export interface EngineWallet {
  id: string;
  name: string;
  balance: number;
  isVault: boolean;
  isInterestEnabled: boolean;
  interestRate: number;
  interestPeriod: 'daily' | 'monthly' | 'none';
  autoTax: boolean;
  taxRate?: number;
  taxThreshold?: number;
  lastAccruedDate?: string | null;
}

export interface EngineTransaction {
  id: string;
  type: 'income' | 'expense' | 'transfer' | 'adjustment';
  amount: number;
  fee: number;
  walletId: string;
  targetWalletId?: string | null;
  categoryId?: string | null;
  isCategoryFixed?: boolean;
  isOutlier: boolean;
  date: string;
  localDate: string;
}

export interface EngineRecurringBill {
  id: string;
  name: string;
  amount: number;
  dueDay: number;
  walletId?: string | null;
  lastPaidPeriod?: string | null;
  isActive: boolean;
}

export interface EngineSettings {
  paydayDay: number;
  fallbackDailyBurn: number;
  burnWindowDays: number;
  targetDate?: string | null;
  dualRunwayMode: boolean;
}

export interface BurnRateResult {
  dailyBurnRate: number;
  effectiveDays: number;
  isColdStart: boolean;
  totalVariableExpense: number;
}

export type RunwayStatus = 'critical' | 'warning' | 'healthy';

export interface RunwayResult {
  operationalRunwayDays: number;
  operationalProjectedDate: string | null;
  emergencyRunwayDays: number;
  emergencyProjectedDate: string | null;
  isDepleted: boolean;
  isInfinite: boolean;
  status: RunwayStatus;
}

export interface SafeSpendResult {
  targetDate: string;
  daysRemaining: number;
  unpaidBillsTotal: number;
  baseDailyAllowance: number;
  todaySpent: number;
  remainingDailyAllowance: number;
  isOverspent: boolean;
}

export interface SuggestedAccrualTransaction {
  type: 'income';
  amount: number;
  walletId: string;
  date: string;
  localDate: string;
  note: string;
}

export interface VaultAccrualResult {
  walletId: string;
  walletName: string;
  missedDays: number;
  totalGrossInterest: number;
  totalTax: number;
  totalNetInterest: number;
  newLastAccruedDate: string;
  suggestedTransaction?: SuggestedAccrualTransaction;
}
