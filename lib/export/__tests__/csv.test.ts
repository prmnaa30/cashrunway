import { describe, it, expect } from 'vitest';
import { escapeCsvField, generateTransactionsCsv } from '../csvExport';

describe('CSV Export Generator', () => {
  it('should properly escape fields containing commas, quotes, and newlines', () => {
    expect(escapeCsvField('Normal text')).toBe('"Normal text"');
    expect(escapeCsvField('Text, with comma')).toBe('"Text, with comma"');
    expect(escapeCsvField('Text "with quotes"')).toBe('"Text ""with quotes"""');
    expect(escapeCsvField(null)).toBe('""');
    expect(escapeCsvField(150000)).toBe('"150000"');
  });

  it('should generate standard CSV with UTF-8 BOM', () => {
    const mockTxs: any[] = [
      {
        id: 'tx_1',
        type: 'expense',
        amount: 25000,
        fee: 0,
        walletId: 'w_cash',
        wallet: { name: 'Tunai Saku' },
        categoryId: 'cat_coffee',
        category: { name: 'Jajan Kopi' },
        date: '2026-09-09 10:30:00',
        localDate: '2026-09-09',
        isOutlier: 0,
        note: 'Es Kopi, Gula Aren',
      },
      {
        id: 'tx_2',
        type: 'transfer',
        amount: 100000,
        fee: 2500,
        walletId: 'w_bca',
        wallet: { name: 'BCA Tahapan' },
        targetWalletId: 'w_gopay',
        targetWallet: { name: 'GoPay' },
        categoryId: null,
        category: null,
        date: '2026-09-08 14:00:00',
        localDate: '2026-09-08',
        isOutlier: 1,
        note: 'Top Up Cepat',
      },
    ];

    const csv = generateTransactionsCsv(mockTxs);

    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv).toContain('"ID","Tanggal","Waktu","Tipe"');
    expect(csv).toContain('"Es Kopi, Gula Aren"');
    expect(csv).toContain('"Tunai Saku"');
    expect(csv).toContain('"Transfer"');
    expect(csv).toContain('"102500"');
    expect(csv).toContain('"Ya"');
  });
});
