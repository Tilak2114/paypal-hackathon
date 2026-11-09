export interface PayPalProductRequest {
  name: string;
  description: string;
  type: 'SERVICE' | 'PHYSICAL' | 'DIGITAL';
  category: string;
  image_url?: string;
  home_url?: string;
}

export interface PayPalProductResponse {
  id: string;
  name: string;
  description?: string;
  create_time?: string;
}

export interface PayPalBillingCycle {
  frequency: {
    interval_unit: 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';
    interval_count: number;
  };
  tenure_type: 'REGULAR' | 'TRIAL';
  sequence: number;
  total_cycles: number;
  pricing_scheme: {
    fixed_price: {
      value: string;
      currency_code: string;
    };
  };
}

export interface PayPalPlanRequest {
  product_id: string;
  name: string;
  description?: string;
  billing_cycles: PayPalBillingCycle[];
  payment_preferences: {
    auto_bill_outstanding: boolean;
    setup_fee?: {
      value: string;
      currency_code: string;
    };
    setup_fee_failure_action?: 'CONTINUE' | 'CANCEL';
    payment_failure_threshold?: number;
  };
}

export interface PayPalPlanResponse {
  id: string;
  product_id: string;
  name: string;
  status: 'CREATED' | 'ACTIVE' | 'INACTIVE';
  description?: string;
  create_time?: string;
}

export interface PayPalLinkDescription {
  href: string;
  rel: string;
  method?: string;
}

export interface PayPalSubscriptionCreateRequest {
  plan_id: string;
  start_time?: string;
  quantity?: string;
  shipping_amount?: {
    currency_code: string;
    value: string;
  };
  subscriber?: {
    name?: {
      given_name?: string;
      surname?: string;
    };
    email_address?: string;
  };
  application_context?: {
    brand_name?: string;
    locale?: string;
    shipping_preference?: 'GET_FROM_FILE' | 'NO_SHIPPING' | 'SET_PROVIDED_ADDRESS';
    user_action?: 'SUBSCRIBE_NOW' | 'CONTINUE';
    payment_method_preference?: 'UNRESTRICTED' | 'IMMEDIATE_PAYMENT_REQUIRED';
    return_url: string;
    cancel_url: string;
  };
}

export interface PayPalSubscriptionDetailResponse {
  id: string;
  status: 'APPROVAL_PENDING' | 'APPROVED' | 'ACTIVE' | 'SUSPENDED' | 'CANCELLED' | 'EXPIRED';
  status_update_time?: string;
  idempotency_key?: string;
  plan_id: string;
  start_time?: string;
  quantity?: string;
  shipping_amount?: {
    currency_code: string;
    value: string;
  };
  subscriber?: {
    email_address?: string;
    name?: {
      given_name?: string;
      surname?: string;
    };
  };
  billing_info?: {
    outstanding_balance?: {
      currency_code: string;
      value: string;
    };
    cycle_executions?: Array<{
      tenure_type: string;
      sequence: number;
      cycles_completed: number;
      cycles_remaining: number;
      current_pricing_scheme_version: number;
    }>;
    last_payment?: {
      amount: {
        currency_code: string;
        value: string;
      };
      time: string;
    };
    next_billing_time?: string;
    final_payment_time?: string;
    failed_payments_count?: number;
  };
  create_time?: string;
  update_time?: string;
  links?: PayPalLinkDescription[];
}

export interface PayPalReviseRequest {
  plan_id?: string;
  quantity?: string;
  shipping_amount?: {
    currency_code: string;
    value: string;
  };
}

export interface PayPalReviseResponse {
  plan_id?: string;
  status?: string;
  plan_overridden?: boolean;
  links?: PayPalLinkDescription[];
}

export interface PayPalTransactionDetail {
  id: string;
  status: string;
  payer_email?: string;
  payer_name?: {
    given_name?: string;
    surname?: string;
  };
  amount_with_breakdown: {
    gross_amount: {
      currency_code: string;
      value: string;
    };
    fee_amount?: {
      currency_code: string;
      value: string;
    };
    net_amount?: {
      currency_code: string;
      value: string;
    };
  };
  time: string;
}

export interface PayPalTransactionsResponse {
  transactions: PayPalTransactionDetail[];
  total_items?: number;
  total_pages?: number;
  links?: PayPalLinkDescription[];
}

export interface WebhookVerifyRequest {
  auth_algo: string;
  cert_url: string;
  transmission_id: string;
  transmission_sig: string;
  transmission_time: string;
  webhook_id: string;
  webhook_event: Record<string, any>;
}

export interface WebhookVerifyResponse {
  verification_status: 'SUCCESS' | 'FAILURE';
}

