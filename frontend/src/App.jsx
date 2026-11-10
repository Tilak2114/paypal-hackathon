// frontend/src/App.jsx
import React, { useState } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import About from './pages/About';
import Dashboard from './pages/Dashboard';
import AppDirectory from './pages/AppDirectory';
import SavingsJar from './pages/SavingsJar';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Onboarding from './pages/Onboarding';
import Settings from './pages/Settings';
import Hero3D from './components/Hero3D';
import NotificationBell from './components/NotificationBell';
import { useAuth } from './auth/AuthContext';
import ProtectedRoute from './auth/ProtectedRoute';

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const [globalToast, setGlobalToast] = useState(null);

  const showGlobalToast = (message) => {
    setGlobalToast(message);
    setTimeout(() => setGlobalToast(null), 4000);
  };

  const navigateTo = (nextPage) => {
    if (nextPage === 'landing') navigate('/');
    else if (nextPage === 'dashboard') navigate('/dashboard');
    else if (nextPage === 'directory') navigate('/directory');
    else if (nextPage === 'jar') navigate('/jar');
    else if (nextPage === 'settings') navigate('/settings/connections');
    else if (nextPage === 'about') navigate('/about');
    else navigate('/' + nextPage);
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleSignOut = async () => {
    await logout();
    navigate('/login');
  };

  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';
  const isLandingPage = location.pathname === '/';

  return (
    <div className="min-h-screen bg-[#050a17] text-[#f0f6ff] flex flex-col justify-between relative overflow-x-hidden">
      {/* 3D Global Canvas in Background */}
      {(!user || isLandingPage || isAuthPage) && (
        <div className="fixed inset-0 pointer-events-none transition-opacity duration-700 opacity-85">
          <Hero3D />
        </div>
      )}

      {/* Global App Toast */}
      {globalToast && (
        <div
          className="fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center gap-3 animate-bounce"
          style={{
            background: 'var(--toast-bg, #0b162e)',
            border: '1px solid var(--mint, #00d2ff)',
            color: 'var(--mint, #00d2ff)',
            boxShadow: '0 0 25px rgba(0, 210, 255, 0.3)',
          }}
        >
          <span className="w-2 h-2 rounded-full bg-mint" />
          <span className="text-sm font-semibold text-ink">{globalToast}</span>
        </div>
      )}

      {/* Top Navbar in Dark Navy & Ice Cyan */}
      <header className="sticky top-0 z-40 bg-[#050a17]/90 backdrop-blur-xl border-b border-[rgba(0,210,255,0.18)] w-full flex justify-center">
        <nav className="max-w-7xl w-full px-6 sm:px-12 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Back Arrow Button */}
            {user && !isLandingPage && location.pathname !== '/dashboard' && (
              <button
                type="button"
                onClick={handleBack}
                className="w-8 h-8 rounded-full text-base font-bold transition-all cursor-pointer flex items-center justify-center hover:-translate-x-0.5"
                style={{
                  border: '1px solid rgba(0, 210, 255, 0.4)',
                  color: '#00d2ff',
                  background: 'rgba(0, 210, 255, 0.08)',
                }}
                title="Go back"
                aria-label="Go back"
              >
                ←
              </button>
            )}

            <div
              onClick={() => navigate(user ? '/dashboard' : '/')}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div
                className="w-5 h-6 clip-shield group-hover:scale-105 transition-transform"
                style={{ background: 'linear-gradient(135deg, #00d2ff, #2563eb)' }}
              />
              <span className="font-display font-extrabold text-xl tracking-tight text-white group-hover:transition-colors">
                Sentinel
              </span>
            </div>
          </div>

          {/* Nav links once signed in */}
          {user ? (
            <div className="flex items-center gap-2 sm:gap-3 text-xs font-semibold">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
                  location.pathname === '/dashboard'
                    ? 'bg-white/10'
                    : 'text-mute hover:text-white'
                }`}
                style={
                  location.pathname === '/dashboard'
                    ? { color: '#00d2ff', border: '1px solid rgba(0,210,255,0.4)' }
                    : {}
                }
              >
                Overview
              </button>

              <button
                type="button"
                onClick={() => navigate('/about')}
                className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
                  location.pathname === '/about'
                    ? 'bg-white/10'
                    : 'text-mute hover:text-white'
                }`}
                style={
                  location.pathname === '/about'
                    ? { color: '#00d2ff', border: '1px solid rgba(0,210,255,0.4)' }
                    : {}
                }
              >
                About
              </button>

              <button
                type="button"
                onClick={() => navigate('/directory')}
                className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
                  location.pathname === '/directory'
                    ? 'bg-white/10'
                    : 'text-mute hover:text-white'
                }`}
                style={
                  location.pathname === '/directory'
                    ? { color: '#00d2ff', border: '1px solid rgba(0,210,255,0.4)' }
                    : {}
                }
              >
                App Directory
              </button>

              <button
                type="button"
                onClick={() => navigate('/jar')}
                className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
                  location.pathname === '/jar'
                    ? 'bg-white/10'
                    : 'text-mute hover:text-white'
                }`}
                style={
                  location.pathname === '/jar'
                    ? { color: '#00d2ff', border: '1px solid rgba(0,210,255,0.4)' }
                    : {}
                }
              >
                💰 Savings Jar
              </button>

              <button
                type="button"
                onClick={() => navigate('/settings/connections')}
                className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
                  location.pathname === '/settings/connections'
                    ? 'bg-white/10'
                    : 'text-mute hover:text-white'
                }`}
                style={
                  location.pathname === '/settings/connections'
                    ? { color: '#00d2ff', border: '1px solid rgba(0,210,255,0.4)' }
                    : {}
                }
              >
                Settings
              </button>

              {/* Notification Bell with live alerts */}
              <div className="ml-1">
                <NotificationBell onActionClick={() => navigate('/dashboard')} />
              </div>

              {/* Profile Chip & Sign Out */}
              <div className="flex items-center gap-2 ml-2">
                <span
                  className="hidden sm:inline-block px-3 py-1.5 rounded-full text-[11px] font-medium"
                  style={{
                    background: 'rgba(0, 210, 255, 0.08)',
                    border: '1px solid rgba(0, 210, 255, 0.3)',
                    color: '#00d2ff',
                  }}
                >
                  ● {user.name}
                </span>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="px-3.5 py-1.5 rounded-full border border-white/20 text-mute hover:text-coral hover:border-coral/40 transition-all text-xs cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-xs font-semibold">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="px-4 py-1.5 rounded-full text-mute hover:text-white cursor-pointer transition-colors"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => navigate('/signup')}
                className="px-4 py-1.5 rounded-full font-bold text-navy bg-mint shadow-[0_0_15px_rgba(0,210,255,0.35)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                Sign Up →
              </button>
            </div>
          )}
        </nav>
      </header>

      {/* Main View Router */}
      <main className="flex-1 w-full relative z-10 flex flex-col items-center">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <Onboarding />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/connections"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard onNavigate={navigateTo} onBack={handleBack} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/directory"
            element={
              <ProtectedRoute>
                <AppDirectory onNavigate={navigateTo} onBack={handleBack} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/jar"
            element={
              <ProtectedRoute>
                <SavingsJar onNavigate={navigateTo} onBack={handleBack} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/about"
            element={<About onNavigate={navigateTo} onGetStarted={() => navigate(user ? '/dashboard' : '/signup')} />}
          />
          <Route
            path="/"
            element={
              !user ? (
                <Landing
                  onGetStarted={() => navigate('/signup')}
                  onSeeDemo={() => navigate('/login')}
                />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />
          <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[rgba(0,210,255,0.18)] py-8 px-6 text-center text-xs text-mute/80 space-y-1 w-full flex flex-col items-center bg-[#050a17]">
        <p>Sentinel • Built for PayPal Hackathon 2026</p>
        <p className="text-[11px] text-mute/50">
          Flow: Sign Up → Connect PayPal → Dashboard → Savings Jar • Integrated with PayPal Sandbox.
        </p>
      </footer>
    </div>
  );
}
