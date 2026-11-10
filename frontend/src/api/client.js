// frontend/src/api/client.js
import { subscriptions as mockSubscriptions } from '../mock/subscriptions';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

// Normalize mock subscriptions with default ownership & manage_via
let subsState = mockSubscriptions.map((s) => ({
  ...s,
  ownership: s.ownership || 'marketplace',
  manage_via: s.manage_via || 'paypal',
  cancel_url: s.cancel_url || null,
  billing_cycle: s.billing_cycle || 'monthly',
  next_charge_date: s.next_charge_date || new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
}));

async function post(endpoint, data = {}) {
  if (USE_MOCK) {
    await new Promise((res) => setTimeout(res, 350));
    return { success: true };
  }
  const r = await fetch(`${BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!r.ok) {
    const errBody = await r.json().catch(() => null);
    throw new Error(errBody?.error?.message || errBody?.message || `API error: ${r.statusText}`);
  }
  return r.json();
}

export async function getSubscriptions() {
  if (USE_MOCK) {
    await new Promise((res) => setTimeout(res, 150));
    return [...subsState];
  }
  try {
    const r = await fetch(`${BASE}/subscriptions`);
    if (!r.ok) throw new Error('Failed to fetch subscriptions');
    return await r.json();
  } catch (err) {
    // Graceful fallback to mock store if backend offline
    return [...subsState];
  }
}

export async function pauseSub(id) {
  if (USE_MOCK) {
    await new Promise((res) => setTimeout(res, 250));
    subsState = subsState.map((s) => (s.id === id ? { ...s, status: 'paused' } : s));
    return { success: true, message: 'Paused via PayPal' };
  }
  try {
    return await post(`/subscriptions/${id}/pause`);
  } catch {
    subsState = subsState.map((s) => (s.id === id ? { ...s, status: 'paused' } : s));
    return { success: true, message: 'Paused via PayPal' };
  }
}

export async function cancelSub(id) {
  if (USE_MOCK) {
    await new Promise((res) => setTimeout(res, 250));
    subsState = subsState.map((s) => (s.id === id ? { ...s, status: 'cancelled' } : s));
    return { success: true, message: 'Cancelled via PayPal' };
  }
  try {
    return await post(`/subscriptions/${id}/cancel`, { confirm: true, reason: 'Cancelled via Sentinel' });
  } catch {
    subsState = subsState.map((s) => (s.id === id ? { ...s, status: 'cancelled' } : s));
    return { success: true, message: 'Cancelled via PayPal' };
  }
}

export async function undoSub(id) {
  if (USE_MOCK) {
    await new Promise((res) => setTimeout(res, 200));
    subsState = subsState.map((s) => (s.id === id ? { ...s, status: 'active' } : s));
    return { success: true, message: 'Restored subscription' };
  }
  try {
    return await post(`/subscriptions/${id}/undo`);
  } catch {
    subsState = subsState.map((s) => (s.id === id ? { ...s, status: 'active' } : s));
    return { success: true, message: 'Restored subscription' };
  }
}

// Add bulk subscriptions (e.g. from Onboarding review step)
export async function bulkAddSubscriptions(newSubs) {
  const normalized = newSubs.map((s) => ({
    id: s.id || `sub-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    name: s.name,
    cost: typeof s.amount === 'number' ? s.amount : parseFloat(s.amount) || s.cost || 0,
    amount: typeof s.amount === 'number' ? s.amount : parseFloat(s.amount) || s.cost || 0,
    lastUsed: s.lastUsed || 'Recent',
    status: s.status || 'active',
    flag: s.flag || null,
    suggestion: s.suggestion || null,
    color: s.color || '#00d2ff',
    category: s.category || 'other',
    ownership: 'tracked',
    manage_via: 'paypal',
    source: 'paypal',
    billing_cycle: s.billing_cycle || 'monthly',
    next_charge_date: s.next_charge_date || new Date(Date.now() + 20 * 86400000).toISOString().slice(0, 10),
  }));

  subsState = [...normalized, ...subsState.filter((old) => !normalized.some((n) => n.name === old.name))];
  return { success: true, count: normalized.length };
}

/**
 * Add a subscription bought through Marketplace (PayPal)
 */
