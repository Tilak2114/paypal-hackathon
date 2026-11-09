/**
 * server/services/paypal.js
 * PayPal Subscriptions API Client for Churn Guard (Person C & B)
 *
 * Implements PayPal REST Subscriptions v1:
 * - Suspend (Pause): POST /v1/billing/subscriptions/{id}/suspend
 * - Cancel: POST /v1/billing/subscriptions/{id}/cancel
 * - Activate (Resume/Undo): POST /v1/billing/subscriptions/{id}/activate
 * - Details: GET /v1/billing/subscriptions/{id}
 *
 * Automatically falls back to a sandbox simulator if PayPal credentials
 * are not provided in the environment.
 */

const https = require('https');

const PAYPAL_ENV = process.env.PAYPAL_ENV || 'sandbox';
const PAYPAL_BASE_URL = PAYPAL_ENV === 'live' 
  ? 'api-m.paypal.com' 
  : 'api-m.sandbox.paypal.com';

const CLIENT_ID = process.env.PAYPAL_CLIENT_ID || '';
const CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || '';

let cachedToken = null;
let tokenExpiry = 0;

/**
 * Checks if live PayPal API credentials are configured.
 */
function isConfigured() {
  return Boolean(CLIENT_ID && CLIENT_SECRET);
}

/**
 * Obtains an OAuth 2.0 Bearer access token using Client Credentials grant.
 */
async function getAccessToken() {
  if (!isConfigured()) {
    return 'mock-sandbox-token';
  }

  const now = Date.now();
  if (cachedToken && now < tokenExpiry) {
    return cachedToken;
  }

  const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
  const body = 'grant_type=client_credentials';

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: PAYPAL_BASE_URL,
      path: '/v1/oauth2/token',
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
        'Accept': 'application/json'
      }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.access_token) {
            cachedToken = parsed.access_token;
            tokenExpiry = Date.now() + ((parsed.expires_in || 3600) - 60) * 1000;
            resolve(cachedToken);
          } else {
            reject(new Error(parsed.error_description || 'PayPal token failed'));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

/**
 * Sends a POST action to a subscription endpoint.
 */
async function sendSubscriptionAction(subscriptionId, action, reason) {
  if (!isConfigured()) {
    // Simulator Mode for local hackathon demo
    console.log(`[PayPal Simulator] Subscription ${subscriptionId} -> ${action.toUpperCase()} (${reason})`);
    return {
      success: true,
      mode: 'sandbox_simulation',
      subscriptionId,
      action,
      timestamp: new Date().toISOString()
    };
  }

  const token = await getAccessToken();
  const payload = JSON.stringify({ reason: reason || 'Action via Churn Guard' });

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: PAYPAL_BASE_URL,
      path: `/v1/billing/subscriptions/${encodeURIComponent(subscriptionId)}/${action}`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'Accept': 'application/json'
      }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        // PayPal returns 204 No Content on success for suspend/cancel/activate
        if (res.statusCode === 204 || res.statusCode === 200) {
          resolve({
            success: true,
            mode: 'live_paypal_api',
            statusCode: res.statusCode,
            subscriptionId,
            action
          });
        } else {
          try {
            const errJson = JSON.parse(data);
            reject(new Error(errJson.message || `PayPal API responded with status ${res.statusCode}`));
          } catch {
            reject(new Error(`PayPal API HTTP error: ${res.statusCode}`));
          }
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

/**
 * Pauses a recurring subscription through PayPal.
 */
async function pauseSubscription(subscriptionId, reason = 'Paused via Churn Guard') {
  return sendSubscriptionAction(subscriptionId, 'suspend', reason);
}

/**
 * Cancels a recurring subscription through PayPal.
 */
async function cancelSubscription(subscriptionId, reason = 'Cancelled via Churn Guard to eliminate waste') {
  return sendSubscriptionAction(subscriptionId, 'cancel', reason);
}

/**
 * Re-activates/undos a previously paused subscription through PayPal.
 */
async function activateSubscription(subscriptionId, reason = 'Restored via Churn Guard') {
  return sendSubscriptionAction(subscriptionId, 'activate', reason);
}

module.exports = {
  isConfigured,
  getAccessToken,
  pauseSubscription,
  cancelSubscription,
  activateSubscription
};
