// frontend/src/pages/Settings.jsx
import React, { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import ConfirmDialog from '../components/ConfirmDialog';
import StatementUpload from '../components/StatementUpload';

export default function Settings() {
  const { user, connectPayPal, disconnectPayPal, syncPayPal } = useAuth();
  const [syncing, setSyncing] = useState(false);
  const [disconnectModalOpen, setDisconnectModalOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await syncPayPal();
      showToast("✅ Successfully synced transactions and subscription renewals with PayPal.");
    } catch (e) {
      showToast("⚠️ Sync failed. Please try again.");
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnectConfirm = async () => {
    await disconnectPayPal();
    setDisconnectModalOpen(false);
    showToast("Disconnected PayPal. Automated Pause and Cancel actions are now paused.");
  };

  const handleUploadSuccess = async () => {
    setUploadModalOpen(false);
    showToast("Statement successfully uploaded! New recurring transactions indexed.");
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8 text-left relative z-10">
      {/* Toast */}
      {toast && (
        <div className="fixed top-20 right-6 z-50 px-5 py-3 rounded-2xl bg-modal-bg border border-mint text-white text-xs font-bold shadow-2xl animate-bounce">
          {toast}
        </div>
      )}

      {/* Header */}
      <div>
        <span className="text-[10px] font-bold tracking-widest uppercase text-mint">
          Account Settings
        </span>
        <h1 className="font-display font-black text-3xl sm:text-4xl text-white">
          Payment Connections & Integrations
        </h1>
        <p className="text-xs text-mute mt-1">
          Manage your connected PayPal OAuth sandbox account, statement sync schedule, and permissions.
        </p>
      </div>

      {/* Connection Card */}
      <div 
        className="rounded-3xl p-6 sm:p-8 space-y-6"
        style={{
          background: 'var(--card-surface)',
          border: '1px solid var(--card-border)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-line/30">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#003087] flex items-center justify-center font-display font-black text-xl text-white shadow-lg">
              <span className="text-[#00d2ff]">P</span>P
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-lg text-white">PayPal Sandbox</h3>
                {user?.paypalConnected ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-mint/15 text-mint border border-mint/30">
                    Connected
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-coral/20 text-coral border border-coral/30">
                    Disconnected
                  </span>
                )}
              </div>
              <p className="text-xs text-mute mt-0.5">
                {user?.paypalConnected
                  ? `Linked identity: ${user.paypalEmail || user.email}`
                  : "Connect your PayPal sandbox account to enable 1-tap Pause & Cancel."}
              </p>
            </div>
          </div>

          <div>
            {user?.paypalConnected ? (
              <button
                type="button"
                onClick={() => setDisconnectModalOpen(true)}
                className="px-4 py-2 rounded-full text-xs font-bold text-coral bg-coral/10 border border-coral/30 hover:bg-coral/20 cursor-pointer"
              >
                Disconnect PayPal
              </button>
            ) : (
              <button
                type="button"
                onClick={() => connectPayPal("sandbox-judge@paypal.com")}
                className="px-5 py-2.5 rounded-full text-xs font-bold text-white bg-[#0070ba] hover:bg-[#003087] shadow-lg cursor-pointer"
              >
                Connect with PayPal
              </button>
            )}
          </div>
        </div>

        {/* Sync Status & Action Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-bg2/60 border border-line/20 space-y-1">
            <span className="text-[10px] font-bold text-mute uppercase">Last Ledger Sync</span>
            <p className="font-semibold text-xs text-white">
              {user?.lastSyncAt ? new Date(user.lastSyncAt).toLocaleString() : 'Never synced'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-bg2/60 border border-line/20 space-y-1">
            <span className="text-[10px] font-bold text-mute uppercase">Auto-Cancel Engine</span>
            <p className="font-semibold text-xs text-mint">
              {user?.paypalConnected ? "✓ Ready (PayPal Webhook Active)" : "⚠️ Inactive"}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleSync}
            disabled={syncing || !user?.paypalConnected}
            className="px-5 py-2.5 rounded-full text-xs font-bold text-navy bg-mint shadow-md hover:scale-105 active:scale-95 disabled:opacity-40 transition-all cursor-pointer flex items-center gap-2"
          >
            {syncing && <div className="w-3.5 h-3.5 border-2 border-navy/20 border-t-navy rounded-full animate-spin" />}
            <span>Sync Ledger Now</span>
          </button>

          <button
            type="button"
            onClick={() => setUploadModalOpen(true)}
            className="px-5 py-2.5 rounded-full text-xs font-bold text-white bg-bg2 border border-line/40 hover:border-mint/50 cursor-pointer"
          >
            📁 Re-upload Statement (.csv / .pdf)
          </button>
        </div>
      </div>

      {/* Disconnect Confirmation Modal */}
      <ConfirmDialog
        isOpen={disconnectModalOpen}
        title="Disconnect PayPal Account?"
        serviceName="PayPal Sandbox Integration"
        effectDescription="Disconnecting will halt automatic transaction scanning and trial-ending renewal alarms. One-tap Pause and Cancel via PayPal will no longer work until you reconnect."
        confirmText="Yes, Disconnect"
        confirmColor="#ff3d71"
        onConfirm={handleDisconnectConfirm}
        onCancel={() => setDisconnectModalOpen(false)}
      />

      {/* Upload Statement Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-xl w-full">
            <StatementUpload
              onUploadSuccess={handleUploadSuccess}
              onBackToOAuth={() => setUploadModalOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
