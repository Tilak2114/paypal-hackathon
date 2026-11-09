import { v4 as uuidv4 } from 'uuid';
import { getDb, mapRowToSubscription } from '../db/index.js';
import { getPayPalClient, PayPalApiError } from '../paypal/index.js';
import { config } from '../config.js';
import { logger } from '../logger.js';
import { eventService } from './event.service.js';
import { Subscription } from '../contract.js';

export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public details?: any;

  constructor(statusCode: number, code: string, message: string, details?: any) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

let lastSyncTimestamp = 0;
const SYNC_CACHE_TTL_MS = 30000; // 30 seconds cache for real PayPal status

export class SubscriptionService {
  async getAllSubscriptions(userId: string, forceSync = false): Promise<Subscription[]> {
    const db = getDb();

    // In real mode, automatically refresh status from PayPal if cache expired (30s)
    if (!config.MOCK_PAYPAL) {
      const now = Date.now();
      if (forceSync || now - lastSyncTimestamp > SYNC_CACHE_TTL_MS) {
        await this.syncPayPalSubscriptions(userId);
        lastSyncTimestamp = now;
      }
    }

    const rows = db.prepare('SELECT * FROM subscriptions WHERE user_id = ? ORDER BY created_at DESC').all(userId);
    return rows.map(mapRowToSubscription);
  }

  async getSubscriptionById(id: string, userId: string): Promise<Subscription | null> {
    const db = getDb();
    const row = db.prepare('SELECT * FROM subscriptions WHERE id = ? AND user_id = ?').get(id, userId);
    return row ? mapRowToSubscription(row) : null;
  }

  async pauseSubscription(id: string, userId: string, reason = 'Paused via Churn Guard'): Promise<Subscription> {
    const sub = await this.getSubscriptionById(id, userId);
    if (!sub) {
      throw new AppError(404, 'NOT_FOUND', `Subscription ${id} not found.`);
    }

    // AUDIT ONLY RULE
    if (sub.source === 'external') {
      throw new AppError(409, 'AUDIT_ONLY', 'Audit only - not managed through PayPal');
    }

    const paypalClient = getPayPalClient();
    if (sub.managedByPaypal && sub.paypalSubscriptionId) {
      await paypalClient.suspendSubscription(sub.paypalSubscriptionId, reason);
    }

    const db = getDb();
    const now = new Date().toISOString();
    db.prepare(`
      UPDATE subscriptions
      SET status = 'SUSPENDED', updated_at = ?
      WHERE id = ?
    `).run(now, id);

    const updated = (await this.getSubscriptionById(id, userId))!;
    eventService.emit('subscription_updated', updated);
    return updated;
  }

  async resumeSubscription(id: string, userId: string, reason = 'Resumed via Churn Guard'): Promise<Subscription> {
    const sub = await this.getSubscriptionById(id, userId);
    if (!sub) {
      throw new AppError(404, 'NOT_FOUND', `Subscription ${id} not found.`);
    }

    // AUDIT ONLY RULE
    if (sub.source === 'external') {
      throw new AppError(409, 'AUDIT_ONLY', 'Audit only - not managed through PayPal');
    }

    const paypalClient = getPayPalClient();
    if (sub.managedByPaypal && sub.paypalSubscriptionId) {
      await paypalClient.activateSubscription(sub.paypalSubscriptionId, reason);
    }

    const db = getDb();
    const now = new Date().toISOString();
    db.prepare(`
      UPDATE subscriptions
      SET status = 'ACTIVE', updated_at = ?
      WHERE id = ?
    `).run(now, id);

    const updated = (await this.getSubscriptionById(id, userId))!;
    eventService.emit('subscription_updated', updated);
    return updated;
  }

  async cancelSubscription(
    id: string,
    userId: string,
    confirm: boolean,
    reason = 'Cancelled via Churn Guard'
  ): Promise<Subscription> {
    if (!confirm) {
      throw new AppError(
        400,
        'CONFIRMATION_REQUIRED',
        'Cancellation is irreversible and requires { "confirm": true } in request body.'
      );
    }

    const sub = await this.getSubscriptionById(id, userId);
    if (!sub) {
      throw new AppError(404, 'NOT_FOUND', `Subscription ${id} not found.`);
    }

    // AUDIT ONLY RULE
    if (sub.source === 'external') {
      throw new AppError(409, 'AUDIT_ONLY', 'Audit only - not managed through PayPal');
    }

    const paypalClient = getPayPalClient();
    if (sub.managedByPaypal && sub.paypalSubscriptionId) {
      await paypalClient.cancelSubscription(sub.paypalSubscriptionId, reason);
    }

    const db = getDb();
    const now = new Date().toISOString();
    db.prepare(`
      UPDATE subscriptions
      SET status = 'CANCELLED', updated_at = ?
      WHERE id = ?
    `).run(now, id);

    const updated = (await this.getSubscriptionById(id, userId))!;
    eventService.emit('subscription_updated', updated);
    return updated;
  }

  async downgradeSubscription(
    id: string,
    userId: string,
    targetPlanId?: string,
    reason = 'Downgraded plan to reduce churn'
  ): Promise<{ subscription: Subscription; approveUrl?: string }> {
    const sub = await this.getSubscriptionById(id, userId);
    if (!sub) {
      throw new AppError(404, 'NOT_FOUND', `Subscription ${id} not found.`);
    }

    // AUDIT ONLY RULE
    if (sub.source === 'external') {
      throw new AppError(409, 'AUDIT_ONLY', 'Audit only - not managed through PayPal');
    }

    const newPlanId = targetPlanId || sub.downgradePlanId;
    if (!newPlanId) {
      throw new AppError(400, 'NO_DOWNGRADE_PLAN', 'No downgrade plan configured for this subscription.');
    }

    const paypalClient = getPayPalClient();
    let approveUrl: string | undefined;

    if (sub.managedByPaypal && sub.paypalSubscriptionId) {
      const reviseResult = await paypalClient.reviseSubscription(sub.paypalSubscriptionId, {
        plan_id: newPlanId,
      });
      approveUrl = reviseResult.approveUrl;
    }

    const db = getDb();
    const now = new Date().toISOString();
    db.prepare(`
      UPDATE subscriptions
      SET plan_id = ?, updated_at = ?
      WHERE id = ?
    `).run(newPlanId, now, id);

    const updated = (await this.getSubscriptionById(id, userId))!;
    eventService.emit('subscription_updated', updated);
    return { subscription: updated, approveUrl };
  }

