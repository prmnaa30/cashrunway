import { create } from 'zustand';
import { TransactionMode } from '@/components/entry/types';
import { KeypadKey, processKeypadInput } from '@/lib/utils/calculator';
import { TransactionWithDetails } from '@/lib/db';

export interface QuickEntryState {
  isOpen: boolean;
  type: TransactionMode;
  expression: string;
  amount: number;
  editingTransaction: TransactionWithDetails | null;
  open: (type?: TransactionMode) => void;
  openEdit: (tx: TransactionWithDetails) => void;
  close: () => void;
  pressKey: (key: KeypadKey) => void;
  resetCalc: () => void;
  setCalc: (expression: string, amount: number) => void;
}

export const useQuickEntryStore = create<QuickEntryState>((set, get) => ({
  isOpen: false,
  type: 'expense',
  expression: '0',
  amount: 0,
  editingTransaction: null,
  open: (type = 'expense') =>
    set({ isOpen: true, type, expression: '0', amount: 0, editingTransaction: null }),
  openEdit: (tx: TransactionWithDetails) =>
    set({
      isOpen: true,
      type: (tx.type === 'adjustment' ? 'expense' : tx.type) as TransactionMode,
      expression: String(tx.amount),
      amount: tx.amount,
      editingTransaction: tx,
    }),
  close: () => set({ isOpen: false, editingTransaction: null, expression: '0', amount: 0 }),
  pressKey: (key: KeypadKey) => {
    const currentExpr = get().expression;
    const next = processKeypadInput(currentExpr, key);
    set({ expression: next.expression, amount: next.amount });
  },
  resetCalc: () => set({ expression: '0', amount: 0 }),
  setCalc: (expression: string, amount: number) => set({ expression, amount }),
}));

