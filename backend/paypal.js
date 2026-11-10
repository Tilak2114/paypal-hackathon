// backend/paypal.js
/**
 * PayPal REST Subscriptions v1 Integration for Sentinel (Sandbox Only)
 * 
 * Provides:
 * - OAuth 2.0 Client Credentials token caching
 * - Subscription suspension (Pause): POST /v1/billing/subscriptions/{id}/suspend
 * - Subscription reactivation (Undo): POST /v1/billing/subscriptions/{id}/activate
 * - Subscription cancellation: POST /v1/billing/subscriptions/{id}/cancel
 * - Product & Plan creation (for seed script): POST /v1/catalogs/products, POST /v1/billing/plans
 * - Webhook signature verification: POST /v1/notifications/verify-webhook-signature
 * - Automatic DEMO_MODE fallback when PayPal credentials are not provided or DEMO_MODE=true
 */

const PAYPAL_BASE_URL = (process.env.PAYPAL_BASE_URL || 'https://api-m.sandbox.paypal.com').replace(/\/+$/, '');
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || '';
const PAYPAL_SECRET = process.env.PAYPAL_SECRET || '';
const PAYPAL_WEBHOOK_ID = process.env.PAYPAL_WEBHOOK_ID || '';

// If DEMO_MODE is true or credentials are missing/placeholders, run in simulation mode
const isDemoMode = () => {
  if (process.env.DEMO_MODE === 'true') return true;
  if (!PAYPAL_CLIENT_ID || !PAYPAL_SECRET) return true;
  if (PAYPAL_CLIENT_ID.includes('your_') || PAYPAL_SECRET.includes('your_')) return true;
  return false;
};

// In-memory token cache
let cachedToken = null;
let tokenExpiresAt = 0;

/**
 * Obtains an OAuth 2.0 Bearer access token from PayPal Sandbox.
 * Caches token until it nears expiration.
 */
async function getAccessToken() {
  if (isDemoMode()) {
    return 'demo-sandbox-access-token';
  }

  // Return cached token if valid (with 60-second buffer)
  const now = Date.now();
  if (cachedToken && tokenExpiresAt > now + 60000) {
    return cachedToken;
  }

  const authHeader = 'Basic ' + Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString('base64');

  const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('[PayPal Auth Error]', response.status, errorBody);
    throw new Error(`Failed to authenticate with PayPal Sandbox (HTTP ${response.status}). Check PAYPAL_CLIENT_ID and PAYPAL_SECRET.`);
  }

  const data = await response.json();
  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + (Number(data.expires_in) || 3600) * 1000;
  console.log('[PayPal Auth] Successfully acquired new sandbox access token.');
  return cachedToken;
}

/**
 * Internal helper to send authenticated requests to PayPal Sandbox
 */
