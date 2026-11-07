import React from 'react';

export default function Landing({ onGetStarted, onSeeDemo, hasScanned }) {
  return (
    <div className="relative z-10 w-full min-h-[calc(100vh-80px)] flex items-center justify-center px-6 sm:px-12 py-16">
      <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* Left Column: Content Area in Navy & Icy Blue */}
        <div className="lg:col-span-6 flex flex-col justify-center items-start text-left space-y-4 max-w-lg">
          <div 
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold tracking-wide shadow-sm"
            style={{
              border: '1px solid rgba(0, 210, 255, 0.5)',
              background: 'rgba(0, 210, 255, 0.08)',
              color: '#00d2ff'
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-ping" style={{ background: '#00d2ff' }} />
            PayPal Subscriptions & Recurring Payments Guard
          </div>

          <h1 className="font-display font-black text-3xl sm:text-4xl lg:text-5xl text-white leading-[1.08] tracking-tight">
            Cancel what you forgot you were paying for.
          </h1>

          <p className="text-mute text-sm sm:text-base font-normal leading-relaxed max-w-md">
            Churn Guard reads your subscriptions, spots the ones you never open, and warns you before trials end or prices rise. Pause or cancel with one tap through PayPal.
          </p>

          {/* Exactly 2 Clean Buttons: Get started (main) + See a demo */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={onGetStarted}
              className="px-7 py-3.5 rounded-full font-bold text-sm shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer flex items-center gap-2"
              style={{
                background: '#00d2ff',
                color: '#030814',
                boxShadow: '0 0 25px rgba(0, 210, 255, 0.45)'
              }}
            >
              <span>Get started</span>
              <span>→</span>
            </button>

            <button
              onClick={onSeeDemo}
              className="px-6 py-3.5 rounded-full text-white font-semibold text-sm backdrop-blur-md hover:-translate-y-0.5 transition-all cursor-pointer flex items-center gap-2"
              style={{
                border: '1px solid rgba(0, 210, 255, 0.4)',
                background: 'rgba(255, 255, 255, 0.04)'
              }}
            >
              <span>See a demo</span>
              <span className="text-xs text-mute">(Sample Data)</span>
            </button>
          </div>

          <p className="text-[11px] text-mute/80 pt-1">
            {hasScanned 
              ? "✓ Subscriptions already synced — clicks directly to your active dashboard."
              : "New here? 'Get started' launches the scanner to import your statement in 30 seconds."}
          </p>

          {/* Quick Stat Bar */}
          <div className="pt-4 border-t border-line/40 grid grid-cols-3 gap-4 text-left w-full">
            <div>
              <div className="font-display font-black text-xl" style={{ color: '#00d2ff' }}>$420+</div>
              <div className="text-[11px] text-mute mt-0.5">Avg. Yearly Saved</div>
            </div>
            <div>
              <div className="font-display font-black text-xl text-white">1-Tap</div>
              <div className="text-[11px] text-mute mt-0.5">PayPal Pause/Cancel</div>
            </div>
            <div>
              <div className="font-display font-black text-xl text-coral">48h</div>
              <div className="text-[11px] text-mute mt-0.5">Advance Warnings</div>
            </div>
          </div>
        </div>

        {/* Right Column: Visual Anchor on Widescreen */}
        <div className="hidden lg:flex lg:col-span-6 flex-col items-center justify-center pointer-events-none">
          <div className="w-full h-[450px]" />
        </div>

      </div>
    </div>
  );
}
