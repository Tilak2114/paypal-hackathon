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
import { logger } from '../logger.js';

interface MockSubRecord {
  id: string;
  status: 'APPROVAL_PENDING' | 'ACTIVE' | 'SUSPENDED' | 'CANCELLED';
  planId: string;
  createTime: string;
  updateTime: string;
  nextBillingTime: string;
  lastPayment?: {
    amount: { currency_code: string; value: string };
    time: string;
  };
}

export class PayPalApiError extends Error {
  public statusCode: number;
  public code: string;
  public details?: any;

  constructor(statusCode: number, code: string, message: string, details?: any) {
    super(message);
    this.name = 'PayPalApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export class MockPayPalClient implements IPayPalClient {
  public readonly mode = 'mock' as const;
  private products = new Map<string, PayPalProductResponse>();
  private plans = new Map<string, PayPalPlanResponse>();
  private subscriptions = new Map<string, MockSubRecord>();

  constructor() {
    this.seedDefaultMockData();
  }

  private seedDefaultMockData() {
    // Default mock products and plans for demo
    const prodId = 'PROD-MOCK-CHURN-GUARD';
    this.products.set(prodId, {
      id: prodId,
      name: 'Churn Guard Subscription Hub',
      description: 'Demo product for subscription management',
      create_time: new Date().toISOString(),
    });

    const planStandard = 'P-MOCK-STANDARD-MONTHLY';
    this.plans.set(planStandard, {
      id: planStandard,
      product_id: prodId,
      name: 'Standard Monthly Service',
      status: 'ACTIVE',
      create_time: new Date().toISOString(),
    });

    const planDowngrade = 'P-MOCK-DOWNGRADE-BASIC';
    this.plans.set(planDowngrade, {
      id: planDowngrade,
      product_id: prodId,
      name: 'Downgraded Basic Tier',
      status: 'ACTIVE',
      create_time: new Date().toISOString(),
    });
  }

  public registerMockSubscription(sub: {
    id: string;
    status: 'APPROVAL_PENDING' | 'ACTIVE' | 'SUSPENDED' | 'CANCELLED';
    planId: string;
    nextBillingTime?: string;
    price?: string;
  }) {
    const now = new Date();
    const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    this.subscriptions.set(sub.id, {
      id: sub.id,
      status: sub.status,
      planId: sub.planId,
      createTime: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      updateTime: now.toISOString(),
      nextBillingTime: sub.nextBillingTime || nextMonth,
      lastPayment: {
        amount: { currency_code: 'USD', value: sub.price || '15.99' },
        time: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000).toISOString(),
      },
    });
  }

  async createProduct(data: PayPalProductRequest): Promise<PayPalProductResponse> {
    const id = `PROD-${uuidv4().substring(0, 8).toUpperCase()}`;
    const prod: PayPalProductResponse = {
      id,
      name: data.name,
      description: data.description,
      create_time: new Date().toISOString(),
    };
    this.products.set(id, prod);
    logger.info({ productId: id, name: data.name }, '[MockPayPal] Created product');
    return prod;
  }

  async createPlan(data: PayPalPlanRequest): Promise<PayPalPlanResponse> {
    const id = `P-${uuidv4().substring(0, 12).toUpperCase()}`;
    const plan: PayPalPlanResponse = {
      id,
      product_id: data.product_id,
      name: data.name,
      status: 'ACTIVE',
      description: data.description,
      create_time: new Date().toISOString(),
    };
    this.plans.set(id, plan);
    logger.info({ planId: id, name: data.name }, '[MockPayPal] Created plan');
    return plan;
  }

  async createSubscription(data: PayPalSubscriptionCreateRequest) {
    const id = `I-${uuidv4().substring(0, 12).toUpperCase()}`;
    const token = `BA-${uuidv4().substring(0, 8).toUpperCase()}`;
    const approveUrl = `https://www.sandbox.paypal.com/checkoutnow?token=${token}&ba_token=${token}`;

    const now = new Date();
    const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

    this.subscriptions.set(id, {
      id,
      status: 'APPROVAL_PENDING',
      planId: data.plan_id,
      createTime: now.toISOString(),
      updateTime: now.toISOString(),
      nextBillingTime: nextMonth,
    });

    logger.info({ subscriptionId: id, planId: data.plan_id }, '[MockPayPal] Created subscription');

    return {
      id,
      status: 'APPROVAL_PENDING',
      approveUrl,
      links: [
        { rel: 'approve', href: approveUrl },
        { rel: 'edit', href: `https://api-m.sandbox.paypal.com/v1/billing/subscriptions/${id}` },
        { rel: 'self', href: `https://api-m.sandbox.paypal.com/v1/billing/subscriptions/${id}` },
      ],
    };
  }

  async getSubscription(id: string): Promise<PayPalSubscriptionDetailResponse> {
    let sub = this.subscriptions.get(id);
    if (!sub) {
      // Auto-register so demo IDs seamlessly resolve
      this.registerMockSubscription({
        id,
        status: 'ACTIVE',
        planId: 'P-MOCK-STANDARD-MONTHLY',
      });
      sub = this.subscriptions.get(id)!;
    }

    return {
      id: sub.id,
      status: sub.status,
      plan_id: sub.planId,
      create_time: sub.createTime,
      update_time: sub.updateTime,
      billing_info: {
        next_billing_time: sub.nextBillingTime,
        last_payment: sub.lastPayment,
        failed_payments_count: 0,
      },
      links: [
        { rel: 'self', href: `https://api-m.sandbox.paypal.com/v1/billing/subscriptions/${id}` },
      ],
    };
  }

