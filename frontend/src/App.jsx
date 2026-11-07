import React, { useState } from 'react';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import AddSubscriptions from './pages/AddSubscriptions';
import SignIn from './pages/SignIn';
import Hero3D from './components/Hero3D';

export default function App() {
  const [currentPage, setCurrentPage] = useState('landing');
  const [user, setUser] = useState(null); // { name, email, method }

  const handleSignInSuccess = (userData) => {
    setUser(userData);
    setCurrentPage('dashboard');
  };

  const handleSignOut = () => {
    setUser(null);
    setCurrentPage('landing');
  };

  return (
    <div className="min-h-screen bg-bg text-ink selection:bg-mint selection:text-slate-950 flex flex-col justify-between relative overflow-x-hidden">
      {/* 3D Global Canvas in Background */}
      <div className={`fixed inset-0 pointer-events-none transition-opacity duration-700 ${currentPage === 'landing' ? 'opacity-85' : 'opacity-20'}`}>
        <Hero3D />
      </div>

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-bg/85 backdrop-blur-xl border-b border-line/50 w-full flex justify-center">
        <nav className="max-w-7xl w-full px-6 sm:px-12 py-4 flex items-center justify-between">
          <div
            onClick={() => setCurrentPage('landing')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-5 h-6 bg-gradient-to-tr from-mint to-indigo-500 clip-shield group-hover:scale-105 transition-transform" />
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

            {/* Auth State Button */}
            {user ? (
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
            ) : (
              <button
                onClick={() => setCurrentPage('signin')}
                className={`ml-2 px-5 py-2 rounded-full font-bold transition-all shadow-md ${
                  currentPage === 'signin'
                    ? 'bg-white/15 text-mint border border-mint/40'
                    : 'bg-mint text-slate-950 hover:shadow-lg hover:shadow-mint/30 hover:-translate-y-0.5'
                }`}
              >
                Sign In
              </button>
            )}
          </div>
        </nav>
      </header>

      {/* Main View Router */}
      <main className="flex-1 w-full relative z-10 flex flex-col items-center">
        {currentPage === 'landing' && <Landing onNavigate={setCurrentPage} />}
        {currentPage === 'dashboard' && <Dashboard onNavigate={setCurrentPage} />}
        {currentPage === 'add' && <AddSubscriptions onNavigate={setCurrentPage} />}
        {currentPage === 'signin' && (
          <SignIn
            onNavigate={setCurrentPage}
            onSignInSuccess={handleSignInSuccess}
          />
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
