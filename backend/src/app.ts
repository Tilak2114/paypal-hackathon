import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config.js';
import { logger } from './logger.js';
import { apiRateLimiter } from './middleware/rate-limiter.js';
import { authMiddleware } from './middleware/auth.middleware.js';
import { errorHandler } from './middleware/error.middleware.js';

// Route imports
import healthRouter from './routes/health.routes.js';
import authRouter from './routes/auth.routes.js';
import eventRouter from './routes/event.routes.js';
import webhookRouter from './routes/webhook.routes.js';
import demoRouter from './routes/demo.routes.js';
import subscriptionRouter from './routes/subscription.routes.js';
import ingestRouter from './routes/ingest.routes.js';
import alertRouter from './routes/alert.routes.js';
import analyzeRouter from './routes/analyze.routes.js';

export function createApp() {
  const app = express();

  // Security Headers
  app.use(helmet());

  // CORS Configuration
  const allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ];
  if (config.CORS_ORIGIN && !allowedOrigins.includes(config.CORS_ORIGIN)) {
    allowedOrigins.push(config.CORS_ORIGIN);
  }

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, server-to-server, webhooks)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin) || origin.startsWith('http://localhost:')) {
          return callback(null, true);
        }
        return callback(null, true); // Permissive in hackathon sandbox dev
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'PayPal-Request-Id'],
    })
  );

  // Body parsers
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request logger
  app.use((req, res, next) => {
    logger.debug({ method: req.method, path: req.path }, 'Incoming request');
    next();
  });

  // Rate Limiting
  app.use('/api/', apiRateLimiter);

  // Unprotected / Public routes
  app.use('/api/health', healthRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/events', eventRouter);
  app.use('/api/webhooks', webhookRouter);
  app.use('/api/demo', demoRouter);

  // Protected application routes
  app.use('/api/subscriptions', authMiddleware, subscriptionRouter);
  app.use('/api/ingest', authMiddleware, ingestRouter);
  app.use('/api/alerts', authMiddleware, alertRouter);
  app.use('/api/analyze', authMiddleware, analyzeRouter);

  // Friendly aliases for frontend integration without /api prefix
  app.use('/subscriptions', authMiddleware, subscriptionRouter);
  app.use('/alerts', authMiddleware, alertRouter);
  app.use('/analyze', authMiddleware, analyzeRouter);
  app.use('/events', eventRouter);
  app.use('/health', healthRouter);

  // 404 Handler
  app.use((req, res) => {
    res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: `Endpoint ${req.method} ${req.path} not found`,
      },
    });
  });

  // Global Error Handler
  app.use(errorHandler);

  return app;
}

