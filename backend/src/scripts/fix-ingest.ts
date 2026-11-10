import { getDb } from '../db/index.js';

const db = getDb();
const res = db.prepare(`
  UPDATE subscriptions 
  SET source = 'paypal', 
      managed_by_paypal = 1, 
      paypal_subscription_id = 'I-PP-' || substr(id, 12),
      status = 'ACTIVE'
  WHERE id LIKE 'sub-ingest-%'
`).run();

console.log('Successfully updated sub-ingest rows to PayPal-managed:', res.changes);
