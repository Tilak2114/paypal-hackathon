import { config } from '../config.js';
import type { IPayPalClient } from './client-interface.js';
import { MockPayPalClient, PayPalApiError } from './mock-client.js';
import { RealPayPalClient } from './real-client.js';
import { logger } from '../logger.js';

let clientInstance: IPayPalClient | null = null;

export function getPayPalClient(): IPayPalClient {
  if (clientInstance) return clientInstance;

  if (config.MOCK_PAYPAL) {
    logger.info('Initializing MOCK PayPal client (in-memory simulator)');
    clientInstance = new MockPayPalClient();
  } else {
    logger.info('Initializing REAL PayPal Sandbox client');
    clientInstance = new RealPayPalClient();
  }

  return clientInstance;
}

export type { IPayPalClient };
export { MockPayPalClient, RealPayPalClient, PayPalApiError };
