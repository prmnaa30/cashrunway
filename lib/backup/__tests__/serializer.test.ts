import { describe, it, expect } from 'vitest';
import {
  serializeBackup,
  validateBackupPayload,
  calculateChecksum,
  CURRENT_BACKUP_SCHEMA_VERSION,
  APP_VERSION,
} from '../serializer';
import type { RawBackupTables } from '@/lib/db';

describe('Backup Serializer', () => {
  const mockTables: RawBackupTables = {
    wallets: [
      {
        id: 'w_cash',
        name: 'Tunai Saku',
        type: 'cash',
        balance: 250000,
        isVault: 0,
        isInterestEnabled: 0,
        interestRate: 0,
        interestPeriod: 'none',
        payoutDay: 1,
        autoTax: 0,
        taxRate: 0.2,
        taxThreshold: 7500000,
        lastAccruedDate: null,
        isDeleted: 0,
      },
    ],
    categories: [
      {
        id: 'cat_food',
        name: 'Makanan & Minuman',
        type: 'expense',
        icon: '🍔',
        isFixed: 0,
        isDefault: 1,
      },
    ],
    recurringBills: [
      {
        id: 'bill_wifi',
        name: 'Indihome',
        amount: 350000,
        dueDay: 15,
        categoryId: 'cat_food',
        walletId: 'w_cash',
        lastPaidPeriod: null,
        isActive: 1,
      },
    ],
    transactions: [
      {
        id: 'tx_1',
        type: 'expense',
        amount: 25000,
        fee: 0,
        walletId: 'w_cash',
        targetWalletId: null,
        categoryId: 'cat_food',
        recurringBillId: null,
        isOutlier: 0,
        date: '2026-09-15 12:30:00',
        localDate: '2026-09-15',
        note: 'Makan Siang',
      },
    ],
    settings: {
      id: 1,
      targetDate: null,
      paydayDay: 25,
      fallbackDailyBurn: 50000,
      burnWindowDays: 14,
      notificationHour: 20,
      isReminderEnabled: 1,
      reminderTimes: '[]',
      language: 'auto',
      currency: 'IDR',
      themeMode: 'system',
      isPrivacyMode: 0,
      dualRunwayMode: 1,
      lastBackupDate: null,
      googleEmail: null,
      autoBackupEnabled: 0,
    },
  };

  it('serializes all 5 tables into standard backup payload structure', () => {
    const payload = serializeBackup(mockTables);

    expect(payload.version).toBe(CURRENT_BACKUP_SCHEMA_VERSION);
    expect(payload.appVersion).toBe(APP_VERSION);
    expect(typeof payload.exportedAt).toBe('string');
    expect(payload.checksum).toBeDefined();
    expect(payload.data.wallets).toHaveLength(1);
    expect(payload.data.categories).toHaveLength(1);
    expect(payload.data.recurringBills).toHaveLength(1);
    expect(payload.data.transactions).toHaveLength(1);
    expect(payload.data.settings?.currency).toBe('IDR');
  });

  it('validates a valid backup payload successfully', () => {
    const payload = serializeBackup(mockTables);
    const result = validateBackupPayload(payload);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.payload?.data.wallets[0].name).toBe('Tunai Saku');
  });

  it('validates a JSON string input successfully', () => {
    const payload = serializeBackup(mockTables);
    const jsonStr = JSON.stringify(payload);
    const result = validateBackupPayload(jsonStr);

    expect(result.valid).toBe(true);
    expect(result.payload?.version).toBe(CURRENT_BACKUP_SCHEMA_VERSION);
  });

  it('rejects tampered data with checksum mismatch', () => {
    const payload = serializeBackup(mockTables);
    // Tamper the data without updating checksum
    payload.data.wallets[0].balance = 99999999;

    const result = validateBackupPayload(payload);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('checksum'))).toBe(true);
  });

  it('rejects unsupported future schema versions', () => {
    const payload = serializeBackup(mockTables);
    payload.version = 999;
    // Recalculate checksum
    payload.checksum = calculateChecksum(JSON.stringify(payload.data));

    const result = validateBackupPayload(payload);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Versi skema'))).toBe(true);
  });

  it('rejects malformed json strings', () => {
    const result = validateBackupPayload('{ invalid json content');
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('tidak valid');
  });
});
