import { v4 as uuidv4 } from 'uuid';
import { getDb, initSchema } from '../db/index.js';
import { getPayPalClient } from '../paypal/index.js';
import { config } from '../config.js';
import { logger } from '../logger.js';
import { DEMO_USER_ID, authService } from '../services/auth.service.js';

export async function runReapprove() {
  logger.info('Starting subscription reapprove process...');

  const db = getDb();
  initSchema(db);
  authService.ensureDemoUserExists();

  const now = new Date();
  const isoNow = now.toISOString();

  // 1. Mark old APPROVAL_PENDING subscriptions as STALE
  const staleResult = db.prepare(`
    UPDATE subscriptions
    SET status = 'STALE', updated_at = ?
    WHERE status = 'APPROVAL_PENDING'
  `).run(isoNow);

  console.log(`[STALE CLEANUP] Marked ${staleResult.changes} expired/unapproved subscription(s) as STALE.`);

  // 2. Determine return and cancel URLs
  let returnUrl = config.PAYPAL_RETURN_URL;
  let cancelUrl = config.PAYPAL_CANCEL_URL;

  // If user configured a valid public HTTPS baseUrl, use that for return/cancel
  if (config.PUBLIC_BASE_URL.startsWith('https://')) {
    returnUrl = `${config.PUBLIC_BASE_URL}/api/demo/return`;
    cancelUrl = `${config.PUBLIC_BASE_URL}/api/demo/cancel`;
  }

  console.log(`[CONFIG] Using Return URL: ${returnUrl}`);
  console.log(`[CONFIG] Using Cancel URL: ${cancelUrl}`);

  // 3. Find or create plans
  const paypalClient = getPayPalClient();

  // Look for existing plans in database
  let standardPlanId: string | null = null;
  let downgradePlanId: string | null = null;
  let trialPlanId: string | null = null;

  const existingRows = db.prepare(`
    SELECT plan_id, downgrade_plan_id, name FROM subscriptions
    WHERE plan_id IS NOT NULL
  `).all() as any[];

  for (const row of existingRows) {
    if (row.name?.includes('Streamly') && row.plan_id) {
      standardPlanId = row.plan_id;
      downgradePlanId = row.downgrade_plan_id;
    }
    if (row.name?.includes('FitPro') && row.plan_id) {
      trialPlanId = row.plan_id;
    }
  }

  // Fallback if not found in DB
  if (!standardPlanId) standardPlanId = 'P-818891060U1274430NLYZWXQ';
  if (!downgradePlanId) downgradePlanId = 'P-87U8690842359580XNLYZWXY';
  if (!trialPlanId) trialPlanId = 'P-6HN83592DJ474983JNLYZWYA';

  // 4. Create fresh subscriptions
  const sub1 = await paypalClient.createSubscription({
    plan_id: standardPlanId,
    application_context: {
      brand_name: 'Churn Guard',
      locale: 'en-US',
      shipping_preference: 'NO_SHIPPING',
      user_action: 'SUBSCRIBE_NOW',
      return_url: returnUrl,
      cancel_url: cancelUrl,
    },
  });

  const sub2 = await paypalClient.createSubscription({
    plan_id: trialPlanId,
    application_context: {
      brand_name: 'Churn Guard',
      locale: 'en-US',
      shipping_preference: 'NO_SHIPPING',
      user_action: 'SUBSCRIBE_NOW',
      return_url: returnUrl,
      cancel_url: cancelUrl,
    },
  });

  // 5. Insert new subscriptions into DB as APPROVAL_PENDING
  const insertSub = db.prepare(`
    INSERT INTO subscriptions (
      id, user_id, name, category, price, currency, interval, status,
      source, managed_by_paypal, paypal_subscription_id, plan_id,
      downgrade_plan_id, next_billing_time, trial_ends_at, last_used_at,
      created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
  `);

  const id1 = `sub-streamly-${uuidv4().substring(0, 6)}`;
  const id2 = `sub-fitpro-${uuidv4().substring(0, 6)}`;

  insertSub.run(
    id1,
    DEMO_USER_ID,
    'Streamly Standard Monthly',
    'Video Streaming',
    '15.99',
    'USD',
    'MONTH',
    'APPROVAL_PENDING',
    'paypal',
    1,
    sub1.id,
    standardPlanId,
    downgradePlanId,
    null,
    null,
    isoNow,
    isoNow,
    isoNow
  );

  insertSub.run(
    id2,
    DEMO_USER_ID,
    'FitPro Trial Monthly',
    'Fitness & Health',
    '29.99',
    'USD',
    'MONTH',
    'APPROVAL_PENDING',
    'paypal',
    1,
    sub2.id,
    trialPlanId,
    null,
    null,
    new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    isoNow,
    isoNow,
    isoNow
  );

  console.log(`\n======================================================`);
  console.log(`FRESH PAYPAL SANDBOX APPROVAL LINKS`);
  console.log(`Streamly Standard Monthly: ${sub1.approveUrl}`);
  console.log(`FitPro Trial Monthly: ${sub2.approveUrl}`);
  console.log(`======================================================\n`);

  return {
    staleCount: staleResult.changes,
    subscriptions: [
      { name: 'Streamly Standard Monthly', id: sub1.id, url: sub1.approveUrl },
      { name: 'FitPro Trial Monthly', id: sub2.id, url: sub2.approveUrl },
    ],
    returnUrl,
    cancelUrl,
  };
}

if (process.argv[1] && process.argv[1].endsWith('reapprove.ts')) {
  runReapprove()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Reapprove failed:', err);
      process.exit(1);
    });
}

