import { describe, it, expect } from 'vitest';
import {
  parseCsvContent,
  detectCsvFormat,
  mapCashRunwayCsvRows,
} from '../csvImporter';

describe('CSV Importer', () => {
  const sampleCashRunwayCsv =
    '\uFEFF"ID","Tanggal","Waktu","Tipe","Akun / Dompet","Akun Tujuan","Kategori","Nominal","Biaya Admin","Total Pengeluaran","Pengeluaran Khusus","Catatan"\r\n' +
    '"tx_1","2026-09-14","12:30:00","Pengeluaran","Tunai Saku","-","Makanan & Minuman","45000","0","45000","Tidak","Makan siang padang"\r\n' +
    '"tx_2","2026-09-14","10:00:00","Transfer","BCA Tahapan","GoPay","-","150000","1000","151000","Tidak","Top up saldo"\r\n' +
    '"tx_3","2026-09-13","08:00:00","Pemasukan","SeaBank Vault","-","Bunga Tabungan","2500","0","2500","Ya","Bunga harian"';

  const sampleGenericCsv =
    'Date,Type,Amount,Wallet,Note\n' +
    '2026-09-10,Expense,35000,Cash,Coffee\n' +
    '2026-09-11,Income,500000,Bank,Side gig';

  it('strips UTF-8 BOM and parses quoted CSV columns correctly', () => {
    const result = parseCsvContent(sampleCashRunwayCsv);

    expect(result.headers).toHaveLength(12);
    expect(result.headers[0]).toBe('ID');
    expect(result.headers[4]).toBe('Akun / Dompet');
    expect(result.totalRows).toBe(3);
    expect(result.rows[0]['Catatan']).toBe('Makan siang padang');
    expect(result.rows[1]['Tipe']).toBe('Transfer');
    expect(result.detectedFormat).toBe('cashrunway');
  });

  it('handles quotes with commas and escaped quotes inside fields', () => {
    const complexCsv =
      '"Name","Amount","Note"\r\n' +
      '"Item A","10000","Note with, comma and ""escaped"" quotes"';

    const result = parseCsvContent(complexCsv);
    expect(result.rows[0]['Note']).toBe('Note with, comma and "escaped" quotes');
  });

  it('detects CashRunway native export format accurately', () => {
    const crHeaders = ['ID', 'Tanggal', 'Tipe', 'Akun / Dompet', 'Nominal'];
    expect(detectCsvFormat(crHeaders)).toBe('cashrunway');

    const genericHeaders = ['Date', 'Category', 'Price', 'Description'];
    expect(detectCsvFormat(genericHeaders)).toBe('generic');
  });

  it('maps CashRunway CSV rows into ImportableTransactions', () => {
    const parsed = parseCsvContent(sampleCashRunwayCsv);
    const mapped = mapCashRunwayCsvRows(parsed.rows);

    expect(mapped).toHaveLength(3);

    // Expense item
    expect(mapped[0].type).toBe('expense');
    expect(mapped[0].amount).toBe(45000);
    expect(mapped[0].walletName).toBe('Tunai Saku');
    expect(mapped[0].categoryName).toBe('Makanan & Minuman');
    expect(mapped[0].isOutlier).toBe(0);

    // Transfer item
    expect(mapped[1].type).toBe('transfer');
    expect(mapped[1].amount).toBe(150000);
    expect(mapped[1].fee).toBe(1000);
    expect(mapped[1].walletName).toBe('BCA Tahapan');
    expect(mapped[1].targetWalletName).toBe('GoPay');

    // Income with outlier
    expect(mapped[2].type).toBe('income');
    expect(mapped[2].amount).toBe(2500);
    expect(mapped[2].isOutlier).toBe(1);
  });

  it('returns empty result gracefully on empty CSV string', () => {
    const result = parseCsvContent('');
    expect(result.totalRows).toBe(0);
    expect(result.headers).toHaveLength(0);
  });
});
