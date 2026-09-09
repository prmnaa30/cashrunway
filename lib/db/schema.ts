import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

export const wallets = sqliteTable('wallets', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type', { enum: ['cash', 'bank', 'ewallet'] }).notNull(),
  balance: real('balance').notNull().default(0),
  isVault: integer('is_vault').notNull().default(0),
  isInterestEnabled: integer('is_interest_enabled').notNull().default(0),
  interestRate: real('interest_rate').notNull().default(0),
  interestPeriod: text('interest_period', { enum: ['daily', 'monthly', 'none'] }).default('none'),
  payoutDay: integer('payout_day').default(1),
  autoTax: integer('auto_tax').notNull().default(1),
  taxRate: real('tax_rate').notNull().default(0.2),
  taxThreshold: real('tax_threshold').notNull().default(7500000),
  lastAccruedDate: text('last_accrued_date'),
  isDeleted: integer('is_deleted').notNull().default(0),
});

export const categories = sqliteTable('categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type', { enum: ['income', 'expense'] }).notNull(),
  icon: text('icon').notNull().default('💰'),
  isFixed: integer('is_fixed').notNull().default(0),
  isDefault: integer('is_default').notNull().default(0),
});

export const recurringBills = sqliteTable('recurring_bills', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  amount: real('amount').notNull(),
  dueDay: integer('due_day').notNull(),
  categoryId: text('category_id')
    .notNull()
    .references(() => categories.id, { onDelete: 'cascade' }),
  walletId: text('wallet_id').references(() => wallets.id, { onDelete: 'set null' }),
  lastPaidPeriod: text('last_paid_period'),
  isActive: integer('is_active').notNull().default(1),
});

export const transactions = sqliteTable('transactions', {
  id: text('id').primaryKey(),
  type: text('type', { enum: ['income', 'expense', 'transfer', 'adjustment'] }).notNull(),
  amount: real('amount').notNull(),
  fee: real('fee').notNull().default(0),
  walletId: text('wallet_id')
    .notNull()
    .references(() => wallets.id, { onDelete: 'cascade' }),
  targetWalletId: text('target_wallet_id').references(() => wallets.id, { onDelete: 'set null' }),
  categoryId: text('category_id').references(() => categories.id, { onDelete: 'set null' }),
  recurringBillId: text('recurring_bill_id').references(() => recurringBills.id, { onDelete: 'set null' }),
  isOutlier: integer('is_outlier').notNull().default(0),
  date: text('date').notNull(),
  localDate: text('local_date').notNull(),
  note: text('note'),
});

export const settings = sqliteTable('settings', {
  id: integer('id').primaryKey().default(1),
  targetDate: text('target_date'),
  paydayDay: integer('payday_day').default(25),
  fallbackDailyBurn: real('fallback_daily_burn').notNull().default(50000),
  burnWindowDays: integer('burn_window_days').notNull().default(14),
  notificationHour: integer('notification_hour').notNull().default(20),
  language: text('language').notNull().default('auto'),
  isPrivacyMode: integer('is_privacy_mode').notNull().default(0),
  dualRunwayMode: integer('dual_runway_mode').notNull().default(1),
});

export const walletsRelations = relations(wallets, ({ many }) => ({
  outgoingTransactions: many(transactions, { relationName: 'walletOutgoing' }),
  incomingTransactions: many(transactions, { relationName: 'walletIncoming' }),
  recurringBills: many(recurringBills),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  transactions: many(transactions),
  recurringBills: many(recurringBills),
}));

export const recurringBillsRelations = relations(recurringBills, ({ one, many }) => ({
  category: one(categories, {
    fields: [recurringBills.categoryId],
    references: [categories.id],
  }),
  wallet: one(wallets, {
    fields: [recurringBills.walletId],
    references: [wallets.id],
  }),
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  wallet: one(wallets, {
    fields: [transactions.walletId],
    references: [wallets.id],
    relationName: 'walletOutgoing',
  }),
  targetWallet: one(wallets, {
    fields: [transactions.targetWalletId],
    references: [wallets.id],
    relationName: 'walletIncoming',
  }),
  category: one(categories, {
    fields: [transactions.categoryId],
    references: [categories.id],
  }),
  recurringBill: one(recurringBills, {
    fields: [transactions.recurringBillId],
    references: [recurringBills.id],
  }),
}));

