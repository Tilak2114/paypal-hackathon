import React, { useState } from 'react';

export default function SignIn({ onNavigate, onSignInSuccess }) {
  const [email, setEmail] = useState('judge@paypalhackathon.com');
  const [password, setPassword] = useState('••••••••••••');
  const [loading, setLoading] = useState(false);
  const [authMethod, setAuthMethod] = useState(null); // 'paypal' or 'email'

  const handlePayPalSignIn = () => {
    setAuthMethod('paypal');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (onSignInSuccess) onSignInSuccess({ name: 'Aahana Rao', email: 'aahana@paypal.com', method: 'PayPal' });
      onNavigate('dashboard');
    }, 900);
  };

  const handleEmailSignIn = (e) => {
    e.preventDefault();
    setAuthMethod('email');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (onSignInSuccess) onSignInSuccess({ name: 'Hackathon Judge', email, method: 'Email' });
      onNavigate('dashboard');
    }, 700);
  };

  return (
    <div className="w-full min-h-[calc(100vh-140px)] flex items-center justify-center px-4 py-12 relative z-10">
      {/* Decorative Glow Blobs */}
      <div className="absolute top-1/4 left-1/3 w-72 h-72 bg-mint/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-72 h-72 bg-coral/10 rounded-full blur-3xl pointer-events-none" />

      {/* Glassmorphic Sign In Card */}
      <div className="max-w-md w-full bg-card/80 border border-line rounded-3xl p-8 sm:p-10 backdrop-blur-2xl shadow-2xl relative">
        
        {/* Brand & Title */}
        <div className="text-center space-y-2 mb-8">
          <div className="inline-flex items-center justify-center w-12 h-14 bg-gradient-to-tr from-mint to-indigo-500 clip-shield mb-2 shadow-lg shadow-mint/20">
            <span className="text-slate-950 font-black text-xl">🛡️</span>
          </div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-ink tracking-tight">
            Connect to Churn Guard
          </h1>
          <p className="text-mute text-xs sm:text-sm">
            Sign in to scan and manage your active PayPal recurring payments.
          </p>
        </div>

        {/* 1-Click PayPal OAuth / Fast Connect */}
        <button
          onClick={handlePayPalSignIn}
          disabled={loading}
          className="w-full py-3.5 px-4 rounded-2xl bg-[#0070ba] hover:bg-[#005ea6] text-white font-bold text-sm flex items-center justify-center gap-3 shadow-lg shadow-blue-500/20 hover:-translate-y-0.5 transition-all"
        >
          {loading && authMethod === 'paypal' ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
          ) : (
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.792.792 0 0 1 .782-.67h7.247c3.486 0 5.86 1.488 5.674 4.887-.213 3.882-2.736 6.002-6.52 6.002H9.282l-1.42 6.726a.79.79 0 0 1-.786.672zm3.32-9.742h1.731c2.42 0 3.714-1.077 3.84-2.83.136-1.89-1.296-2.585-3.324-2.585H9.79l-1.066 5.415h1.672z" />
            </svg>
          )}
          <span>Continue with PayPal</span>
        </button>

        {/* Divider */}
        <div className="relative my-6 flex items-center justify-center">
          <div className="border-t border-line/60 w-full" />
          <span className="bg-[#140c33] px-3 text-[11px] font-bold uppercase tracking-wider text-mute shrink-0">
            Or Demo Sign In
          </span>
        </div>

        {/* Email Password Form */}
        <form onSubmit={handleEmailSignIn} className="space-y-4">
          <div>
            <label className="block text-xs uppercase font-bold tracking-wider text-mute mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-slate-950/60 border border-line rounded-xl px-4 py-3 text-ink text-sm placeholder:text-mute/40 focus:outline-none focus:border-mint/60 transition-colors"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs uppercase font-bold tracking-wider text-mute">
                Password
              </label>
              <span className="text-[11px] text-mint/80 hover:underline cursor-pointer">
                Forgot?
              </span>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-slate-950/60 border border-line rounded-xl px-4 py-3 text-ink text-sm placeholder:text-mute/40 focus:outline-none focus:border-mint/60 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-2xl bg-mint hover:bg-mint/90 text-slate-950 font-bold text-sm shadow-lg shadow-mint/20 hover:-translate-y-0.5 transition-all mt-2 flex items-center justify-center gap-2"
          >
            {loading && authMethod === 'email' ? (
              <>
                <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin inline-block" />
                <span>Entering Demo...</span>
              </>
            ) : (
              <span>Sign In to Audit Wallet →</span>
            )}
          </button>
        </form>

        {/* Guest Demo Helper Pill */}
        <div className="mt-6 pt-5 border-t border-line/40 text-center">
          <p className="text-xs text-mute">
            Judge testing mode enabled. Click either button to enter instantly.
          </p>
          <div className="mt-3 flex justify-center gap-2">
            <span className="text-[11px] px-2.5 py-1 rounded-full bg-white/5 border border-line text-mint font-medium">
              🔒 256-Bit Encrypted
            </span>
            <span className="text-[11px] px-2.5 py-1 rounded-full bg-white/5 border border-line text-mute font-medium">
              🛡️ Read-Only Scans
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
