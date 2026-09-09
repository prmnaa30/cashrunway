import * as SQLite from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { eq, desc, asc } from 'drizzle-orm';
import * as schema from './schema';
import {
  CREATE_TABLES_SQL_STATEMENTS,
  CREATE_TRIGGERS_SQL_STATEMENTS,
} from './schema';
import { seedInitialData } from './seed';
import {
  Wallet,
  Category,
  RecurringBill,
  Transaction,
  NewTransaction,
  Settings,
  generateId,
  CategoryType,
} from './types';

export * from './schema';
export * from './types';
export * from './seed';

export const DATABASE_NAME = 'cashrunway.db';

export const expoDb = SQLite.openDatabaseSync(DATABASE_NAME);
export const db = drizzle(expoDb, { schema });

let isDbInitialized = false;
let initPromise: Promise<void> | null = null;

export async function initDatabase(dbInstance?: SQLite.SQLiteDatabase): Promise<void> {
  if (isDbInitialized) return;
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    const targetDb = dbInstance ?? expoDb;

    try {
      await targetDb.execAsync('PRAGMA journal_mode = WAL;');
      await targetDb.execAsync('PRAGMA foreign_keys = ON;');
    } catch (err) {
      console.warn('[DB Init] Warning configuring pragmas:', err);
    }

    for (const sql of CREATE_TABLES_SQL_STATEMENTS) {
      const trimmed = sql.trim();
      if (!trimmed) continue;
      try {
        await targetDb.execAsync(trimmed);
      } catch (err) {
        console.error('[DB Init] Error executing table statement:', trimmed, err);
        throw err;
      }
    }

    for (const sql of CREATE_TRIGGERS_SQL_STATEMENTS) {
      const trimmed = sql.trim();
      if (!trimmed) continue;
      try {
        await targetDb.execAsync(trimmed);
      } catch (err) {
        console.error('[DB Init] Error executing trigger statement:', trimmed, err);
        throw err;
      }
    }

    // Safe migration: add is_deleted, tax_rate, tax_threshold columns to existing databases if missing
    try {
      await targetDb.execAsync('ALTER TABLE wallets ADD COLUMN is_deleted INTEGER NOT NULL DEFAULT 0;');
    } catch (_) {}
    try {
      await targetDb.execAsync('ALTER TABLE wallets ADD COLUMN tax_rate REAL NOT NULL DEFAULT 0.2;');
    } catch (_) {}
    try {
      await targetDb.execAsync('ALTER TABLE wallets ADD COLUMN tax_threshold REAL NOT NULL DEFAULT 7500000;');
    } catch (_) {}

    const drizzleClient = dbInstance ? drizzle(dbInstance, { schema }) : db;
    await seedInitialData(drizzleClient);
    isDbInitialized = true;
  })().catch((err) => {
    initPromise = null;
    console.error('[DB Init] Fatal database initialization failure:', err);
    throw err;
  });

  return initPromise;
}

export async function ensureDatabaseInitialized(): Promise<void> {
  return initDatabase();
}

export async function getWallets(includeDeleted = false): Promise<Wallet[]> {
  await ensureDatabaseInitialized();
  return await db.query.wallets.findMany({
    where: includeDeleted ? undefined : eq(schema.wallets.isDeleted, 0),
    orderBy: [asc(schema.wallets.isVault), asc(schema.wallets.name)],
  });
}

export async function getCategories(type?: CategoryType): Promise<Category[]> {
  await ensureDatabaseInitialized();
  if (type) {
    return await db.query.categories.findMany({
      where: eq(schema.categories.type, type),
      orderBy: [asc(schema.categories.isFixed), asc(schema.categories.name)],
    });
  }
  return await db.query.categories.findMany({
    orderBy: [asc(schema.categories.type), asc(schema.categories.isFixed), asc(schema.categories.name)],
  });
}

export async function getRecurringBills(): Promise<RecurringBill[]> {
  await ensureDatabaseInitialized();
  return await db.query.recurringBills.findMany({
    where: eq(schema.recurringBills.isActive, 1),
    orderBy: [asc(schema.recurringBills.dueDay)],
  });
}

