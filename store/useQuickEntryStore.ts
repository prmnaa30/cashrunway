import { create } from 'zustand';
import { TransactionMode } from '@/components/entry/types';
import { KeypadKey, processKeypadInput } from '@/lib/utils/calculator';

export interface QuickEntryState {
  isOpen: boolean;
  type: TransactionMode;
  expression: string;
  amount: number;
  open: (type?: TransactionMode) => void;
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
  open: (type = 'expense') => set({ isOpen: true, type, expression: '0', amount: 0 }),
  close: () => set({ isOpen: false }),
  pressKey: (key: KeypadKey) => {
    const currentExpr = get().expression;
    const next = processKeypadInput(currentExpr, key);
    set({ expression: next.expression, amount: next.amount });
  },
  resetCalc: () => set({ expression: '0', amount: 0 }),
  setCalc: (expression: string, amount: number) => set({ expression, amount }),
}));

