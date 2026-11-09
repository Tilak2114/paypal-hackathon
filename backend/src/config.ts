import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env
dotenv.config();

const ConfigSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.string().default('development'),
  PUBLIC_BASE_URL: z.string().default('http://localhost:3000'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  DATABASE_PATH: z.string().default('./data/churnguard.db'),
  DEMO_MODE: z
    .string()
    .default('true')
    .transform((val) => val === 'true' || val === '1'),
  JWT_SECRET: z.string().default('churnguard-hackathon-default-jwt-secret'),
  DEMO_USER_EMAIL: z.string().default('demo@churnguard.local'),
  DEMO_USER_PASSWORD: z.string().default('demopassword'),
  PAYPAL_ENV: z.string().default('sandbox'),
  MOCK_PAYPAL: z
    .string()
    .default('true')
    .transform((val) => val === 'true' || val === '1'),
  PAYPAL_CLIENT_ID: z.string().optional().default(''),
  PAYPAL_CLIENT_SECRET: z.string().optional().default(''),
  PAYPAL_WEBHOOK_ID: z.string().optional().default(''),
});

const parsed = ConfigSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('CRITICAL: Configuration validation failed:', parsed.error.format());
  process.exit(1);
}

export const config = parsed.data;

// HARD SAFETY CHECK: Refuse to start if PAYPAL_ENV is not "sandbox"
if (config.PAYPAL_ENV.toLowerCase() !== 'sandbox') {
  console.error(
    `FATAL HARD SAFETY VIOLATION: PAYPAL_ENV is set to "${config.PAYPAL_ENV}". Only "sandbox" is permitted. Refusing to start.`
  );
  process.exit(1);
}

// Check real PayPal credentials if MOCK_PAYPAL is false
if (!config.MOCK_PAYPAL) {
  if (!config.PAYPAL_CLIENT_ID || !config.PAYPAL_CLIENT_SECRET) {
    console.error(
      'CRITICAL: MOCK_PAYPAL is set to false, but PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET are not provided.'
    );
    process.exit(1);
  }
}