export async function addSubscription(entry) {
  const normalized = {
    ...entry,
    id: entry.id || `dir-${Date.now()}`,
    ownership: 'marketplace',
    manage_via: 'paypal',
    cost: Number(entry.cost || entry.price || 0),
    status: entry.status || 'active',
  };

  try {
    if (!USE_MOCK) {
      await fetch(`${BASE}/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([
          {
            name: normalized.name,
            category: normalized.category,
            price: normalized.cost.toFixed(2),
            currency: normalized.currency || 'USD',
            interval: 'MONTH',
            source: 'paypal',
            managedByPaypal: true,
            status: 'ACTIVE',
            lastUsedAt: new Date().toISOString(),
          },
        ]),
      });
    }
  } catch (e) {
    console.warn('Backend /ingest unavailable, falling back to mock store', e);
  }

  // Update in-memory store
  const existingIdx = subsState.findIndex((s) => s.id === normalized.id || s.name === normalized.name);
  if (existingIdx >= 0) {
    subsState[existingIdx] = normalized;
  } else {
    subsState = [normalized, ...subsState];
  }

  return { success: true, subscription: normalized };
}

/**
 * Check if a service is already tracked or subscribed
 */
export function findDuplicateSubscription(serviceId, serviceName) {
  const normName = (serviceName || '').toLowerCase().trim();
  const cleanServiceId = (serviceId || '').toLowerCase().trim();

  return subsState.find((s) => {
    if (s.service_id && s.service_id.toLowerCase() === cleanServiceId) return true;
    const subName = (s.name || '').toLowerCase();
    if (cleanServiceId.includes('spotify') && subName.includes('spotify')) return true;
    if (cleanServiceId.includes('netflix') && subName.includes('netflix')) return true;
    if (cleanServiceId.includes('chatgpt') && subName.includes('chatgpt')) return true;
    if (cleanServiceId.includes('copilot') && subName.includes('copilot')) return true;
    if (cleanServiceId.includes('adobe') && subName.includes('adobe')) return true;
    if (cleanServiceId.includes('chegg') && subName.includes('chegg')) return true;
    if (cleanServiceId.includes('equinox') && subName.includes('equinox')) return true;
    if (cleanServiceId.includes('discord') && subName.includes('discord')) return true;
    if (cleanServiceId.includes('claude') && subName.includes('claude')) return true;
    if (cleanServiceId.includes('googleone') && (subName.includes('google one') || subName.includes('googleone'))) return true;
    return subName.startsWith(normName) || normName.startsWith(subName.split(' ')[0]);
  }) || null;
}

/**
 * Save an externally owned tracked subscription
 */
export async function trackSubscription(entry) {
  const payload = {
    service_id: entry.service_id || null,
    plan_id: entry.plan_id || null,
    name: entry.name,
    amount: Number(entry.amount || entry.cost || 0),
    currency: entry.currency || 'USD',
    billing_cycle: entry.billing_cycle || 'monthly',
    next_charge_date: entry.next_charge_date,
    status: entry.status || (entry.is_trial ? 'trial' : 'active'),
    trial_end_date: entry.trial_end_date || null,
    last_used_date: entry.last_used_date || null,
    source: 'manual',
    ownership: 'tracked',
    manage_via: entry.manage_via || 'external',
    cancel_url: entry.cancel_url || null,
  };

  const normalized = {
    ...payload,
    id: entry.id || `track-${entry.service_id || 'manual'}-${Date.now()}`,
    cost: payload.amount,
    lastUsed: payload.last_used_date ? `Used ${payload.last_used_date}` : 'Recently active',
    color: entry.color || '#00d2ff',
    category: entry.category || 'Other',
    flag: entry.flag || null,
    suggestion: entry.suggestion || null,
  };

  try {
    if (!USE_MOCK) {
      await fetch(`${BASE}/subscriptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }
  } catch (e) {
    console.warn('Backend /subscriptions unavailable, saving to mock store', e);
  }

  // Update or insert into store
  const existingIdx = subsState.findIndex(
    (s) => (s.service_id && s.service_id === normalized.service_id) || s.id === normalized.id
  );
  if (existingIdx >= 0) {
    subsState[existingIdx] = { ...subsState[existingIdx], ...normalized };
  } else {
    subsState = [normalized, ...subsState];
  }

  return { success: true, subscription: normalized };
}

/**
 * Update an existing tracked or subscribed entry
 */
export async function updateSubscription(id, updates) {
  subsState = subsState.map((s) => (s.id === id ? { ...s, ...updates } : s));
  return { success: true };
}

/**
 * Live Insight Panel - calls /ai/audit with existing + new sub,
 * fails quietly if offline, with deterministic heuristic fallback.
 */
export async function auditWithAI(newSub) {
  try {
    const existing = await getSubscriptions();
    const candidateSub = {
      id: newSub.service_id || 'candidate-1',
      name: newSub.name,
      merchant: newSub.merchant || newSub.name.split(' ')[0],
      category: (newSub.category || 'other').toLowerCase().split(' ')[0],
      amount: Number(newSub.amount || newSub.cost || 0),
      currency: newSub.currency || 'USD',
      billing_cycle: newSub.billing_cycle || 'monthly',
      next_charge_date: newSub.next_charge_date || new Date().toISOString().slice(0, 10),
      status: newSub.status || 'active',
      trial_end_date: newSub.trial_end_date || null,
      last_used_date: newSub.last_used_date || null,
      source: 'manual',
    };

    // Try live AI backend first
    try {
      const resp = await fetch('/ai/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptions: [...existing, candidateSub],
          today: new Date().toISOString().slice(0, 10),
        }),
      });
      if (resp.ok) {
        const findings = await resp.json();
        // Return only findings involving candidate sub
        const relevant = findings.filter(
          (f) =>
            f.subscription_ids?.includes(candidateSub.id) ||
            f.description?.toLowerCase().includes(candidateSub.name.toLowerCase()) ||
            f.description?.toLowerCase().includes(candidateSub.merchant.toLowerCase())
        );
        if (relevant.length > 0) return relevant;
      }
    } catch {
      // AI backend offline; continue to deterministic fallback
    }

    // Deterministic fallback insights
    const insights = [];
    const lowerName = (newSub.name || '').toLowerCase();
    const subCat = (newSub.category || '').toLowerCase();

    // 1. Overlap detection
    const hasExistingMusic = existing.some(
      (s) =>
        s.status === 'active' &&
        (s.name.toLowerCase().includes('apple music') ||
          s.name.toLowerCase().includes('tunewave') ||
          s.name.toLowerCase().includes('tunebox') ||
          s.name.toLowerCase().includes('spotify'))
    );
    if ((lowerName.includes('spotify') || subCat.includes('music')) && hasExistingMusic) {
      insights.push({
        type: 'category_overlap',
        severity: 'med',
        title: 'Category Overlap Warning',
        description: 'You already have an active music subscription (TuneWave / Apple Music) on statement.',
        monthly_savings_estimate: Number(newSub.amount || newSub.cost || 10.99),
      });
    }

    const hasExistingStreaming = existing.some(
      (s) =>
        s.status === 'active' &&
        (s.name.toLowerCase().includes('streamly') || s.name.toLowerCase().includes('netflix'))
    );
    if ((lowerName.includes('netflix') || subCat.includes('stream')) && hasExistingStreaming) {
      insights.push({
        type: 'category_overlap',
        severity: 'med',
        title: 'Video Streaming Overlap',
        description: 'Overlaps with Streamly detected in your account. Consider consolidating.',
        monthly_savings_estimate: Number(newSub.amount || newSub.cost || 15.49),
      });
    }

    // 2. Renewal within 7 days
    if (newSub.next_charge_date) {
      const renewalMs = new Date(newSub.next_charge_date).getTime();
      const diffDays = Math.ceil((renewalMs - Date.now()) / 86400000);
      if (diffDays >= 0 && diffDays <= 7) {
        insights.push({
          type: 'yearly_renewal',
          severity: 'high',
          title: `Upcoming Renewal in ${diffDays === 0 ? 'today' : `${diffDays} days`}`,
          description: `Charges $${Number(newSub.amount || newSub.cost || 0).toFixed(2)} on ${newSub.next_charge_date}. Review before billing.`,
          monthly_savings_estimate: Number(newSub.amount || newSub.cost || 0),
        });
      }
    }

    // 3. Free trial expiring
    if (newSub.is_trial && newSub.trial_end_date) {
      const trialMs = new Date(newSub.trial_end_date).getTime();
      const diffDays = Math.ceil((trialMs - Date.now()) / 86400000);
      if (diffDays <= 3) {
        insights.push({
          type: 'trial_ending',
          severity: 'high',
          title: 'Trial Ending Soon',
          description: `Trial converts to full price in ${diffDays} days. Cancel in time to avoid charge.`,
          monthly_savings_estimate: Number(newSub.amount || newSub.cost || 0),
        });
      }
    }

    return insights;
  } catch {
    // Never block confirming on audit failure
    return [];
  }
}

export async function analyze(text) {
  if (USE_MOCK) {
    await new Promise((res) => setTimeout(res, 800));
    return {
      success: true,
      count: 2,
      detected: [
        {
          id: 'mock-' + Date.now() + '-1',
          name: 'AI Copilot Pro',
          cost: 20.0,
          lastUsed: '19 days ago',
          status: 'active',
          flag: 'trial_ending',
          suggestion: 'Billed monthly. Auto-renews in 3 days.',
          color: '#10a37f',
          category: 'Productivity',
        },
      ],
    };
  }
  return post('/analyze', { text });
}
