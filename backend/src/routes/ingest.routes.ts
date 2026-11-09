import { Router } from 'express';
import { subscriptionService } from '../services/subscription.service.js';
import { IngestSubscriptionsSchema } from '../contract.js';

const router = Router();

// POST /api/ingest
router.post('/', async (req, res, next) => {
  try {
    const userId = req.user!.userId;
    // Support either an array directly or { subscriptions: [...] }
    const payload = Array.isArray(req.body) ? req.body : req.body.subscriptions;
    const items = IngestSubscriptionsSchema.parse(payload);
    const result = await subscriptionService.ingestSubscriptions(userId, items);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

export default router;

