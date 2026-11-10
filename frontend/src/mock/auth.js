// frontend/src/mock/auth.js
/**
 * Mock Auth & Onboarding Layer for Sentinel (Person B fakes until live)
 * Activated when VITE_USE_MOCKS=true or fallback in sandbox
 */
import { subscriptions as initialSubs } from './subscriptions';
import { bulkAddSubscriptions } from '../api/client';

// Extended detected items including high and low confidence for review step
export const DETECTED_SUBS_SEED = [
  {
    id: "det-1",
    name: "Spotify Premium",
    merchant: "Spotify",
    category: "music",
    amount: 10.99,
    currency: "USD",
    billing_cycle: "monthly",
    next_charge_date: "2026-11-20",
    status: "active",
    confidence_score: 0.98,
    color: "#1db954",
    lastUsed: "2 days ago",
    flag: "overlap",
    suggestion: "Overlaps with Apple Music detected in statement."
  },
  {
    id: "det-2",
    name: "Apple Music Individual",
    merchant: "Apple",
    category: "music",
    amount: 10.99,
    currency: "USD",
    billing_cycle: "monthly",
    next_charge_date: "2026-11-25",
    status: "active",
    confidence_score: 0.95,
    color: "#fc3c44",
    lastUsed: "24 days ago",
    flag: "overlap",
    suggestion: "Duplicate streaming service. Pick one to save $131.88/yr."
  },
  {
    id: "det-3",
    name: "PixelPro Studio",
    merchant: "PixelPro",
    category: "software",
    amount: 22.50,
    currency: "USD",
    billing_cycle: "monthly",
    next_charge_date: "2026-11-12",
    status: "trial",
    confidence_score: 0.92,
    color: "#ff9ad5",
    lastUsed: "today",
    flag: "trial_ending",
    suggestion: "Free trial ends in 2 days. Auto-renews to $22.50/mo."
  },
  {
    id: "det-4",
    name: "Netflix 4K Premium",
    merchant: "Netflix",
    category: "video",
    amount: 17.99,
    currency: "USD",
    billing_cycle: "monthly",
    next_charge_date: "2026-11-28",
    status: "active",
    confidence_score: 0.99,
    color: "#e50914",
    lastUsed: "yesterday",
    flag: null,
    suggestion: null
  },
  {
    id: "det-5",
    name: "CloudDrive 2TB",
    merchant: "CloudDrive",
    category: "cloud",
    amount: 9.99,
    currency: "USD",
    billing_cycle: "monthly",
    next_charge_date: "2026-12-05",
    status: "active",
    confidence_score: 0.95,
    color: "#6bb7ff",
    lastUsed: "3 days ago",
    flag: null,
    suggestion: null
  },
  {
    id: "det-6",
    name: "Gym Local Pass",
    merchant: "Fitness Partner",
    category: "fitness",
    amount: 35.00,
    currency: "USD",
    billing_cycle: "monthly",
    next_charge_date: "2026-12-01",
    status: "active",
    confidence_score: 0.72, // LOW CONFIDENCE -> must be unchecked and flagged "Needs review"
    color: "#ffb86b",
    lastUsed: "55 days ago",
    flag: "unused",
    suggestion: "Low confidence match: verify if this is an active gym membership."
  },
  {
    id: "det-7",
    name: "NewsPlus Daily",
    merchant: "NewsPlus",
    category: "news",
    amount: 12.00,
    currency: "USD",
    billing_cycle: "monthly",
    next_charge_date: "2026-11-26",
    status: "active",
    confidence_score: 0.78, // LOW CONFIDENCE -> unchecked
    color: "#c4f06b",
    lastUsed: "40 days ago",
    flag: "low_usage",
    suggestion: "Infrequent charges detected. Check before confirming."
  }
];

// Initial alerts state
export const INITIAL_ALERTS = [
  {
    id: "alert-1",
    type: "trial_ending",
    severity: "high",
    title: "Trial Ending in 2 Days",
    message: "PixelPro Studio ($22.50/mo) will convert to a paid subscription on Nov 12.",
    subscription_id: "det-3",
    action_suggested: "cancel",
    read: false,
    created_at: new Date().toISOString()
  },
  {
    id: "alert-2",
    type: "overlap",
    severity: "high",
    title: "Audio Overlap Detected",
    message: "You have both Spotify Premium ($10.99) and Apple Music ($10.99) active.",
    subscription_id: "det-2",
    action_suggested: "pause",
    read: false,
    created_at: new Date().toISOString()
  },
  {
    id: "alert-3",
    type: "price_increase",
    severity: "med",
    title: "Upcoming Yearly Renewal",
    message: "CloudDrive renewal coming up soon. Ensure billing info is fresh.",
    subscription_id: "det-5",
    action_suggested: "keep",
    read: false,
    created_at: new Date().toISOString()
  }
];

// Local memory store
let currentSessionUser = null;
let currentAlerts = [...INITIAL_ALERTS];
let scanState = { state: 'idle', progress: 0 };
let scanTimer = null;

