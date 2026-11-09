import { Router } from 'express';
import { runSeed } from '../scripts/seed.js';

const router = Router();

// POST /api/demo/reset
router.post('/reset', async (req, res, next) => {
  try {
    const result = await runSeed();
    res.json({
      success: true,
      message: 'Demo state successfully reset to clean default fixtures',
      ...result,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/demo/return (helper for PayPal return_url)
router.get('/return', (req, res) => {
  res.send('<h1>PayPal Subscription Approved!</h1><p>You may close this window and return to Churn Guard.</p>');
});

// GET /api/demo/cancel (helper for PayPal cancel_url)
router.get('/cancel', (req, res) => {
  res.send('<h1>PayPal Subscription Flow Cancelled.</h1><p>You may close this window and return to Churn Guard.</p>');
});

export default router;

