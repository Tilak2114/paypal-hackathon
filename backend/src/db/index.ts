import Database, { Database as DatabaseType } from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { config } from '../config.js';
import { logger } from '../logger.js';
import { Subscription, Alert } from '../contract.js';

let dbInstance: DatabaseType | null = null;

export function getDb(): DatabaseType {
  if (dbInstance) return dbInstance;

  const dbPath = path.resolve(config.DATABASE_PATH);
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  logger.info({ path: dbPath }, 'Initializing SQLite database connection');
  dbInstance = new Database(dbPath);
  dbInstance.pragma('journal_mode = WAL');
  dbInstance.pragma('foreign_keys = ON');

  initSchema(dbInstance);

  return dbInstance;
}

export function initSchema(db: DatabaseType) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price TEXT NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      interval TEXT NOT NULL,
      status TEXT NOT NULL,
      source TEXT NOT NULL,
      managed_by_paypal INTEGER NOT NULL,
      paypal_subscription_id TEXT UNIQUE,
      plan_id TEXT,
      downgrade_plan_id TEXT,
      next_billing_time TEXT,
      trial_ends_at TEXT,
      last_used_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS alerts (
      id TEXT PRIMARY KEY,
      subscription_id TEXT NOT NULL,
      type TEXT NOT NULL,
      severity TEXT NOT NULL,
      message TEXT NOT NULL,
      recommendation TEXT NOT NULL,
      reason TEXT NOT NULL,
      created_at TEXT NOT NULL,
      read INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      event_type TEXT NOT NULL,
      payload TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS webhook_events (
      event_id TEXT PRIMARY KEY,
      event_type TEXT NOT NULL,
      resource_id TEXT,
      received_at TEXT NOT NULL,
      processed INTEGER NOT NULL DEFAULT 1
    );

    CREATE INDEX IF NOT EXISTS idx_subs_user_id ON subscriptions(user_id);
    CREATE INDEX IF NOT EXISTS idx_subs_paypal_id ON subscriptions(paypal_subscription_id);
    CREATE INDEX IF NOT EXISTS idx_alerts_sub_id ON alerts(subscription_id);
  `);
}

// Mapper helpers
export function mapRowToSubscription(row: any): Subscription {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    price: row.price,
    currency: row.currency,
    interval: row.interval,
    status: row.status,
    source: row.source,
    managedByPaypal: Boolean(row.managed_by_paypal),
    paypalSubscriptionId: row.paypal_subscription_id || null,
    planId: row.plan_id || null,
    downgradePlanId: row.downgrade_plan_id || null,
    nextBillingTime: row.next_billing_time || null,
    trialEndsAt: row.trial_ends_at || null,
    lastUsedAt: row.last_used_at || null,
    createdAt: row.created_at,
  };
}

export function mapRowToAlert(row: any): Alert {
  return {
    id: row.id,
    subscriptionId: row.subscription_id,
    type: row.type,
    severity: row.severity,
    message: row.message,
    recommendation: row.recommendation,
    reason: row.reason,
    createdAt: row.created_at,
    read: Boolean(row.read),
  };
}

