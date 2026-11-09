# Churn Guard Backend (PayPal AI Hackathon 2026)

Smart Subscription & Churn Guard backend service built with Node.js, TypeScript, Express, SQLite (`better-sqlite3`), and PayPal Subscriptions v1 integration.

---

## ⚡ Quick Start (Ready for Person A & Person C)

The backend defaults to **MOCK_PAYPAL=true** and **DEMO_MODE=true**, meaning it runs immediately without needing PayPal developer credentials, API keys, or logins.

```bash
cd backend
npm install
npm run seed       # Populates realistic demo subscriptions and alerts
npm run dev        # Launches server at http://localhost:3000
```

Verify everything is working:
```bash
npm run test:smoke # Executes 16 automated end-to-end smoke tests
```

---

## 🛡️ Hard Safety Rules Enforced in Code

1. **PayPal SANDBOX ONLY**:
   - Base URL: `https://api-m.sandbox.paypal.com`.
   - The server **strictly refuses to start** if `PAYPAL_ENV` is not `"sandbox"`.
2. **Never Log Secrets**:
   - `pino` logger is configured with strict redaction paths covering client secrets, access tokens, auth headers, and webhook cryptographic keys.
3. **Idempotency**:
   - Every state-changing PayPal POST request automatically generates and attaches a unique `PayPal-Request-Id` UUID header.
4. **Cancellation Safety**:
   - Cancellation is irreversible: `POST /api/subscriptions/:id/cancel` strictly enforces `{ "confirm": true }` in the request body.
5. **Audit-Only Protection**:
   - Subscriptions from raw bank statements (`source: "external"`) cannot be modified via PayPal; any pause/resume/cancel/downgrade attempt returns `409 Conflict` with `"Audit only - not managed through PayPal"`.

---

## 🔄 Two Operating Modes

| Mode | Environment | Description |
|---|---|---|
| **MOCK MODE** (Default) | `MOCK_PAYPAL=true` | Uses an in-memory realistic fake PayPal client matching the live REST interface and state machine (`ACTIVE` &rarr; `SUSPENDED` &rarr; `ACTIVE`, `CANCELLED` terminal state). No network requests needed. Frontend and AI teammates can develop without interruption. |
| **REAL SANDBOX MODE** | `MOCK_PAYPAL=false` | Connects directly to `https://api-m.sandbox.paypal.com`. Uses OAuth2 client credentials with token caching and proactive refresh ~60s before expiry. Automatic 401 retry, product creation, plan creation, and buyer approval flows. |

---

## 📁 Project Structure

```
backend/
├── .env.example              # Template environment variables
├── package.json              # Scripts: dev, seed, sync, test:smoke, build
├── tsconfig.json             # TypeScript ES2022 NodeNext configuration
├── docs/
│   ├── contract.md           # Shared Data Contract for Persons A, B, and C
│   └── openapi.yaml          # Complete OpenAPI 3.0 specification
├── src/
│   ├── contract.ts           # Zod schemas & TypeScript types (Subscription, Alert, etc.)
│   ├── config.ts             # Strict environment validation (refuses non-sandbox)
│   ├── logger.ts             # Pino logger with secret redaction
│   ├── server.ts             # Server entry point
│   ├── app.ts                # Express app, helmet, CORS, rate-limiter, routes
│   ├── db/
│   │   └── index.ts          # better-sqlite3 SQLite instance and schema migration
│   ├── paypal/
│   │   ├── types.ts          # PayPal Subscriptions v1 types
│   │   ├── client-interface.ts # IPayPalClient unified interface
│   │   ├── mock-client.ts    # In-memory realistic fake PayPal client
│   │   ├── real-client.ts    # Real PayPal Sandbox client (OAuth2, idempotency)
│   │   └── index.ts          # Client factory
│   ├── services/
│   │   ├── auth.service.ts   # JWT and DEMO_MODE bypass
│   │   ├── subscription.service.ts # Core logic, cache, external audit-only rule
│   │   ├── alert.service.ts  # Alerts management
│   │   ├── event.service.ts  # Server-Sent Events (SSE) broadcaster
│   │   └── webhook.service.ts# Webhook signature verification, dedupe, & alerts
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── subscription.routes.ts
│   │   ├── alert.routes.ts
│   │   ├── ingest.routes.ts  # For Person C statement parser
│   │   ├── event.routes.ts   # GET /api/events (SSE)
│   │   ├── webhook.routes.ts # POST /api/webhooks/paypal
│   │   ├── demo.routes.ts    # POST /api/demo/reset
│   │   └── health.routes.ts
│   └── scripts/
│       ├── seed.ts           # npm run seed
│       ├── sync.ts           # npm run sync
│       └── smoke-test.ts     # npm run test:smoke
```

---

## 📜 Available NPM Scripts

| Command | Action |
|---|---|
| `npm run dev` | Starts server in watch mode using `tsx` at `http://localhost:3000`. |
| `npm run seed` | In MOCK mode: seeds ~7 realistic subscriptions (music overlap, video price increase, gym unused 74 days, notes trial ending, external audit-only items) and alerts. In REAL mode: creates PayPal Catalog Product, Plans, Subscriptions, and outputs browser approval URLs. |
| `npm run sync` | Iterates over all PayPal-managed subscriptions in the DB, queries PayPal Sandbox, and synchronizes status and next billing time. |
| `npm run test:smoke` | Executes 16 automated end-to-end integration tests (Health, Auth, Reset, Subscriptions CRUD, 409 Audit-Only check, 400 Cancel confirmation check, Ingest, Alerts, Webhooks, and Deduplication). |
| `npm run build` | Compiles TypeScript source to `./dist`. |

---

## 🔌 Switching to Real PayPal Sandbox Mode

To switch from Mock mode to live PayPal Sandbox calls:

1. Create a Sandbox App in your [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/applications/sandbox).
2. Open `backend/.env` and update:
   ```env
   MOCK_PAYPAL=false
   PAYPAL_ENV=sandbox
   PAYPAL_CLIENT_ID=<Your_Sandbox_Client_Id>
   PAYPAL_CLIENT_SECRET=<Your_Sandbox_Client_Secret>
   PAYPAL_WEBHOOK_ID=<Your_Sandbox_Webhook_Id>
   ```
3. Run `npm run seed` to provision your sandbox product, subscription plans, and print buyer approval URLs.
4. Run `npm run sync` to check active billing statuses.

