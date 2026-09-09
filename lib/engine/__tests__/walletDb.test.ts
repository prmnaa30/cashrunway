import { describe, it, expect } from 'vitest';

describe('Wallet Soft Delete & Logic Rules', () => {
  interface MockWallet {
    id: string;
    name: string;
    type: 'cash' | 'bank' | 'ewallet';
    balance: number;
    isVault: number;
    isDeleted: number;
    isInterestEnabled: number;
    interestRate: number;
    autoTax: number;
  }

  const mockWallets: MockWallet[] = [
    {
      id: 'w_cash',
      name: 'Tunai Saku',
      type: 'cash',
      balance: 150000,
      isVault: 0,
      isDeleted: 0,
      isInterestEnabled: 0,
      interestRate: 0,
      autoTax: 0,
    },
    {
      id: 'w_old_bank',
      name: 'BCA Lama (Archived)',
      type: 'bank',
      balance: 0,
      isVault: 0,
      // Soft deleted
      isDeleted: 1,
      isInterestEnabled: 0,
      interestRate: 0,
      autoTax: 0,
    },
    {
      id: 'w_seabank',
      name: 'SeaBank Vault',
      type: 'bank',
      balance: 10000000,
      isVault: 1,
      isDeleted: 0,
      isInterestEnabled: 1,
      interestRate: 0.0375,
      autoTax: 1,
    },
  ];

  it('filters out soft deleted wallets by default for active display', () => {
    const activeWallets = mockWallets.filter((w) => w.isDeleted === 0);
    expect(activeWallets.length).toBe(2);
    expect(activeWallets.find((w) => w.id === 'w_old_bank')).toBeUndefined();
  });

  it('allows soft-deleting a wallet without mutating other wallets', () => {
    const walletsCopy = mockWallets.map((w) => ({ ...w }));
    const target = walletsCopy.find((w) => w.id === 'w_cash');
    if (target) {
      target.isDeleted = 1;
    }

    expect(walletsCopy.find((w) => w.id === 'w_cash')?.isDeleted).toBe(1);
    expect(walletsCopy.find((w) => w.id === 'w_seabank')?.isDeleted).toBe(0);
  });

  it('calculates adjustment delta correctly for reconciliation', () => {
    const currentBalance = 150000;
    const newPhysicalBalance = 200000;
    const delta = newPhysicalBalance - currentBalance;

    expect(delta).toBe(50000);
    expect(delta > 0).toBe(true);
  });
});