export type TransactionWithDetails = Transaction & {
  category?: Category | null;
  wallet?: Wallet | null;
  targetWallet?: Wallet | null;
};

export async function getTransactionsWithDetails(limit = 100): Promise<TransactionWithDetails[]> {
  await ensureDatabaseInitialized();
  return (await db.query.transactions.findMany({
    with: {
      category: true,
      wallet: true,
      targetWallet: true,
    },
    orderBy: [desc(schema.transactions.date)],
    limit,
  })) as TransactionWithDetails[];
}

export async function getTransactions(limit = 50): Promise<Transaction[]> {
  await ensureDatabaseInitialized();
  return await db.query.transactions.findMany({
    orderBy: [desc(schema.transactions.date)],
    limit,
  });
}

export async function getSettings(): Promise<Settings | null> {
  await ensureDatabaseInitialized();
  const result = await db.query.settings.findFirst({
    where: eq(schema.settings.id, 1),
  });
  return result ?? null;
}

export async function insertTransaction(
  tx: Omit<NewTransaction, 'id' | 'localDate'> & { id?: string; localDate?: string }
): Promise<string> {
  const id = tx.id ?? generateId('tx');
  const localDate =
    tx.localDate ?? (tx.date.includes('T') ? tx.date.split('T')[0] : tx.date.split(' ')[0]);

  await db.insert(schema.transactions).values({
    ...tx,
    id,
    localDate,
  });

  return id;
}

export async function deleteTransaction(id: string): Promise<void> {
  await db.delete(schema.transactions).where(eq(schema.transactions.id, id));
}

export async function updateWalletBalance(walletId: string, newBalance: number): Promise<void> {
  const now = new Date();
  const dateStr = now.toISOString().replace('T', ' ').substring(0, 19);
  await insertTransaction({
    type: 'adjustment',
    amount: newBalance,
    fee: 0,
    walletId,
    targetWalletId: null,
    categoryId: null,
    recurringBillId: null,
    isOutlier: 1,
    date: dateStr,
    note: 'Cash balancing',
  });
}

export async function insertWallet(
  wallet: Omit<Wallet, 'id' | 'isDeleted'> & { id?: string; isDeleted?: number; initialBalance?: number }
): Promise<string> {
  await ensureDatabaseInitialized();
  const id = wallet.id ?? generateId('w');
  const { initialBalance = 0, ...walletData } = wallet;

  await db.insert(schema.wallets).values({
    ...walletData,
    id,
    balance: 0,
    isDeleted: wallet.isDeleted ?? 0,
  });

  if (initialBalance > 0) {
    const now = new Date();
    const dateStr = now.toISOString().replace('T', ' ').substring(0, 19);
    await insertTransaction({
      type: 'adjustment',
      amount: initialBalance,
      fee: 0,
      walletId: id,
      targetWalletId: null,
      categoryId: null,
      recurringBillId: null,
      isOutlier: 1,
      date: dateStr,
      note: 'Saldo Awal',
    });
  }

  return id;
}

export async function softDeleteWallet(walletId: string): Promise<void> {
  await ensureDatabaseInitialized();
  await db.update(schema.wallets).set({ isDeleted: 1 }).where(eq(schema.wallets.id, walletId));
}

export async function restoreWallet(walletId: string): Promise<void> {
  await ensureDatabaseInitialized();
  await db.update(schema.wallets).set({ isDeleted: 0 }).where(eq(schema.wallets.id, walletId));
}

export async function updateWallet(
  walletId: string,
  data: Partial<Omit<Wallet, 'id'>>
): Promise<void> {
  await db.update(schema.wallets).set(data).where(eq(schema.wallets.id, walletId));
}

