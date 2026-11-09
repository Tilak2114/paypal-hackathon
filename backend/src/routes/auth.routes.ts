import { Router } from 'express';
import { z } from 'zod';
import { authService } from '../services/auth.service.js';

const router = Router();

const LoginBodySchema = z.object({
  email: z.string().email().optional(),
  password: z.string().optional(),
});

router.post('/login', (req, res, next) => {
  try {
    const { email, password } = LoginBodySchema.parse(req.body);
    const result = authService.login(email, password);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;

