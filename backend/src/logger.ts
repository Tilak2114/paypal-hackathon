import pino from 'pino';
import { config } from './config.js';

export const logger = pino({
  level: config.NODE_ENV === 'test' ? 'silent' : 'info',
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers["paypal-auth-algo"]',
      'req.headers["paypal-cert-url"]',
      'req.headers["paypal-transmission-sig"]',
      'password',
      'client_secret',
      'PAYPAL_CLIENT_SECRET',
      'access_token',
      'token',
      'jwt',
      'secret',
      '*.password',
      '*.client_secret',
      '*.access_token',
      '*.token',
      '*.secret',
    ],
    censor: '[REDACTED_SECRET]',
  },
  transport:
    config.NODE_ENV !== 'production'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            ignore: 'pid,hostname',
            translateTime: 'SYS:standard',
          },
        }
      : undefined,
});

