import React, { useState } from 'react';

export default function SignIn({ onSignInSuccess }) {
  const [email, setEmail] = useState('judge@paypalhackathon.com');
  const [password, setPassword] = useState('••••••••••••');
  const [loading, setLoading] = useState(false);
  const [authMethod, setAuthMethod] = useState(null);

  const handlePayPalSignIn = () => {
    setAuthMethod('paypal');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (onSignInSuccess) onSignInSuccess({ name: 'Aahana Rao', email: 'aahana@paypal.com', method: 'PayPal' });
    }, 850);
  };

  const handleEmailSignIn = (e) => {
    e.preventDefault();
    setAuthMethod('email');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (onSignInSuccess) onSignInSuccess({ name: 'Hackathon Judge', email, method: 'Email' });
    }, 650);
  };

  return (
    <div className="w-full min-h-[calc(100vh-140px)] flex items-center justify-start max-w-7xl px-6 sm:px-12 py-12 relative z-10">
      
      {/* Left-Aligned, Fully Transparent Glass Box with Mint / Turquoise Border */}
      <div className="w-full max-w-md bg-transparent border-2 border-mint rounded-3xl p-8 sm:p-10 backdrop-blur-md shadow-[0_0_40px_rgba(52,240,200,0.18)] relative">
        
        {/* Brand & Title */}
        <div className="text-left space-y-2 mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-mint/60 bg-transparent text-mint text-xs font-bold tracking-wide">
            <span className="w-2 h-2 rounded-full bg-mint animate-ping" />
            PayPal Hackathon Gate
          </div>

          <h1 className="font-display font-black text-3xl sm:text-4xl text-white tracking-tight mt-2">
            Sign In
          </h1>
          <p className="text-white/80 text-xs sm:text-sm font-normal">
            Connect your PayPal account to scan and halt idle recurring payments.
          </p>
        </div>

        {/* 1-Click PayPal Button */}
        <button
          onClick={handlePayPalSignIn}
          disabled={loading}
          className="w-full py-3.5 px-4 rounded-2xl bg-transparent border-2 border-mint text-white font-bold text-sm flex items-center justify-center gap-3 hover:bg-mint/15 shadow-[0_0_20px_rgba(52,240,200,0.25)] hover:shadow-[0_0_30px_rgba(52,240,200,0.4)] hover:-translate-y-0.5 transition-all cursor-pointer"
        >
          {loading && authMethod === 'paypal' ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
          ) : (
            <svg className="w-5 h-5 fill-mint" viewBox="0 0 24 24">
              <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.792.792 0 0 1 .782-.67h7.247c3.486 0 5.86 1.488 5.674 4.887-.213 3.882-2.736 6.002-6.52 6.002H9.282l-1.42 6.726a.79.79 0 0 1-.786.672zm3.32-9.742h1.731c2.42 0 3.714-1.077 3.84-2.83.136-1.89-1.296-2.585-3.324-2.585H9.79l-1.066 5.415h1.672z" />
            </svg>
          )}
          <span className="text-white">Continue with PayPal</span>
        </button>

        {/* Divider */}
        <div className="relative my-6 flex items-center justify-center">
          <div className="border-t border-mint/40 w-full" />
          <span className="bg-transparent px-3 text-[11px] font-bold uppercase tracking-wider text-white shrink-0">
            Or Demo Sign In
          </span>
        </div>

        {/* Email Password Form */}
        <form onSubmit={handleEmailSignIn} className="space-y-4">
          <div>
            <label className="block text-xs uppercase font-bold tracking-wider text-white mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-transparent border-2 border-mint rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/40 focus:outline-none focus:shadow-[0_0_15px_rgba(52,240,200,0.5)] transition-all"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs uppercase font-bold tracking-wider text-white">
                Password
              </label>
              <span className="text-[11px] text-mint hover:underline cursor-pointer">
                Forgot?
              </span>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-transparent border-2 border-mint rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/40 focus:outline-none focus:shadow-[0_0_15px_rgba(52,240,200,0.5)] transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-2xl bg-mint hover:bg-mint/90 text-slate-950 font-extrabold text-sm shadow-[0_0_25px_rgba(52,240,200,0.4)] hover:shadow-[0_0_35px_rgba(52,240,200,0.6)] hover:-translate-y-0.5 transition-all mt-2 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading && authMethod === 'email' ? (
              <>
                <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin inline-block" />
                <span className="text-slate-950">Signing In...</span>
              </>
            ) : (
              <span className="text-slate-950">Sign In to Dashboard →</span>
            )}
          </button>
        </form>

        {/* Security / Credentials Helper Pill */}
        <div className="mt-6 pt-5 border-t border-mint/40 text-left">
          <p className="text-xs text-white/80">
            Demo pre-filled. Tap either button to open the full experience.
          </p>
          <div className="mt-3 flex gap-2">
            <span className="text-[11px] px-2.5 py-1 rounded-full border border-mint text-white bg-transparent">
              🔒 256-Bit Encrypted
            </span>
            <span className="text-[11px] px-2.5 py-1 rounded-full border border-mint text-white bg-transparent">
              🛡️ Read-Only
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
