import { Router } from 'express';
import { subscriptionService } from '../services/subscription.service.js';
import {
  PauseResumeBodySchema,
  DowngradeBodySchema,
} from '../contract.js';
import { getDb } from '../db/index.js';

const router = Router();

function enrichForFrontend(sub: any, alerts: any[] = []): any {
  const alert = alerts.find((a) => a.subscription_id === sub.id || a.subscriptionId === sub.id);

  let lastUsed = 'Active';
  if (sub.lastUsedAt) {
    const diffDays = Math.round((Date.now() - new Date(sub.lastUsedAt).getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) lastUsed = 'Today';
    else if (diffDays === 1) lastUsed = 'Yesterday';
    else lastUsed = `${diffDays} days ago`;
  } else if (sub.createdAt) {
    const diffDays = Math.round((Date.now() - new Date(sub.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    lastUsed = diffDays > 0 ? `${diffDays} days ago` : 'Recently';
  }

  const colors: Record<string, string> = {
    TuneBox: '#34f0c8',
    SoundWave: '#34f0c8',
    TuneWave: '#34f0c8',
    Streamly: '#7b6cff',
    FitClub: '#ffb86b',
    FitPro: '#ffb86b',
    NoteVault: '#10a37f',
    CloudDrive: '#6bb7ff',
    Artisan: '#c4f06b',
    PixelPro: '#ff9ad5',
    Netflix: '#e50914',
    Spotify: '#1db954',
  };

  let color = '#00d2ff';
  for (const [k, v] of Object.entries(colors)) {
    if (sub.name?.toLowerCase().includes(k.toLowerCase())) {
      color = v;
      break;
    }
  }

  let frontendStatus = 'active';
  if (sub.status === 'SUSPENDED' || sub.status === 'paused') frontendStatus = 'paused';
  else if (sub.status === 'CANCELLED' || sub.status === 'cancelled') frontendStatus = 'cancelled';
  else frontendStatus = 'active';

  return {
    ...sub,
    cost: typeof sub.cost === 'number' ? sub.cost : parseFloat(sub.price || '0'),
    status: frontendStatus,
    backendStatus: sub.status,
    lastUsed,
    flag: alert?.type || null,
    suggestion: alert?.reason || alert?.message || null,
    color,
  };
}

// GET /api/subscriptions
router.get('/', async (req, res, next) => {
  try {
    const userId = req.user!.userId;
    const forceSync = req.query.sync === 'true';
    const subscriptions = await subscriptionService.getAllSubscriptions(userId, forceSync);

    const db = getDb();
    const alerts = db.prepare('SELECT * FROM alerts').all() as any[];

    const enriched = subscriptions.map((s) => enrichForFrontend(s, alerts));
    res.json(enriched);
  } catch (err) {
    next(err);
  }
});

// GET /api/subscriptions/:id
router.get('/:id', async (req, res, next) => {
  try {
    const userId = req.user!.userId;
    const sub = await subscriptionService.getSubscriptionById(req.params.id, userId);
    if (!sub) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: `Subscription ${req.params.id} not found.` },
      });
    }

    const db = getDb();
    const alerts = db.prepare('SELECT * FROM alerts WHERE subscription_id = ?').all(req.params.id) as any[];

    res.json(enrichForFrontend(sub, alerts));
  } catch (err) {
    next(err);
  }
});

// POST /api/subscriptions/:id/pause
router.post('/:id/pause', async (req, res, next) => {
  try {
    const userId = req.user!.userId;
    const { reason } = PauseResumeBodySchema.parse(req.body || {});
    const updated = await subscriptionService.pauseSubscription(req.params.id, userId, reason);
    res.json({ success: true, message: 'Paused via PayPal', subscription: enrichForFrontend(updated) });
  } catch (err) {
    next(err);
  }
});

// POST /api/subscriptions/:id/resume
router.post('/:id/resume', async (req, res, next) => {
  try {
    const userId = req.user!.userId;
    const { reason } = PauseResumeBodySchema.parse(req.body || {});
    const updated = await subscriptionService.resumeSubscription(req.params.id, userId, reason);
    res.json({ success: true, message: 'Restored subscription', subscription: enrichForFrontend(updated) });
  } catch (err) {
    next(err);
  }
});

// POST /api/subscriptions/:id/undo (Person A frontend alias for restore)
router.post('/:id/undo', async (req, res, next) => {
  try {
    const userId = req.user!.userId;
    const reason = req.body?.reason || 'Restored subscription';
    const updated = await subscriptionService.resumeSubscription(req.params.id, userId, reason);
    res.json({ success: true, message: 'Restored subscription', subscription: enrichForFrontend(updated) });
  } catch (err) {
    next(err);
  }
});

// POST /api/subscriptions/:id/cancel
router.post('/:id/cancel', async (req, res, next) => {
  try {
    const userId = req.user!.userId;
    const confirm = req.body?.confirm ?? true;
    if (confirm !== true) {
      return res.status(400).json({
        error: {
          code: 'CONFIRMATION_REQUIRED',
          message: 'Cancellation is irreversible and requires { "confirm": true } in request body.',
        },
      });
    }
    const reason = req.body?.reason || 'Cancelled via Churn Guard';
    const updated = await subscriptionService.cancelSubscription(req.params.id, userId, confirm, reason);
    res.json({ success: true, message: 'Cancelled via PayPal', subscription: enrichForFrontend(updated) });
  } catch (err) {
    next(err);
  }
});

// POST /api/subscriptions/:id/downgrade
router.post('/:id/downgrade', async (req, res, next) => {
  try {
    const userId = req.user!.userId;
    const { targetPlanId, reason } = DowngradeBodySchema.parse(req.body || {});
    const result = await subscriptionService.downgradeSubscription(req.params.id, userId, targetPlanId, reason);
    res.json({
      success: true,
      subscription: enrichForFrontend(result.subscription),
      approveUrl: result.approveUrl,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/subscriptions/:id/transactions
router.get('/:id/transactions', async (req, res, next) => {
  try {
    const userId = req.user!.userId;
    const result = await subscriptionService.getTransactions(req.params.id, userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
