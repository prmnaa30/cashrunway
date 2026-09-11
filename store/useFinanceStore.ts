import { create } from 'zustand';
import {
  Wallet,
  Category,
  RecurringBill,
  Settings,
  TransactionWithDetails,
  getWallets,
  getCategories,
  getRecurringBills,
  getTransactionsWithDetails,
  getSettings,
  updateSettings as updateSettingsDb,
  resetToDemoData as resetDemoDb,
  clearAllTransactions as clearTxDb,
  deleteTransaction as deleteTxDb,
  insertTransaction,
  updateWallet,
  insertWallet,
  softDeleteWallet,
  updateWalletBalance,
  seedDemoTransactions as seedDemoDb,
  ensureDatabaseInitialized,
  createCategory,
  updateCategory as updateCategoryDb,
  deleteCategory as deleteCategoryDb,
} from '@/lib/db';
import {
  calculateRollingBurnRate,
  calculateDiscreteRunway,
  calculateSafeDailySpend,
  calculateVaultAccrual,
  formatLocalDate,
  BurnRateResult,
  RunwayResult,
  SafeSpendResult,
  EngineWallet,
  EngineTransaction,
  EngineRecurringBill,
  EngineSettings,
  VaultAccrualResult,
} from '@/lib/engine';

export interface VaultYieldStats {
  estimatedDailyGross: number;
  estimatedDailyNet: number;
  projectedMonthlyYield: number;
  projectedAnnualYield: number;
  totalPendingInterest: number;
  pendingAccruals: VaultAccrualResult[];
}

export interface LoadDataOptions {
  force?: boolean;
  showLoading?: boolean;
}

export interface FinanceState {
  wallets: Wallet[];
  transactions: TransactionWithDetails[];
  categories: Category[];
  recurringBills: RecurringBill[];
  settings: Settings | null;
  isLoading: boolean;
  isInitialized: boolean;

  operationalBalance: number;
  vaultBalance: number;
  totalBalance: number;

  burnRate: BurnRateResult;
  runway: RunwayResult;
  safeSpend: SafeSpendResult;
  vaultStats: VaultYieldStats;

  isQuickEntryOpen: boolean;
  quickEntryType: 'expense' | 'income' | 'transfer';
  openQuickEntry: (type?: 'expense' | 'income' | 'transfer') => void;
  closeQuickEntry: () => void;

  loadAllData: (options?: LoadDataOptions) => Promise<void>;
  addTransaction: (tx: {
    type: 'expense' | 'income' | 'transfer';
    amount: number;
    fee?: number;
    walletId: string;
    targetWalletId?: string | null;
    categoryId?: string | null;
    isOutlier?: number;
    date: string;
    localDate: string;
    note?: string | null;
  }) => Promise<string>;
  deleteTx: (id: string) => Promise<void>;
  applyVaultAccrual: () => Promise<void>;
  applyVaultAccrualForWallet: (walletId: string) => Promise<void>;
  createWallet: (wallet: {
    name: string;
    type: 'cash' | 'bank' | 'ewallet';
    isVault: boolean;
    initialBalance?: number;
    isInterestEnabled?: boolean;
    interestRate?: number;
    autoTax?: boolean;
    taxRate?: number;
    taxThreshold?: number;
  }) => Promise<string>;
  editWallet: (
    walletId: string,
    data: Partial<Omit<Wallet, 'id'>>
  ) => Promise<void>;
  adjustBalance: (walletId: string, newBalance: number) => Promise<void>;
  removeWallet: (walletId: string) => Promise<void>;
  addCategory: (categoryData: {
    name: string;
    type: 'income' | 'expense';
    icon: string;
    isFixed?: number;
  }) => Promise<Category>;
  updateCategory: (id: string, updates: { name?: string; icon?: string }) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  seedDemoData: () => Promise<void>;
  updateSettings: (data: Partial<Omit<Settings, 'id'>>) => Promise<void>;
  resetToDemo: () => Promise<void>;
  clearTransactions: () => Promise<void>;
}

const DEFAULT_BURN_RATE: BurnRateResult = {
  dailyBurnRate: 50000,
  effectiveDays: 14,
  isColdStart: true,
  totalVariableExpense: 0,
};

const DEFAULT_RUNWAY: RunwayResult = {
  operationalRunwayDays: 0,
  operationalProjectedDate: null,
  emergencyRunwayDays: 0,
  emergencyProjectedDate: null,
  isDepleted: true,
  isInfinite: false,
  status: 'critical',
};

const DEFAULT_SAFE_SPEND: SafeSpendResult = {
  targetDate: '',
  daysRemaining: 1,
  unpaidBillsTotal: 0,
  baseDailyAllowance: 0,
  todaySpent: 0,
  remainingDailyAllowance: 0,
  isOverspent: false,
};

