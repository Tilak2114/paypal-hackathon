import React from 'react';
import Hero3D from '../components/Hero3D';

export default function Landing({ onNavigate }) {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* 3D Canvas Background on Desktop / Tablet */}
      <div className="absolute inset-0 z-0 opacity-80 pointer-events-none">
        <Hero3D />
      </div>

      {/* Hero Section */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-12 pt-20 pb-28 min-h-[90vh] flex flex-col justify-center">
        <div className="max-w-2xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-mint/30 bg-mint/10 text-mint text-xs font-bold tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-mint animate-ping" />
            Built for PayPal Hackathon 2026
          </div>

          <h1 className="font-display font-black text-5xl sm:text-6xl md:text-7xl text-ink leading-[1.05] tracking-tight">
            Cancel what you forgot you were paying for.
          </h1>

          <p className="text-mute text-lg sm:text-xl font-normal leading-relaxed max-w-xl">
            Churn Guard audits recurring transactions, identifies forgotten zombie subscriptions, warns you before free trials charge, and lets you pause or cancel instantly through PayPal.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-4">
            <button
              onClick={() => onNavigate('dashboard')}
              className="px-8 py-4 rounded-full bg-mint hover:bg-mint/90 text-slate-950 font-bold text-base shadow-lg shadow-mint/25 hover:shadow-mint/40 hover:-translate-y-0.5 transition-all"
            >
              Launch Dashboard Demo →
            </button>

            <button
              onClick={() => onNavigate('add')}
              className="px-8 py-4 rounded-full border border-line bg-card/60 hover:bg-card hover:border-mint/50 text-ink font-semibold text-base backdrop-blur-md transition-all"
            >
              Scan Subscriptions (AI)
            </button>
          </div>
        </div>
      </div>

      {/* Feature Pillar Cards */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 sm:px-12 py-20 border-t border-line/40">
        <div className="text-center max-w-xl mx-auto space-y-3 mb-16">
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-ink">
            Three jobs, done for you
          </h2>
          <p className="text-mute text-base">
            Paste your bank statement or connect PayPal. Churn Guard does the checking so you never overpay.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card border border-line rounded-3xl p-8 backdrop-blur-xl hover:border-mint/40 hover:-translate-y-1 transition-all">
            <div className="w-14 h-14 rounded-2xl bg-mint/20 text-mint flex items-center justify-center text-2xl mb-6 shadow-inner">
              🔍
            </div>
            <h3 className="font-display font-bold text-xl text-ink mb-2">Audit & Detect</h3>
            <p className="text-mute text-sm leading-relaxed">
              Finds recurring bills unused in weeks and flags redundant overlaps, like two streaming music services with the same catalog.
            </p>
          </div>

          <div className="bg-card border border-line rounded-3xl p-8 backdrop-blur-xl hover:border-coral/40 hover:-translate-y-1 transition-all">
            <div className="w-14 h-14 rounded-2xl bg-coral/20 text-coral flex items-center justify-center text-2xl mb-6 shadow-inner">
              ⏰
            </div>
            <h3 className="font-display font-bold text-xl text-ink mb-2">Warn & Recommend</h3>
            <p className="text-mute text-sm leading-relaxed">
              Alerts you 48 hours before free trials convert to paid charges, and suggests cheaper tiers tailored to actual usage metrics.
            </p>
          </div>

          <div className="bg-card border border-line rounded-3xl p-8 backdrop-blur-xl hover:border-indigo-400/40 hover:-translate-y-1 transition-all">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-2xl mb-6 shadow-inner">
              ⚡
            </div>
            <h3 className="font-display font-bold text-xl text-ink mb-2">1-Click PayPal Act</h3>
            <p className="text-mute text-sm leading-relaxed">
              Direct integration with PayPal's Subscriptions and Billing Agreements API to safely pause, cancel, or resume payments instantly.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
