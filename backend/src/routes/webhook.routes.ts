import { Router } from 'express';
import { webhookService } from '../services/webhook.service.js';

const router = Router();

// POST /api/webhooks/paypal
router.post('/paypal', async (req, res, next) => {
  try {
    const result = await webhookService.handleWebhook(req);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

export default router;

