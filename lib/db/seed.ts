// lib/db/seed.ts
import { count } from 'drizzle-orm';
import { categories, wallets, settings } from './schema';
import { NewCategory, NewWallet, NewSettings } from './types';
import type { db as DrizzleDB } from './index';

export const DEFAULT_CATEGORIES: NewCategory[] = [
  // Daily Spending
  { id: 'cat_food', name: 'Makanan & Minuman', type: 'expense', icon: '🍔', isFixed: 0, isDefault: 1 },
  { id: 'cat_transport', name: 'Transportasi', type: 'expense', icon: '🛵', isFixed: 0, isDefault: 1 },
  { id: 'cat_groceries', name: 'Belanja Harian', type: 'expense', icon: '🛒', isFixed: 0, isDefault: 1 },
  { id: 'cat_coffee', name: 'Jajan & Nongkrong', type: 'expense', icon: '☕', isFixed: 0, isDefault: 1 },
  { id: 'cat_health', name: 'Kesehatan', type: 'expense', icon: '💊', isFixed: 0, isDefault: 1 },

  // Fixed Bills
  { id: 'cat_rent', name: 'Sewa Kos / Rumah', type: 'expense', icon: '🏠', isFixed: 1, isDefault: 1 },
  { id: 'cat_wifi', name: 'WiFi & Paket Data', type: 'expense', icon: '📶', isFixed: 1, isDefault: 1 },
  { id: 'cat_electricity', name: 'Listrik & Air', type: 'expense', icon: '⚡', isFixed: 1, isDefault: 1 },
  { id: 'cat_subs', name: 'Langganan Digital', type: 'expense', icon: '📺', isFixed: 1, isDefault: 1 },
  { id: 'cat_installment', name: 'Cicilan & Asuransi', type: 'expense', icon: '💳', isFixed: 1, isDefault: 1 },

  // Income
  { id: 'cat_salary', name: 'Gaji Utama', type: 'income', icon: '💼', isFixed: 0, isDefault: 1 },
  { id: 'cat_freelance', name: 'Freelance & Proyek', type: 'income', icon: '💻', isFixed: 0, isDefault: 1 },
  { id: 'cat_bonus', name: 'Bonus & Hadiah', type: 'income', icon: '🎁', isFixed: 0, isDefault: 1 },
  { id: 'cat_interest', name: 'Bunga Tabungan', type: 'income', icon: '📈', isFixed: 0, isDefault: 1 },
];

export const DEFAULT_WALLETS: NewWallet[] = [
  {
    id: 'w_cash',
    name: 'Tunai Saku',
    type: 'cash',
    balance: 0,
    isVault: 0,
    isInterestEnabled: 0,
    interestRate: 0,
    interestPeriod: 'none',
    payoutDay: 1,
    autoTax: 0,
    lastAccruedDate: null,
  },
  {
    id: 'w_bca',
    name: 'BCA Tahapan',
    type: 'bank',
    balance: 0,
    isVault: 0,
    isInterestEnabled: 0,
    interestRate: 0,
    interestPeriod: 'none',
    payoutDay: 1,
    autoTax: 0,
    lastAccruedDate: null,
  },
  {
    id: 'w_gopay',
    name: 'GoPay',
    type: 'ewallet',
    balance: 0,
    isVault: 0,
    isInterestEnabled: 0,
    interestRate: 0,
    interestPeriod: 'none',
    payoutDay: 1,
    autoTax: 0,
    lastAccruedDate: null,
  },
  {
    id: 'w_seabank',
    name: 'SeaBank Vault',
    type: 'bank',
    balance: 0,
    isVault: 1,
    isInterestEnabled: 1,
    interestRate: 0.0375,
    interestPeriod: 'daily',
    payoutDay: 1,
    autoTax: 1,
    lastAccruedDate: null,
  },
];

export const DEFAULT_SETTINGS: NewSettings = {
  id: 1,
  targetDate: null,
  paydayDay: 25,
  fallbackDailyBurn: 50000,
  burnWindowDays: 14,
  notificationHour: 20,
  language: 'auto',
  currency: 'IDR',
  themeMode: 'system',
  isPrivacyMode: 0,
  dualRunwayMode: 1,
};

export async function seedInitialData(database: typeof DrizzleDB): Promise<void> {
  // 1. Seed Categories if empty
  const existingCategories = await database.select({ count: count() }).from(categories);
  if ((existingCategories[0]?.count ?? 0) === 0) {
    await database.insert(categories).values(DEFAULT_CATEGORIES);
  }

  // 2. Seed Wallets if empty
  const existingWallets = await database.select({ count: count() }).from(wallets);
  if ((existingWallets[0]?.count ?? 0) === 0) {
    await database.insert(wallets).values(DEFAULT_WALLETS);
  }

  // 3. Seed default Settings if empty
  const existingSettings = await database.select({ count: count() }).from(settings);
  if ((existingSettings[0]?.count ?? 0) === 0) {
    await database.insert(settings).values(DEFAULT_SETTINGS);
  }
}