export const mockAuthApi = {
  // Check active session
  async getMe() {
    await new Promise((r) => setTimeout(r, 120));
    return currentSessionUser;
  },

  // Signup
  async signup(data) {
    await new Promise((r) => setTimeout(r, 350));
    currentSessionUser = {
      id: `usr-${Date.now()}`,
      name: data.name,
      email: data.email,
      country: data.country || "US",
      currency: data.currency || "USD",
      phone: data.phone || "",
      dob: data.dob || "",
      referral: data.referral || "",
      paypalConnected: false,
      paypalEmail: null,
      lastSyncAt: null,
      hasCompletedOnboarding: false
    };
    return { success: true, user: currentSessionUser };
  },

  // Login with Email + Password
  async login(email, password) {
    await new Promise((r) => setTimeout(r, 350));
    if (!email || !password) {
      throw new Error("Email and password are required.");
    }
    currentSessionUser = {
      id: "usr-demo",
      name: email.split("@")[0].replace(/[._-]/g, ' '),
      email,
      country: "US",
      currency: "USD",
      paypalConnected: true,
      paypalEmail: email,
      lastSyncAt: new Date().toISOString(),
      hasCompletedOnboarding: true
    };
    return { success: true, user: currentSessionUser };
  },

  // Login with PayPal OAuth
  async loginWithPayPal() {
    await new Promise((r) => setTimeout(r, 450));
    currentSessionUser = {
      id: "usr-paypal-demo",
      name: "PayPal Sandbox User",
      email: "sandbox-judge@paypal.com",
      country: "US",
      currency: "USD",
      paypalConnected: true,
      paypalEmail: "sandbox-judge@paypal.com",
      lastSyncAt: new Date().toISOString(),
      hasCompletedOnboarding: true
    };
    return { success: true, user: currentSessionUser };
  },

  // Logout
  async logout() {
    await new Promise((r) => setTimeout(r, 150));
    currentSessionUser = null;
    return { success: true };
  },

  // Connect PayPal during onboarding or settings
  async connectPayPal(email = "user-sandbox@paypal.com") {
    await new Promise((r) => setTimeout(r, 400));
    if (currentSessionUser) {
      currentSessionUser.paypalConnected = true;
      currentSessionUser.paypalEmail = email;
      currentSessionUser.lastSyncAt = new Date().toISOString();
    }
    return { success: true, user: currentSessionUser };
  },

  // Disconnect PayPal
  async disconnectPayPal() {
    await new Promise((r) => setTimeout(r, 300));
    if (currentSessionUser) {
      currentSessionUser.paypalConnected = false;
      currentSessionUser.paypalEmail = null;
    }
    return { success: true, user: currentSessionUser };
  },

  // Sync PayPal
  async syncPayPal() {
    await new Promise((r) => setTimeout(r, 600));
    if (currentSessionUser) {
      currentSessionUser.lastSyncAt = new Date().toISOString();
    }
    return { success: true, lastSyncAt: currentSessionUser?.lastSyncAt };
  },

  // Statement upload (validates type & size <= 10MB)
  async uploadStatement(file) {
    await new Promise((r) => setTimeout(r, 500));
    if (!file) throw new Error("No file provided");
    const allowed = ['text/csv', 'application/pdf', 'application/vnd.ms-excel'];
    const ext = file.name.split('.').pop().toLowerCase();
    if (!allowed.includes(file.type) && !['csv', 'pdf'].includes(ext)) {
      throw new Error("Invalid file type. Only .csv and .pdf statements are supported.");
    }
    if (file.size > 10 * 1024 * 1024) {
      throw new Error("File exceeds 10 MB limit.");
    }
    return { success: true, filename: file.name, size: file.size };
  },

  // Start onboarding scan
  startScan() {
    scanState = { state: 'scanning', progress: 5, message: "Reading transaction ledger..." };
    let progress = 5;
    if (scanTimer) clearInterval(scanTimer);
    scanTimer = setInterval(() => {
      progress += 25;
      if (progress >= 100) {
        progress = 100;
        scanState = { state: 'done', progress: 100, message: "Scan complete!" };
        clearInterval(scanTimer);
      } else if (progress >= 60) {
        scanState = { state: 'scanning', progress, message: "Matching recurring charges to app directory..." };
      } else if (progress >= 30) {
        scanState = { state: 'scanning', progress, message: "Spotting recurring subscriptions..." };
      }
    }, 400);
  },

  // Get scan status
  async getScanStatus() {
    return scanState;
  },

  // Get detected subscriptions
  async getDetectedSubscriptions() {
    await new Promise((r) => setTimeout(r, 200));
    return DETECTED_SUBS_SEED.map((s) => ({
      ...s,
      ownership: 'tracked',
      manage_via: 'paypal',
      source: 'paypal',
      selected: s.confidence_score >= 0.85
    }));
  },

  // Bulk confirm
  async confirmBulkSubscriptions(confirmedList) {
    await new Promise((r) => setTimeout(r, 400));
    await bulkAddSubscriptions(confirmedList);
    if (currentSessionUser) {
      currentSessionUser.hasCompletedOnboarding = true;
    }
    // Add a welcome notification
    const welcomeAlert = {
      id: `welcome-${Date.now()}`,
      type: "renewal",
      severity: "low",
      title: "Welcome to Sentinel!",
      message: `We found ${confirmedList.length} subscriptions you already pay for. PayPal alarms are now active.`,
      action_suggested: "keep",
      read: false,
      created_at: new Date().toISOString()
    };
    currentAlerts = [welcomeAlert, ...currentAlerts];
    return { success: true, count: confirmedList.length };
  },

  // Alerts
  async getAlerts() {
    return [...currentAlerts];
  },

  async markAlertRead(id) {
    currentAlerts = currentAlerts.map((a) => (a.id === id ? { ...a, read: true } : a));
    return { success: true };
  },

  async dismissAlert(id) {
    currentAlerts = currentAlerts.filter((a) => a.id !== id);
    return { success: true };
  }
};
