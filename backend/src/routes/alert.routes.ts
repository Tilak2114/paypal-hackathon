import { Router } from 'express';
import { z } from 'zod';
import { alertService } from '../services/alert.service.js';
import { CreateAlertSchema } from '../contract.js';

const router = Router();

// GET /api/alerts
router.get('/', async (req, res, next) => {
  try {
    const unreadOnly = req.query.unread === 'true';
    const alerts = await alertService.getAlerts(unreadOnly);
    res.json(alerts);
  } catch (err) {
    next(err);
  }
});

// POST /api/alerts (Person C posts alerts)
router.post('/', async (req, res, next) => {
  try {
    if (Array.isArray(req.body)) {
      const inputs = z.array(CreateAlertSchema).parse(req.body);
      const created = await alertService.createManyAlerts(inputs);
      return res.status(201).json(created);
    }
    const input = CreateAlertSchema.parse(req.body);
    const created = await alertService.createAlert(input);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

// POST /api/alerts/:id/read
router.post('/:id/read', async (req, res, next) => {
  try {
    const alert = await alertService.markAsRead(req.params.id);
    res.json({ success: true, alert });
  } catch (err) {
    next(err);
  }
});

export default router;

