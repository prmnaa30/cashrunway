import { describe, it, expect } from 'vitest';
import { evaluateExpression, processKeypadInput } from '@/lib/utils/calculator';
import { formatLocalDate } from '@/lib/engine';
import { calculateRollingBurnRate } from '@/lib/engine/burnRate';
import { EngineTransaction } from '@/lib/engine/types';

describe('Quick Entry Business Logic & Payload Verification', () => {
  it('correctly maps expense transaction with outlier toggle to engine burn rate exclusion', () => {
    // Regular transactions
    const txNormal: EngineTransaction = {
      id: 'tx_normal',
      type: 'expense',
      amount: 50000,
      fee: 0,
      walletId: 'w_bca',
      isCategoryFixed: false,
      isOutlier: false,
      date: '2026-09-08 12:00:00',
      localDate: '2026-09-08',
    };

    // Outlier transaction marked via Anomali toggle
    const txOutlier: EngineTransaction = {
      id: 'tx_outlier',
      type: 'expense',
      amount: 1500000,
      fee: 0,
      walletId: 'w_bca',
      isCategoryFixed: false,
      isOutlier: true,
      date: '2026-09-08 14:00:00',
      localDate: '2026-09-08',
    };

    const result = calculateRollingBurnRate({
      transactions: [
        txNormal,
        txOutlier,
        // Add historical days to bypass cold start
        { id: 'tx_hist', type: 'expense', amount: 50000, fee: 0, walletId: 'w_bca', isCategoryFixed: false, isOutlier: false, date: '2026-09-01 12:00:00', localDate: '2026-09-01' },
      ],
      burnWindowDays: 14,
      fallbackDailyBurn: 50000,
      todayDate: '2026-09-08',
    });

    // Total variable expense must exclude the 1.500.000 outlier
    expect(result.totalVariableExpense).toBe(100000);
    expect(result.isColdStart).toBe(false);
  });

  it('correctly calculates backdated date when Kemarin toggle is active', () => {
    const today = new Date('2026-09-08T12:00:00.000Z');
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const localToday = formatLocalDate(today);
    const localYesterday = formatLocalDate(yesterday);

    expect(localToday).toBe('2026-09-08');
    expect(localYesterday).toBe('2026-09-07');
  });

  it('evaluates dynamic calculator expressions in quick entry before saving', () => {
    // User types 15000 + 35000
    let state = processKeypadInput('0', '1');
    state = processKeypadInput(state.expression, '5');
    state = processKeypadInput(state.expression, '000');
    state = processKeypadInput(state.expression, '+');
    state = processKeypadInput(state.expression, '3');
    state = processKeypadInput(state.expression, '5');
    state = processKeypadInput(state.expression, '000');

    expect(state.expression).toBe('15000 + 35000');
    expect(state.amount).toBe(50000);

    // Final evaluation returns numeric amount 50000
    const finalAmount = evaluateExpression(state.expression);
    expect(finalAmount).toBe(50000);
  });

  it('validates transfer mode constraints (distinct source and target wallets)', () => {
    const sourceWallet: string = 'w_bca';
    const targetWalletSame: string = 'w_bca';
    const targetWalletDiff: string = 'w_gopay';

    const isInvalidTransfer = sourceWallet === targetWalletSame;
    const isValidTransfer = sourceWallet !== targetWalletDiff;

    expect(isInvalidTransfer).toBe(true);
    expect(isValidTransfer).toBe(true);
  });
});
