import { createApp } from '../app.js';
import { config } from '../config.js';
import { runSeed } from './seed.js';
import { getPayPalClient } from '../paypal/index.js';
import { Server } from 'http';

interface TestResult {
  name: string;
  passed: boolean;
  message?: string;
}

const results: TestResult[] = [];

function record(name: string, passed: boolean, message?: string) {
  results.push({ name, passed, message });
  const icon = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${icon} | ${name}${message ? ` (${message})` : ''}`);
}

async function runSmokeTests() {
  console.log(`\n======================================================`);
  console.log(`🧪 Running Churn Guard Backend Smoke Tests`);
  console.log(`   Mode: ${config.MOCK_PAYPAL ? 'MOCK' : 'REAL SANDBOX'}`);
  console.log(`   Port: ${config.PORT}`);
  console.log(`======================================================\n`);

  // Start temporary server instance
  const app = createApp();
  const testPort = config.PORT + 10;
  const baseUrl = `http://localhost:${testPort}`;

  const server: Server = await new Promise((resolve) => {
    const s = app.listen(testPort, () => resolve(s));
  });

  try {
    // 1. Health check
    const healthRes = await fetch(`${baseUrl}/api/health`);
    const healthJson = (await healthRes.json()) as any;
    record('GET /api/health', healthRes.status === 200 && healthJson.status === 'healthy', `Status: ${healthJson.status}`);

    // 2. Auth login
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: config.DEMO_USER_EMAIL, password: config.DEMO_USER_PASSWORD }),
    });
    const loginJson = (await loginRes.json()) as any;
    const token = loginJson.token;
    record('POST /api/auth/login', loginRes.status === 200 && !!token, 'JWT Token generated');

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };

    // 3. Demo Reset / Seed
    const resetRes = await fetch(`${baseUrl}/api/demo/reset`, { method: 'POST', headers });
    const resetJson = (await resetRes.json()) as any;
    record('POST /api/demo/reset', resetRes.status === 200 && resetJson.success === true, `Seeded ${resetJson.subscriptionsCount} subs`);

    // 4. GET /api/subscriptions
    const subsRes = await fetch(`${baseUrl}/api/subscriptions`, { headers });
    const subs = (await subsRes.json()) as any[];
    record(
      'GET /api/subscriptions',
      subsRes.status === 200 && Array.isArray(subs) && subs.length >= 5,
      `Retrieved ${subs.length} subscriptions`
    );

    // 5. SSE GET /api/events
    const eventAbort = new AbortController();
    const eventRes = await fetch(`${baseUrl}/api/events`, { signal: eventAbort.signal });
    const sseContentType = eventRes.headers.get('content-type') || '';
    record(
      'GET /api/events (SSE Stream)',
      eventRes.status === 200 && sseContentType.includes('text/event-stream'),
      'Connected to Server-Sent Events stream'
    );
    eventAbort.abort();

    // 6. GET /api/subscriptions/:id
    const targetSub = subs.find((s: any) => s.managedByPaypal && s.downgradePlanId) || subs[0];
    const singleRes = await fetch(`${baseUrl}/api/subscriptions/${targetSub.id}`, { headers });
    const singleSub = (await singleRes.json()) as any;
    record('GET /api/subscriptions/:id', singleRes.status === 200 && singleSub.id === targetSub.id, targetSub.name);

    // 6. POST /api/subscriptions/:id/pause
    const pauseRes = await fetch(`${baseUrl}/api/subscriptions/${targetSub.id}/pause`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ reason: 'Smoke test pausing' }),
    });
    const pauseJson = (await pauseRes.json()) as any;
    record(
      'POST /api/subscriptions/:id/pause',
      pauseRes.status === 200 && pauseJson.subscription?.status === 'SUSPENDED',
      'Status transitioned to SUSPENDED'
    );

    // 7. POST /api/subscriptions/:id/resume
    const resumeRes = await fetch(`${baseUrl}/api/subscriptions/${targetSub.id}/resume`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ reason: 'Smoke test resuming' }),
    });
    const resumeJson = (await resumeRes.json()) as any;
    record(
      'POST /api/subscriptions/:id/resume',
      resumeRes.status === 200 && resumeJson.subscription?.status === 'ACTIVE',
      'Status transitioned to ACTIVE'
    );

    // 8. POST /api/subscriptions/:id/downgrade
    if (targetSub.downgradePlanId) {
      const downRes = await fetch(`${baseUrl}/api/subscriptions/${targetSub.id}/downgrade`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ reason: 'Smoke test downgrade' }),
      });
      const downJson = (await downRes.json()) as any;
      record(
        'POST /api/subscriptions/:id/downgrade',
        downRes.status === 200 && downJson.subscription?.planId === targetSub.downgradePlanId,
        `Revised plan to ${downJson.subscription?.planId}`
      );
    }

    // 9. AUDIT ONLY RULE TEST (External subscription must return 409 Conflict)
    const extSub = subs.find((s: any) => s.source === 'external');
    if (extSub) {
      const extPauseRes = await fetch(`${baseUrl}/api/subscriptions/${extSub.id}/pause`, {
        method: 'POST',
        headers,
      });
      const extPauseJson = (await extPauseRes.json()) as any;
      record(
        'AUDIT ONLY 409 Enforcement (pause external sub)',
        extPauseRes.status === 409 && extPauseJson.error?.code === 'AUDIT_ONLY',
        extPauseJson.error?.message
      );
    }

    // 10. CANCEL CONFIRMATION TEST
    // A) Missing confirm: true -> 400
    const failCancelRes = await fetch(`${baseUrl}/api/subscriptions/${targetSub.id}/cancel`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ confirm: false }),
    });
    record('POST /api/subscriptions/:id/cancel (requires confirm:true)', failCancelRes.status === 400, 'Rejected confirm:false');

    // B) Valid cancel
    const cancelRes = await fetch(`${baseUrl}/api/subscriptions/${targetSub.id}/cancel`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ confirm: true, reason: 'Smoke test cancellation' }),
    });
    const cancelJson = (await cancelRes.json()) as any;
    record(
      'POST /api/subscriptions/:id/cancel (with confirm:true)',
      cancelRes.status === 200 && cancelJson.subscription?.status === 'CANCELLED',
      'Status transitioned to CANCELLED'
    );

    // 11. Transactions
    const txRes = await fetch(`${baseUrl}/api/subscriptions/${targetSub.id}/transactions`, { headers });
    const txJson = (await txRes.json()) as any;
    record('GET /api/subscriptions/:id/transactions', txRes.status === 200 && Array.isArray(txJson.transactions), `Found ${txJson.transactions?.length} transactions`);

    // 12. Ingest (Person C parsing output)
    const ingestPayload = [
      {
        name: 'Grammarly Premium',
        category: 'Productivity',
        price: '30.00',
        currency: 'USD',
        interval: 'MONTH',
        lastUsedAt: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];
    const ingestRes = await fetch(`${baseUrl}/api/ingest`, {
      method: 'POST',
      headers,
      body: JSON.stringify(ingestPayload),
    });
    const ingestJson = (await ingestRes.json()) as any;
    record('POST /api/ingest (Person C)', ingestRes.status === 201 && ingestJson.count === 1, `Ingested as source: "${ingestJson.items?.[0]?.source}"`);

    // 13. Alerts (Person C & Frontend)
    const alertRes = await fetch(`${baseUrl}/api/alerts`, { headers });
    const alerts = (await alertRes.json()) as any[];
    record('GET /api/alerts', alertRes.status === 200 && Array.isArray(alerts) && alerts.length > 0, `Loaded ${alerts.length} alerts`);

    if (alerts[0]) {
      const readRes = await fetch(`${baseUrl}/api/alerts/${alerts[0].id}/read`, { method: 'POST', headers });
      const readJson = (await readRes.json()) as any;
      record('POST /api/alerts/:id/read', readRes.status === 200 && readJson.alert?.read === true, `Marked alert ${alerts[0].id} read`);
    }

    // 14. Webhook handling (Payment Failed & Deduplication)
    const webhookPayload = {
      id: `WH-TEST-${Date.now()}`,
      event_type: 'BILLING.SUBSCRIPTION.PAYMENT.FAILED',
      resource: {
        id: subs[1]?.paypalSubscriptionId || 'I-MOCK-SOUNDWAVE',
      },
    };
    const whRes1 = await fetch(`${baseUrl}/api/webhooks/paypal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webhookPayload),
    });
    const whJson1 = (await whRes1.json()) as any;
    record('POST /api/webhooks/paypal (Payment Failed)', whRes1.status === 200 && whJson1.status === 'processed', 'Created payment_failed alert');

    // Deduplication check
    const whRes2 = await fetch(`${baseUrl}/api/webhooks/paypal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webhookPayload),
    });
    const whJson2 = (await whRes2.json()) as any;
    record('POST /api/webhooks/paypal (Deduplication)', whRes2.status === 200 && whJson2.status === 'ignored_duplicate', 'Ignored duplicate webhook event');

    // Real Sandbox tests if MOCK_PAYPAL === false
    if (!config.MOCK_PAYPAL) {
      console.log('\n--- Running Real PayPal Sandbox Tests ---');
      const paypalClient = getPayPalClient();
      const testProd = await paypalClient.createProduct({
        name: 'Smoke Test Product',
        description: 'Smoke test sandbox product',
        type: 'SERVICE',
        category: 'SOFTWARE',
      });
      record('Real PayPal: createProduct', !!testProd.id, `Product ID: ${testProd.id}`);

      const testPlan = await paypalClient.createPlan({
        product_id: testProd.id,
        name: 'Smoke Test Plan',
        billing_cycles: [
          {
            frequency: { interval_unit: 'MONTH', interval_count: 1 },
            tenure_type: 'REGULAR',
            sequence: 1,
            total_cycles: 0,
            pricing_scheme: { fixed_price: { value: '5.00', currency_code: 'USD' } },
          },
        ],
        payment_preferences: { auto_bill_outstanding: true, payment_failure_threshold: 1 },
      });
      record('Real PayPal: createPlan', !!testPlan.id, `Plan ID: ${testPlan.id}`);

      const testSub = await paypalClient.createSubscription({
        plan_id: testPlan.id,
        application_context: {
          return_url: `${config.PUBLIC_BASE_URL}/api/demo/return`,
          cancel_url: `${config.PUBLIC_BASE_URL}/api/demo/cancel`,
        },
      });
      record('Real PayPal: createSubscription', !!testSub.id && !!testSub.approveUrl, `Approval Link: ${testSub.approveUrl}`);
    }
  } finally {
    server.close();
  }

  // Summary
  const passedCount = results.filter((r) => r.passed).length;
  const totalCount = results.length;
  console.log(`\n======================================================`);
  console.log(`Smoke Test Results: ${passedCount}/${totalCount} Passed`);
  console.log(`======================================================\n`);

  if (passedCount < totalCount) {
    process.exit(1);
  }
}

runSmokeTests().catch((err) => {
  console.error('Smoke tests crashed:', err);
  process.exit(1);
});
