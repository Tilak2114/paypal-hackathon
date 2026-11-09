import { Request, Response, NextFunction } from 'express';
import { authService, DEMO_USER_ID, TokenPayload } from '../services/auth.service.js';
import { config } from '../config.js';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (token) {
    try {
      const payload = authService.verifyToken(token);
      req.user = payload;
      return next();
    } catch (err) {
      // If DEMO_MODE is active, gracefully fall back to demo user
      if (config.DEMO_MODE) {
        req.user = {
          userId: DEMO_USER_ID,
          email: config.DEMO_USER_EMAIL,
          demoMode: true,
        };
        return next();
      }
      return res.status(401).json({
        error: {
          code: 'INVALID_TOKEN',
          message: 'Supplied authentication token is invalid or expired.',
        },
      });
    }
  }

  // If no token was passed
  if (config.DEMO_MODE) {
    req.user = {
      userId: DEMO_USER_ID,
      email: config.DEMO_USER_EMAIL,
      demoMode: true,
    };
    return next();
  }

  return res.status(401).json({
    error: {
      code: 'UNAUTHORIZED',
      message: 'Authentication bearer token is required in production mode.',
    },
  });
}

