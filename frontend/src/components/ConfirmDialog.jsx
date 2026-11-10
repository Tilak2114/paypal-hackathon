// frontend/src/components/ConfirmDialog.jsx
import React, { useEffect, useRef } from 'react';

export default function ConfirmDialog({
  isOpen,
  title,
  serviceName,
  amount,
  effectDescription,
  confirmText = "Confirm Action",
  confirmColor = "#00d2ff",
  onConfirm,
  onCancel,
  loading = false,
  isConnectPrompt = false,
  onConnectPayPal
}) {
  const dialogRef = useRef(null);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen && !loading) {
        onCancel();
      }
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, onCancel]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[70] bg-black/75 backdrop-blur-md flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div
        ref={dialogRef}
        className="w-full max-w-md rounded-3xl p-7 space-y-6 text-left shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        style={{
          background: 'var(--modal-bg)',
          border: '1px solid var(--card-border)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)'
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <span className="text-[10px] font-bold tracking-widest uppercase text-mint">
              {isConnectPrompt ? "PayPal Connection Required" : "Explicit Confirmation"}
            </span>
            <h3 id="confirm-dialog-title" className="font-display font-black text-xl text-white">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="text-mute hover:text-white p-1"
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        {/* Details Card */}
        <div className="p-4 rounded-2xl bg-bg2/80 border border-line/30 space-y-2">
          {serviceName && (
            <div className="flex justify-between text-xs">
              <span className="text-mute">Service</span>
              <span className="font-bold text-white">{serviceName}</span>
            </div>
          )}
          {amount !== undefined && (
            <div className="flex justify-between text-xs">
              <span className="text-mute">Monthly Amount</span>
              <span className="font-bold text-mint">${typeof amount === 'number' ? amount.toFixed(2) : amount}/mo</span>
            </div>
          )}
          <div className="pt-2 border-t border-line/20 text-xs text-mute/90 leading-relaxed">
            {effectDescription}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-5 py-2.5 rounded-full text-xs font-semibold text-mute hover:text-white transition-colors cursor-pointer"
          >
            Cancel
          </button>

          {isConnectPrompt ? (
            <button
              type="button"
              onClick={onConnectPayPal}
              className="px-6 py-2.5 rounded-full font-bold text-xs text-white shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, #0070ba, #003087)',
                boxShadow: '0 4px 15px rgba(0, 112, 186, 0.4)'
              }}
            >
              Connect with PayPal →
            </button>
          ) : (
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="px-6 py-2.5 rounded-full font-bold text-xs text-navy shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
              style={{
                backgroundColor: confirmColor,
                boxShadow: `0 4px 15px ${confirmColor}55`
              }}
            >
              {loading && <div className="w-3.5 h-3.5 border-2 border-navy/20 border-t-navy rounded-full animate-spin" />}
              <span>{confirmText}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
