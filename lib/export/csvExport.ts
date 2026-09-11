import type { TransactionWithDetails } from '@/lib/db';

export function escapeCsvField(value: any): string {
  if (value === null || value === undefined) {
    return '""';
  }
  const str = String(value);
  const escaped = str.split('"').join('""');
  return '"' + escaped + '"';
}

export function generateTransactionsCsv(transactions: TransactionWithDetails[]): string {
  const headers = [
    'ID',
    'Tanggal',
    'Waktu',
    'Tipe',
    'Akun / Dompet',
    'Akun Tujuan',
    'Kategori',
    'Nominal',
    'Biaya Admin',
    'Total Pengeluaran',
    'Pengeluaran Khusus',
    'Catatan',
  ];

  const headerRow = headers.map(escapeCsvField).join(',');

  const rows = transactions.map((tx) => {
    let datePart = tx.localDate;
    let timePart = '';
    if (tx.date.includes('T')) {
      const split = tx.date.split('T');
      datePart = split[0];
      timePart = split[1]?.slice(0, 8) || '';
    } else if (tx.date.includes(' ')) {
      const split = tx.date.split(' ');
      datePart = split[0];
      timePart = split[1] || '';
    }

    const typeLabel =
      tx.type === 'expense'
        ? 'Pengeluaran'
        : tx.type === 'income'
        ? 'Pemasukan'
        : tx.type === 'transfer'
        ? 'Transfer'
        : 'Penyesuaian';

    const sourceWallet = tx.wallet?.name || '-';
    const targetWallet = tx.targetWallet?.name || '-';
    const categoryName = tx.category?.name || '-';
    const fee = tx.fee || 0;
    const totalAmount = tx.type === 'transfer' ? tx.amount + fee : tx.amount;
    const isSpecial = tx.isOutlier ? 'Ya' : 'Tidak';
    const note = tx.note || '';

    return [
      escapeCsvField(tx.id),
      escapeCsvField(datePart),
      escapeCsvField(timePart),
      escapeCsvField(typeLabel),
      escapeCsvField(sourceWallet),
      escapeCsvField(targetWallet),
      escapeCsvField(categoryName),
      escapeCsvField(tx.amount),
      escapeCsvField(fee),
      escapeCsvField(totalAmount),
      escapeCsvField(isSpecial),
      escapeCsvField(note),
    ].join(',');
  });

  return '\uFEFF' + [headerRow, ...rows].join('\r\n');
}

export async function exportAndShareTransactionsCsv(
  transactions: TransactionWithDetails[],
  fileNamePrefix = 'mutasi-cashrunway'
): Promise<{ success: boolean; uri?: string }> {
  if (!transactions || transactions.length === 0) {
    return { success: false };
  }

  const csvContent = generateTransactionsCsv(transactions);
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const fileName = `${fileNamePrefix}-${dateStr}.csv`;

  let isWeb = false;
  try {
    const { Platform } = require('react-native');
    isWeb = Platform.OS === 'web';
  } catch (_) {
    isWeb = typeof document !== 'undefined';
  }

  if (isWeb && typeof document !== 'undefined') {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return { success: true };
  }

  try {
    const { File, Paths } = require('expo-file-system');
    const Sharing = require('expo-sharing');

    const file = new File(Paths.cache, fileName);
    file.write(csvContent);

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(file.uri, {
        mimeType: 'text/csv',
        dialogTitle: 'Ekspor Data Mutasi CashRunway',
        UTI: 'public.comma-separated-values-text',
      });
      return { success: true, uri: file.uri };
    }
    return { success: true, uri: file.uri };
  } catch (err) {
    console.error('Failed to export CSV native:', err);
    throw err;
  }
}
