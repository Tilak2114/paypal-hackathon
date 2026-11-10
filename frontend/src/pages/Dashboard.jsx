import React, { useState, useEffect } from 'react';
import SubscriptionCard from '../components/SubscriptionCard';
import SavingsMeter from '../components/SavingsMeter';
import AlertFeed from '../components/AlertFeed';
import ConfirmDialog from '../components/ConfirmDialog';
import SavingsJarPopup from '../components/SavingsJarPopup';
import { useAuth } from '../auth/AuthContext';
import { getSubscriptions, pauseSub, cancelSub, undoSub } from '../api/client';

export default function Dashboard({ onNavigate, onBack }) {
  const { user, connectPayPal } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [pendingAction, setPendingAction] = useState(null); // { type: 'pause' | 'cancel', sub }
  const [connectPromptOpen, setConnectPromptOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [jarPopup, setJarPopup] = useState({ open: false, fromFill: 0.2, toFill: 0.65 });

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

  // Intercept Pause with PayPal connection check + explicit confirmation
  const handlePause = (id) => {
    const target = subscriptions.find((s) => s.id === id);
    if (!target) return;
    if (target.source === 'external' || target.managedByPaypal === false) {
      showToast('Audit only: This external subscription is not managed via PayPal.', 'error');
      return;
    }
    if (!user?.paypalConnected) {
      setConnectPromptOpen(true);
      return;
    }
    setPendingAction({ type: 'pause', sub: target });
  };

  // Intercept Cancel with PayPal connection check + explicit confirmation
  const handleCancel = (id) => {
    const target = subscriptions.find((s) => s.id === id);
    if (!target) return;
    if (target.source === 'external' || target.managedByPaypal === false) {
      showToast('Audit only: This external subscription is not managed via PayPal.', 'error');
      return;
    }
    if (!user?.paypalConnected) {
      setConnectPromptOpen(true);
      return;
    }
    setPendingAction({ type: 'cancel', sub: target });
  };

  const executeConfirmedAction = async () => {
    if (!pendingAction) return;
    const { type, sub } = pendingAction;
    setActionLoading(true);
    try {
      if (type === 'pause') {
        await pauseSub(sub.id);
        setSubscriptions((prev) =>
          prev.map((s) => (s.id === sub.id ? { ...s, status: 'paused' } : s))
        );
        showToast(`Paused ${sub.name} via PayPal Sandbox.`);
      } else if (type === 'cancel') {
        await cancelSub(sub.id);
        setSubscriptions((prev) =>
          prev.map((s) => (s.id === sub.id ? { ...s, status: 'cancelled' } : s))
        );
        const yearly = (sub.cost || 0) * 12;

        const prevSaved = parseFloat(localStorage.getItem('churnguard_saved') || '0');
        const newSaved = prevSaved + yearly;
        localStorage.setItem('churnguard_saved', newSaved.toString());

        const prevFill = Math.min(prevSaved / 600, 0.75);
        const nextFill = Math.min(Math.max(newSaved / 600, prevFill + 0.35), 0.95);

        setJarPopup({
          open: true,
          fromFill: Math.max(0.18, prevFill),
          toFill: nextFill,
          savedAmount: yearly,
        });
      }
    } catch (err) {
      showToast(`Action failed: ${err.message}`, 'error');
    } finally {
      setActionLoading(false);
      setPendingAction(null);
    }
  };

  const handleUndo = async (id) => {
    const target = subscriptions.find((s) => s.id === id);
    try {
      await undoSub(id);
      setSubscriptions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: 'active' } : s))
      );
      showToast(`Restored ${target ? target.name : 'subscription'}.`);
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Failed to restore subscription.', 'error');
    }
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
        <div 
          className="fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center gap-3 animate-bounce"
          style={{
            background: '#0b162e',
            border: '1px solid #00d2ff',
            color: '#00d2ff',
            boxShadow: '0 0 25px rgba(0, 210, 255, 0.3)'
          }}
        >
          <span className="w-2 h-2 rounded-full" style={{ background: '#00d2ff' }} />
          <span className="text-sm font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Top right Savings Jar Pop-up with Cha-Ching Sound */}
      <SavingsJarPopup
        isOpen={jarPopup.open}
        onClose={() => setJarPopup((prev) => ({ ...prev, open: false }))}
        fromFill={jarPopup.fromFill}
        toFill={jarPopup.toFill}
        savedAmount={jarPopup.savedAmount}
      />

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-black text-3xl sm:text-4xl text-white tracking-tight">
            Subscription Command Center
          </h1>
          <p className="text-mute text-sm mt-1">
            Review active PayPal billing plans and optimize redundant spending.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('directory')}
            className="px-5 py-2.5 rounded-full text-slate-950 text-xs font-bold shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-2 cursor-pointer"
            style={{
              background: '#00d2ff',
              boxShadow: '0 0 20px rgba(0, 210, 255, 0.35)'
            }}
          >
            <span>+</span> Browse Apps
          </button>
        </div>
      </div>

      {/* 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (7 cols): Cards */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs uppercase font-bold tracking-wider text-mute">
              Monitored Recurring Plans ({subscriptions.length})
            </h2>
            <button
              onClick={fetchSubs}
              className="text-xs text-mute hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
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

          <div 
            className="rounded-3xl p-6 backdrop-blur-xl"
            style={{
              background: 'rgba(11, 22, 46, 0.75)',
              border: '1px solid rgba(0, 210, 255, 0.2)'
            }}
          >
            <AlertFeed subscriptions={subscriptions} />
          </div>
        </div>
      </div>

      {/* Explicit Confirm Action Dialog */}
      <ConfirmDialog
        isOpen={Boolean(pendingAction)}
        title={pendingAction?.type === 'pause' ? 'Pause Subscription via PayPal?' : 'Cancel Subscription via PayPal?'}
        serviceName={pendingAction?.sub?.name}
        amount={pendingAction?.sub?.cost}
        effectDescription={
          pendingAction?.type === 'pause'
            ? 'Pausing will suspend upcoming billing cycles through your PayPal Sandbox agreement. You can restore access at any time with one click.'
            : `Cancelling will terminate this recurring billing agreement with PayPal. You will immediately save $${((pendingAction?.sub?.cost || 0) * 12).toFixed(2)} per year.`
        }
        confirmText={pendingAction?.type === 'pause' ? 'Confirm Pause' : 'Confirm Cancel'}
        confirmColor={pendingAction?.type === 'pause' ? '#00d2ff' : '#ff3d71'}
        loading={actionLoading}
        onConfirm={executeConfirmedAction}
        onCancel={() => setPendingAction(null)}
      />

      {/* Connect PayPal Prompt Dialog */}
      <ConfirmDialog
        isOpen={connectPromptOpen}
        isConnectPrompt={true}
        title="Connect PayPal to Manage Subscriptions"
        serviceName="PayPal Sandbox Integration"
        effectDescription="To pause or cancel subscriptions with 1-click, Sentinel requires a connected PayPal account. Connect your sandbox account to continue."
        onConnectPayPal={async () => {
          await connectPayPal("sandbox-judge@paypal.com");
          setConnectPromptOpen(false);
          showToast("Connected to PayPal Sandbox! You can now pause and cancel subscriptions.");
        }}
        onCancel={() => setConnectPromptOpen(false)}
      />
    </div>
  );
}
