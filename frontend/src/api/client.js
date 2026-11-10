// frontend/src/api/client.js
import { subscriptions as mockSubscriptions } from '../mock/subscriptions';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

// In-memory state for mock sessions
let subsState = [...mockSubscriptions];

async function post(endpoint, data = {}) {
  if (USE_MOCK) {
    // Artificial latency for smooth UI demo
    await new Promise((res) => setTimeout(res, 400));
    return { success: true };
  }
  const r = await fetch(`${BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!r.ok) {
    throw new Error(`API error: ${r.statusText}`);
  }
  return r.json();
}

export async function getSubscriptions() {
  if (USE_MOCK) {
    await new Promise((res) => setTimeout(res, 200));
    return [...subsState];
  }
  const r = await fetch(`${BASE}/subscriptions`);
  if (!r.ok) throw new Error('Failed to fetch subscriptions');
  return r.json();
}

export async function pauseSub(id) {
  if (USE_MOCK) {
    await new Promise((res) => setTimeout(res, 350));
    subsState = subsState.map((s) => (s.id === id ? { ...s, status: 'paused' } : s));
    return { success: true, message: 'Paused via PayPal' };
  }
  return post(`/subscriptions/${id}/pause`);
}

export async function cancelSub(id) {
  if (USE_MOCK) {
    await new Promise((res) => setTimeout(res, 350));
    subsState = subsState.map((s) => (s.id === id ? { ...s, status: 'cancelled' } : s));
    return { success: true, message: 'Cancelled via PayPal' };
  }
  return post(`/subscriptions/${id}/cancel`, { confirm: true, reason: 'Cancelled via Churn Guard' });
}

export async function undoSub(id) {
  if (USE_MOCK) {
    await new Promise((res) => setTimeout(res, 250));
    subsState = subsState.map((s) => (s.id === id ? { ...s, status: 'active' } : s));
    return { success: true, message: 'Restored subscription' };
  }
  return post(`/subscriptions/${id}/undo`);
}

// Add a subscription purchased from the App Directory into the shared state
// so the Dashboard immediately reflects the new entry.
export async function addSubscription(entry) {
  if (USE_MOCK) {
    await new Promise((res) => setTimeout(res, 350));
    // Avoid exact-name duplicates (idempotent for quick double-clicks)
    if (!subsState.find((s) => s.name === entry.name)) {
      subsState = [entry, ...subsState];
    }
    return { success: true };
  }
  // Live mode: hit the backend ingest endpoint
  return post('/ingest', [entry]);
}

export async function analyze(text) {
  if (USE_MOCK) {
    await new Promise((res) => setTimeout(res, 1200));
    // Smart heuristic mock parser if user pastes text
    const added = [];
    const lower = text.toLowerCase();
    
    if (lower.includes('netflix') || lower.includes('stream')) {
      added.push({
        id: 'mock-' + Date.now() + '-1',
        name: 'Netflix 4K',
        cost: 22.99,
        lastUsed: '48 days ago',
        status: 'active',
        flag: 'unused',
        suggestion: 'No device activity in 48 days. Cancel to save $275/yr.',
        color: '#e50914',
        category: 'Streaming'
      });
    }
    if (lower.includes('spotify') || lower.includes('music') || lower.includes('audio')) {
      added.push({
        id: 'mock-' + Date.now() + '-2',
        name: 'Spotify Family',
        cost: 16.99,
        lastUsed: 'today',
        status: 'active',
        flag: 'overlap',
        suggestion: 'Overlaps with Apple Music detected on statement.',
        color: '#1db954',
        category: 'Music'
      });
    }
    if (lower.includes('gym') || lower.includes('fitness')) {
      added.push({
        id: 'mock-' + Date.now() + '-3',
        name: 'Equinox All-Access',
        cost: 280.00,
        lastUsed: '60 days ago',
        status: 'active',
        flag: 'unused',
        suggestion: 'High recurring drain with no keycard scans.',
        color: '#ffffff',
        category: 'Fitness'
      });
    }
    
    // Default fallback mock if arbitrary text is pasted
    if (added.length === 0) {
      added.push(
        {
          id: 'mock-' + Date.now() + '-1',
          name: 'AI Copilot Pro',
          cost: 20.00,
          lastUsed: '19 days ago',
          status: 'active',
          flag: 'trial_ending',
          suggestion: 'Billed monthly. Auto-renews in 3 days.',
          color: '#10a37f',
          category: 'Productivity'
        },
        {
          id: 'mock-' + Date.now() + '-2',
          name: 'Chegg Study',
          cost: 19.95,
          lastUsed: '74 days ago',
          status: 'active',
          flag: 'unused',
          suggestion: 'Inactive semester detected. Recommended cancel.',
          color: '#ff6200',
          category: 'Education'
        }
      );
    }
    
    subsState = [...added, ...subsState];
    return {
      success: true,
      count: added.length,
      detected: added
    };
  }
  return post('/analyze', { text });
}
