import { subscriptionService } from '../services/subscription.service.js';
import { DEMO_USER_ID } from '../services/auth.service.js';
import { logger } from '../logger.js';

export async function runSync(): Promise<number> {
  logger.info('Running PayPal Subscriptions sync...');
  const count = await subscriptionService.syncPayPalSubscriptions(DEMO_USER_ID);
  logger.info({ updatedCount: count }, 'Sync completed successfully');
  return count;
}

if (process.argv[1] && process.argv[1].endsWith('sync.ts')) {
  runSync()
    .then((count) => {
      console.log(`Sync complete: updated ${count} PayPal subscription(s).`);
      process.exit(0);
    })
    .catch((err) => {
      console.error('Sync failed:', err);
      process.exit(1);
    });
}