  async getTransactions(id: string, userId: string) {
    const sub = await this.getSubscriptionById(id, userId);
    if (!sub) {
      throw new AppError(404, 'NOT_FOUND', `Subscription ${id} not found.`);
    }

    if (!sub.managedByPaypal || !sub.paypalSubscriptionId) {
      // Mock synthetic history for external/audit subscriptions
      return {
        transactions: [
          {
            id: `TXN-EXT-${id}`,
            status: 'COMPLETED',
            amount: { currency: sub.currency, value: sub.price },
            time: sub.lastUsedAt || sub.createdAt,
          },
        ],
      };
    }

    const now = new Date();
    const startTime = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const endTime = now.toISOString();

    const paypalClient = getPayPalClient();
    const result = await paypalClient.getTransactions(sub.paypalSubscriptionId, startTime, endTime);

    return {
      transactions: result.transactions.map((t) => ({
        id: t.id,
        status: t.status,
        amount: {
          currency: t.amount_with_breakdown.gross_amount.currency_code,
          value: t.amount_with_breakdown.gross_amount.value,
        },
        time: t.time,
      })),
    };
  }

  async ingestSubscriptions(userId: string, items: any[]): Promise<{ count: number; items: Subscription[] }> {
    const db = getDb();
    const now = new Date().toISOString();
    const saved: Subscription[] = [];

    const insertStmt = db.prepare(`
      INSERT OR REPLACE INTO subscriptions (
        id, user_id, name, category, price, currency, interval, status,
        source, managed_by_paypal, paypal_subscription_id, plan_id,
        downgrade_plan_id, next_billing_time, trial_ends_at, last_used_at,
        created_at, updated_at
      ) VALUES (
        @id, @userId, @name, @category, @price, @currency, @interval, @status,
        @source, @managedByPaypal, @paypalSubscriptionId, @planId,
        @downgradePlanId, @nextBillingTime, @trialEndsAt, @lastUsedAt,
        @createdAt, @updatedAt
      )
    `);

    db.transaction(() => {
      for (const item of items) {
        const id = item.id || `sub-ingest-${uuidv4().substring(0, 8)}`;
        const hasPaypalId = Boolean(item.paypalSubscriptionId);
        const source = hasPaypalId ? (item.source || 'paypal') : 'external';
        const managedByPaypal = hasPaypalId ? (item.managedByPaypal ?? true) : false;
        const status = item.status || (source === 'external' ? 'EXTERNAL' : 'ACTIVE');

        const record = {
          id,
          userId,
          name: item.name,
          category: item.category || 'General',
          price: String(item.price),
          currency: item.currency || 'USD',
          interval: item.interval || 'MONTH',
          status,
          source,
          managedByPaypal: managedByPaypal ? 1 : 0,
          paypalSubscriptionId: item.paypalSubscriptionId || null,
          planId: item.planId || null,
          downgradePlanId: item.downgradePlanId || null,
          nextBillingTime: item.nextBillingTime || null,
          trialEndsAt: item.trialEndsAt || null,
          lastUsedAt: item.lastUsedAt || null,
          createdAt: item.createdAt || now,
          updatedAt: now,
        };

        insertStmt.run(record);
        saved.push(mapRowToSubscription({ ...record, user_id: userId, managed_by_paypal: record.managedByPaypal, created_at: record.createdAt, updated_at: record.updatedAt }));
      }
    })();

    for (const sub of saved) {
      eventService.emit('subscription_updated', sub);
    }

    return { count: saved.length, items: saved };
  }

  async syncPayPalSubscriptions(userId: string): Promise<number> {
    const db = getDb();
    const rows = db.prepare(`
      SELECT * FROM subscriptions
      WHERE user_id = ? AND managed_by_paypal = 1 AND paypal_subscription_id IS NOT NULL
    `).all(userId) as any[];

    const paypalClient = getPayPalClient();
    let updatedCount = 0;
    const now = new Date().toISOString();

    for (const row of rows) {
      try {
        const details = await paypalClient.getSubscription(row.paypal_subscription_id);
        const statusMap: Record<string, string> = {
          ACTIVE: 'ACTIVE',
          SUSPENDED: 'SUSPENDED',
          CANCELLED: 'CANCELLED',
          APPROVAL_PENDING: 'APPROVAL_PENDING',
          APPROVED: 'ACTIVE',
          EXPIRED: 'CANCELLED',
        };

        const newStatus = statusMap[details.status] || row.status;
        const nextBilling = details.billing_info?.next_billing_time || row.next_billing_time;

        db.prepare(`
          UPDATE subscriptions
          SET status = ?, next_billing_time = ?, updated_at = ?
          WHERE id = ?
        `).run(newStatus, nextBilling, now, row.id);

        updatedCount++;
      } catch (err) {
        logger.warn({ subId: row.id, paypalId: row.paypal_subscription_id, err }, 'Failed to sync status for subscription');
      }
    }

    return updatedCount;
  }
}

export const subscriptionService = new SubscriptionService();
