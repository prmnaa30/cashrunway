import * as SQLite from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { eq, desc, asc } from 'drizzle-orm';
import * as schema from './schema';
import { CREATE_TABLES_SQL, CREATE_TRIGGERS_SQL } from './schema';
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

export async function initDatabase(): Promise<void> {
  expoDb.execSync(CREATE_TABLES_SQL);
  expoDb.execSync(CREATE_TRIGGERS_SQL);

  await seedInitialData(db);
}

export async function getWallets(): Promise<Wallet[]> {
  return await db.query.wallets.findMany({
    orderBy: [asc(schema.wallets.isVault), asc(schema.wallets.name)],
  });
}

export async function getCategories(type?: CategoryType): Promise<Category[]> {
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
  return await db.query.recurringBills.findMany({
    where: eq(schema.recurringBills.isActive, 1),
    orderBy: [asc(schema.recurringBills.dueDay)],
  });
}

export async function getTransactions(limit = 50): Promise<Transaction[]> {
  return await db.query.transactions.findMany({
    orderBy: [desc(schema.transactions.date)],
    limit,
  });
}

export async function getSettings(): Promise<Settings | null> {
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
