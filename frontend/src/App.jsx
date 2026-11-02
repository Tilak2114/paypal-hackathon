import React, { useState } from 'react';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import AddSubscriptions from './pages/AddSubscriptions';

export default function App() {
  const [currentPage, setCurrentPage] = useState('landing');

  return (
    <div className="min-h-screen bg-bg text-ink selection:bg-mint selection:text-slate-950 flex flex-col justify-between">
      {/* Top Navbar */}
      <nav className="sticky top-0 z-40 bg-bg/80 backdrop-blur-xl border-b border-line/50 px-6 sm:px-12 py-4 flex items-center justify-between">
        <div
          onClick={() => setCurrentPage('landing')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-6 h-7 bg-gradient-to-tr from-mint to-indigo-500 rounded-sm clip-shield group-hover:scale-105 transition-transform" />
          <span className="font-display font-extrabold text-xl tracking-tight text-ink group-hover:text-mint transition-colors">
            Churn Guard
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 text-xs font-semibold">
          <button
            onClick={() => setCurrentPage('landing')}
            className={`px-3.5 py-1.5 rounded-full transition-all ${
              currentPage === 'landing'
                ? 'bg-white/10 text-mint'
                : 'text-mute hover:text-ink'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setCurrentPage('dashboard')}
            className={`px-3.5 py-1.5 rounded-full transition-all ${
              currentPage === 'dashboard'
                ? 'bg-white/10 text-mint'
                : 'text-mute hover:text-ink'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setCurrentPage('add')}
            className={`px-3.5 py-1.5 rounded-full transition-all ${
              currentPage === 'add'
                ? 'bg-white/10 text-mint'
                : 'text-mute hover:text-ink'
            }`}
          >
            AI Scanner
          </button>

          <button
            onClick={() => setCurrentPage('dashboard')}
            className="hidden sm:inline-block ml-2 px-5 py-2 rounded-full bg-mint text-slate-950 font-bold hover:shadow-lg hover:shadow-mint/30 hover:-translate-y-0.5 transition-all"
          >
            Launch Demo
          </button>
        </div>
      </nav>

      {/* Main View Router */}
      <main className="flex-1">
        {currentPage === 'landing' && <Landing onNavigate={setCurrentPage} />}
        {currentPage === 'dashboard' && <Dashboard onNavigate={setCurrentPage} />}
        {currentPage === 'add' && <AddSubscriptions onNavigate={setCurrentPage} />}
      </main>

      {/* Footer */}
      <footer className="border-t border-line/40 py-8 px-6 text-center text-xs text-mute/80 space-y-1">
        <p>Churn Guard • Built for PayPal Hackathon 2026</p>
        <p className="text-[11px] text-mute/50">
          Integrated with PayPal Subscriptions, Billing Agreements & Webhooks.
        </p>
      </footer>
    </div>
  );
}
