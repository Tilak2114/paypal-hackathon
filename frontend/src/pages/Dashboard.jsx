import React, { useState, useEffect } from 'react';
import SubscriptionCard from '../components/SubscriptionCard';
import SavingsMeter from '../components/SavingsMeter';
import AlertFeed from '../components/AlertFeed';
import { getSubscriptions, pauseSub, cancelSub, undoSub } from '../api/client';

export default function Dashboard({ onNavigate }) {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const fetchSubs = async () => {
    try {
      setLoading(true);
      const data = await getSubscriptions();
      setSubscriptions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubs();
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handlePause = async (id) => {
    const target = subscriptions.find((s) => s.id === id);
    await pauseSub(id);
    setSubscriptions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: 'paused' } : s))
    );
    showToast(`Paused ${target ? target.name : 'subscription'} via PayPal.`);
  };

  const handleCancel = async (id) => {
    const target = subscriptions.find((s) => s.id === id);
    await cancelSub(id);
    setSubscriptions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: 'cancelled' } : s))
    );
    const yearly = target ? target.cost * 12 : 0;
    showToast(
      `Cancelled ${target ? target.name : 'subscription'}. You're keeping $${yearly.toFixed(
        2
      )}/yr.`
    );
  };

  const handleUndo = async (id) => {
    const target = subscriptions.find((s) => s.id === id);
    await undoSub(id);
    setSubscriptions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: 'active' } : s))
    );
    showToast(`Restored ${target ? target.name : 'subscription'}.`);
  };

  // Calculations for SavingsMeter
  const totalMonthly = subscriptions.reduce((acc, curr) => acc + curr.cost, 0);
  const activeMonthly = subscriptions.reduce(
    (acc, curr) => acc + (curr.status === 'active' ? curr.cost : 0),
    0
  );

  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-12 py-10 space-y-10">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-bg border border-mint/40 text-mint px-5 py-3.5 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center gap-3 animate-bounce">
          <span className="w-2 h-2 rounded-full bg-mint" />
          <span className="text-sm font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-black text-3xl sm:text-4xl text-ink tracking-tight">
            Subscription Command Center
          </h1>
          <p className="text-mute text-sm mt-1">
            Review active PayPal billing plans and optimize redundant spending.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('add')}
            className="px-5 py-2.5 rounded-full bg-mint hover:bg-mint/90 text-slate-950 text-xs font-bold shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-2"
          >
            <span>+</span> Paste & Scan New
          </button>
        </div>
      </div>

      {/* 2-Column Responsive Layout: Left cards, Right stats & alert feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (7 cols): Cards */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm uppercase font-bold tracking-wider text-mute">
              Monitored Recurring Plans ({subscriptions.length})
            </h2>
            <button
              onClick={fetchSubs}
              className="text-xs text-mute hover:text-ink transition-colors flex items-center gap-1"
            >
              ↻ Refresh
            </button>
          </div>

          {loading ? (
            <div className="p-12 text-center text-mute text-sm animate-pulse border border-line rounded-2xl">
              Fetching PayPal subscriptions...
            </div>
          ) : (
            <div className="space-y-3">
              {subscriptions.map((sub) => (
                <SubscriptionCard
                  key={sub.id}
                  sub={sub}
                  onPause={handlePause}
                  onCancel={handleCancel}
                  onUndo={handleUndo}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right Column (5 cols): Savings Meter + Alerts */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
          <SavingsMeter
            totalMonthly={totalMonthly}
            activeMonthly={activeMonthly}
          />

          <div className="bg-card border border-line rounded-3xl p-6 backdrop-blur-xl">
            <AlertFeed subscriptions={subscriptions} />
          </div>
        </div>
      </div>
    </div>
  );
}