export const CREATE_TABLES_SQL_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS wallets (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT CHECK(type IN ('cash', 'bank', 'ewallet')) NOT NULL,
    balance REAL NOT NULL DEFAULT 0,
    is_vault INTEGER NOT NULL DEFAULT 0,
    is_interest_enabled INTEGER NOT NULL DEFAULT 0,
    interest_rate REAL NOT NULL DEFAULT 0,
    interest_period TEXT CHECK(interest_period IN ('daily', 'monthly', 'none')) DEFAULT 'none',
    payout_day INTEGER DEFAULT 1,
    auto_tax INTEGER NOT NULL DEFAULT 1,
    tax_rate REAL NOT NULL DEFAULT 0.2,
    tax_threshold REAL NOT NULL DEFAULT 7500000,
    last_accrued_date TEXT,
    is_deleted INTEGER NOT NULL DEFAULT 0
  );`,
  `CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT CHECK(type IN ('income', 'expense')) NOT NULL,
    icon TEXT NOT NULL DEFAULT '💰',
    is_fixed INTEGER NOT NULL DEFAULT 0,
    is_default INTEGER NOT NULL DEFAULT 0
  );`,
  `CREATE TABLE IF NOT EXISTS recurring_bills (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    amount REAL NOT NULL,
    due_day INTEGER NOT NULL CHECK(due_day BETWEEN 1 AND 31),
    category_id TEXT NOT NULL,
    wallet_id TEXT,
    last_paid_period TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE SET NULL
  );`,
  `CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    type TEXT CHECK(type IN ('income', 'expense', 'transfer', 'adjustment')) NOT NULL,
    amount REAL NOT NULL,
    fee REAL NOT NULL DEFAULT 0,
    wallet_id TEXT NOT NULL,
    target_wallet_id TEXT,
    category_id TEXT,
    recurring_bill_id TEXT,
    is_outlier INTEGER NOT NULL DEFAULT 0,
    date TEXT NOT NULL,
    local_date TEXT NOT NULL,
    note TEXT,
    FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE,
    FOREIGN KEY (target_wallet_id) REFERENCES wallets(id) ON DELETE SET NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY (recurring_bill_id) REFERENCES recurring_bills(id) ON DELETE SET NULL
  );`,
  `CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    target_date TEXT,
    payday_day INTEGER DEFAULT 25,
    fallback_daily_burn REAL NOT NULL DEFAULT 50000,
    burn_window_days INTEGER NOT NULL DEFAULT 14,
    notification_hour INTEGER NOT NULL DEFAULT 20,
    language TEXT NOT NULL DEFAULT 'auto',
    is_privacy_mode INTEGER NOT NULL DEFAULT 0,
    dual_runway_mode INTEGER NOT NULL DEFAULT 1
  );`,
];

export const CREATE_TRIGGERS_SQL_STATEMENTS = [
  `CREATE TRIGGER IF NOT EXISTS trg_tx_expense_insert AFTER INSERT ON transactions
  WHEN NEW.type = 'expense'
  BEGIN
    UPDATE wallets SET balance = balance - NEW.amount WHERE id = NEW.wallet_id;
  END;`,
  `CREATE TRIGGER IF NOT EXISTS trg_tx_income_insert AFTER INSERT ON transactions
  WHEN NEW.type = 'income'
  BEGIN
    UPDATE wallets SET balance = balance + NEW.amount WHERE id = NEW.wallet_id;
  END;`,
  `CREATE TRIGGER IF NOT EXISTS trg_tx_transfer_insert AFTER INSERT ON transactions
  WHEN NEW.type = 'transfer'
  BEGIN
    UPDATE wallets SET balance = balance - (NEW.amount + NEW.fee) WHERE id = NEW.wallet_id;
    UPDATE wallets SET balance = balance + NEW.amount WHERE id = NEW.target_wallet_id;
  END;`,
  `CREATE TRIGGER IF NOT EXISTS trg_tx_adjustment_insert AFTER INSERT ON transactions
  WHEN NEW.type = 'adjustment'
  BEGIN
    UPDATE wallets SET balance = NEW.amount WHERE id = NEW.wallet_id;
  END;`,
  `CREATE TRIGGER IF NOT EXISTS trg_tx_delete AFTER DELETE ON transactions
  BEGIN
    UPDATE wallets SET balance = balance + (
      CASE
        WHEN OLD.type = 'expense' THEN OLD.amount
        WHEN OLD.type = 'income' THEN -OLD.amount
        WHEN OLD.type = 'transfer' THEN (OLD.amount + OLD.fee)
        ELSE 0
      END
    ) WHERE id = OLD.wallet_id;

    UPDATE wallets SET balance = balance - OLD.amount
    WHERE id = OLD.target_wallet_id AND OLD.type = 'transfer';
  END;`,
];

export const CREATE_TABLES_SQL = CREATE_TABLES_SQL_STATEMENTS.join('\n');
export const CREATE_TRIGGERS_SQL = CREATE_TRIGGERS_SQL_STATEMENTS.join('\n');
