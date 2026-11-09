import { Router } from 'express';
import { config } from '../config.js';
import { getPayPalClient } from '../paypal/index.js';

const router = Router();

// GET /api/health
router.get('/', (req, res) => {
  const paypalClient = getPayPalClient();
  res.json({
    status: 'healthy',
    mode: paypalClient.mode,
    paypalEnv: config.PAYPAL_ENV,
    demoMode: config.DEMO_MODE,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

export default router;

