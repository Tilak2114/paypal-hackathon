import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { getDb } from '../db/index.js';
import { logger } from '../logger.js';

export const DEMO_USER_ID = 'user-demo-churn-guard';

export interface TokenPayload {
  userId: string;
  email: string;
  demoMode: boolean;
}

export class AuthService {
  constructor() {
    this.ensureDemoUserExists();
  }

  ensureDemoUserExists() {
    try {
      const db = getDb();
      const existing = db.prepare('SELECT id FROM users WHERE id = ?').get(DEMO_USER_ID);
      if (!existing) {
        db.prepare(`
          INSERT INTO users (id, email, password_hash, created_at)
          VALUES (?, ?, ?, ?)
        `).run(
          DEMO_USER_ID,
          config.DEMO_USER_EMAIL,
          'plaintext-dev-hash-demo', // Dev demo account
          new Date().toISOString()
        );
        logger.info({ userId: DEMO_USER_ID }, 'Created default demo user');
      }
    } catch (err) {
      logger.error({ err }, 'Error ensuring demo user exists');
    }
  }

  login(email?: string, password?: string): { token: string; user: { id: string; email: string } } {
    // In DEMO_MODE, bypass credential check if requested or matches demo
    if (config.DEMO_MODE) {
      const token = this.generateToken(DEMO_USER_ID, config.DEMO_USER_EMAIL);
      return {
        token,
        user: { id: DEMO_USER_ID, email: config.DEMO_USER_EMAIL },
      };
    }

    if (!email || !password) {
      throw new Error('Email and password required');
    }

    if (email === config.DEMO_USER_EMAIL && password === config.DEMO_USER_PASSWORD) {
      const token = this.generateToken(DEMO_USER_ID, email);
      return {
        token,
        user: { id: DEMO_USER_ID, email },
      };
    }

    throw new Error('Invalid email or password');
  }

  generateToken(userId: string, email: string): string {
    const payload: TokenPayload = {
      userId,
      email,
      demoMode: config.DEMO_MODE,
    };
    return jwt.sign(payload, config.JWT_SECRET, { expiresIn: '7d' });
  }

  verifyToken(token: string): TokenPayload {
    return jwt.verify(token, config.JWT_SECRET) as TokenPayload;
  }
}

export const authService = new AuthService();

