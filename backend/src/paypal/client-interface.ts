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

export interface IPayPalClient {
  readonly mode: 'mock' | 'real';

  // Products
  createProduct(data: PayPalProductRequest): Promise<PayPalProductResponse>;

  // Plans
  createPlan(data: PayPalPlanRequest): Promise<PayPalPlanResponse>;

  // Subscriptions
  createSubscription(data: PayPalSubscriptionCreateRequest): Promise<{
    id: string;
    status: string;
    approveUrl: string;
    links: Array<{ rel: string; href: string }>;
  }>;

  getSubscription(id: string): Promise<PayPalSubscriptionDetailResponse>;

  suspendSubscription(id: string, reason: string): Promise<{ success: boolean }>;

  activateSubscription(id: string, reason: string): Promise<{ success: boolean }>;

  cancelSubscription(id: string, reason: string): Promise<{ success: boolean }>;

  reviseSubscription(
    id: string,
    data: PayPalReviseRequest
  ): Promise<{
    success: boolean;
    planId: string;
    approveUrl?: string;
    raw: PayPalReviseResponse;
  }>;

  getTransactions(
    id: string,
    startTime: string,
    endTime: string
  ): Promise<PayPalTransactionsResponse>;

  // Webhooks
  verifyWebhookSignature(data: WebhookVerifyRequest): Promise<WebhookVerifyResponse>;
}

