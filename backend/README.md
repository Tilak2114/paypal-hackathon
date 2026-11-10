# 🛡️ Sentinel — Backend API & PayPal Subscriptions Service

Sentinel is an automated subscription auditing and one-tap cancellation service built for the PayPal AI Hackathon 2026. This service manages persistent subscription state in SQLite, interfaces directly with the **PayPal Subscriptions REST API (Sandbox Mode)** to pause, cancel, and reactivate recurring billing profiles, and processes real-time PayPal webhooks.

---

## 🏗️ Architecture & Tech Stack

- **Runtime**: Node.js (v18+) with Express
- **Database**: SQLite with synchronous driver (`better-sqlite3` with auto-fallback to built-in `node:sqlite`)
- **Payment Gateway**: PayPal Subscriptions v1 REST API (`https://api-m.sandbox.paypal.com`)
- **Security**: Strict CORS policy, IP rate limiting, input validation, webhook cryptographic signature verification
- **Reliability**: Dual-mode engine with `DEMO_MODE=true` zero-network simulator fallback

---

## 📁 Directory Structure

```text
backend/
├── .env.example              # Template for environment variables (never committed)
├── .gitignore                # Ignores .env, node_modules, and *.db files
├── db.js                     # SQLite database initialization & helper queries
├── package.json              # Express, CORS, Dotenv, and Better-SQLite3
├── paypal.js                 # PayPal Sandbox OAuth, Suspend, Cancel, Reactivate, & Webhooks
├── README.md                 # Complete documentation, curl examples, and deployment
├── server.js                 # Express server with rate limiting, logging, and routing
├── routes/
│   ├── subscriptions.js      # /subscriptions (GET, POST, pause, cancel, undo)
│   ├── analyze.js            # /analyze (statement text parser placeholder for Person C)
│   └── webhooks.js           # /webhooks/paypal (PayPal webhook verification & sync)
└── scripts/
    └── seed.js               # npm run seed (initializes the 6 demo subscriptions)
```

---

## 🔑 1. How to Get PayPal Sandbox Credentials

1. Log in to the [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/).
2. Navigate to **Apps & Credentials** and ensure the toggle is set to **Sandbox**.
3. Under **REST API Apps**, click **Create App**:
   - App Name: `Sentinel Subscription Guard`
   - App Type: `Merchant`
4. Copy your **Client ID** and **Secret Key**.
5. *(Optional for Webhooks)* In your App settings, scroll to **SandBox Webhooks**, click **Add Webhook**, enter your public endpoint URL (e.g. `https://your-domain.com/webhooks/paypal`), select `All events` or specifically:
   - `Billing subscription cancelled`
   - `Billing subscription suspended`
   - `Billing subscription re-activated`
   Copy the generated **Webhook ID**.

---

## ⚙️ 2. Configuration (`.env`)

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env`:

```ini
PORT=3000
FRONTEND_URL=http://localhost:5173
DATABASE_PATH=./sentinel.db

# Set to true for instant offline demo mode; set to false for live PayPal Sandbox
DEMO_MODE=true

# PayPal Sandbox Credentials
PAYPAL_CLIENT_ID=your_sandbox_client_id_here
PAYPAL_CLIENT_SECRET=your_sandbox_client_secret_here
PAYPAL_BASE_URL=https://api-m.sandbox.paypal.com
PAYPAL_WEBHOOK_ID=your_webhook_id_here
```

---

## 🚀 3. Quickstart & Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Seed SQLite database with the 6 sample subscriptions
npm run seed

# 3. Start development server (with live auto-reload)
npm run dev

# Or start in standard production mode
npm start
```

The server will bind to `http://localhost:3000`.

---

## 📡 4. Exact Contract Shape (Shared with Frontend)

Every subscription object strictly matches this format:

