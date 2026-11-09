import { z } from 'zod';

export const SubscriptionIntervalSchema = z.enum(['MONTH', 'YEAR']);
export type SubscriptionInterval = z.infer<typeof SubscriptionIntervalSchema>;

export const SubscriptionStatusSchema = z.enum([
  'APPROVAL_PENDING',
  'ACTIVE',
  'SUSPENDED',
  'CANCELLED',
  'EXTERNAL',
  'STALE',
]);
export type SubscriptionStatus = z.infer<typeof SubscriptionStatusSchema>;

export const SubscriptionSourceSchema = z.enum(['paypal', 'external']);
export type SubscriptionSource = z.infer<typeof SubscriptionSourceSchema>;

export const SubscriptionSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  price: z.string(), // e.g. "15.99"
  currency: z.string().default('USD'),
  interval: SubscriptionIntervalSchema,
  status: SubscriptionStatusSchema,
  source: SubscriptionSourceSchema,
  managedByPaypal: z.boolean(),
  paypalSubscriptionId: z.string().nullable().default(null),
  planId: z.string().nullable().default(null),
  downgradePlanId: z.string().nullable().default(null),
  nextBillingTime: z.string().nullable().default(null), // ISO string
  trialEndsAt: z.string().nullable().default(null), // ISO string
  lastUsedAt: z.string().nullable().default(null), // ISO string
  createdAt: z.string(), // ISO string
});
export type Subscription = z.infer<typeof SubscriptionSchema>;

export const AlertTypeSchema = z.enum([
  'trial_ending',
  'price_increase',
  'unused',
  'overlap',
  'payment_failed',
]);
export type AlertType = z.infer<typeof AlertTypeSchema>;

export const AlertSeveritySchema = z.enum(['low', 'medium', 'high']);
export type AlertSeverity = z.infer<typeof AlertSeveritySchema>;

export const AlertRecommendationSchema = z.enum(['pause', 'downgrade', 'cancel', 'keep']);
export type AlertRecommendation = z.infer<typeof AlertRecommendationSchema>;

export const AlertSchema = z.object({
  id: z.string(),
  subscriptionId: z.string(),
  type: AlertTypeSchema,
  severity: AlertSeveritySchema,
  message: z.string(),
  recommendation: AlertRecommendationSchema,
  reason: z.string(),
  createdAt: z.string(), // ISO string
  read: z.boolean().default(false),
});
export type Alert = z.infer<typeof AlertSchema>;

export const CreateAlertSchema = AlertSchema.omit({ id: true, createdAt: true, read: true }).extend({
  read: z.boolean().optional().default(false),
});
export type CreateAlertInput = z.infer<typeof CreateAlertSchema>;

export const IngestSubscriptionsSchema = z.array(
  SubscriptionSchema.partial({
    id: true,
    currency: true,
    status: true,
    source: true,
    managedByPaypal: true,
    paypalSubscriptionId: true,
    planId: true,
    downgradePlanId: true,
    nextBillingTime: true,
    trialEndsAt: true,
    lastUsedAt: true,
    createdAt: true,
  }).extend({
    name: z.string(),
    category: z.string(),
    price: z.string(),
    interval: SubscriptionIntervalSchema,
  })
);
export type IngestSubscriptionsInput = z.infer<typeof IngestSubscriptionsSchema>;

export const CancelSubscriptionBodySchema = z.object({
  confirm: z.literal(true, {
    message: 'Cancellation is irreversible and requires { "confirm": true } in request body.',
  }),
  reason: z.string().optional().default('Cancelled via Churn Guard'),
});

export const PauseResumeBodySchema = z.object({
  reason: z.string().optional().default('Updated via Churn Guard'),
});

export const DowngradeBodySchema = z.object({
  targetPlanId: z.string().optional(),
  reason: z.string().optional().default('Downgraded via Churn Guard to reduce churn'),
});

export const TransactionSchema = z.object({
  id: z.string(),
  status: z.string(),
  amount: z.object({
    currency: z.string(),
    value: z.string(),
  }),
  time: z.string(),
});
export type Transaction = z.infer<typeof TransactionSchema>;

export const ApiErrorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.any().optional(),
  }),
});
export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;

export const EventPayloadSchema = z.object({
  event: z.enum(['subscription_updated', 'alert_created', 'webhook_received']),
  data: z.any(),
  timestamp: z.string(),
});
export type EventPayload = z.infer<typeof EventPayloadSchema>;

