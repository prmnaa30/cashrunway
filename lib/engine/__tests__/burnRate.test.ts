import { describe, it, expect } from 'vitest';
import { calculateRollingBurnRate } from '../burnRate';
import { EngineTransaction } from '../types';

describe('lib/engine/burnRate', () => {
  const defaultSettings = {
    burnWindowDays: 14,
    fallbackDailyBurn: 75000,
    todayDate: '2026-09-10',
  };

  it('should return fallback burn rate when transaction list is empty (cold start)', () => {
    const result = calculateRollingBurnRate({
      transactions: [],
      ...defaultSettings,
    });

    expect(result.isColdStart).toBe(true);
    expect(result.dailyBurnRate).toBe(75000);
    expect(result.totalVariableExpense).toBe(0);
  });

  it('should trigger cold start when history span is less than 5 days', () => {
    const transactions: EngineTransaction[] = [
      {
        id: 'tx1',
        type: 'expense',
        amount: 100000,
        fee: 0,
        walletId: 'w1',
        isOutlier: false,
        isCategoryFixed: false,
        date: '2026-09-08T10:00:00.000Z',
        localDate: '2026-09-08',
      },
    ];

    const result = calculateRollingBurnRate({
      transactions,
      ...defaultSettings,
    });

    expect(result.isColdStart).toBe(true);
    expect(result.dailyBurnRate).toBe(75000);
    expect(result.totalVariableExpense).toBe(100000);
    expect(result.effectiveDays).toBe(3);
  });

  it('should calculate rolling burn rate when history span is 5 days or more', () => {
    const transactions: EngineTransaction[] = [
      {
        id: 'tx1',
        type: 'expense',
        amount: 200000,
        fee: 0,
        walletId: 'w1',
        isOutlier: false,
        isCategoryFixed: false,
        date: '2026-09-05T10:00:00.000Z',
        localDate: '2026-09-05',
      },
      {
        id: 'tx2',
        type: 'expense',
        amount: 100000,
        fee: 0,
        walletId: 'w1',
        isOutlier: false,
        isCategoryFixed: false,
        date: '2026-09-09T10:00:00.000Z',
        localDate: '2026-09-09',
      },
    ];

    const result = calculateRollingBurnRate({
      transactions,
      ...defaultSettings,
    });

    expect(result.isColdStart).toBe(false);
    expect(result.effectiveDays).toBe(6);
    expect(result.totalVariableExpense).toBe(300000);
    expect(result.dailyBurnRate).toBe(50000);
  });

  it('should ignore outliers and fixed expenses in variable burn calculation', () => {
    const transactions: EngineTransaction[] = [
      {
        id: 'tx-anchor',
        type: 'expense',
        amount: 50000,
        fee: 0,
        walletId: 'w1',
        isOutlier: false,
        isCategoryFixed: false,
        date: '2026-09-01T10:00:00.000Z',
        localDate: '2026-09-01',
      },
      {
        id: 'tx-outlier',
        type: 'expense',
        amount: 5000000,
        fee: 0,
        walletId: 'w1',
        isOutlier: true,
        isCategoryFixed: false,
        date: '2026-09-06T10:00:00.000Z',
        localDate: '2026-09-06',
      },
      {
        id: 'tx-fixed',
        type: 'expense',
        amount: 1500000,
        fee: 0,
        walletId: 'w1',
        isOutlier: false,
        isCategoryFixed: true,
        date: '2026-09-07T10:00:00.000Z',
        localDate: '2026-09-07',
      },
    ];

    const result = calculateRollingBurnRate({
      transactions,
      ...defaultSettings,
    });

    expect(result.isColdStart).toBe(false);
    expect(result.totalVariableExpense).toBe(50000);
  });

  it('should include transfer fees in variable burn calculation', () => {
    const transactions: EngineTransaction[] = [
      {
        id: 'tx-anchor',
        type: 'expense',
        amount: 100000,
        fee: 0,
        walletId: 'w1',
        isOutlier: false,
        isCategoryFixed: false,
        date: '2026-09-01T10:00:00.000Z',
        localDate: '2026-09-01',
      },
      {
        id: 'tx-transfer',
        type: 'transfer',
        amount: 2000000,
        fee: 6500,
        walletId: 'w1',
        targetWalletId: 'w2',
        isOutlier: false,
        isCategoryFixed: false,
        date: '2026-09-08T10:00:00.000Z',
        localDate: '2026-09-08',
      },
    ];

    const result = calculateRollingBurnRate({
      transactions,
      ...defaultSettings,
    });

    expect(result.totalVariableExpense).toBe(106500);
  });

  it('should exclude transactions older than burnWindowDays', () => {
    const transactions: EngineTransaction[] = [
      {
        id: 'tx-old',
        type: 'expense',
        amount: 999999,
        fee: 0,
        walletId: 'w1',
        isOutlier: false,
        isCategoryFixed: false,
        date: '2026-08-01T10:00:00.000Z',
        localDate: '2026-08-01',
      },
      {
        id: 'tx-valid',
        type: 'expense',
        amount: 140000,
        fee: 0,
        walletId: 'w1',
        isOutlier: false,
        isCategoryFixed: false,
        date: '2026-09-05T10:00:00.000Z',
        localDate: '2026-09-05',
      },
    ];

    const result = calculateRollingBurnRate({
      transactions,
      ...defaultSettings,
      burnWindowDays: 14,
    });

    expect(result.effectiveDays).toBe(14);
    expect(result.totalVariableExpense).toBe(140000);
    expect(result.dailyBurnRate).toBe(10000);
  });
});
