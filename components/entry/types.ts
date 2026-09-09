/**
 * Type definitions for Quick Entry & Calculator Keypad components.
 */

export type TransactionMode = 'expense' | 'income' | 'transfer';

export interface QuickEntryFormData {
  type: TransactionMode;
  expression: string;
  amount: number;
  walletId: string;
  targetWalletId: string;
  categoryId: string | null;
  isYesterday: boolean;
  isOutlier: boolean;
  note: string;
  fee: number;
}
