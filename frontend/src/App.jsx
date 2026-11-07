import React, { useState } from 'react';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import AddSubscriptions from './pages/AddSubscriptions';
import SignIn from './pages/SignIn';
import Hero3D from './components/Hero3D';

export default function App() {
  const [user, setUser] = useState(null); // null = unauthenticated (shows Sign In on front)
  const [currentPage, setCurrentPage] = useState('landing'); // 'landing' | 'dashboard' | 'add'

  const handleSignInSuccess = (userData) => {
    setUser(userData);
    setCurrentPage('landing'); // Opens the landing page right after signing in
  };

  const handleSignOut = () => {
    setUser(null);
  };

  return (
    <div className="min-h-screen bg-bg text-ink selection:bg-mint selection:text-slate-950 flex flex-col justify-between relative overflow-x-hidden">
      {/* 3D Global Canvas in Background (always alive behind sign in & landing) */}
      <div className={`fixed inset-0 pointer-events-none transition-opacity duration-700 ${!user || currentPage === 'landing' ? 'opacity-85' : 'opacity-20'}`}>
        <Hero3D />
      </div>

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-bg/85 backdrop-blur-xl border-b border-line/50 w-full flex justify-center">
        <nav className="max-w-7xl w-full px-6 sm:px-12 py-4 flex items-center justify-between">
          <div
            onClick={() => user && setCurrentPage('landing')}
            className={`flex items-center gap-3 ${user ? 'cursor-pointer group' : ''}`}
          >
            <div className="w-5 h-6 bg-gradient-to-tr from-mint to-indigo-500 clip-shield group-hover:scale-105 transition-transform" />
            <span className="font-display font-extrabold text-xl tracking-tight text-ink group-hover:text-mint transition-colors">
              Churn Guard
            </span>
          </div>

          {/* Nav links only visible once signed in */}
          {user ? (
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

              <div className="flex items-center gap-2.5 ml-2">
                <span className="hidden sm:inline-block px-3 py-1.5 rounded-full bg-white/5 border border-line text-mint text-[11px] font-medium">
                  ● {user.name}
                </span>
                <button
                  onClick={handleSignOut}
                  className="px-3.5 py-1.5 rounded-full border border-line text-mute hover:text-coral hover:border-coral/40 transition-all text-xs"
                >
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-mute font-semibold">
              <span className="hidden sm:inline-block px-3 py-1 rounded-full border border-mint/30 bg-mint/10 text-mint text-[11px]">
                PayPal Hackathon Gate
              </span>
            </div>
          )}
        </nav>
      </header>

      {/* Main View Router */}
      <main className="flex-1 w-full relative z-10 flex flex-col items-center">
        {/* If user is NOT signed in: Front page is ONLY the Sign In modal over the 3D background */}
        {!user ? (
          <SignIn
            onSignInSuccess={handleSignInSuccess}
          />
        ) : (
          /* Once signed in: show the landing, dashboard, or add screens */
          <>
            {currentPage === 'landing' && <Landing onNavigate={setCurrentPage} />}
            {currentPage === 'dashboard' && <Dashboard onNavigate={setCurrentPage} />}
            {currentPage === 'add' && <AddSubscriptions onNavigate={setCurrentPage} />}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-line/40 py-8 px-6 text-center text-xs text-mute/80 space-y-1 w-full flex flex-col items-center">
        <p>Churn Guard • Built for PayPal Hackathon 2026</p>
        <p className="text-[11px] text-mute/50">
          Integrated with PayPal Subscriptions, Billing Agreements & Webhooks.
        </p>
      </footer>
    </div>
  );
}