```json
{
  "id": "sub-tunewave",
  "name": "TuneWave",
  "cost": 149,
  "currency": "INR",
  "lastUsed": "52 days ago",
  "status": "active",
  "flag": "overlap",
  "suggestion": "Overlaps with TuneBox. Cancel to save ₹1,788/yr",
  "paypalSubscriptionId": "I-TWAV3003003"
}
```

- `status`: `"active"` | `"paused"` | `"cancelled"`
- `flag`: `null` | `"overlap"` | `"unused"` | `"trial_ending"` | `"price_increase"`

---

## 🧪 5. cURL Examples for Every Route

### 1. Health Check
```bash
curl -X GET http://localhost:3000/health
```
**Response (200 OK):**
```json
{ "ok": true, "service": "Sentinel API", "timestamp": "2026-11-10T18:41:58.704Z" }
```

---

### 2. List All Subscriptions
```bash
curl -X GET http://localhost:3000/subscriptions
```
**Response (200 OK):**
```json
{
  "ok": true,
  "subscriptions": [
    {
      "id": "sub-streamly",
      "name": "Streamly",
      "cost": 499,
      "currency": "INR",
      "lastUsed": "3 days ago",
      "status": "active",
      "flag": null,
      "suggestion": "Regular streaming activity detected",
      "paypalSubscriptionId": "I-STRM1001001"
    },
    {
      "id": "sub-tunewave",
      "name": "TuneWave",
      "cost": 149,
      "currency": "INR",
      "lastUsed": "52 days ago",
      "status": "active",
      "flag": "overlap",
      "suggestion": "Overlaps with TuneBox. Cancel to save ₹1,788/yr",
      "paypalSubscriptionId": "I-TWAV3003003"
    }
  ]
}
```

---

### 3. Add a New Subscription
```bash
curl -X POST http://localhost:3000/subscriptions \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Duolingo Plus",
    "cost": 399,
    "currency": "INR",
    "lastUsed": "12 days ago",
    "flag": "unused",
    "suggestion": "Practice streak stopped"
  }'
```
**Response (201 Created):**
```json
{
  "ok": true,
  "subscription": {
    "id": "sub_1794336199255_e30r",
    "name": "Duolingo Plus",
    "cost": 399,
    "currency": "INR",
    "lastUsed": "12 days ago",
    "status": "active",
    "flag": "unused",
    "suggestion": "Practice streak stopped",
    "paypalSubscriptionId": null
  }
}
```

---

### 4. Pause a Subscription
```bash
curl -X POST http://localhost:3000/subscriptions/sub-tunewave/pause \
  -H "Content-Type: application/json" \
  -d '{"reason": "Testing pause"}'
```
**Response (200 OK):**
```json
{
  "ok": true,
  "subscription": {
    "id": "sub-tunewave",
    "name": "TuneWave",
    "cost": 149,
    "currency": "INR",
    "lastUsed": "52 days ago",
    "status": "paused",
    "flag": "overlap",
    "suggestion": "Overlaps with TuneBox. Cancel to save ₹1,788/yr",
    "paypalSubscriptionId": "I-TWAV3003003"
  }
}
```

---

### 5. Cancel a Subscription
```bash
curl -X POST http://localhost:3000/subscriptions/sub-tunewave/cancel \
  -H "Content-Type: application/json" \
  -d '{"reason": "Cancelled via Sentinel"}'
```
**Response (200 OK):**
```json
{
  "ok": true,
  "subscription": {
    "id": "sub-tunewave",
    "name": "TuneWave",
    "cost": 149,
    "currency": "INR",
    "lastUsed": "52 days ago",
    "status": "cancelled",
    "flag": "overlap",
    "suggestion": "Overlaps with TuneBox. Cancel to save ₹1,788/yr",
    "paypalSubscriptionId": "I-TWAV3003003"
  }
}
```

---

