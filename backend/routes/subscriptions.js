// backend/routes/subscriptions.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const paypal = require('../paypal');

/**
 * GET /subscriptions
 * Returns all tracked subscriptions in the Sentinel data shape
 */
router.get('/', (req, res) => {
  try {
    const list = db.getAllSubscriptions();
    // Return both { ok: true, subscriptions } and handle array serialization gracefully
    return res.json({
      ok: true,
      subscriptions: list,
    });
  } catch (err) {
    console.error('[GET /subscriptions Error]', err);
    return res.status(500).json({
      ok: false,
      error: 'Unable to retrieve subscriptions from database.',
    });
  }
});

/**
 * POST /subscriptions
 * Adds or tracks a new subscription
 */
router.post('/', (req, res) => {
  try {
    const { name, cost, currency, lastUsed, status, flag, suggestion, paypalSubscriptionId, id } = req.body || {};

    // Validation
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        ok: false,
        error: 'Subscription "name" is required and must be a valid string.',
      });
    }

    const numericCost = Number(cost);
    if (isNaN(numericCost) || numericCost < 0) {
      return res.status(400).json({
        ok: false,
        error: 'Subscription "cost" must be a valid non-negative number.',
      });
    }

    const validFlags = [null, 'overlap', 'unused', 'trial_ending', 'price_increase'];
    if (flag !== undefined && !validFlags.includes(flag)) {
      return res.status(400).json({
        ok: false,
        error: `Invalid flag "${flag}". Allowed: ${validFlags.map(f => String(f)).join(', ')}`,
      });
    }

    const created = db.createSubscription({
      id,
      name: name.trim(),
      cost: numericCost,
      currency: currency || 'USD',
      lastUsed: lastUsed || 'Recent',
      status: status || 'active',
      flag: flag || null,
      suggestion: suggestion || null,
      paypalSubscriptionId: paypalSubscriptionId || null,
    });

    return res.status(201).json({
      ok: true,
      subscription: created,
    });
  } catch (err) {
    console.error('[POST /subscriptions Error]', err);
    return res.status(500).json({
      ok: false,
      error: 'Failed to create subscription.',
    });
  }
});

/**
 * POST /subscriptions/:id/pause
 * Suspends billing agreement in PayPal, sets status to "paused"
 */
router.post('/:id/pause', async (req, res) => {
  const { id } = req.params;
  try {
    const sub = db.getSubscriptionById(id);
    if (!sub) {
      return res.status(404).json({
        ok: false,
        error: `Subscription with ID "${id}" was not found.`,
      });
    }

    // Status transition validation
    if (sub.status === 'paused') {
      return res.status(400).json({
        ok: false,
        error: `"${sub.name}" is already paused.`,
      });
    }
    if (sub.status === 'cancelled') {
      return res.status(400).json({
        ok: false,
        error: `Cannot pause "${sub.name}" because it is cancelled. Reactivate it first.`,
      });
    }

    const reason = req.body?.reason || `Paused by user on Sentinel`;

    // 1. Call PayPal API first (or simulated in DEMO_MODE)
    try {
      await paypal.pauseSubscription(sub.paypalSubscriptionId, reason);
    } catch (paypalErr) {
      console.error(`[Pause PayPal Failed for ${id}]`, paypalErr.message);
      // DO NOT change DB status if PayPal call fails
      return res.status(paypalErr.paypalStatus || 502).json({
        ok: false,
        error: `PayPal Sandbox error: ${paypalErr.message}`,
      });
    }

    // 2. PayPal succeeded -> update DB
    const updated = db.updateSubscriptionStatus(id, 'paused');

    return res.json({
      ok: true,
      subscription: updated,
    });
  } catch (err) {
    console.error(`[POST /subscriptions/${id}/pause Error]`, err);
    return res.status(500).json({
      ok: false,
      error: 'Failed to pause subscription.',
    });
  }
});

/**
 * POST /subscriptions/:id/cancel
 * Cancels billing agreement in PayPal, sets status to "cancelled"
 */
router.post('/:id/cancel', async (req, res) => {
  const { id } = req.params;
  try {
    const sub = db.getSubscriptionById(id);
    if (!sub) {
      return res.status(404).json({
        ok: false,
        error: `Subscription with ID "${id}" was not found.`,
      });
    }

    // Status transition validation
    if (sub.status === 'cancelled') {
      return res.status(400).json({
        ok: false,
        error: `"${sub.name}" is already cancelled.`,
      });
    }

    const reason = req.body?.reason || `Cancelled by user on Sentinel`;

    // 1. Call PayPal API first (or simulated in DEMO_MODE)
    try {
      await paypal.cancelSubscription(sub.paypalSubscriptionId, reason);
    } catch (paypalErr) {
      console.error(`[Cancel PayPal Failed for ${id}]`, paypalErr.message);
      // DO NOT change DB status if PayPal call fails
      return res.status(paypalErr.paypalStatus || 502).json({
        ok: false,
        error: `PayPal Sandbox error: ${paypalErr.message}`,
      });
    }

    // 2. PayPal succeeded -> update DB
    const updated = db.updateSubscriptionStatus(id, 'cancelled');

    return res.json({
      ok: true,
      subscription: updated,
    });
  } catch (err) {
    console.error(`[POST /subscriptions/${id}/cancel Error]`, err);
    return res.status(500).json({
      ok: false,
      error: 'Failed to cancel subscription.',
    });
  }
});

/**
 * POST /subscriptions/:id/undo
 * Reactivates suspended or cancelled subscription in PayPal, sets status to "active"
 */
router.post('/:id/undo', async (req, res) => {
  const { id } = req.params;
  try {
    const sub = db.getSubscriptionById(id);
    if (!sub) {
      return res.status(404).json({
        ok: false,
        error: `Subscription with ID "${id}" was not found.`,
      });
    }

    // Status transition validation
    if (sub.status === 'active') {
      return res.status(400).json({
        ok: false,
        error: `"${sub.name}" is already active.`,
      });
    }

    const reason = req.body?.reason || `Reactivated by user on Sentinel`;

    // 1. Call PayPal API first (or simulated in DEMO_MODE)
    try {
      await paypal.activateSubscription(sub.paypalSubscriptionId, reason);
    } catch (paypalErr) {
      console.error(`[Undo PayPal Failed for ${id}]`, paypalErr.message);
      // DO NOT change DB status if PayPal call fails
      return res.status(paypalErr.paypalStatus || 502).json({
        ok: false,
        error: `PayPal Sandbox error: ${paypalErr.message}`,
      });
    }

    // 2. PayPal succeeded -> update DB
    const updated = db.updateSubscriptionStatus(id, 'active');

    return res.json({
      ok: true,
      subscription: updated,
    });
  } catch (err) {
    console.error(`[POST /subscriptions/${id}/undo Error]`, err);
    return res.status(500).json({
      ok: false,
      error: 'Failed to reactivate subscription.',
    });
  }
});

module.exports = router;