  async suspendSubscription(id: string, reason: string): Promise<{ success: boolean }> {
    const sub = this.subscriptions.get(id);
    if (!sub) {
      throw new PayPalApiError(404, 'RESOURCE_NOT_FOUND', `Subscription ${id} not found.`);
    }

    if (sub.status === 'CANCELLED') {
      throw new PayPalApiError(
        422,
        'UNPROCESSABLE_ENTITY',
        'Subscription is in terminal state CANCELLED and cannot be suspended.'
      );
    }

    if (sub.status === 'SUSPENDED') {
      throw new PayPalApiError(
        422,
        'UNPROCESSABLE_ENTITY',
        'Subscription is already in SUSPENDED status.'
      );
    }

    sub.status = 'SUSPENDED';
    sub.updateTime = new Date().toISOString();
    logger.info({ subscriptionId: id, reason }, '[MockPayPal] Suspended subscription');
    return { success: true };
  }

  async activateSubscription(id: string, reason: string): Promise<{ success: boolean }> {
    const sub = this.subscriptions.get(id);
    if (!sub) {
      throw new PayPalApiError(404, 'RESOURCE_NOT_FOUND', `Subscription ${id} not found.`);
    }

    if (sub.status === 'CANCELLED') {
      throw new PayPalApiError(
        422,
        'UNPROCESSABLE_ENTITY',
        'Subscription is in terminal state CANCELLED and cannot be activated.'
      );
    }

    if (sub.status === 'ACTIVE') {
      throw new PayPalApiError(
        422,
        'UNPROCESSABLE_ENTITY',
        'Subscription is already in ACTIVE status.'
      );
    }

    sub.status = 'ACTIVE';
    sub.updateTime = new Date().toISOString();
    logger.info({ subscriptionId: id, reason }, '[MockPayPal] Activated subscription');
    return { success: true };
  }

  async cancelSubscription(id: string, reason: string): Promise<{ success: boolean }> {
    const sub = this.subscriptions.get(id);
    if (!sub) {
      throw new PayPalApiError(404, 'RESOURCE_NOT_FOUND', `Subscription ${id} not found.`);
    }

    if (sub.status === 'CANCELLED') {
      throw new PayPalApiError(
        422,
        'UNPROCESSABLE_ENTITY',
        'Subscription is already in terminal state CANCELLED.'
      );
    }

    sub.status = 'CANCELLED';
    sub.updateTime = new Date().toISOString();
    logger.info({ subscriptionId: id, reason }, '[MockPayPal] Cancelled subscription');
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
    const sub = this.subscriptions.get(id);
    if (!sub) {
      throw new PayPalApiError(404, 'RESOURCE_NOT_FOUND', `Subscription ${id} not found.`);
    }

    if (sub.status === 'CANCELLED') {
      throw new PayPalApiError(
        422,
        'UNPROCESSABLE_ENTITY',
        'Subscription is CANCELLED and cannot be revised.'
      );
    }

    const newPlanId = data.plan_id || sub.planId;
    sub.planId = newPlanId;
    sub.updateTime = new Date().toISOString();

    const token = `BA-${uuidv4().substring(0, 8).toUpperCase()}`;
    const approveUrl = `https://www.sandbox.paypal.com/checkoutnow?token=${token}`;

    const raw: PayPalReviseResponse = {
      plan_id: newPlanId,
      status: sub.status,
      plan_overridden: true,
      links: [
        { rel: 'approve', href: approveUrl, method: 'GET' },
        { rel: 'self', href: `https://api-m.sandbox.paypal.com/v1/billing/subscriptions/${id}`, method: 'GET' },
      ],
    };

    logger.info({ subscriptionId: id, newPlanId }, '[MockPayPal] Revised subscription plan');
    return {
      success: true,
      planId: newPlanId,
      approveUrl,
      raw,
    };
  }

  async getTransactions(
    id: string,
    startTime: string,
    endTime: string
  ): Promise<PayPalTransactionsResponse> {
    const now = new Date();
    return {
      transactions: [
        {
          id: `TXN-${uuidv4().substring(0, 8).toUpperCase()}`,
          status: 'COMPLETED',
          amount_with_breakdown: {
            gross_amount: { currency_code: 'USD', value: '15.99' },
            fee_amount: { currency_code: 'USD', value: '0.66' },
            net_amount: { currency_code: 'USD', value: '15.33' },
          },
          time: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: `TXN-${uuidv4().substring(0, 8).toUpperCase()}`,
          status: 'COMPLETED',
          amount_with_breakdown: {
            gross_amount: { currency_code: 'USD', value: '15.99' },
            fee_amount: { currency_code: 'USD', value: '0.66' },
            net_amount: { currency_code: 'USD', value: '15.33' },
          },
          time: new Date(now.getTime() - 55 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ],
      total_items: 2,
      total_pages: 1,
    };
  }

  async verifyWebhookSignature(data: WebhookVerifyRequest): Promise<WebhookVerifyResponse> {
    logger.info({ transmissionId: data.transmission_id }, '[MockPayPal] Verified webhook signature (Mock SUCCESS)');
    return { verification_status: 'SUCCESS' };
  }
}