export async function seedDemoTransactions(): Promise<void> {
  await db.update(schema.wallets).set({ balance: 450000 }).where(eq(schema.wallets.id, 'w_cash'));
  await db.update(schema.wallets).set({ balance: 6850000 }).where(eq(schema.wallets.id, 'w_bca'));
  await db.update(schema.wallets).set({ balance: 350000 }).where(eq(schema.wallets.id, 'w_gopay'));
  
  const today = new Date();
  const threeDaysAgo = new Date(today);
  threeDaysAgo.setDate(today.getDate() - 3);
  const threeDaysAgoStr = threeDaysAgo.toISOString().split('T')[0];

  await db.update(schema.wallets).set({ 
    balance: 15000000,
    lastAccruedDate: threeDaysAgoStr,
  }).where(eq(schema.wallets.id, 'w_seabank'));

  const existingBills = await db.query.recurringBills.findMany();
  if (existingBills.length === 0) {
    await db.insert(schema.recurringBills).values([
      {
        id: generateId('bill'),
        name: 'Sewa Kos Bulanan',
        amount: 1500000,
        dueDay: 1,
        categoryId: 'cat_rent',
        walletId: 'w_bca',
        lastPaidPeriod: null,
        isActive: 1,
      },
      {
        id: generateId('bill'),
        name: 'WiFi Indihome',
        amount: 385000,
        dueDay: 15,
        categoryId: 'cat_wifi',
        walletId: 'w_bca',
        lastPaidPeriod: null,
        isActive: 1,
      },
      {
        id: generateId('bill'),
        name: 'Spotify & YouTube',
        amount: 85000,
        dueDay: 20,
        categoryId: 'cat_subs',
        walletId: 'w_gopay',
        lastPaidPeriod: null,
        isActive: 1,
      },
    ]);
  }

  const existingTx = await db.query.transactions.findMany({ limit: 1 });
  if (existingTx.length === 0) {
    const todayStr = today.toISOString().split('T')[0];
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(today.getDate() - 2);
    const twoDaysAgoStr = twoDaysAgo.toISOString().split('T')[0];

    await db.insert(schema.transactions).values([
      {
        id: generateId('tx'),
        type: 'expense',
        amount: 45000,
        fee: 0,
        walletId: 'w_gopay',
        targetWalletId: null,
        categoryId: 'cat_food',
        recurringBillId: null,
        isOutlier: 0,
        date: `${todayStr} 12:30:00`,
        localDate: todayStr,
        note: 'Makan siang nasi padang',
      },
      {
        id: generateId('tx'),
        type: 'expense',
        amount: 28000,
        fee: 0,
        walletId: 'w_cash',
        targetWalletId: null,
        categoryId: 'cat_coffee',
        recurringBillId: null,
        isOutlier: 0,
        date: `${todayStr} 09:15:00`,
        localDate: todayStr,
        note: 'Es Kopi Susu Aren',
      },
      {
        id: generateId('tx'),
        type: 'expense',
        amount: 115000,
        fee: 0,
        walletId: 'w_bca',
        targetWalletId: null,
        categoryId: 'cat_groceries',
        recurringBillId: null,
        isOutlier: 0,
        date: `${yesterdayStr} 18:45:00`,
        localDate: yesterdayStr,
        note: 'Belanja mingguan supermarket',
      },
      {
        id: generateId('tx'),
        type: 'transfer',
        amount: 200000,
        fee: 1000,
        walletId: 'w_bca',
        targetWalletId: 'w_gopay',
        categoryId: null,
        recurringBillId: null,
        isOutlier: 0,
        date: `${yesterdayStr} 10:00:00`,
        localDate: yesterdayStr,
        note: 'Top up GoPay dari BCA',
      },
      {
        id: generateId('tx'),
        type: 'expense',
        amount: 25000,
        fee: 0,
        walletId: 'w_gopay',
        targetWalletId: null,
        categoryId: 'cat_transport',
        recurringBillId: null,
        isOutlier: 0,
        date: `${twoDaysAgoStr} 08:30:00`,
        localDate: twoDaysAgoStr,
        note: 'Ojek online ke kantor',
      },
      {
        id: generateId('tx'),
        type: 'income',
        amount: 1540,
        fee: 0,
        walletId: 'w_seabank',
        targetWalletId: null,
        categoryId: 'cat_interest',
        recurringBillId: null,
        isOutlier: 0,
        date: `${threeDaysAgoStr} 05:00:00`,
        localDate: threeDaysAgoStr,
        note: 'Bunga SeaBank Harian',
      },
    ]);
  }
}
