import { v4 as uuidv4 } from 'uuid';
import { getDb, mapRowToAlert } from '../db/index.js';
import { Alert, CreateAlertInput } from '../contract.js';
import { eventService } from './event.service.js';
import { AppError } from './subscription.service.js';

export class AlertService {
  async getAlerts(unreadOnly = false): Promise<Alert[]> {
    const db = getDb();
    let query = 'SELECT * FROM alerts';
    if (unreadOnly) {
      query += ' WHERE read = 0';
    }
    query += ' ORDER BY created_at DESC';

    const rows = db.prepare(query).all();
    return rows.map(mapRowToAlert);
  }

  async createAlert(data: CreateAlertInput): Promise<Alert> {
    const db = getDb();
    const id = `alert-${uuidv4().substring(0, 8)}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO alerts (id, subscription_id, type, severity, message, recommendation, reason, created_at, read)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      data.subscriptionId,
      data.type,
      data.severity,
      data.message,
      data.recommendation,
      data.reason,
      now,
      data.read ? 1 : 0
    );

    const alert: Alert = {
      id,
      subscriptionId: data.subscriptionId,
      type: data.type,
      severity: data.severity,
      message: data.message,
      recommendation: data.recommendation,
      reason: data.reason,
      createdAt: now,
      read: Boolean(data.read),
    };

    eventService.emit('alert_created', alert);
    return alert;
  }

  async createManyAlerts(inputs: CreateAlertInput[]): Promise<Alert[]> {
    const created: Alert[] = [];
    for (const input of inputs) {
      const alert = await this.createAlert(input);
      created.push(alert);
    }
    return created;
  }

  async markAsRead(id: string): Promise<Alert> {
    const db = getDb();
    const existing = db.prepare('SELECT * FROM alerts WHERE id = ?').get(id);
    if (!existing) {
      throw new AppError(404, 'NOT_FOUND', `Alert with id ${id} not found.`);
    }

    db.prepare('UPDATE alerts SET read = 1 WHERE id = ?').run(id);
    const updated = db.prepare('SELECT * FROM alerts WHERE id = ?').get(id);
    return mapRowToAlert(updated);
  }
}

export const alertService = new AlertService();

