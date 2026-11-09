import { createApp } from './app.js';
import { config } from './config.js';
import { logger } from './logger.js';
import { getDb } from './db/index.js';
import { authService } from './services/auth.service.js';

const app = createApp();

// Ensure DB is initialized
getDb();
authService.ensureDemoUserExists();

const server = app.listen(config.PORT, () => {
  logger.info(
    {
      port: config.PORT,
      mode: config.MOCK_PAYPAL ? 'MOCK_PAYPAL' : 'REAL_SANDBOX',
      paypalEnv: config.PAYPAL_ENV,
      demoMode: config.DEMO_MODE,
      publicUrl: config.PUBLIC_BASE_URL,
    },
    `🚀 Churn Guard Backend running on port ${config.PORT}`
  );
  console.log(`\n======================================================`);
  console.log(`🚀 Smart Subscription & Churn Guard Backend`);
  console.log(`   Port:           ${config.PORT}`);
  console.log(`   Mode:           ${config.MOCK_PAYPAL ? 'MOCK (In-memory PayPal simulation)' : 'REAL (PayPal Sandbox)'}`);
  console.log(`   PayPal Env:     ${config.PAYPAL_ENV}`);
  console.log(`   Demo Mode:      ${config.DEMO_MODE ? 'Enabled (No auth needed)' : 'Disabled'}`);
  console.log(`   Health Check:   http://localhost:${config.PORT}/api/health`);
  console.log(`   Subscriptions:  http://localhost:${config.PORT}/api/subscriptions`);
  console.log(`   Events (SSE):   http://localhost:${config.PORT}/api/events`);
  console.log(`======================================================\n`);
});

export default server;

