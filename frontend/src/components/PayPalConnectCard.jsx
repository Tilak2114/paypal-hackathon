// frontend/src/components/PayPalConnectCard.jsx
import React from 'react';

export default function PayPalConnectCard({ onConnect, connecting, onSwitchToUpload }) {
  return (
    <div className="w-full space-y-6">
      {/* Primary OAuth Box */}
      <div 
        className="rounded-3xl p-6 sm:p-8 space-y-6 text-left relative overflow-hidden"
        style={{
          background: 'var(--card-surface)',
          border: '1px solid var(--card-border)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#003087] flex items-center justify-center font-display font-black text-xl text-white shadow-lg">
              <span className="text-[#00d2ff]">P</span>P
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-white">Log in with PayPal</h3>
              <p className="text-xs text-mute">Official Sandbox OAuth 2.0 Integration</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-mint/15 text-mint border border-mint/30">
            Recommended
          </span>
        </div>

        {/* Permissions Requested */}
        <div className="space-y-2.5 pt-2 border-t border-line/30">
          <p className="text-xs font-bold text-white uppercase tracking-wider">
            Permissions Requested
          </p>
          <ul className="space-y-2 text-xs text-mute">
            <li className="flex items-start gap-2.5">
              <span className="text-mint font-bold text-sm leading-none mt-0.5">✓</span>
              <div>
                <strong className="text-white">View transaction history:</strong> To identify periodic and recurring billing patterns.
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-mint font-bold text-sm leading-none mt-0.5">✓</span>
              <div>
                <strong className="text-white">View subscription agreements:</strong> To look up renewal dates, cycles, and prices.
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-mint font-bold text-sm leading-none mt-0.5">✓</span>
              <div>
                <strong className="text-white">Manage subscriptions:</strong> Gives Sentinel permission to Pause or Cancel on your explicit demand.
              </div>
            </li>
          </ul>
        </div>

        {/* Plain Language Privacy Note */}
        <div className="p-3.5 rounded-2xl bg-bg/80 border border-line/30 text-[11px] text-mute space-y-1">
          <div className="flex items-center gap-1.5 text-mint font-bold">
            <span>🔒</span>
            <span>Zero-Credential Guarantee</span>
          </div>
          <p>
            We never see or store your PayPal password, card numbers, or bank details. Authentication is handled directly on PayPal's secured domain. We never move funds without your explicit confirmation.
          </p>
        </div>

        {/* Connect Action Button */}
        <button
          type="button"
          onClick={onConnect}
          disabled={connecting}
          className="w-full py-3.5 px-6 rounded-full font-bold text-sm text-white transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          style={{
            background: 'linear-gradient(135deg, #0070ba, #003087)',
            boxShadow: '0 6px 20px rgba(0, 112, 186, 0.45)'
          }}
        >
          {connecting ? (
            <>
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              <span>Redirecting to PayPal Sandbox...</span>
            </>
          ) : (
            <>
              <span>Connect with PayPal</span>
              <span>→</span>
            </>
          )}
        </button>
      </div>

      {/* Fallback Option */}
      <div className="text-center pt-2">
        <p className="text-xs text-mute mb-3">— or don't have PayPal sandbox access right now? —</p>
        <button
          type="button"
          onClick={onSwitchToUpload}
          className="inline-flex items-center gap-2 text-xs font-bold text-mint hover:underline cursor-pointer"
        >
          <span>📁 Upload your PayPal statement (.csv or .pdf)</span>
          <span>↓</span>
        </button>
      </div>
    </div>
  );
}
