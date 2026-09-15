import type { RawBackupTables } from '@/lib/db';
import type { Wallet, Category, RecurringBill, Transaction, Settings } from '@/lib/db/types';

export const CURRENT_BACKUP_SCHEMA_VERSION = 1;
export const APP_VERSION = '1.0.0';

export interface BackupDataPayload {
  version: number;
  appVersion: string;
  exportedAt: string;
  data: {
    wallets: Wallet[];
    categories: Category[];
    recurringBills: RecurringBill[];
    transactions: Transaction[];
    settings: Settings | null;
  };
  checksum: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  payload?: BackupDataPayload;
}

/**
 * Deterministic hash calculation for data payload string.
 * Generates an FNV-1a / 64-bit hexadecimal checksum across the serialized data payload.
 */
export function calculateChecksum(content: string): string {
  let hash1 = 0x811c9dc5;
  let hash2 = 0x9e3779b9;

  for (let i = 0; i < content.length; i++) {
    const charCode = content.charCodeAt(i);
    hash1 ^= charCode;
    hash1 = Math.imul(hash1, 0x01000193);
    hash2 ^= (charCode + i);
    hash2 = Math.imul(hash2, 0x1000193);
  }

  const h1 = (hash1 >>> 0).toString(16).padStart(8, '0');
  const h2 = (hash2 >>> 0).toString(16).padStart(8, '0');
  return `${h1}${h2}`;
}

/**
 * Serialize database tables into structured, verifiable JSON backup payload.
 */
export function serializeBackup(tables: RawBackupTables): BackupDataPayload {
  const data = {
    wallets: tables.wallets,
    categories: tables.categories,
    recurringBills: tables.recurringBills,
    transactions: tables.transactions,
    settings: tables.settings,
  };

  const dataString = JSON.stringify(data);
  const checksum = calculateChecksum(dataString);

  return {
    version: CURRENT_BACKUP_SCHEMA_VERSION,
    appVersion: APP_VERSION,
    exportedAt: new Date().toISOString(),
    data,
    checksum,
  };
}

/**
 * Validate a backup payload object or JSON string before restoration.
 */
export function validateBackupPayload(raw: unknown): ValidationResult {
  const errors: string[] = [];

  let obj: any = raw;
  if (typeof raw === 'string') {
    try {
      obj = JSON.parse(raw);
    } catch {
      return { valid: false, errors: ['Format JSON tidak valid atau berkas korup.'] };
    }
  }

  if (!obj || typeof obj !== 'object') {
    return { valid: false, errors: ['Format berkas cadangan tidak valid.'] };
  }

  if (typeof obj.version !== 'number' || obj.version > CURRENT_BACKUP_SCHEMA_VERSION) {
    errors.push(`Versi skema cadangan tidak didukung (versi: ${obj.version}).`);
  }

  if (!obj.data || typeof obj.data !== 'object') {
    errors.push('Data cadangan tidak ditemukan.');
  } else {
    if (!Array.isArray(obj.data.wallets)) errors.push('Tabel dompet (wallets) hilang atau bukan array.');
    if (!Array.isArray(obj.data.categories)) errors.push('Tabel kategori hilang atau bukan array.');
    if (!Array.isArray(obj.data.transactions)) errors.push('Tabel transaksi hilang atau bukan array.');
  }

  if (typeof obj.checksum !== 'string' || !obj.checksum) {
    errors.push('Checksum verifikasi integritas cadangan tidak ditemukan.');
  } else if (obj.data) {
    const dataString = JSON.stringify(obj.data);
    const expectedChecksum = calculateChecksum(dataString);
    if (obj.checksum !== expectedChecksum) {
      errors.push('Integritas data tidak cocok (checksum mismatch). Berkas cadangan mungkin telah dimodifikasi.');
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: [],
    payload: obj as BackupDataPayload,
  };
}
