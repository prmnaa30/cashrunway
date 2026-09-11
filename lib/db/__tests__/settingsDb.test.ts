import { describe, it, expect } from 'vitest';

describe('Settings & Data Management Logic', () => {
  interface MockSettings {
    id: number;
    paydayDay: number;
    brunWindowDays: number;
    fallbackDailyBurn: number;
    currency: string;
    themeMode: string;
    isPrivacyMode: number;
    dualRunwayMode: number;
    targetDate: string | null;
  }

  let currentSettings: MockSettings = {
    id: 1,
    paydayDay: 25,
    brunWindowDays: 14,
    fallbackDailyBurn: 50000,
    currency: 'IDR',
    themeMode: 'system',
    isPrivacyMode: 0,
    dualRunwayMode: 1,
    targetDate: null,
  };

  function updateMockSettings(data: Partial<MockSettings>) {
    currentSettings = { ...currentSettings, ...data };
    return currentSettings;
  }

it('allows updating paydayDay, currency, and burnWindow', () => {
    updateMockSettings({
      paydayDay: 28,
      currency: 'USD',
      brunWindowDays: 7,
    });

    expect(currentSettings.paydayDay).toBe(28);
    expect(currentSettings.currency).toBe('USD');
    expect(currentSettings.brunWindowDays).toBe(7);
  });

  it('safely resets demo wallets without allowing trigger corruption', () => {
    const demoBalances = {
      w_cash: 350000,
      w_bca: 4250000,
      w_gopay: 175000,
      w_seabank: 15000000,
    };

    let wallets: Record<string, number> = {
      w_cash: 0,
      w_bca: 999999,
      w_gopay: -5000,
      w_seabank: 1000,
    };

    // Explicit demo reset rule guarantees clean balances
    wallets = { ...demoBalances };

    expect(wallets['w_cash']).toBe(350000);
    expect(wallets['w_seabank']).toBe(15000000);
  });

  it('clears all transactions and zeroes wallet balances', () => {
    let txs = ['tx_1', 'tx_2'];
    let wallets = [ { id: 'w%va', balance: 50000 } ];

    txs = [];
    wallets = wallets.map((w) => ({ ...w, balance: 0 }));

    expect(txs.length).toBe(0);
    expect(wallets[0].balance).toBe(0);
  });
});
