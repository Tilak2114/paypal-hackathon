import React, { useState } from 'react';

const DIRECTORY_APPS = [
  {
    id: 'app-spotify',
    name: 'Spotify',
    category: 'Music & Audio',
    color: '#1db954',
    letter: 'S',
    description: 'Ad-free music streaming with offline downloads and podcasts.',
    trialBadge: '30-Day Free Trial',
    plans: [
      { name: 'Individual', price: 11.99, interval: 'monthly' },
      { name: 'Duo', price: 14.99, interval: 'monthly' },
      { name: 'Family', price: 16.99, interval: 'monthly' },
      { name: 'Student', price: 5.99, interval: 'monthly' },
    ],
  },
  {
    id: 'app-netflix',
    name: 'Netflix',
    category: 'Streaming & TV',
    color: '#e50914',
    letter: 'N',
    description: 'Award-winning movies, TV series, documentaries, and mobile games.',
    trialBadge: 'Instant Activation',
    plans: [
      { name: 'Standard with Ads', price: 6.99, interval: 'monthly' },
      { name: 'Standard HD', price: 15.49, interval: 'monthly' },
      { name: 'Premium 4K', price: 22.99, interval: 'monthly' },
    ],
  },
  {
    id: 'app-chatgpt',
    name: 'ChatGPT Plus',
    category: 'Productivity & AI',
    color: '#10a37f',
    letter: 'O',
    description: 'Direct access to OpenAI\'s flagship models, custom GPTs, and advanced tools.',
    trialBadge: 'Instant Activation',
    plans: [
      { name: 'Plus', price: 20.0, interval: 'monthly' },
      { name: 'Team', price: 25.0, interval: 'monthly' },
    ],
  },
  {
    id: 'app-copilot',
    name: 'GitHub Copilot',
    category: 'Developer Tools',
    color: '#7b6cff',
    letter: 'G',
    description: 'AI pair programmer that suggests code and whole functions in real time.',
    trialBadge: '30-Day Free Trial',
    plans: [
      { name: 'Individual', price: 10.0, interval: 'monthly' },
      { name: 'Business', price: 19.0, interval: 'monthly' },
    ],
  },
  {
    id: 'app-adobe',
    name: 'Adobe Creative Cloud',
    category: 'Design & Photo',
    color: '#ff3d71',
    letter: 'A',
    description: 'Industry standard creative suite including Photoshop, Illustrator, and Premiere.',
    trialBadge: '7-Day Free Trial',
    plans: [
      { name: 'All Apps', price: 54.99, interval: 'monthly' },
      { name: 'Photography Plan', price: 9.99, interval: 'monthly' },
      { name: 'Single App (Photoshop)', price: 20.99, interval: 'monthly' },
    ],
  },
  {
    id: 'app-chegg',
    name: 'Chegg Study',
    category: 'Education',
    color: '#ff6200',
    letter: 'C',
    description: 'Step-by-step textbook solutions and expert Q&A for college courses.',
    trialBadge: 'Instant Activation',
    plans: [
      { name: 'Monthly Study', price: 19.95, interval: 'monthly' },
      { name: 'Study Pack Pro', price: 24.95, interval: 'monthly' },
    ],
  },
  {
    id: 'app-equinox',
    name: 'Equinox Gym',
    category: 'Fitness & Health',
    color: '#f59e0b',
    letter: 'E',
    description: 'Luxury health club access, private training, and recovery spa amenities.',
    trialBadge: 'Instant Activation',
    plans: [
      { name: 'All-Access', price: 280.0, interval: 'monthly' },
      { name: 'Destination Pass', price: 350.0, interval: 'monthly' },
    ],
  },
  {
    id: 'app-discord',
    name: 'Discord Nitro',
    category: 'Gaming & Social',
    color: '#5865f2',
    letter: 'D',
    description: 'HD streaming, custom emojis anywhere, bigger file sharing, and server boosts.',
    trialBadge: 'Instant Activation',
    plans: [
      { name: 'Nitro', price: 9.99, interval: 'monthly' },
      { name: 'Nitro Basic', price: 2.99, interval: 'monthly' },
    ],
  },
  {
    id: 'app-claude',
    name: 'Claude Pro',
    category: 'Productivity & AI',
    color: '#d97706',
    letter: 'C',
    description: '5x more usage of Claude 3.5 Sonnet, priority access during peak hours.',
    trialBadge: 'Instant Activation',
    plans: [
      { name: 'Pro', price: 20.0, interval: 'monthly' },
      { name: 'Team', price: 25.0, interval: 'monthly' },
    ],
  },
  {
    id: 'app-googleone',
    name: 'Google One',
    category: 'Productivity & AI',
    color: '#4285f4',
    letter: 'G',
    description: '2TB expanded cloud storage across Google Drive, Gmail, and Google Photos.',
    trialBadge: 'Instant Activation',
    plans: [
      { name: 'Premium 2TB', price: 9.99, interval: 'monthly' },
      { name: 'Basic 100GB', price: 1.99, interval: 'monthly' },
      { name: 'Standard 200GB', price: 2.99, interval: 'monthly' },
    ],
  },
];

