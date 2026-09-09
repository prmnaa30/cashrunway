import { describe, it, expect } from 'vitest';
import { calculateVaultAccrual } from '../vaultAccrual';
import { EngineWallet } from '../types';

describe('Per-Wallet Vault Accrual & Decentralized Yield', () => {
  const walletA: EngineWallet = {
    id: 'w_seabank',
    name: 'SeaBank High Yield',
    balance: 10000000,
    isVault: true,
    isInterestEnabled: true,
    // 3.75%
    interestRate: 0.0375,
    interestPeriod: 'daily',
    autoTax: true,
    lastAccruedDate: '2026-09-06',
  };

  const walletB: EngineWallet = {
    id: 'w_jago',
    name: 'Jago Locked Pocket',
    balance: 5000000,
    isVault: true,
    isInterestEnabled: true,
    // 5%
    interestRate: 0.05,
    interestPeriod: 'daily',
    autoTax: true,
    lastAccruedDate: '2026-09-08',
  };

  const todayDate = '2026-09-09';

  it('calculates independent accruals for each wallet without crosstalk', () => {
    const accrualA = calculateVaultAccrual({ wallet: walletA, todayDate });
    const accrualB = calculateVaultAccrual({ wallet: walletB, todayDate });

    // Wallet A has 3 missed days (06 -> 09)
    expect(accrualA.walletId).toBe('w_seabank');
    expect(accrualA.missedDays).toBe(3);
    expect(accrualA.totalNetInterest).toBeGreaterThan(0);

    // Wallet B has 1 missed day (08 -> 09)
    expect(accrualB.walletId).toBe('w_jago');
    expect(accrualB.missedDays).toBe(1);
    expect(accrualB.totalNetInterest).toBeGreaterThan(0);

    // Amounts should reflect individual balances & rates
    expect(accrualA.totalGrossInterest).not.toBe(accrualB.totalGrossInterest);
  });

  it('accurately advances lastAccruedDate for only the claimed wallet', () => {
    const accrualA = calculateVaultAccrual({ wallet: walletA, todayDate });
    
    // Simulate updating only wallet A
    const updatedWalletA: EngineWallet = {
      ...walletA,
      lastAccruedDate: accrualA.newLastAccruedDate,
    };

    // Subsequent accrual calculation for wallet A shows 0 missed days
    const nextAccrualA = calculateVaultAccrual({ wallet: updatedWalletA, todayDate });
    expect(nextAccrualA.missedDays).toBe(0);
    expect(nextAccrualA.totalNetInterest).toBe(0);

    // Wallet B remains unaccrued with 1 missed day
    const nextAccrualB = calculateVaultAccrual({ wallet: walletB, todayDate });
    expect(nextAccrualB.missedDays).toBe(1);
  });
});