### 6. Undo (Reactivate) a Subscription
```bash
curl -X POST http://localhost:3000/subscriptions/sub-tunewave/undo \
  -H "Content-Type: application/json" \
  -d '{"reason": "Reactivated via Sentinel"}'
```
**Response (200 OK):**
```json
{
  "ok": true,
  "subscription": {
    "id": "sub-tunewave",
    "name": "TuneWave",
    "cost": 149,
    "currency": "INR",
    "lastUsed": "52 days ago",
    "status": "active",
    "flag": "overlap",
    "suggestion": "Overlaps with TuneBox. Cancel to save ₹1,788/yr",
    "paypalSubscriptionId": "I-TWAV3003003"
  }
}
```

---

### 7. Analyze Statement Text (Person C AI Placeholder)
```bash
curl -X POST http://localhost:3000/analyze \
  -H "Content-Type: application/json" \
  -d '{"text": "Pasted bank or PayPal billing statement transactions..."}'
```
**Response (200 OK):**
```json
{
  "ok": true,
  "subscriptions": [
    {
      "id": "sub_streamly",
      "name": "Streamly",
      "cost": 499,
      "currency": "INR",
      "lastUsed": "3 days ago",
      "status": "active",
      "flag": null,
      "suggestion": "Regular streaming activity detected",
      "paypalSubscriptionId": "I-STRM1001001"
    }
  ],
  "source": "placeholder_ai"
}
```

---

### 8. PayPal Webhook Simulation
```bash
curl -X POST http://localhost:3000/webhooks/paypal \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "BILLING.SUBSCRIPTION.SUSPENDED",
    "resource": {
      "id": "I-STRM1001001"
    }
  }'
```
**Response (200 OK):**
```json
{
  "ok": true,
  "eventType": "BILLING.SUBSCRIPTION.SUSPENDED",
  "subscription": {
    "id": "sub-streamly",
    "name": "Streamly",
    "cost": 499,
    "status": "paused"
  }
}
```

---

## 🤝 6. Guide for Person A (Frontend Integration)

All responses follow a predictable JSON envelope:
- **Success**: `{ ok: true, subscription: { ... } }` or `{ ok: true, subscriptions: [ ... ] }`
- **Failure**: `{ ok: false, error: "Friendly message for UI banner or toast" }`

### Frontend Client Helper Example (`fetch`):
```javascript
const API_BASE = 'http://localhost:3000';

export async function pauseSubscription(id) {
  const res = await fetch(`${API_BASE}/subscriptions/${id}/pause`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason: 'Paused in Sentinel' }),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error);
  return data.subscription;
}
```

---

## ☁️ 7. Deployment Steps

### Deploying to Render
1. Create a **Web Service** on Render and connect your GitHub repository.
2. Configure settings:
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run seed`
   - **Start Command**: `npm start`
3. Add Environment Variables in the Render dashboard:
   - `PORT`: `3000`
   - `FRONTEND_URL`: `https://your-frontend-domain.vercel.app`
   - `DEMO_MODE`: `false` (or `true` if presenting offline)
   - `PAYPAL_CLIENT_ID`: `your_sandbox_client_id`
   - `PAYPAL_SECRET`: `your_sandbox_secret`
   - `PAYPAL_BASE_URL`: `https://api-m.sandbox.paypal.com`
4. Add a **Render Persistent Disk** mounted at `/data` and set `DATABASE_PATH=/data/sentinel.db` so subscriptions persist across deployments.

### Deploying to Railway
1. Click **New Project** -> **Deploy from GitHub repo**.
2. Set the root directory to `backend`.
3. In Service Settings -> Variables, add your environment variables (`PORT`, `FRONTEND_URL`, `DEMO_MODE`, `PAYPAL_CLIENT_ID`, `PAYPAL_SECRET`, etc.).
4. In Service Settings -> Deploy:
   - Build Command: `npm install && npm run seed`
   - Start Command: `npm start`
5. *(Optional)* Add a Railway Volume mounted to `/app/data` and configure `DATABASE_PATH=/app/data/sentinel.db`.
