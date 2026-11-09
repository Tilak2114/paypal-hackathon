import { Router } from 'express';
import { eventService } from '../services/event.service.js';

const router = Router();

// GET /api/events (SSE stream)
router.get('/', (req, res) => {
  eventService.addClient(res);
});

export default router;

