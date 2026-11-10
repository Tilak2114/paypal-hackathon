// frontend/src/types/index.js
/**
 * @typedef {'marketplace' | 'tracked'} Ownership
 * @typedef {'paypal' | 'external'} ManageVia
 * @typedef {'active' | 'trial' | 'paused' | 'cancelled'} SubStatus
 * @typedef {'monthly' | 'yearly' | 'weekly'} BillingCycle
 * @typedef {'paypal' | 'bank' | 'pasted' | 'manual'} SubSource
 * 
 * @typedef {Object} ServicePlan
 * @property {string} id
 * @property {string} name
 * @property {number} price
 * @property {BillingCycle} interval
 * 
 * @typedef {Object} Service
 * @property {string} id
 * @property {string} name
 * @property {string} category
 * @property {string} color
 * @property {string} letter
 * @property {string} description
 * @property {string} trialBadge
 * @property {string|null} cancel_url
 * @property {ServicePlan[]} plans
 * 
 * @typedef {Object} Subscription
 * @property {string} id
 * @property {string} [service_id]
 * @property {string} [plan_id]
 * @property {string} name
 * @property {number} [amount]
 * @property {number} cost
 * @property {string} currency
 * @property {BillingCycle} [billing_cycle]
 * @property {string} [next_charge_date]
 * @property {SubStatus} status
 * @property {string|null} [trial_end_date]
 * @property {string|null} [last_used_date]
 * @property {string} [lastUsed]
 * @property {SubSource} source
 * @property {Ownership} ownership
 * @property {ManageVia} manage_via
 * @property {string|null} cancel_url
 * @property {string|null} [flag]
 * @property {string|null} [suggestion]
 * @property {string} [color]
 * @property {string} [category]
 */

export const OWNERSHIP = {
  MARKETPLACE: 'marketplace',
  TRACKED: 'tracked',
};

export const MANAGE_VIA = {
  PAYPAL: 'paypal',
  EXTERNAL: 'external',
};

export const PAYMENT_METHODS = [
  { id: 'paypal', label: 'PayPal', icon: '🅿️', manage_via: 'paypal', desc: 'Direct PayPal renewal management & alerts' },
  { id: 'card', label: 'Credit / Debit Card', icon: '💳', manage_via: 'external', desc: 'Charged to your personal or bank card' },
  { id: 'app_store', label: 'App Store / Google Play', icon: '📱', manage_via: 'external', desc: 'Apple Subscriptions or Google Play Billing' },
  { id: 'bank_upi', label: 'Bank Account / UPI', icon: '🏦', manage_via: 'external', desc: 'Direct debit, ACH, or UPI autopay mandate' },
  { id: 'other', label: 'Other Method', icon: '⚡', manage_via: 'external', desc: 'Gift card, crypto, or corporate expense' },
];
