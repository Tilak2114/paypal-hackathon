// backend/server.js
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const subscriptionsRoute = require('./routes/subscriptions');
const analyzeRoute = require('./routes/analyze');
const webhooksRoute = require('./routes/webhooks');

const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// ── 1. Security & CORS Configuration ──────────────────────────────
const allowedOrigins = [
  FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like curl, Postman, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.some((allowed) => origin.startsWith(allowed))) {
      return callback(null, true);
    }
    // In development or demo mode, allow all origins
    if (process.env.DEMO_MODE === 'true' || process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// ── 2. Request Parsers (Capturing rawBody for PayPal Webhooks) ──────
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf.toString('utf8');
  },
}));
app.use(express.urlencoded({ extended: true }));

// ── 3. Basic In-Memory Rate Limiter ────────────────────────────────
const rateLimitWindowMs = 60 * 1000; // 1 minute
const rateLimitMax = 200; // 200 requests per minute per IP
const requestCounts = new Map();

app.use((req, res, next) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const entry = requestCounts.get(ip) || { count: 0, resetTime: now + rateLimitWindowMs };

  if (now > entry.resetTime) {
    entry.count = 1;
    entry.resetTime = now + rateLimitWindowMs;
  } else {
    entry.count++;
  }

  requestCounts.set(ip, entry);

  if (entry.count > rateLimitMax) {
    return res.status(429).json({
      ok: false,
      error: 'Too many requests. Rate limit exceeded, please retry in a moment.',
    });
  }

  next();
});

// Periodic cleanup of rate limiter map
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of requestCounts.entries()) {
    if (now > entry.resetTime) {
      requestCounts.delete(ip);
    }
  }
}, 5 * 60 * 1000).unref();

// ── 4. Logging Middleware ──────────────────────────────────────────
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[HTTP] ${req.method} ${req.originalUrl} ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// ── 5. Health Check ────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'Sentinel API', timestamp: new Date().toISOString() });
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'Sentinel API', timestamp: new Date().toISOString() });
});

// ── 6. Mount API Routes ────────────────────────────────────────────
// Mount routes at both root and /api for compatibility with Person A's frontend
app.use('/subscriptions', subscriptionsRoute);
app.use('/api/subscriptions', subscriptionsRoute);

app.use('/analyze', analyzeRoute);
app.use('/api/analyze', analyzeRoute);

app.use('/webhooks', webhooksRoute);
app.use('/api/webhooks', webhooksRoute);

// ── 7. 404 Handler ─────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    ok: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ── 8. Global Error Handler ────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[Server Unhandled Error]', err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    ok: false,
    error: err.message || 'Internal server error occurred.',
  });
});

// ── 9. Start Server ────────────────────────────────────────────────
const server = app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`  🛡️  SENTINEL BACKEND RUNNING ON PORT ${PORT}`);
  console.log(`  Mode: ${process.env.DEMO_MODE === 'true' ? 'DEMO MODE (Simulated PayPal)' : 'REAL PAYPAL SANDBOX'}`);
  console.log(`  Base URL: http://localhost:${PORT}`);
  console.log(`  Health Check: http://localhost:${PORT}/health`);
  console.log(`====================================================`);
});

// Graceful termination
process.on('SIGINT', () => {
  console.log('Stopping Sentinel API server...');
  server.close(() => process.exit(0));
});

process.on('SIGTERM', () => {
  console.log('Terminating Sentinel API server...');
  server.close(() => process.exit(0));
});

module.exports = app;
