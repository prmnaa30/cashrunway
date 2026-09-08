import { describe, it, expect } from 'vitest';
import { calculateVaultAccrual } from '../vaultAccrual';
import { EngineWallet } from '../types';

describe('lib/engine/vaultAccrual', () => {
  const baseVault: EngineWallet = {
    id: 'vault-1',
    name: 'SeaBank High Yield',
    balance: 10000000,
    isVault: true,
    isInterestEnabled: true,
    interestRate: 0.0365,
    interestPeriod: 'daily',
    autoTax: true,
    lastAccruedDate: '2026-09-07',
  };

  it('should calculate 1 day accrual with 20% PPh Final tax for balance > 7.5M', () => {
    const result = calculateVaultAccrual({
      wallet: baseVault,
      todayDate: '2026-09-08',
    });

    expect(result.missedDays).toBe(1);
    expect(result.totalGrossInterest).toBe(1000);
    expect(result.totalTax).toBe(200);
    expect(result.totalNetInterest).toBe(800);
    expect(result.newLastAccruedDate).toBe('2026-09-08');
    expect(result.suggestedTransaction).toBeDefined();
    expect(result.suggestedTransaction?.amount).toBe(800);
    expect(result.suggestedTransaction?.note).toBe('Bunga Vault (1 hari akrual)');
  });

  it('should exempt tax when balance is less than or equal to 7.5M', () => {
    const underThresholdVault: EngineWallet = {
      ...baseVault,
      balance: 5000000,
      interestRate: 0.0365,
    };

    const result = calculateVaultAccrual({
      wallet: underThresholdVault,
      todayDate: '2026-09-08',
    });

    expect(result.missedDays).toBe(1);
    expect(result.totalGrossInterest).toBe(500);
    expect(result.totalTax).toBe(0);
    expect(result.totalNetInterest).toBe(500);
  });

  it('should exempt tax when autoTax is set to false regardless of balance', () => {
    const noAutoTaxVault: EngineWallet = {
      ...baseVault,
      autoTax: false,
    };

    const result = calculateVaultAccrual({
      wallet: noAutoTaxVault,
      todayDate: '2026-09-08',
    });

    expect(result.totalGrossInterest).toBe(1000);
    expect(result.totalTax).toBe(0);
    expect(result.totalNetInterest).toBe(1000);
  });

  it('should accumulate multi-day catch-up when app was unopened for several days', () => {
    const result = calculateVaultAccrual({
      wallet: {
        ...baseVault,
        lastAccruedDate: '2026-09-03',
      },
      todayDate: '2026-09-08',
    });

    expect(result.missedDays).toBe(5);
    expect(result.totalGrossInterest).toBe(5000);
    expect(result.totalTax).toBe(1000);
    expect(result.totalNetInterest).toBe(4000);
    expect(result.suggestedTransaction?.amount).toBe(4000);
    expect(result.suggestedTransaction?.note).toBe('Bunga Vault (5 hari akrual)');
  });

  it('should return zero accrual when wallet is already up to date', () => {
    const result = calculateVaultAccrual({
      wallet: {
        ...baseVault,
        lastAccruedDate: '2026-09-08',
      },
      todayDate: '2026-09-08',
    });

    expect(result.missedDays).toBe(0);
    expect(result.totalNetInterest).toBe(0);
    expect(result.suggestedTransaction).toBeUndefined();
  });

  it('should return zero accrual for regular non-vault wallets', () => {
    const cashWallet: EngineWallet = {
      id: 'wallet-cash',
      name: 'Cash in Pocket',
      balance: 1000000,
      isVault: false,
      isInterestEnabled: false,
      interestRate: 0,
      interestPeriod: 'none',
      autoTax: false,
      lastAccruedDate: '2026-09-01',
    };

    const result = calculateVaultAccrual({
      wallet: cashWallet,
      todayDate: '2026-09-08',
    });

    expect(result.missedDays).toBe(0);
    expect(result.totalNetInterest).toBe(0);
  });
});
