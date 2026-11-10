// frontend/src/components/NotificationBell.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';

export default function NotificationBell({ onActionClick }) {
  const { alerts, unreadAlertCount, markAlertRead, dismissAlert } = useAuth();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleAction = (alert, action) => {
    markAlertRead(alert.id);
    setOpen(false);
    if (onActionClick) {
      onActionClick(alert, action);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer relative hover:scale-105"
        style={{
          border: '1px solid rgba(0, 210, 255, 0.4)',
          background: 'rgba(0, 210, 255, 0.08)',
          color: '#00d2ff'
        }}
        aria-label="Notifications"
        title="Alerts Feed"
      >
        <span className="text-base">🔔</span>

        {unreadAlertCount > 0 && (
          <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full font-bold text-[10px] bg-coral text-white animate-pulse shadow-md">
            {unreadAlertCount}
          </span>
        )}
      </button>

      {/* Dropdown Feed */}
      {open && (
        <div 
          className="absolute right-0 mt-3 w-80 sm:w-96 rounded-3xl p-4 sm:p-5 space-y-4 shadow-2xl z-50 text-left border"
          style={{
            background: 'var(--modal-bg)',
            borderColor: 'var(--card-border)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)'
          }}
        >
          <div className="flex items-center justify-between pb-2 border-b border-line/30">
            <div className="flex items-center gap-2">
              <h3 className="font-display font-bold text-sm text-white">Renewal Alarms</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-mint/15 text-mint font-bold">
                {alerts.length} total
              </span>
            </div>
            <span className="text-[11px] text-mute">Driven by PayPal API</span>
          </div>

          <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
            {alerts.length === 0 ? (
              <p className="text-xs text-mute py-6 text-center">No active alarms or alerts right now.</p>
            ) : (
              alerts.map((alert) => {
                const isHigh = alert.severity === 'high';
                return (
                  <div
                    key={alert.id}
                    className={`p-3 rounded-2xl border transition-all ${
                      !alert.read
                        ? 'bg-bg2/90 border-mint/40 shadow-sm'
                        : 'bg-bg/40 border-line/20 opacity-80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs">
                          {alert.type === 'trial_ending' ? '⏳' : alert.type === 'overlap' ? '⚡' : '📈'}
                        </span>
                        <h4 className="font-bold text-xs text-white">{alert.title}</h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => dismissAlert(alert.id)}
                        className="text-[10px] text-mute hover:text-white"
                        title="Dismiss"
                      >
                        ✕
                      </button>
                    </div>

                    <p className="text-[11px] text-mute mt-1 leading-snug">
                      {alert.message}
                    </p>

                    {/* Suggested Action Bar */}
                    <div className="mt-2.5 pt-2 border-t border-line/20 flex items-center justify-between">
                      <span className="text-[10px] text-mute font-medium">
                        Suggested: <span className="text-mint font-bold uppercase">{alert.action_suggested}</span>
                      </span>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleAction(alert, alert.action_suggested)}
                          className="px-2.5 py-1 rounded-full text-[10px] font-bold text-navy bg-mint hover:scale-105 transition-transform"
                        >
                          {alert.action_suggested === 'pause' ? 'Pause' : alert.action_suggested === 'cancel' ? 'Cancel' : 'Review'}
                        </button>
                        <button
                          type="button"
                          onClick={() => markAlertRead(alert.id)}
                          className="px-2 py-1 rounded-full text-[10px] font-semibold text-mute hover:text-white"
                        >
                          Keep
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
