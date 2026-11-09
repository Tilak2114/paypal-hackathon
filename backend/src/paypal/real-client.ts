import { v4 as uuidv4 } from 'uuid';
import type { IPayPalClient } from './client-interface.js';
import {
  PayPalProductRequest,
  PayPalProductResponse,
  PayPalPlanRequest,
  PayPalPlanResponse,
  PayPalSubscriptionCreateRequest,
  PayPalSubscriptionDetailResponse,
  PayPalReviseRequest,
  PayPalReviseResponse,
  PayPalTransactionsResponse,
  WebhookVerifyRequest,
  WebhookVerifyResponse,
} from './types.js';
import { config } from '../config.js';
import { logger } from '../logger.js';
import { PayPalApiError } from './mock-client.js';

interface CachedToken {
  accessToken: string;
  expiresAt: number; // timestamp in ms
}

export class RealPayPalClient implements IPayPalClient {
  public readonly mode = 'real' as const;
  private readonly baseUrl = 'https://api-m.sandbox.paypal.com';
  private cachedToken: CachedToken | null = null;

  constructor() {
    if (config.PAYPAL_ENV.toLowerCase() !== 'sandbox') {
      throw new Error(`RealPayPalClient refused to initialize: PAYPAL_ENV is "${config.PAYPAL_ENV}". Only sandbox allowed.`);
    }
  }

  /**
   * Fetches or returns cached OAuth2 Client Credentials Bearer Token.
   * Proactively refreshes ~60s before expiry.
   */
  private async getAccessToken(forceRefresh = false): Promise<string> {
    const now = Date.now();
    if (!forceRefresh && this.cachedToken && this.cachedToken.expiresAt > now + 60000) {
      return this.cachedToken.accessToken;
    }

    const auth = Buffer.from(`${config.PAYPAL_CLIENT_ID}:${config.PAYPAL_CLIENT_SECRET}`).toString('base64');

    logger.info('Requesting fresh PayPal OAuth2 client_credentials token from sandbox');
    const response = await fetch(`${this.baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error({ status: response.status }, 'PayPal OAuth2 token request failed');
      throw new PayPalApiError(
        response.status,
        'OAUTH_ERROR',
        `Failed to obtain PayPal access token: ${response.statusText}`,
        errorText
      );
    }

    const data = (await response.json()) as { access_token: string; expires_in: number };
    this.cachedToken = {
      accessToken: data.access_token,
      expiresAt: now + data.expires_in * 1000,
    };

    return this.cachedToken.accessToken;
  }

  /**
   * Core HTTP request handler with automatic token refresh, idempotency header, and error handling.
   */
  private async request<T>(
    endpoint: string,
    options: {
      method?: 'GET' | 'POST' | 'PATCH';
      body?: any;
      headers?: Record<string, string>;
      isRetry?: boolean;
    } = {}
  ): Promise<T> {
    const method = options.method || 'GET';
    const token = await this.getAccessToken(options.isRetry);

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...options.headers,
    };

    // HARD SAFETY RULE: Add PayPal-Request-Id (UUID) idempotency header to every POST
    if (method === 'POST') {
      headers['PayPal-Request-Id'] = uuidv4();
    }

    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      method,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    // 401 Unauthorized handling: refresh token and retry once
    if (response.status === 401 && !options.isRetry) {
      logger.warn({ endpoint }, 'Received 401 from PayPal, refreshing token and retrying request');
      return this.request<T>(endpoint, { ...options, isRetry: true });
    }

    // 204 No Content handling (common on suspend, cancel, activate)
    if (response.status === 204) {
      return { success: true } as unknown as T;
    }

    const text = await response.text();
    let json: any = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = text;
    }

    if (!response.ok) {
      const code = json?.name || json?.error || `HTTP_${response.status}`;
      const message = json?.message || json?.error_description || `PayPal API error: ${response.statusText}`;
      logger.error({ status: response.status, code, endpoint }, 'PayPal API error');
      throw new PayPalApiError(response.status, code, message, json);
    }

    return json as T;
  }

  async createProduct(data: PayPalProductRequest): Promise<PayPalProductResponse> {
    return this.request<PayPalProductResponse>('/v1/catalogs/products', {
      method: 'POST',
      body: data,
    });
  }

  async createPlan(data: PayPalPlanRequest): Promise<PayPalPlanResponse> {
    return this.request<PayPalPlanResponse>('/v1/billing/plans', {
      method: 'POST',
      body: data,
    });
  }

  async createSubscription(data: PayPalSubscriptionCreateRequest) {
    const res = await this.request<PayPalSubscriptionDetailResponse>('/v1/billing/subscriptions', {
      method: 'POST',
      body: data,
    });

    const approveLink = res.links?.find((l) => l.rel === 'approve');
    if (!approveLink) {
      logger.warn({ id: res.id }, 'PayPal subscription created but approve link not found');
    }

    return {
      id: res.id,
      status: res.status,
      approveUrl: approveLink?.href || '',
      links: res.links || [],
    };
  }

  async getSubscription(id: string): Promise<PayPalSubscriptionDetailResponse> {
    return this.request<PayPalSubscriptionDetailResponse>(`/v1/billing/subscriptions/${id}`, {
      method: 'GET',
    });
  }

  async suspendSubscription(id: string, reason: string): Promise<{ success: boolean }> {
    await this.request<void>(`/v1/billing/subscriptions/${id}/suspend`, {
      method: 'POST',
      body: { reason },
    });
    return { success: true };
  }

  async activateSubscription(id: string, reason: string): Promise<{ success: boolean }> {
    await this.request<void>(`/v1/billing/subscriptions/${id}/activate`, {
      method: 'POST',
      body: { reason },
    });
    return { success: true };
  }

  async cancelSubscription(id: string, reason: string): Promise<{ success: boolean }> {
    await this.request<void>(`/v1/billing/subscriptions/${id}/cancel`, {
      method: 'POST',
      body: { reason },
    });
    return { success: true };
  }

  async reviseSubscription(
    id: string,
    data: PayPalReviseRequest
  ): Promise<{
    success: boolean;
    planId: string;
    approveUrl?: string;
    raw: PayPalReviseResponse;
  }> {
    const raw = await this.request<PayPalReviseResponse>(`/v1/billing/subscriptions/${id}/revise`, {
      method: 'POST',
      body: data,
    });

    const approveLink = raw.links?.find((l) => l.rel === 'approve');
    return {
      success: true,
      planId: data.plan_id || '',
      approveUrl: approveLink?.href,
      raw,
    };
  }

  async getTransactions(
    id: string,
    startTime: string,
    endTime: string
  ): Promise<PayPalTransactionsResponse> {
    const query = new URLSearchParams({
      start_time: startTime,
      end_time: endTime,
    }).toString();

    return this.request<PayPalTransactionsResponse>(
      `/v1/billing/subscriptions/${id}/transactions?${query}`,
      { method: 'GET' }
    );
  }

  async verifyWebhookSignature(data: WebhookVerifyRequest): Promise<WebhookVerifyResponse> {
    return this.request<WebhookVerifyResponse>('/v1/notifications/verify-webhook-signature', {
      method: 'POST',
      body: data,
    });
  }
}
