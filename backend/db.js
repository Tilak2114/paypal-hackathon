// backend/db.js
const path = require('path');
const fs = require('fs');

// Determine Database Engine: better-sqlite3 with seamless fallback to node:sqlite
let Database;
let isNodeSqlite = false;

try {
  Database = require('better-sqlite3');
} catch {
  // Built-in node:sqlite (Node 22.5+) adapter providing identical synchronous API
  const { DatabaseSync } = require('node:sqlite');
  isNodeSqlite = true;

  Database = class NodeSqliteAdapter {
    constructor(filePath) {
      this.db = new DatabaseSync(filePath);
    }

    prepare(sql) {
      const stmt = this.db.prepare(sql);
      return {
        run: (...params) => {
          // Flatten params if passed as an array or individual args
          const args = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
          const result = stmt.run(...args);
          return {
            changes: Number(result.changes || 0),
            lastInsertRowid: result.lastInsertRowid,
          };
        },
        get: (...params) => {
          const args = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
          return stmt.get(...args) || null;
        },
        all: (...params) => {
          const args = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
          return stmt.all(...args) || [];
        },
      };
    }

    exec(sql) {
      return this.db.exec(sql);
    }

    pragma(cmd) {
      try {
        this.db.exec(`PRAGMA ${cmd};`);
      } catch (_) {}
    }
  };
}

// Database file path (configurable via DATABASE_PATH, defaults to sentinel.db in backend root)
const dbPath = process.env.DATABASE_PATH
  ? path.resolve(process.cwd(), process.env.DATABASE_PATH)
  : path.join(__dirname, 'sentinel.db');

// Ensure parent directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize schema with exact Sentinel data shape
db.exec(`
  CREATE TABLE IF NOT EXISTS subscriptions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    cost REAL NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    lastUsed TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    flag TEXT,
    suggestion TEXT,
    paypalSubscriptionId TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_subs_status ON subscriptions(status);
  CREATE INDEX IF NOT EXISTS idx_subs_paypal_id ON subscriptions(paypalSubscriptionId);
`);

/**
 * Normalizes a database row to the exact Sentinel contract shape
 */
function toContractShape(row) {
  if (!row) return null;
  return {
    id: String(row.id),
    name: String(row.name),
    cost: Number(row.cost),
    currency: String(row.currency || 'INR'),
    lastUsed: row.lastUsed ? String(row.lastUsed) : null,
    status: row.status, // "active" | "paused" | "cancelled"
    flag: row.flag || null, // null | "overlap" | "unused" | "trial_ending" | "price_increase"
    suggestion: row.suggestion || null,
    paypalSubscriptionId: row.paypalSubscriptionId || null,
  };
}

// Database helper functions
const dbHelpers = {
  db,
  isNodeSqlite,

  getAllSubscriptions() {
    const rows = db.prepare('SELECT * FROM subscriptions ORDER BY createdAt ASC').all();
    return rows.map(toContractShape);
  },

  getSubscriptionById(id) {
    const row = db.prepare('SELECT * FROM subscriptions WHERE id = ?').get(String(id));
    return toContractShape(row);
  },

  getSubscriptionByPayPalId(paypalSubscriptionId) {
    if (!paypalSubscriptionId) return null;
    const row = db.prepare('SELECT * FROM subscriptions WHERE paypalSubscriptionId = ?').get(String(paypalSubscriptionId));
    return toContractShape(row);
  },

  createSubscription(sub) {
    const id = sub.id || `sub_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const name = String(sub.name || '').trim();
    const cost = Number(sub.cost) || 0;
    const currency = String(sub.currency || 'INR');
    const lastUsed = sub.lastUsed || 'Recent';
    const status = ['active', 'paused', 'cancelled'].includes(sub.status) ? sub.status : 'active';
    const flag = sub.flag || null;
    const suggestion = sub.suggestion || null;
    const paypalSubscriptionId = sub.paypalSubscriptionId || null;

    db.prepare(`
      INSERT INTO subscriptions (id, name, cost, currency, lastUsed, status, flag, suggestion, paypalSubscriptionId, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        cost = excluded.cost,
        currency = excluded.currency,
        lastUsed = excluded.lastUsed,
        status = excluded.status,
        flag = excluded.flag,
        suggestion = excluded.suggestion,
        paypalSubscriptionId = excluded.paypalSubscriptionId,
        updatedAt = CURRENT_TIMESTAMP
    `).run(id, name, cost, currency, lastUsed, status, flag, suggestion, paypalSubscriptionId);

    return dbHelpers.getSubscriptionById(id);
  },

  updateSubscriptionStatus(id, newStatus) {
    const validStatuses = ['active', 'paused', 'cancelled'];
    if (!validStatuses.includes(newStatus)) {
      throw new Error(`Invalid status "${newStatus}". Must be one of: ${validStatuses.join(', ')}`);
    }

    const result = db.prepare(`
      UPDATE subscriptions
      SET status = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(newStatus, String(id));

    if (result.changes === 0) return null;
    return dbHelpers.getSubscriptionById(id);
  },

  updateSubscriptionPayPalId(id, paypalSubscriptionId) {
    db.prepare(`
      UPDATE subscriptions
      SET paypalSubscriptionId = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(paypalSubscriptionId, String(id));

    return dbHelpers.getSubscriptionById(id);
  },

  deleteSubscription(id) {
    const result = db.prepare('DELETE FROM subscriptions WHERE id = ?').run(String(id));
    return result.changes > 0;
  },

  clearAll() {
    db.exec('DELETE FROM subscriptions;');
  },
};

module.exports = dbHelpers;
