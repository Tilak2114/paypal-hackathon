// backend/routes/webhooks.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const paypal = require('../paypal');

/**
 * POST /webhooks/paypal
 * Receives webhook notifications from PayPal Sandbox, verifies signature,
 * and synchronizes subscription status in SQLite.
 */
router.post('/paypal', async (req, res) => {
  try {
    const headers = req.headers;
    const body = req.body;
    const rawBody = req.rawBody || JSON.stringify(body);

    console.log(`[PayPal Webhook] Received event: ${body?.event_type || 'Unknown'}`);

    // 1. Verify webhook signature
    const verification = await paypal.verifyWebhookSignature({
      headers,
      rawBody,
    });

    if (verification.verification_status !== 'SUCCESS') {
      console.warn('[PayPal Webhook] Signature verification failed:', verification);
      return res.status(401).json({
        ok: false,
        error: 'Invalid PayPal webhook signature.',
      });
    }

    const eventType = body?.event_type;
    const resource = body?.resource || {};
    const paypalSubId = resource.id;

    if (!paypalSubId) {
      console.log('[PayPal Webhook] Event does not contain subscription resource ID, skipping.');
      return res.json({ ok: true, ignored: true, reason: 'No subscription resource ID' });
    }

    // Find the subscription in SQLite
    const sub = db.getSubscriptionByPayPalId(paypalSubId);
    if (!sub) {
      console.log(`[PayPal Webhook] No local subscription found matching PayPal ID "${paypalSubId}".`);
      return res.json({ ok: true, matched: false, paypalSubscriptionId: paypalSubId });
    }

    let updated = null;

    switch (eventType) {
      case 'BILLING.SUBSCRIPTION.SUSPENDED':
        console.log(`[PayPal Webhook] Marking subscription ${sub.id} (${sub.name}) as PAUSED.`);
        updated = db.updateSubscriptionStatus(sub.id, 'paused');
        break;

      case 'BILLING.SUBSCRIPTION.CANCELLED':
      case 'BILLING.SUBSCRIPTION.EXPIRED':
        console.log(`[PayPal Webhook] Marking subscription ${sub.id} (${sub.name}) as CANCELLED.`);
        updated = db.updateSubscriptionStatus(sub.id, 'cancelled');
        break;

      case 'BILLING.SUBSCRIPTION.ACTIVATED':
      case 'BILLING.SUBSCRIPTION.RE-ACTIVATED':
        console.log(`[PayPal Webhook] Marking subscription ${sub.id} (${sub.name}) as ACTIVE.`);
        updated = db.updateSubscriptionStatus(sub.id, 'active');
        break;

      default:
        console.log(`[PayPal Webhook] Unhandled event type "${eventType}" for subscription ${sub.id}.`);
        break;
    }

    return res.json({
      ok: true,
      eventType,
      subscription: updated || sub,
    });
  } catch (err) {
    console.error('[POST /webhooks/paypal Error]', err);
    return res.status(500).json({
      ok: false,
      error: 'Error processing PayPal webhook event.',
    });
  }
});

module.exports = router;
