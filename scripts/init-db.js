#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'finance.db');

fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const schema = `
-- Users (optional for future multi-user support)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  default_currency TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Accounts
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('cash','bank','card','investment')),
  currency TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  archived INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income','expense')),
  parent_id TEXT,
  color TEXT,
  archived INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Transactions
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income','expense','transfer')),
  account_id TEXT,
  category_id TEXT,
  from_account_id TEXT,
  to_account_id TEXT,
  fee_amount INTEGER,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  notes TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  FOREIGN KEY (from_account_id) REFERENCES accounts(id) ON DELETE SET NULL,
  FOREIGN KEY (to_account_id) REFERENCES accounts(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_transactions_user_occurred ON transactions(user_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);

-- Budgets
CREATE TABLE IF NOT EXISTS budgets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  period TEXT NOT NULL CHECK (period IN ('monthly','weekly','custom')),
  start_date TEXT NOT NULL,
  end_date TEXT,
  rollover INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS budget_allocations (
  budget_id TEXT NOT NULL,
  category_id TEXT NOT NULL,
  limit_amount INTEGER NOT NULL,
  PRIMARY KEY (budget_id, category_id),
  FOREIGN KEY (budget_id) REFERENCES budgets(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- Recurring items
CREATE TABLE IF NOT EXISTS recurring_items (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income','expense')),
  category_id TEXT NOT NULL,
  account_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL,
  schedule TEXT NOT NULL,
  next_run_at TEXT,
  last_run_at TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE RESTRICT
);

-- Debts
CREATE TABLE IF NOT EXISTS debts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('lent','borrowed')),
  counterparty TEXT,
  principal INTEGER NOT NULL,
  interest_rate_apr REAL,
  start_date TEXT NOT NULL,
  due_date TEXT,
  schedule TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','closed','defaulted')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS debt_payments (
  id TEXT PRIMARY KEY,
  debt_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  occurred_at TEXT NOT NULL,
  interest_portion INTEGER,
  principal_portion INTEGER,
  FOREIGN KEY (debt_id) REFERENCES debts(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_debt_payments_debt ON debt_payments(debt_id, occurred_at);

-- Credit facilities
CREATE TABLE IF NOT EXISTS credit_facilities (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  limit_amount INTEGER NOT NULL,
  available_amount INTEGER,
  apr REAL,
  statement_day INTEGER,
  payment_due_day INTEGER,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Savings
CREATE TABLE IF NOT EXISTS saving_goals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  target_amount INTEGER NOT NULL,
  current_amount INTEGER NOT NULL DEFAULT 0,
  due_date TEXT,
  priority INTEGER,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Events
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  date TEXT NOT NULL,
  expected_spend_amount INTEGER,
  notes TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
`;

db.exec('BEGIN');
db.exec(schema);
db.exec('COMMIT');

if (!db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='transactions'").get()) {
  console.error('Schema creation failed');
  process.exit(1);
}

console.log(`Database initialized at ${DB_PATH}`);
