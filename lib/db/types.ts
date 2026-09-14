import { type InferSelectModel, type InferInsertModel } from 'drizzle-orm';
import { wallets, categories, recurringBills, transactions, settings } from './schema';

export type Wallet = InferSelectModel<typeof wallets>;
export type NewWallet = InferInsertModel<typeof wallets>;

export type Category = InferSelectModel<typeof categories>;
export type NewCategory = InferInsertModel<typeof categories>;

export type RecurringBill = InferSelectModel<typeof recurringBills>;
export type NewRecurringBill = InferInsertModel<typeof recurringBills>;

export type Transaction = InferSelectModel<typeof transactions>;
export type NewTransaction = InferInsertModel<typeof transactions>;

export type Settings = InferSelectModel<typeof settings>;
export type NewSettings = InferInsertModel<typeof settings>;

export type WalletType = 'cash' | 'bank' | 'ewallet';
export type InterestPeriod = 'daily' | 'monthly' | 'none';
export type CategoryType = 'income' | 'expense';
export type TransactionType = 'income' | 'expense' | 'transfer' | 'adjustment';

export interface ReminderItem {
  id: string;
  time: string; // 'HH:mm'
  label: string;
  isEnabled: boolean;
}

export const DEFAULT_REMINDERS: ReminderItem[] = [
  { id: 'rem_morning', time: '09:00', label: '', isEnabled: false },
  { id: 'rem_lunch', time: '13:00', label: '', isEnabled: false },
  { id: 'rem_evening', time: '20:00', label: '', isEnabled: true },
];

export const DEFAULT_REMINDERS_JSON = JSON.stringify(DEFAULT_REMINDERS);

/**
 * Unique ID Generator
 */
export function generateId(prefix = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

