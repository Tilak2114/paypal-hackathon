import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/index.js';
import { logger } from '../logger.js';
import { EventPayload } from '../contract.js';

interface Client {
  id: string;
  res: Response;
}

class EventService {
  private clients: Client[] = [];

  addClient(res: Response): string {
    const clientId = uuidv4();
    this.clients.push({ id: clientId, res });

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    res.write(`data: ${JSON.stringify({ event: 'connected', clientId })}\n\n`);

    res.on('close', () => {
      this.removeClient(clientId);
    });

    logger.info({ clientId, totalClients: this.clients.length }, 'SSE Client connected');
    return clientId;
  }

  removeClient(clientId: string) {
    this.clients = this.clients.filter((c) => c.id !== clientId);
    logger.info({ clientId, remainingClients: this.clients.length }, 'SSE Client disconnected');
  }

  emit(eventType: 'subscription_updated' | 'alert_created' | 'webhook_received', data: any) {
    const payload: EventPayload = {
      event: eventType,
      data,
      timestamp: new Date().toISOString(),
    };

    // Save event to DB
    try {
      const db = getDb();
      db.prepare(`
        INSERT INTO events (id, event_type, payload, created_at)
        VALUES (?, ?, ?, ?)
      `).run(uuidv4(), eventType, JSON.stringify(data), payload.timestamp);
    } catch (err) {
      logger.error({ err }, 'Failed to persist event to SQLite');
    }

    // Broadcast to SSE clients
    const message = `event: ${eventType}\ndata: ${JSON.stringify(payload)}\n\n`;
    for (const client of this.clients) {
      try {
        client.res.write(message);
      } catch (err) {
        logger.warn({ clientId: client.id, err }, 'Failed writing to SSE client, removing');
        this.removeClient(client.id);
      }
    }

    logger.debug({ eventType, activeClients: this.clients.length }, 'Broadcasted SSE event');
  }
}

export const eventService = new EventService();