async function paypalRequest(endpoint, { method = 'POST', body = null } = {}) {
  const token = await getAccessToken();

  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${PAYPAL_BASE_URL}${endpoint}`, {
    ...options,
  });

  // 204 No Content is a standard PayPal success for suspend / cancel / activate
  if (response.status === 204) {
    return { ok: true, status: 204 };
  }

  const text = await response.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }

  if (!response.ok) {
    const message = json.message || json.details?.[0]?.description || json.error_description || `PayPal API error ${response.status}`;
    console.error(`[PayPal Error] ${method} ${endpoint} returned HTTP ${response.status}:`, json);
    const err = new Error(message);
    err.paypalStatus = response.status;
    err.paypalResponse = json;
    throw err;
  }

  return json;
}

/**
 * Suspend (Pause) a PayPal subscription
 */
async function pauseSubscription(subscriptionId, reason = 'Paused via Sentinel subscription manager') {
  if (isDemoMode() || !subscriptionId || subscriptionId.startsWith('I-DEMO')) {
    console.log(`[PayPal DEMO] Simulated Pause for subscription ${subscriptionId}: "${reason}"`);
    return { ok: true, simulated: true };
  }

  console.log(`[PayPal Sandbox] Suspending subscription ${subscriptionId}...`);
  await paypalRequest(`/v1/billing/subscriptions/${encodeURIComponent(subscriptionId)}/suspend`, {
    method: 'POST',
    body: { reason },
  });

  return { ok: true };
}

/**
 * Cancel a PayPal subscription
 */
async function cancelSubscription(subscriptionId, reason = 'Cancelled via Sentinel subscription manager') {
  if (isDemoMode() || !subscriptionId || subscriptionId.startsWith('I-DEMO')) {
    console.log(`[PayPal DEMO] Simulated Cancel for subscription ${subscriptionId}: "${reason}"`);
    return { ok: true, simulated: true };
  }

  console.log(`[PayPal Sandbox] Cancelling subscription ${subscriptionId}...`);
  await paypalRequest(`/v1/billing/subscriptions/${encodeURIComponent(subscriptionId)}/cancel`, {
    method: 'POST',
    body: { reason },
  });

  return { ok: true };
}

/**
 * Activate (Undo / Resume) a PayPal subscription
 */
async function activateSubscription(subscriptionId, reason = 'Reactivated via Sentinel subscription manager') {
  if (isDemoMode() || !subscriptionId || subscriptionId.startsWith('I-DEMO')) {
    console.log(`[PayPal DEMO] Simulated Undo/Reactivate for subscription ${subscriptionId}: "${reason}"`);
    return { ok: true, simulated: true };
  }

  console.log(`[PayPal Sandbox] Reactivating subscription ${subscriptionId}...`);
  await paypalRequest(`/v1/billing/subscriptions/${encodeURIComponent(subscriptionId)}/activate`, {
    method: 'POST',
    body: { reason },
  });

  return { ok: true };
}

/**
 * Verify a PayPal Webhook signature
 */
async function verifyWebhookSignature({ headers, rawBody, webhookId = PAYPAL_WEBHOOK_ID }) {
  if (isDemoMode() || !webhookId) {
    console.log('[PayPal Webhook] DEMO_MODE active: skipping cryptographic signature verification.');
    return { verification_status: 'SUCCESS', simulated: true };
  }

  try {
    const payload = {
      auth_algo: headers['paypal-auth-algo'],
      cert_url: headers['paypal-cert-url'],
      transmission_id: headers['paypal-transmission-id'],
      transmission_sig: headers['paypal-transmission-sig'],
      transmission_time: headers['paypal-transmission-time'],
      webhook_id: webhookId,
      webhook_event: typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody,
    };

    const result = await paypalRequest('/v1/notifications/verify-webhook-signature', {
      method: 'POST',
      body: payload,
    });

    return result;
  } catch (err) {
    console.error('[PayPal Webhook Verification Failed]', err.message);
    return { verification_status: 'FAILURE', error: err.message };
  }
}

/**
 * Create a Product in PayPal Sandbox (Used by seed script)
 */
async function createProduct({ name, description = 'Sentinel Demo Product', type = 'SERVICE', category = 'SOFTWARE' }) {
  if (isDemoMode()) {
    return { id: `PROD-DEMO-${Date.now()}`, name };
  }

  return paypalRequest('/v1/catalogs/products', {
    method: 'POST',
    body: {
      name,
      description,
      type,
      category,
    },
  });
}

/**
 * Create a Billing Plan in PayPal Sandbox (Used by seed script)
 */
async function createPlan({ productId, name, description, cost, currency = 'USD' }) {
  if (isDemoMode()) {
    return { id: `P-DEMO-${Date.now()}`, name };
  }

  return paypalRequest('/v1/billing/plans', {
    method: 'POST',
    body: {
      product_id: productId,
      name,
      description: description || `${name} Monthly Plan`,
      status: 'ACTIVE',
      billing_cycles: [
        {
          frequency: {
            interval_unit: 'MONTH',
            interval_count: 1,
          },
          tenure_type: 'REGULAR',
          sequence: 1,
          total_cycles: 0, // Infinite
          pricing_scheme: {
            fixed_price: {
              value: String(cost),
              currency_code: currency === 'INR' ? 'USD' : currency, // PayPal sandbox testing often uses USD
            },
          },
        },
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee_failure_action: 'CONTINUE',
        payment_failure_threshold: 3,
      },
    },
  });
}

module.exports = {
  isDemoMode,
  getAccessToken,
  pauseSubscription,
  cancelSubscription,
  activateSubscription,
  verifyWebhookSignature,
  createProduct,
  createPlan,
};
