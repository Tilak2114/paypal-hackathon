import { Router } from 'express';
import { subscriptionService } from '../services/subscription.service.js';
import {
  CancelSubscriptionBodySchema,
  PauseResumeBodySchema,
  DowngradeBodySchema,
} from '../contract.js';

const router = Router();

// GET /api/subscriptions
router.get('/', async (req, res, next) => {
  try {
    const userId = req.user!.userId;
    const forceSync = req.query.sync === 'true';
    const subscriptions = await subscriptionService.getAllSubscriptions(userId, forceSync);
    res.json(subscriptions);
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
    res.json(sub);
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
    res.json({ success: true, subscription: updated });
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
    res.json({ success: true, subscription: updated });
  } catch (err) {
    next(err);
  }
});

// POST /api/subscriptions/:id/cancel
router.post('/:id/cancel', async (req, res, next) => {
  try {
    const userId = req.user!.userId;
    const { confirm, reason } = CancelSubscriptionBodySchema.parse(req.body);
    const updated = await subscriptionService.cancelSubscription(req.params.id, userId, confirm, reason);
    res.json({ success: true, subscription: updated });
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
      subscription: result.subscription,
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