const DEFAULT_VAULT_STATS: VaultYieldStats = {
  estimatedDailyGross: 0,
  estimatedDailyNet: 0,
  projectedMonthlyYield: 0,
  projectedAnnualYield: 0,
  totalPendingInterest: 0,
  pendingAccruals: [],
};

export const useFinanceStore = create<FinanceState>((set, get) => ({
  wallets: [],
  transactions: [],
  categories: [],
  recurringBills: [],
  settings: null,
  isLoading: false,
  isInitialized: false,

  operationalBalance: 0,
  vaultBalance: 0,
  totalBalance: 0,

  burnRate: DEFAULT_BURN_RATE,
  runway: DEFAULT_RUNWAY,
  safeSpend: DEFAULT_SAFE_SPEND,
  vaultStats: DEFAULT_VAULT_STATS,

  isQuickEntryOpen: false,
  quickEntryType: 'expense',
  openQuickEntry: (type = 'expense') => {
    try {
      const { useQuickEntryStore } = require('@/store/useQuickEntryStore');
      useQuickEntryStore.getState().open(type);
    } catch (_) {}
    set({ isQuickEntryOpen: true, quickEntryType: type });
  },
  closeQuickEntry: () => {
    try {
      const { useQuickEntryStore } = require('@/store/useQuickEntryStore');
      useQuickEntryStore.getState().close();
    } catch (_) {}
    set({ isQuickEntryOpen: false });
  },

  loadAllData: async (options?: LoadDataOptions) => {
    const { force = false, showLoading = false } = options ?? {};
    const state = get();

    if (state.isInitialized && !force) {
      return;
    }

    try {
      if (showLoading || !state.isInitialized) {
        set({ isLoading: true });
      }
      await ensureDatabaseInitialized();

      const [wallets, transactions, categories, recurringBills, settings] = await Promise.all([
        getWallets(),
        getTransactionsWithDetails(100),
        getCategories(),
        getRecurringBills(),
        getSettings(),
      ]);

      const operationalBalance = wallets
        .filter((w) => w.isVault === 0)
        .reduce((sum, w) => sum + (w.balance || 0), 0);

      const vaultBalance = wallets
        .filter((w) => w.isVault === 1)
        .reduce((sum, w) => sum + (w.balance || 0), 0);

      const totalBalance = operationalBalance + vaultBalance;

      const todayDate = formatLocalDate(new Date());

      const engineWallets: EngineWallet[] = wallets.map((w) => ({
        id: w.id,
        name: w.name,
        balance: w.balance || 0,
        isVault: Boolean(w.isVault),
        isInterestEnabled: Boolean(w.isInterestEnabled),
        interestRate: w.interestRate || 0,
        interestPeriod: (w.interestPeriod as any) || 'none',
        autoTax: Boolean(w.autoTax),
        taxRate: w.taxRate ?? 0.2,
        taxThreshold: w.taxThreshold ?? 7500000,
        lastAccruedDate: w.lastAccruedDate,
      }));

      const engineTxs: EngineTransaction[] = transactions.map((tx) => ({
        id: tx.id,
        type: tx.type,
        amount: tx.amount,
        fee: tx.fee || 0,
        walletId: tx.walletId,
        targetWalletId: tx.targetWalletId,
        categoryId: tx.categoryId,
        isCategoryFixed: Boolean(tx.category?.isFixed),
        isOutlier: Boolean(tx.isOutlier),
        date: tx.date,
        localDate: tx.localDate,
      }));

      const engineBills: EngineRecurringBill[] = recurringBills.map((b) => ({
        id: b.id,
        name: b.name,
        amount: b.amount,
        dueDay: b.dueDay,
        walletId: b.walletId,
        lastPaidPeriod: b.lastPaidPeriod,
        isActive: Boolean(b.isActive),
      }));

      const engineSettings: EngineSettings = {
        paydayDay: settings?.paydayDay ?? 25,
        fallbackDailyBurn: settings?.fallbackDailyBurn ?? 50000,
        burnWindowDays: settings?.burnWindowDays ?? 14,
        targetDate: settings?.targetDate ?? null,
        dualRunwayMode: Boolean(settings?.dualRunwayMode ?? 1),
      };

      const burnRate = calculateRollingBurnRate({
        transactions: engineTxs,
        burnWindowDays: engineSettings.burnWindowDays,
        fallbackDailyBurn: engineSettings.fallbackDailyBurn,
        todayDate,
      });

      const runway = calculateDiscreteRunway({
        operationalBalance,
        vaultBalance,
        dailyBurnRate: burnRate.dailyBurnRate,
        recurringBills: engineBills,
        todayDate,
      });

      const safeSpend = calculateSafeDailySpend({
        operationalBalance,
        recurringBills: engineBills,
        transactions: engineTxs,
        settings: engineSettings,
        todayDate,
      });

      let estimatedDailyGross = 0;
      let estimatedDailyNet = 0;
      const pendingAccruals: VaultAccrualResult[] = [];

      for (const w of engineWallets) {
        if (w.isVault && w.isInterestEnabled && w.interestRate > 0 && w.balance > 0) {
          const gross = (w.balance * w.interestRate) / 365;
          const threshold = w.taxThreshold !== undefined ? w.taxThreshold : 7500000;
          const rate = w.taxRate !== undefined ? w.taxRate : 0.2;
          const isTaxable = w.balance > threshold && w.autoTax;
          const net = isTaxable ? gross * (1 - rate) : gross;
          estimatedDailyGross += gross;
          estimatedDailyNet += net;

          if (w.lastAccruedDate) {
            const accrual = calculateVaultAccrual({ wallet: w, todayDate });
            if (accrual.missedDays > 0 && accrual.totalNetInterest > 0) {
              pendingAccruals.push(accrual);
            }
          }
        }
      }

      const totalPendingInterest = pendingAccruals.reduce(
        (sum, a) => sum + a.totalNetInterest,
        0
      );

      const vaultStats: VaultYieldStats = {
        estimatedDailyGross: Math.round(estimatedDailyGross * 100) / 100,
        estimatedDailyNet: Math.round(estimatedDailyNet * 100) / 100,
        projectedMonthlyYield: Math.round(estimatedDailyNet * 30),
        projectedAnnualYield: Math.round(estimatedDailyNet * 365),
        totalPendingInterest: Math.round(totalPendingInterest * 100) / 100,
        pendingAccruals,
      };

      if (settings) {
        try {
          const { useSettingsStore } = require('@/store/useSettingStore');
          const savedTheme = (settings.themeMode as any) || 'system';
          useSettingsStore.setState({
            currency: settings.currency || 'IDR',
            isPrivacyMode: Boolean(settings.isPrivacyMode),
            themeMode: savedTheme,
          });
          try {
            const { colorScheme } = require('nativewind');
            colorScheme.set(savedTheme);
          } catch (_) {}
        } catch (_) {}
      }

      set({
        wallets,
        transactions,
        categories,
        recurringBills,
        settings,
        operationalBalance,
        vaultBalance,
        totalBalance,
        burnRate,
        runway,
        safeSpend,
        vaultStats,
        isLoading: false,
        isInitialized: true,
      });
    } catch (error) {
      console.error('Failed to load finance data:', error);
      set({ isLoading: false });
    }
  },

  addTransaction: async (tx) => {
    try {
      set({ isLoading: true });
      const id = await insertTransaction({
        type: tx.type,
        amount: tx.amount,
        fee: tx.fee ?? 0,
        walletId: tx.walletId,
        targetWalletId: tx.targetWalletId ?? null,
        categoryId: tx.categoryId ?? null,
        recurringBillId: null,
        isOutlier: tx.isOutlier ?? 0,
        date: tx.date,
        localDate: tx.localDate,
        note: tx.note ?? null,
      });

      await get().loadAllData({ force: true, showLoading: false });
      return id;
    } catch (error) {
      console.error('Failed to add transaction:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  deleteTx: async (id: string) => {
    try {
      set({ isLoading: true });
      await deleteTxDb(id);
      await get().loadAllData({ force: true, showLoading: false });
    } catch (error) {
      console.error('Failed to delete transaction:', error);
      set({ isLoading: false });
    }
  },

  applyVaultAccrual: async () => {
    try {
      const { vaultStats } = get();
      if (!vaultStats.pendingAccruals || vaultStats.pendingAccruals.length === 0) {
        return;
      }

      set({ isLoading: true });
      for (const accrual of vaultStats.pendingAccruals) {
        if (accrual.suggestedTransaction) {
          await insertTransaction({
            type: accrual.suggestedTransaction.type,
            amount: accrual.suggestedTransaction.amount,
            fee: 0,
            walletId: accrual.suggestedTransaction.walletId,
            targetWalletId: null,
            categoryId: 'cat_interest',
            recurringBillId: null,
            isOutlier: 0,
            date: accrual.suggestedTransaction.date,
            localDate: accrual.suggestedTransaction.localDate,
            note: accrual.suggestedTransaction.note,
          });

          await updateWallet(accrual.walletId, {
            lastAccruedDate: accrual.newLastAccruedDate,
          });
        }
      }

      await get().loadAllData({ force: true, showLoading: false });
    } catch (error) {
      console.error('Failed to apply vault accrual:', error);
      set({ isLoading: false });
    }
  },

  applyVaultAccrualForWallet: async (walletId: string) => {
    try {
      const { vaultStats } = get();
      const accrual = vaultStats.pendingAccruals.find((a) => a.walletId === walletId);
      if (!accrual || !accrual.suggestedTransaction) {
        return;
      }

      set({ isLoading: true });
      await insertTransaction({
        type: accrual.suggestedTransaction.type,
        amount: accrual.suggestedTransaction.amount,
        fee: 0,
        walletId: accrual.suggestedTransaction.walletId,
        targetWalletId: null,
        categoryId: 'cat_interest',
        recurringBillId: null,
        isOutlier: 0,
        date: accrual.suggestedTransaction.date,
        localDate: accrual.suggestedTransaction.localDate,
        note: accrual.suggestedTransaction.note,
      });

      await updateWallet(accrual.walletId, {
        lastAccruedDate: accrual.newLastAccruedDate,
      });

      await get().loadAllData({ force: true, showLoading: false });
    } catch (error) {
      console.error(`Failed to apply vault accrual for wallet ${walletId}:`, error);
      set({ isLoading: false });
      throw error;
    }
  },

  createWallet: async (wallet) => {
    try {
      set({ isLoading: true });
      const id = await insertWallet({
        name: wallet.name.trim(),
        type: wallet.type,
        balance: 0,
        isVault: wallet.isVault ? 1 : 0,
        isInterestEnabled: wallet.isInterestEnabled ? 1 : 0,
        interestRate: wallet.interestRate ?? 0,
        interestPeriod: 'daily',
        payoutDay: 1,
        autoTax: wallet.autoTax === false ? 0 : 1,
        taxRate: wallet.taxRate ?? 0.2,
        taxThreshold: wallet.taxThreshold ?? 7500000,
        lastAccruedDate: formatLocalDate(new Date()),
        initialBalance: wallet.initialBalance ?? 0,
      });

      await get().loadAllData({ force: true, showLoading: false });
      return id;
    } catch (error) {
      console.error('Failed to create wallet:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  editWallet: async (walletId, data) => {
    try {
      set({ isLoading: true });
      await updateWallet(walletId, data);
      await get().loadAllData({ force: true, showLoading: false });
    } catch (error) {
      console.error('Failed to edit wallet:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  adjustBalance: async (walletId, newBalance) => {
    try {
      set({ isLoading: true });
      await updateWalletBalance(walletId, newBalance);
      await get().loadAllData({ force: true, showLoading: false });
    } catch (error) {
      console.error('Failed to adjust wallet balance:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  removeWallet: async (walletId) => {
    try {
      set({ isLoading: true });
      await softDeleteWallet(walletId);
      await get().loadAllData({ force: true, showLoading: false });
    } catch (error) {
      console.error('Failed to remove wallet:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  addCategory: async (categoryData) => {
    try {
      const newCategory = await createCategory(categoryData);
      set((state) => ({
        categories: [...state.categories, newCategory],
      }));
      return newCategory;
    } catch (error) {
      console.error('Failed to add category:', error);
      throw error;
    }
  },

  updateCategory: async (id, updates) => {
    try {
      await updateCategoryDb(id, updates);
      set((state) => ({
        categories: state.categories.map((c) =>
          c.id === id
            ? {
                ...c,
                ...(updates.name !== undefined ? { name: updates.name.trim() } : {}),
                ...(updates.icon !== undefined ? { icon: updates.icon } : {}),
              }
            : c
        ),
      }));
    } catch (error) {
      console.error('Failed to update category:', error);
      throw error;
    }
  },

  deleteCategory: async (id) => {
    try {
      await deleteCategoryDb(id);
      set((state) => ({
        categories: state.categories.filter((c) => c.id !== id),
      }));
      await get().loadAllData({ force: true, showLoading: false });
    } catch (error) {
      console.error('Failed to delete category:', error);
      throw error;
    }
  },

  seedDemoData: async () => {
    try {
      set({ isLoading: true });
      await get().resetToDemo();
    } catch (error) {
      console.error('Failed to seed demo data:', error);
      set({ isLoading: false });
    }
  },

  updateSettings: async (data) => {
    try {
      await updateSettingsDb(data);
      await get().loadAllData({ force: true, showLoading: false });
    } catch (error) {
      console.error('Failed to update settings:', error);
      throw error;
    }
  },

  resetToDemo: async () => {
    try {
      set({ isLoading: true });
      await resetDemoDb();
      await get().loadAllData({ force: true, showLoading: false });
    } catch (error) {
      console.error('Failed to reset to demo data:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  clearTransactions: async () => {
    try {
      set({ isLoading: true });
      await clearTxDb();
      await get().loadAllData({ force: true, showLoading: false });
    } catch (error) {
      console.error('Failed to clear transactions:', error);
      set({ isLoading: false });
      throw error;
    }
  },
}));
