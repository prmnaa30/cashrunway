import { describe, it, expect } from 'vitest';
import { calculateDiscreteRunway } from '../runway';
import { EngineRecurringBill } from '../types';

describe('lib/engine/runway', () => {
  const baseOptions = {
    operationalBalance: 1000000,
    vaultBalance: 500000,
    dailyBurnRate: 50000,
    recurringBills: [] as EngineRecurringBill[],
    todayDate: '2026-09-01',
  };

  it('should calculate discrete runway accurately with pure daily burn', () => {
    const result = calculateDiscreteRunway(baseOptions);

    expect(result.operationalRunwayDays).toBe(20);
    expect(result.operationalProjectedDate).toBe('2026-09-21');
    expect(result.emergencyRunwayDays).toBe(30);
    expect(result.emergencyProjectedDate).toBe('2026-10-01');
    expect(result.status).toBe('warning');
  });

  it('should return 0 days and critical status when initial balance is zero or negative', () => {
    const result = calculateDiscreteRunway({
      ...baseOptions,
      operationalBalance: 0,
      vaultBalance: 0,
    });

    expect(result.operationalRunwayDays).toBe(0);
    expect(result.operationalProjectedDate).toBe('2026-09-01');
    expect(result.isDepleted).toBe(true);
    expect(result.status).toBe('critical');
  });

  it('should identify infinite runway when burn rate and recurring bills are zero', () => {
    const result = calculateDiscreteRunway({
      ...baseOptions,
      dailyBurnRate: 0,
      recurringBills: [],
    });

    expect(result.isInfinite).toBe(true);
    expect(result.operationalProjectedDate).toBeNull();
    expect(result.status).toBe('healthy');
  });

  it('should deduct recurring bills and handle clamped due day at end of month', () => {
    const recurringBills: EngineRecurringBill[] = [
      {
        id: 'bill-wifi',
        name: 'Internet Indihome',
        amount: 300000,
        dueDay: 31,
        isActive: true,
      },
    ];

    const result = calculateDiscreteRunway({
      ...baseOptions,
      dailyBurnRate: 20000,
      recurringBills,
      todayDate: '2026-09-01',
    });

    expect(result.operationalRunwayDays).toBe(35);
    expect(result.operationalProjectedDate).toBe('2026-10-06');
    expect(result.status).toBe('healthy');
  });

  it('should protect against double-counting if current month bill was already paid', () => {
    const recurringBills: EngineRecurringBill[] = [
      {
        id: 'bill-rent',
        name: 'Rent',
        amount: 500000,
        dueDay: 15,
        lastPaidPeriod: '2026-09',
        isActive: true,
      },
    ];

    const result = calculateDiscreteRunway({
      ...baseOptions,
      operationalBalance: 600000,
      dailyBurnRate: 20000,
      recurringBills,
      todayDate: '2026-09-10',
    });

    expect(result.operationalRunwayDays).toBe(30);
    expect(result.operationalProjectedDate).toBe('2026-10-10');
  });

  it('should mark status as critical when operational runway is under 7 days', () => {
    const result = calculateDiscreteRunway({
      ...baseOptions,
      operationalBalance: 200000,
      dailyBurnRate: 50000,
    });

    expect(result.operationalRunwayDays).toBe(4);
    expect(result.status).toBe('critical');
  });
});
