import { Request } from 'express';
import { getDb, mapRowToSubscription } from '../db/index.js';
import { getPayPalClient } from '../paypal/index.js';
import { config } from '../config.js';
import { logger } from '../logger.js';
import { eventService } from './event.service.js';
import { alertService } from './alert.service.js';
import { AppError } from './subscription.service.js';

export class WebhookService {
  async handleWebhook(req: Request): Promise<{ status: string; eventId?: string }> {
    const rawBody = req.body;
    if (!rawBody || !rawBody.id || !rawBody.event_type) {
      throw new AppError(400, 'INVALID_WEBHOOK_PAYLOAD', 'Payload missing event id or event_type');
    }

    const eventId = rawBody.id as string;
    const eventType = rawBody.event_type as string;
    const resource = rawBody.resource || {};
    const resourceId = resource.id || resource.billing_agreement_id || null;

    logger.info({ eventId, eventType, resourceId }, 'Processing PayPal webhook event');

    // Signature verification in real mode
    if (!config.MOCK_PAYPAL) {
      const authAlgo = req.headers['paypal-auth-algo'] as string;
      const certUrl = req.headers['paypal-cert-url'] as string;
      const transmissionId = req.headers['paypal-transmission-id'] as string;
      const transmissionSig = req.headers['paypal-transmission-sig'] as string;
      const transmissionTime = req.headers['paypal-transmission-time'] as string;

      if (!authAlgo || !certUrl || !transmissionId || !transmissionSig || !transmissionTime) {
        logger.warn('PayPal webhook headers missing required signature headers');
        throw new AppError(400, 'INVALID_SIGNATURE_HEADERS', 'Missing required PayPal signature headers');
      }

      const paypalClient = getPayPalClient();
      const verifyRes = await paypalClient.verifyWebhookSignature({
        auth_algo: authAlgo,
        cert_url: certUrl,
        transmission_id: transmissionId,
        transmission_sig: transmissionSig,
        transmission_time: transmissionTime,
        webhook_id: config.PAYPAL_WEBHOOK_ID,
        webhook_event: rawBody,
      });

      if (verifyRes.verification_status !== 'SUCCESS') {
        logger.error({ verifyRes }, 'PayPal webhook signature verification failed');
        throw new AppError(401, 'INVALID_SIGNATURE', 'PayPal webhook signature verification failed');
      }
    }

    // Deduplication check
    const db = getDb();
    const existing = db.prepare('SELECT event_id FROM webhook_events WHERE event_id = ?').get(eventId);
    if (existing) {
      logger.info({ eventId }, 'Webhook event duplicate detected; ignoring');
      return { status: 'ignored_duplicate', eventId };
    }

    // Insert into webhook_events table
    db.prepare(`
      INSERT INTO webhook_events (event_id, event_type, resource_id, received_at, processed)
      VALUES (?, ?, ?, ?, 1)
    `).run(eventId, eventType, resourceId, new Date().toISOString());

    // Broadcast webhook_received SSE
    eventService.emit('webhook_received', { eventId, eventType, resourceId });

    // Handle specific event types
    await this.processEvent(eventType, resource);

    return { status: 'processed', eventId };
  }

  private async processEvent(eventType: string, resource: any) {
    const db = getDb();
    const paypalSubId = resource.id || resource.billing_agreement_id;
    if (!paypalSubId) {
      logger.debug({ eventType }, 'Webhook resource has no subscription ID; skipping DB subscription update');
      return;
    }

    const subRow = db.prepare('SELECT * FROM subscriptions WHERE paypal_subscription_id = ?').get(paypalSubId) as any;
    if (!subRow) {
      logger.info({ paypalSubId, eventType }, 'Webhook subscription ID not found in local DB');
      return;
    }

    const now = new Date().toISOString();

    switch (eventType) {
      case 'BILLING.SUBSCRIPTION.ACTIVATED': {
        db.prepare("UPDATE subscriptions SET status = 'ACTIVE', updated_at = ? WHERE id = ?").run(now, subRow.id);
        const updated = mapRowToSubscription(db.prepare('SELECT * FROM subscriptions WHERE id = ?').get(subRow.id));
        eventService.emit('subscription_updated', updated);
        logger.info({ id: subRow.id }, 'Subscription marked ACTIVE via webhook');
        break;
      }
      case 'BILLING.SUBSCRIPTION.SUSPENDED': {
        db.prepare("UPDATE subscriptions SET status = 'SUSPENDED', updated_at = ? WHERE id = ?").run(now, subRow.id);
        const updated = mapRowToSubscription(db.prepare('SELECT * FROM subscriptions WHERE id = ?').get(subRow.id));
        eventService.emit('subscription_updated', updated);
        logger.info({ id: subRow.id }, 'Subscription marked SUSPENDED via webhook');
        break;
      }
      case 'BILLING.SUBSCRIPTION.CANCELLED':
      case 'BILLING.SUBSCRIPTION.EXPIRED': {
        db.prepare("UPDATE subscriptions SET status = 'CANCELLED', updated_at = ? WHERE id = ?").run(now, subRow.id);
        const updated = mapRowToSubscription(db.prepare('SELECT * FROM subscriptions WHERE id = ?').get(subRow.id));
        eventService.emit('subscription_updated', updated);
        logger.info({ id: subRow.id }, 'Subscription marked CANCELLED via webhook');
        break;
      }
      case 'BILLING.SUBSCRIPTION.UPDATED': {
        const nextBilling = resource.billing_info?.next_billing_time || subRow.next_billing_time;
        const planId = resource.plan_id || subRow.plan_id;
        db.prepare('UPDATE subscriptions SET next_billing_time = ?, plan_id = ?, updated_at = ? WHERE id = ?').run(
          nextBilling,
          planId,
          now,
          subRow.id
        );
        const updated = mapRowToSubscription(db.prepare('SELECT * FROM subscriptions WHERE id = ?').get(subRow.id));
        eventService.emit('subscription_updated', updated);
        logger.info({ id: subRow.id }, 'Subscription updated via webhook');
        break;
      }
      case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED':
      case 'PAYMENT.SALE.DENIED': {
        logger.warn({ id: subRow.id, name: subRow.name }, 'Subscription payment failed via webhook');
        // Create payment_failed alert
        await alertService.createAlert({
          subscriptionId: subRow.id,
          type: 'payment_failed',
          severity: 'high',
          message: `Payment failed for ${subRow.name}. Action required to maintain access.`,
          recommendation: 'pause',
          reason: 'PayPal recurring billing cycle reported payment failure (insufficient funds or card issue).',
          read: false,
        });
        break;
      }
      default:
        logger.debug({ eventType }, 'Unhandled webhook event type');
    }
  }
}

export const webhookService = new WebhookService();
