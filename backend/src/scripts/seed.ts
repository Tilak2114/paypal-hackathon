import { v4 as uuidv4 } from 'uuid';
import { getDb, initSchema } from '../db/index.js';
import { getPayPalClient, MockPayPalClient } from '../paypal/index.js';
import { config } from '../config.js';
import { logger } from '../logger.js';
import { DEMO_USER_ID, authService } from '../services/auth.service.js';

export async function runSeed(): Promise<{ subscriptionsCount: number; alertsCount: number }> {
  logger.info({ mode: config.MOCK_PAYPAL ? 'MOCK' : 'REAL' }, 'Starting database seed...');

  const db = getDb();
  initSchema(db);
  authService.ensureDemoUserExists();

  // Clean existing demo data for clean state
  db.prepare('DELETE FROM alerts').run();
  db.prepare('DELETE FROM subscriptions WHERE user_id = ?').run(DEMO_USER_ID);
  db.prepare('DELETE FROM events').run();

  const now = new Date();
  const isoNow = now.toISOString();

  if (config.MOCK_PAYPAL) {
    const paypalClient = getPayPalClient() as MockPayPalClient;

    // Register demo plans in mock client
    const planStandard = 'P-MOCK-MUSIC-STANDARD';
    const planMusicBasic = 'P-MOCK-MUSIC-BASIC';
    const planVideoPro = 'P-MOCK-VIDEO-PRO';
    const planVideoBasic = 'P-MOCK-VIDEO-BASIC';
    const planTrialNotes = 'P-MOCK-NOTES-TRIAL';

    // 1. TuneBox (Music)
    const id1 = 'sub-tunebox';
    const pay1 = 'I-MOCK-TUNEBOX';
    paypalClient.registerMockSubscription({
      id: pay1,
      status: 'ACTIVE',
      planId: planStandard,
      price: '10.99',
    });

    // 2. SoundWave (Music - Overlaps with TuneBox)
    const id2 = 'sub-soundwave';
    const pay2 = 'I-MOCK-SOUNDWAVE';
    paypalClient.registerMockSubscription({
      id: pay2,
      status: 'ACTIVE',
      planId: planStandard,
      price: '10.99',
    });

    // 3. Streamly Pro (Video - Price Increase)
    const id3 = 'sub-streamly';
    const pay3 = 'I-MOCK-STREAMLY';
    paypalClient.registerMockSubscription({
      id: pay3,
      status: 'ACTIVE',
      planId: planVideoPro,
      price: '19.99',
    });

    // 4. FitClub Platinum (Gym - Unused 74 days)
    const id4 = 'sub-fitclub';
    const pay4 = 'I-MOCK-FITCLUB';
    paypalClient.registerMockSubscription({
      id: pay4,
      status: 'ACTIVE',
      planId: 'P-MOCK-GYM',
      price: '49.00',
    });

    // 5. NoteVault AI (Trial ending in 3 days)
    const id5 = 'sub-notevault';
    const pay5 = 'I-MOCK-NOTEVAULT';
    paypalClient.registerMockSubscription({
      id: pay5,
      status: 'ACTIVE',
      planId: planTrialNotes,
      price: '14.99',
    });

    // Subscriptions array
    const demoSubscriptions = [
      {
        id: id1,
        user_id: DEMO_USER_ID,
        name: 'TuneBox Premium',
        category: 'Music & Audio',
        price: '10.99',
        currency: 'USD',
        interval: 'MONTH',
        status: 'ACTIVE',
        source: 'paypal',
        managed_by_paypal: 1,
        paypal_subscription_id: pay1,
        plan_id: planStandard,
        downgrade_plan_id: planMusicBasic,
        next_billing_time: new Date(now.getTime() + 18 * 24 * 60 * 60 * 1000).toISOString(),
        trial_ends_at: null,
        last_used_at: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: isoNow,
      },
      {
        id: id2,
        user_id: DEMO_USER_ID,
        name: 'SoundWave Music',
        category: 'Music & Audio',
        price: '10.99',
        currency: 'USD',
        interval: 'MONTH',
        status: 'ACTIVE',
        source: 'paypal',
        managed_by_paypal: 1,
        paypal_subscription_id: pay2,
        plan_id: planStandard,
        downgrade_plan_id: planMusicBasic,
        next_billing_time: new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000).toISOString(),
        trial_ends_at: null,
        last_used_at: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: isoNow,
      },
      {
        id: id3,
        user_id: DEMO_USER_ID,
        name: 'Streamly 4K Pro',
        category: 'Video Streaming',
        price: '19.99',
        currency: 'USD',
        interval: 'MONTH',
        status: 'ACTIVE',
        source: 'paypal',
        managed_by_paypal: 1,
        paypal_subscription_id: pay3,
        plan_id: planVideoPro,
        downgrade_plan_id: planVideoBasic,
        next_billing_time: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        trial_ends_at: null,
        last_used_at: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(now.getTime() - 200 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: isoNow,
      },
      {
        id: id4,
        user_id: DEMO_USER_ID,
        name: 'FitClub All-Access',
        category: 'Fitness & Health',
        price: '49.00',
        currency: 'USD',
        interval: 'MONTH',
        status: 'ACTIVE',
        source: 'paypal',
        managed_by_paypal: 1,
        paypal_subscription_id: pay4,
        plan_id: 'P-MOCK-GYM',
        downgrade_plan_id: null,
        next_billing_time: new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000).toISOString(),
        trial_ends_at: null,
        last_used_at: new Date(now.getTime() - 74 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: isoNow,
      },
      {
        id: id5,
        user_id: DEMO_USER_ID,
        name: 'NoteVault AI Pro',
        category: 'Productivity',
        price: '14.99',
        currency: 'USD',
        interval: 'MONTH',
        status: 'ACTIVE',
        source: 'paypal',
        managed_by_paypal: 1,
        paypal_subscription_id: pay5,
        plan_id: planTrialNotes,
        downgrade_plan_id: null,
        next_billing_time: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        trial_ends_at: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days left
        last_used_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(now.getTime() - 11 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: isoNow,
      },
      // 6. External audit-only: CloudDrive
      {
        id: 'sub-clouddrive-ext',
        user_id: DEMO_USER_ID,
        name: 'CloudDrive 2TB',
        category: 'Cloud Storage',
        price: '9.99',
        currency: 'USD',
        interval: 'MONTH',
        status: 'EXTERNAL',
        source: 'external',
        managed_by_paypal: 0,
        paypal_subscription_id: null,
        plan_id: null,
        downgrade_plan_id: null,
        next_billing_time: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000).toISOString(),
        trial_ends_at: null,
        last_used_at: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: isoNow,
      },
      // 7. External audit-only: Boutique Coffee Club
      {
        id: 'sub-coffee-ext',
        user_id: DEMO_USER_ID,
        name: 'Artisan Coffee Roasters',
        category: 'Food & Beverage',
        price: '28.00',
        currency: 'USD',
        interval: 'MONTH',
        status: 'EXTERNAL',
        source: 'external',
        managed_by_paypal: 0,
        paypal_subscription_id: null,
        plan_id: null,
        downgrade_plan_id: null,
        next_billing_time: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        trial_ends_at: null,
        last_used_at: new Date(now.getTime() - 65 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: isoNow,
      },
    ];

    const insertSub = db.prepare(`
      INSERT INTO subscriptions (
        id, user_id, name, category, price, currency, interval, status,
        source, managed_by_paypal, paypal_subscription_id, plan_id,
        downgrade_plan_id, next_billing_time, trial_ends_at, last_used_at,
        created_at, updated_at
      ) VALUES (
        @id, @user_id, @name, @category, @price, @currency, @interval, @status,
        @source, @managed_by_paypal, @paypal_subscription_id, @plan_id,
        @downgrade_plan_id, @next_billing_time, @trial_ends_at, @last_used_at,
        @created_at, @updated_at
      )
    `);

    for (const sub of demoSubscriptions) {
      insertSub.run(sub);
    }

    // Matching Alerts
    const demoAlerts = [
      {
        id: 'alert-overlap-music',
        subscription_id: id2,
        type: 'overlap',
        severity: 'high',
        message: 'Duplicate Music Streaming: SoundWave and TuneBox are both active.',
        recommendation: 'cancel',
        reason: 'You have two active music services billing $10.99/mo each. SoundWave has not been opened in 45 days.',
        created_at: isoNow,
        read: 0,
      },
      {
        id: 'alert-unused-gym',
        subscription_id: id4,
        type: 'unused',
        severity: 'high',
        message: 'FitClub All-Access unused for 74 days.',
        recommendation: 'pause',
        reason: 'Zero gym keycard swipes or check-ins recorded in 74 days. Pausing now saves $49.00/mo ($588/yr).',
        created_at: isoNow,
        read: 0,
      },
      {
        id: 'alert-trial-ending-notes',
        subscription_id: id5,
        type: 'trial_ending',
        severity: 'medium',
        message: 'NoteVault AI Pro free trial ends in 3 days.',
        recommendation: 'keep',
        reason: 'Trial expires on ' + new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString() + '. Auto-renewal of $14.99/mo will commence via PayPal.',
        created_at: isoNow,
        read: 0,
      },
      {
        id: 'alert-price-increase-streamly',
        subscription_id: id3,
        type: 'price_increase',
        severity: 'medium',
        message: 'Upcoming price increase on Streamly 4K Pro.',
        recommendation: 'downgrade',
        reason: 'Streamly announced rate adjustment to $19.99/mo. Switch to Basic plan ($9.99/mo) to save $120/yr.',
        created_at: isoNow,
        read: 0,
      },
      {
        id: 'alert-coffee-unused',
        subscription_id: 'sub-coffee-ext',
        type: 'unused',
        severity: 'low',
        message: 'Artisan Coffee Roasters statement charge detected (external).',
        recommendation: 'cancel',
        reason: 'Audit only: External credit card statement reflects $28.00 monthly shipment with no recent delivery confirmations.',
        created_at: isoNow,
        read: 0,
      },
    ];

    const insertAlert = db.prepare(`
      INSERT INTO alerts (
        id, subscription_id, type, severity, message, recommendation, reason, created_at, read
      ) VALUES (
        @id, @subscription_id, @type, @severity, @message, @recommendation, @reason, @created_at, @read
      )
    `);

    for (const alert of demoAlerts) {
      insertAlert.run(alert);
    }

    logger.info(`[MOCK SEED] Created ${demoSubscriptions.length} subscriptions and ${demoAlerts.length} alerts.`);
    return { subscriptionsCount: demoSubscriptions.length, alertsCount: demoAlerts.length };
  } else {
    // REAL PayPal Sandbox Seeding
    const paypalClient = getPayPalClient();
    logger.info('[REAL SEED] Setting up Sandbox Catalog Product, Plans, and Subscriptions...');

    // 1. Create Product
    const product = await paypalClient.createProduct({
      name: 'Churn Guard Subscriptions Hub',
      description: 'PayPal AI Hackathon 2026 Sandbox Products',
      type: 'SERVICE',
      category: 'SOFTWARE',
    });
    console.log(`\n========================================`);
    console.log(`[REAL PAYPAL] Created Product: ${product.id} (${product.name})`);

    // 2. Create Plans (Standard, Downgrade, and Trial)
    const standardPlan = await paypalClient.createPlan({
      product_id: product.id,
      name: 'Streamly Standard Monthly',
      description: 'Standard tier video streaming service',
      billing_cycles: [
        {
          frequency: { interval_unit: 'MONTH', interval_count: 1 },
          tenure_type: 'REGULAR',
          sequence: 1,
          total_cycles: 0,
          pricing_scheme: { fixed_price: { value: '15.99', currency_code: 'USD' } },
        },
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        payment_failure_threshold: 3,
      },
    });

    const downgradePlan = await paypalClient.createPlan({
      product_id: product.id,
      name: 'Streamly Basic Downgrade',
      description: 'Budget tier video streaming service',
      billing_cycles: [
        {
          frequency: { interval_unit: 'MONTH', interval_count: 1 },
          tenure_type: 'REGULAR',
          sequence: 1,
          total_cycles: 0,
          pricing_scheme: { fixed_price: { value: '7.99', currency_code: 'USD' } },
        },
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        payment_failure_threshold: 3,
      },
    });

    const trialPlan = await paypalClient.createPlan({
      product_id: product.id,
      name: 'FitPro Trial + Monthly',
      description: '7-day trial at $0 followed by $29.99/mo',
      billing_cycles: [
        {
          frequency: { interval_unit: 'DAY', interval_count: 7 },
          tenure_type: 'TRIAL',
          sequence: 1,
          total_cycles: 1,
          pricing_scheme: { fixed_price: { value: '0', currency_code: 'USD' } },
        },
        {
          frequency: { interval_unit: 'MONTH', interval_count: 1 },
          tenure_type: 'REGULAR',
          sequence: 2,
          total_cycles: 0,
          pricing_scheme: { fixed_price: { value: '29.99', currency_code: 'USD' } },
        },
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        payment_failure_threshold: 3,
      },
    });

    console.log(`[REAL PAYPAL] Created Standard Plan: ${standardPlan.id}`);
    console.log(`[REAL PAYPAL] Created Downgrade Plan: ${downgradePlan.id}`);
    console.log(`[REAL PAYPAL] Created Trial Plan: ${trialPlan.id}`);

    // 3. Create Subscriptions and print Approval Links
    const sub1 = await paypalClient.createSubscription({
      plan_id: standardPlan.id,
      application_context: {
        return_url: `${config.PUBLIC_BASE_URL}/api/demo/return`,
        cancel_url: `${config.PUBLIC_BASE_URL}/api/demo/cancel`,
      },
    });

    const sub2 = await paypalClient.createSubscription({
      plan_id: trialPlan.id,
      application_context: {
        return_url: `${config.PUBLIC_BASE_URL}/api/demo/return`,
        cancel_url: `${config.PUBLIC_BASE_URL}/api/demo/cancel`,
      },
    });

    console.log(`\n========================================`);
    console.log(`ACTION REQUIRED: APPROVE REAL SANDBOX SUBSCRIPTIONS IN BROWSER`);
    console.log(`Subscription 1 (${standardPlan.name}):`);
    console.log(`  ID: ${sub1.id}`);
    console.log(`  Approve URL: ${sub1.approveUrl}`);
    console.log(`\nSubscription 2 (${trialPlan.name}):`);
    console.log(`  ID: ${sub2.id}`);
    console.log(`  Approve URL: ${sub2.approveUrl}`);
    console.log(`========================================\n`);

    // Insert into DB
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

    insertSub.run(
      'sub-real-streamly',
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
      standardPlan.id,
      downgradePlan.id,
      null,
      null,
      isoNow,
      isoNow,
      isoNow
    );

    insertSub.run(
      'sub-real-fitpro',
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
      trialPlan.id,
      null,
      null,
      new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      isoNow,
      isoNow,
      isoNow
    );

    return { subscriptionsCount: 2, alertsCount: 0 };
  }
}

// If executed directly from CLI: npm run seed
if (process.argv[1] && process.argv[1].endsWith('seed.ts')) {
  runSeed()
    .then((res) => {
      console.log(`Seed completed successfully: ${res.subscriptionsCount} subscriptions, ${res.alertsCount} alerts.`);
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seed failed:', err);
      process.exit(1);
    });
}