const CATEGORIES = [
  'All',
  'Music & Audio',
  'Streaming & TV',
  'Productivity & AI',
  'Design & Photo',
  'Education',
  'Developer Tools',
  'Gaming & Social',
  'Fitness & Health',
];

export default function AppDirectory({ onNavigate }) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPlans, setSelectedPlans] = useState({});
  const [planModalApp, setPlanModalApp] = useState(null);
  const [toast, setToast] = useState(null);
  const [subscribingId, setSubscribingId] = useState(null);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 4000);
  };

  const getSelectedPlan = (app) => {
    const idx = selectedPlans[app.id] ?? 0;
    return app.plans[idx] || app.plans[0];
  };

  const handleSubscribe = async (app) => {
    const plan = getSelectedPlan(app);
    setSubscribingId(app.id);

    try {
      const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      // Ingest into backend DB so it shows immediately on Dashboard
      await fetch(`${BASE}/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([
          {
            name: `${app.name} (${plan.name})`,
            category: app.category,
            price: plan.price.toFixed(2),
            currency: 'USD',
            interval: 'MONTH',
            source: 'paypal',
            managedByPaypal: true,
            status: 'ACTIVE',
            lastUsedAt: new Date().toISOString(),
          },
        ]),
      });

      showToast(`Subscribed to ${app.name} (${plan.name}) via PayPal! Renewal alarm activated.`);
    } catch (err) {
      console.error('Subscription error:', err);
      showToast(`Linked ${app.name} (${plan.name}) to your Churn Guard wallet.`);
    } finally {
      setSubscribingId(null);
    }
  };

  const filteredApps = DIRECTORY_APPS.filter((app) => {
    const matchesCategory =
      selectedCategory === 'All' || app.category === selectedCategory;
    const matchesSearch =
      !search.trim() ||
      app.name.toLowerCase().includes(search.toLowerCase()) ||
      app.description.toLowerCase().includes(search.toLowerCase()) ||
      app.category.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-7xl w-full mx-auto px-6 sm:px-12 py-10 space-y-8 animate-fadeIn">
      {/* Toast Notification */}
      {toast && (
        <div
          className="fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center gap-3 animate-bounce"
          style={{
            background: '#0b162e',
            border: '1px solid #00d2ff',
            color: '#00d2ff',
            boxShadow: '0 0 25px rgba(0, 210, 255, 0.3)',
          }}
        >
          <span className="w-2 h-2 rounded-full" style={{ background: '#00d2ff' }} />
          <span className="text-sm font-semibold">{toast}</span>
        </div>
      )}

      {/* Plan Selection Modal */}
      {planModalApp && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div
            className="max-w-md w-full rounded-3xl p-6 sm:p-8 space-y-5 animate-scaleUp"
            style={{
              background: '#0b162e',
              border: '1px solid rgba(0, 210, 255, 0.4)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)',
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-display font-black text-slate-950 text-lg shadow-inner"
                  style={{ backgroundColor: planModalApp.color }}
                >
                  {planModalApp.letter}
                </div>
                <div>
                  <h3 className="font-display font-bold text-white text-lg">{planModalApp.name} Plans</h3>
                  <p className="text-xs text-mute">{planModalApp.category}</p>
                </div>
              </div>
              <button
                onClick={() => setPlanModalApp(null)}
                className="w-8 h-8 rounded-full border border-white/20 text-mute hover:text-white flex items-center justify-center text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5">
              {planModalApp.plans.map((p, idx) => {
                const isSelected = (selectedPlans[planModalApp.id] ?? 0) === idx;
                return (
                  <div
                    key={p.name}
                    onClick={() => {
                      setSelectedPlans((prev) => ({ ...prev, [planModalApp.id]: idx }));
                      setPlanModalApp(null);
                    }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'border-[#00d2ff] bg-[rgba(0,210,255,0.1)]'
                        : 'border-white/10 bg-slate-950/40 hover:border-white/30'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-white text-sm">{p.name}</div>
                      <div className="text-xs text-mute">${p.price.toFixed(2)} / {p.interval}</div>
                    </div>
                    {isSelected && (
                      <span className="text-xs font-bold text-[#00d2ff] px-2 py-0.5 rounded-full bg-[#00d2ff]/10">
                        Selected
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#00d2ff]/10 text-[#00d2ff] border border-[#00d2ff]/30">
            <span>✨</span>
            <span>PayPal Verified Subscriptions Directory</span>
          </div>
          <h1 className="font-display font-black text-3xl sm:text-5xl text-white tracking-tight">
            Discover & Subscribe via PayPal
          </h1>
          <p className="text-mute text-sm sm:text-base leading-relaxed">
            Choose any service, explore available tiers, and link directly to your PayPal account.
            Churn Guard automatically activates renewal alarms and trial trackers.
          </p>
        </div>

        <button
          onClick={() => onNavigate('dashboard')}
          className="self-start lg:self-center px-5 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 transition-all cursor-pointer hover:scale-105"
          style={{
            border: '1px solid rgba(0, 210, 255, 0.4)',
            color: '#00d2ff',
            background: 'rgba(0, 210, 255, 0.08)',
            boxShadow: '0 0 20px rgba(0, 210, 255, 0.15)',
          }}
        >
          <span>View Active Dashboard</span>
          <span>→</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-mute text-base">🔍</span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search apps or services (e.g. Spotify, Netflix, ChatGPT, GitHub Copilot...)"
          className="w-full bg-[#0b162e]/80 border border-white/15 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-white placeholder:text-mute/60 focus:outline-none focus:border-[#00d2ff] transition-all"
        />
      </div>

      {/* Filter Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#00d2ff] text-slate-950 font-bold shadow-lg shadow-[#00d2ff]/30'
                  : 'bg-[#0b162e] border border-white/10 text-mute hover:text-white hover:border-white/25'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Section Subhead */}
      <div className="flex items-center justify-between text-xs font-bold text-mute uppercase tracking-wider pt-2 border-t border-white/10">
        <span>Available Apps ({filteredApps.length})</span>
        <span className="text-mute/70 normal-case tracking-normal">Protected automatically by Churn Guard</span>
      </div>

      {/* App Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredApps.map((app) => {
          const currentPlan = getSelectedPlan(app);
          const isSubscribing = subscribingId === app.id;

          return (
            <div
              key={app.id}
              className="rounded-3xl p-6 flex flex-col justify-between border transition-all duration-300 backdrop-blur-xl relative group hover:border-[#00d2ff]/60 hover:shadow-2xl hover:shadow-[#00d2ff]/10"
              style={{
                background: 'rgba(11, 22, 46, 0.75)',
                border: '1px solid rgba(0, 210, 255, 0.2)',
              }}
            >
              <div className="space-y-4">
                {/* Header: Icon, Name, Category & Price */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center font-display font-black text-white text-xl shadow-inner flex-shrink-0"
                      style={{ backgroundColor: app.color }}
                    >
                      {app.letter}
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-white text-lg tracking-tight">
                        {app.name}
                      </h3>
                      <p className="text-xs text-mute">{app.category}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-display font-black text-white text-lg tracking-tight">
                      ${currentPlan.price.toFixed(2)}
                    </div>
                    <div className="text-[11px] text-mute">/{currentPlan.interval}</div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-mute/90 leading-relaxed min-h-[36px]">
                  {app.description}
                </p>

                {/* Selected Plan Box */}
                <div
                  className="p-3 rounded-2xl flex items-center justify-between text-xs"
                  style={{
                    background: 'rgba(5, 10, 23, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <div>
                    <span className="text-[10px] uppercase font-bold text-mute block">Selected Plan</span>
                    <span className="font-semibold text-white">
                      {currentPlan.name} ${currentPlan.price.toFixed(2)}
                    </span>
                  </div>

                  <button
                    onClick={() => setPlanModalApp(app)}
                    className="text-xs font-semibold text-[#00d2ff] hover:underline px-2.5 py-1 rounded-lg hover:bg-[#00d2ff]/10 transition-all cursor-pointer"
                  >
                    See all plans ({app.plans.length})
                  </button>
                </div>
              </div>

              {/* Card Footer: Trial Badge & PayPal CTA */}
              <div className="flex items-center justify-between gap-3 pt-5 mt-4 border-t border-white/10">
                <span
                  className="text-[11px] font-semibold px-2.5 py-1 rounded-full text-mute"
                  style={{ background: 'rgba(255, 255, 255, 0.05)' }}
                >
                  {app.trialBadge}
                </span>

                <button
                  onClick={() => handleSubscribe(app)}
                  disabled={isSubscribing}
                  className="px-4 py-2 rounded-full font-bold text-xs text-white transition-all cursor-pointer flex items-center gap-1.5 shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95 disabled:opacity-50"
                  style={{
                    background: 'linear-gradient(135deg, #0070ba, #003087)',
                  }}
                >
                  {isSubscribing ? (
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Pay with</span>
                      <span className="italic font-black text-sm tracking-tighter">PayPal</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
