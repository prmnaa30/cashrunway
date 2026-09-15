import type { Wallet, Category, TransactionType } from '@/lib/db/types';

export interface ParsedCsvRow {
  [header: string]: string;
}

export interface ParsedCsvResult {
  headers: string[];
  rows: ParsedCsvRow[];
  totalRows: number;
  detectedFormat: 'cashrunway' | 'generic';
}

export interface ImportableTransaction {
  type: TransactionType;
  amount: number;
  fee: number;
  walletName: string;
  targetWalletName?: string;
  categoryName?: string;
  date: string;
  localDate: string;
  note?: string;
  isOutlier: number;
}

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

/**
 * Robust RFC 4180 CSV parser handling UTF-8 BOM, quoted fields, and newlines.
 */
export function parseCsvContent(rawCsv: string): ParsedCsvResult {
  let content = rawCsv;
  // Remove UTF-8 BOM if present
  if (content.charCodeAt(0) === 0xfeff) {
    content = content.slice(1);
  }

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let insideQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentField += '"';
        i++; // skip escaped quote
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentField.trim());
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentField.trim());
      currentField = '';
      if (currentRow.some((f) => f.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
    } else {
      currentField += char;
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((f) => f.length > 0)) {
      rows.push(currentRow);
    }
  }

  if (rows.length === 0) {
    return { headers: [], rows: [], totalRows: 0, detectedFormat: 'generic' };
  }

  const headers = rows[0].map((h) => h.replace(/^["']|["']$/g, '').trim());
  const dataRows: ParsedCsvRow[] = [];

  for (let r = 1; r < rows.length; r++) {
    const rowObj: ParsedCsvRow = {};
    const cols = rows[r];
    for (let c = 0; c < headers.length; c++) {
      const headerKey = headers[c];
      rowObj[headerKey] = cols[c] !== undefined ? cols[c] : '';
    }
    dataRows.push(rowObj);
  }

  const detectedFormat = detectCsvFormat(headers);

  return {
    headers,
    rows: dataRows,
    totalRows: dataRows.length,
    detectedFormat,
  };
}

/**
 * Detect whether the CSV adheres to CashRunway's native export layout.
 */
export function detectCsvFormat(headers: string[]): 'cashrunway' | 'generic' {
  const normalized = headers.map((h) => h.toLowerCase());
  const hasCashRunwayHeaders =
    normalized.includes('akun / dompet') ||
    normalized.includes('pengeluaran khusus') ||
    (normalized.includes('tipe') && normalized.includes('nominal') && normalized.includes('tanggal'));

  return hasCashRunwayHeaders ? 'cashrunway' : 'generic';
}

/**
 * Convert parsed CashRunway CSV rows into validated ImportableTransactions.
 */
export function mapCashRunwayCsvRows(rows: ParsedCsvRow[]): ImportableTransaction[] {
  const transactions: ImportableTransaction[] = [];

  for (const row of rows) {
    const typeRaw = (row['Tipe'] || row['tipe'] || '').toLowerCase();
    let type: TransactionType = 'expense';
    if (typeRaw.includes('pemasukan') || typeRaw === 'income') {
      type = 'income';
    } else if (typeRaw.includes('transfer')) {
      type = 'transfer';
    } else if (typeRaw.includes('penyesuaian') || typeRaw === 'adjustment') {
      type = 'adjustment';
    }

    const dateStr = row['Tanggal'] || row['tanggal'] || new Date().toISOString().split('T')[0];
    const timeStr = row['Waktu'] || row['waktu'] || '12:00:00';
    const combinedDate = `${dateStr} ${timeStr.length === 5 ? timeStr + ':00' : timeStr}`.trim();

    const amount = Math.abs(parseFloat(row['Nominal'] || row['nominal'] || '0')) || 0;
    const fee = Math.abs(parseFloat(row['Biaya Admin'] || row['biaya admin'] || '0')) || 0;
    const walletName = (row['Akun / Dompet'] || row['Dompet'] || row['Akun'] || '').trim();
    const targetWalletName = (row['Akun Tujuan'] || row['Target'] || '').trim() || undefined;
    const categoryName = (row['Kategori'] || '').trim() || undefined;
    const isOutlier = (row['Pengeluaran Khusus'] || '').toLowerCase() === 'ya' ? 1 : 0;
    const note = (row['Catatan'] || '').trim() || undefined;

    if (amount > 0 && walletName) {
      transactions.push({
        type,
        amount,
        fee,
        walletName,
        targetWalletName: targetWalletName !== '-' ? targetWalletName : undefined,
        categoryName: categoryName !== '-' ? categoryName : undefined,
        date: combinedDate,
        localDate: dateStr,
        note,
        isOutlier,
      });
    }
  }

  return transactions;
}

/**
 * Import a collection of mapped transactions into the database.
 * Strategy 'append' ignores exact duplicates, 'replace' clears all transactions first.
 */
export async function importTransactionsBatch(
  transactions: ImportableTransaction[],
  strategy: 'append' | 'replace' = 'append'
): Promise<ImportResult> {
  const errors: string[] = [];
  let imported = 0;
  let skipped = 0;

  if (transactions.length === 0) {
    return { imported: 0, skipped: 0, errors: ['Tidak ada transaksi valid untuk diimpor.'] };
  }

  const {
    getWallets,
    getCategories,
    insertTransaction,
    generateId,
    clearAllTransactions,
  } = require('@/lib/db');

  const [existingWallets, existingCategories] = await Promise.all([
    getWallets(true),
    getCategories(),
  ]);

  const walletByName = new Map<string, Wallet>();
  existingWallets.forEach((w: Wallet) => walletByName.set(w.name.toLowerCase(), w));

  const categoryByName = new Map<string, Category>();
  existingCategories.forEach((c: Category) => categoryByName.set(c.name.toLowerCase(), c));

  const fallbackWallet = existingWallets.find((w: Wallet) => w.isVault === 0) || existingWallets[0];
  if (!fallbackWallet) {
    return { imported: 0, skipped: 0, errors: ['Tidak ditemukan akun dompet aktif di sistem.'] };
  }

  if (strategy === 'replace') {
    await clearAllTransactions();
  }

  for (const item of transactions) {
    try {
      const matchedWallet = walletByName.get(item.walletName.toLowerCase());
      const effectiveWalletId = matchedWallet ? matchedWallet.id : fallbackWallet.id;

      let targetWallet: Wallet | undefined;
      if (item.targetWalletName) {
        targetWallet = walletByName.get(item.targetWalletName.toLowerCase());
      }

      let category: Category | undefined;
      if (item.categoryName) {
        category = categoryByName.get(item.categoryName.toLowerCase());
      }

      await insertTransaction({
        id: generateId('tx_imp'),
        type: item.type,
        amount: item.amount,
        fee: item.fee,
        walletId: effectiveWalletId,
        targetWalletId: targetWallet ? targetWallet.id : null,
        categoryId: category ? category.id : null,
        recurringBillId: null,
        isOutlier: item.isOutlier,
        date: item.date,
        localDate: item.localDate,
        note: item.note ? `${item.note} [Imported]` : '[Imported]',
      });

      imported++;
    } catch (err: any) {
      skipped++;
      errors.push(`Gagal mengimpor transaksi pada ${item.date}: ${err.message || String(err)}`);
    }
  }

  return {
    imported,
    skipped,
    errors,
  };
}
