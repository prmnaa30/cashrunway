import { describe, it, expect } from 'vitest';
import { calculateSafeDailySpend } from '../safeSpend';
import {
  EngineRecurringBill,
  EngineSettings,
  EngineTransaction,
} from '../types';

describe('lib/engine/safeSpend', () => {
  const defaultSettings: EngineSettings = {
    paydayDay: 25,
    fallbackDailyBurn: 50000,
    burnWindowDays: 14,
    dualRunwayMode: true,
  };

  it('should target current month payday when today is before payday', () => {
    const result = calculateSafeDailySpend({
      operationalBalance: 1500000,
      recurringBills: [],
      transactions: [],
      settings: defaultSettings,
      todayDate: '2026-09-10',
    });

    expect(result.targetDate).toBe('2026-09-25');
    expect(result.daysRemaining).toBe(15);
    expect(result.baseDailyAllowance).toBe(100000);
    expect(result.remainingDailyAllowance).toBe(100000);
    expect(result.isOverspent).toBe(false);
  });

  it('should auto-advance to next month payday when today is on or after payday', () => {
    const result = calculateSafeDailySpend({
      operationalBalance: 3000000,
      recurringBills: [],
      transactions: [],
      settings: defaultSettings,
      todayDate: '2026-09-25',
    });

    expect(result.targetDate).toBe('2026-10-25');
    expect(result.daysRemaining).toBe(30);
    expect(result.baseDailyAllowance).toBe(100000);
  });

  it('should deduct unpaid recurring bills between today and target date', () => {
    const recurringBills: EngineRecurringBill[] = [
      {
        id: 'b1',
        name: 'Electricity',
        amount: 300000,
        dueDay: 15,
        isActive: true,
      },
      {
        id: 'b2',
        name: 'Internet (Paid)',
        amount: 200000,
        dueDay: 20,
        lastPaidPeriod: '2026-09',
        isActive: true,
      },
    ];

    const result = calculateSafeDailySpend({
      operationalBalance: 1300000,
      recurringBills,
      transactions: [],
      settings: defaultSettings,
      todayDate: '2026-09-10',
    });

    expect(result.unpaidBillsTotal).toBe(300000);
    expect(result.baseDailyAllowance).toBe(66666.67);
  });

  it('should deduct today variable expenses and indicate overspent status', () => {
    const transactions: EngineTransaction[] = [
      {
        id: 'tx-today-1',
        type: 'expense',
        amount: 40000,
        fee: 0,
        walletId: 'w1',
        isOutlier: false,
        isCategoryFixed: false,
        date: '2026-09-10T12:00:00.000Z',
        localDate: '2026-09-10',
      },
      {
        id: 'tx-today-2',
        type: 'expense',
        amount: 70000,
        fee: 0,
        walletId: 'w1',
        isOutlier: false,
        isCategoryFixed: false,
        date: '2026-09-10T18:00:00.000Z',
        localDate: '2026-09-10',
      },
      {
        id: 'tx-yesterday',
        type: 'expense',
        amount: 500000,
        fee: 0,
        walletId: 'w1',
        isOutlier: false,
        isCategoryFixed: false,
        date: '2026-09-09T18:00:00.000Z',
        localDate: '2026-09-09',
      },
    ];

    const result = calculateSafeDailySpend({
      operationalBalance: 1500000,
      recurringBills: [],
      transactions,
      settings: defaultSettings,
      todayDate: '2026-09-10',
    });

    expect(result.baseDailyAllowance).toBe(100000);
    expect(result.todaySpent).toBe(110000);
    expect(result.remainingDailyAllowance).toBe(-10000);
    expect(result.isOverspent).toBe(true);
  });

  it('should respect custom settings targetDate when configured', () => {
    const customSettings: EngineSettings = {
      ...defaultSettings,
      targetDate: '2026-09-20',
    };

    const result = calculateSafeDailySpend({
      operationalBalance: 1000000,
      recurringBills: [],
      transactions: [],
      settings: customSettings,
      todayDate: '2026-09-10',
    });

    expect(result.targetDate).toBe('2026-09-20');
    expect(result.daysRemaining).toBe(10);
    expect(result.baseDailyAllowance).toBe(100000);
  });
});
