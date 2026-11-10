import React, { useState } from 'react';
import { Link } from 'react-router-dom';

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
      
      {/* Left-Aligned, Transparent Glass Box with Pure Ice-Cyan Borders */}
      <div 
        className="w-full max-w-md bg-transparent rounded-3xl p-8 sm:p-10 backdrop-blur-md relative"
        style={{
          border: '2px solid #00d2ff',
          boxShadow: '0 0 35px rgba(0, 210, 255, 0.25)'
        }}
      >
        
        {/* Brand & Title */}
        <div className="text-left space-y-2 mb-8">
          <div 
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-transparent text-xs font-bold tracking-wide"
            style={{
              border: '1px solid rgba(0, 210, 255, 0.6)',
              color: '#00d2ff'
            }}
          >
            <span className="w-2 h-2 rounded-full animate-ping" style={{ background: '#00d2ff' }} />
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
          className="w-full py-3.5 px-4 rounded-2xl bg-transparent text-white font-bold text-sm flex items-center justify-center gap-3 hover:-translate-y-0.5 transition-all cursor-pointer"
          style={{
            border: '2px solid #00d2ff',
            boxShadow: '0 0 20px rgba(0, 210, 255, 0.2)'
          }}
        >
          {loading && authMethod === 'paypal' ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
          ) : (
            <svg className="w-5 h-5" fill="#00d2ff" viewBox="0 0 24 24">
              <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.792.792 0 0 1 .782-.67h7.247c3.486 0 5.86 1.488 5.674 4.887-.213 3.882-2.736 6.002-6.52 6.002H9.282l-1.42 6.726a.79.79 0 0 1-.786.672zm3.32-9.742h1.731c2.42 0 3.714-1.077 3.84-2.83.136-1.89-1.296-2.585-3.324-2.585H9.79l-1.066 5.415h1.672z" />
            </svg>
          )}
          <span className="text-white">Continue with PayPal</span>
        </button>

        {/* Divider */}
        <div className="relative my-6 flex items-center justify-center">
          <div className="w-full" style={{ borderTop: '1px solid rgba(0, 210, 255, 0.3)' }} />
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
              className="w-full bg-transparent rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/40 focus:outline-none transition-all"
              style={{
                border: '2px solid #00d2ff'
              }}
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs uppercase font-bold tracking-wider text-white">
                Password
              </label>
              <span className="text-[11px] hover:underline cursor-pointer" style={{ color: '#00d2ff' }}>
                Forgot?
              </span>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-transparent rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/40 focus:outline-none transition-all"
              style={{
                border: '2px solid #00d2ff'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-2xl font-extrabold text-sm hover:-translate-y-0.5 transition-all mt-2 flex items-center justify-center gap-2 cursor-pointer"
            style={{
              background: '#00d2ff',
              color: '#030814',
              boxShadow: '0 0 25px rgba(0, 210, 255, 0.45)'
            }}
          >
            {loading && authMethod === 'email' ? (
              <>
                <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin inline-block" />
                <span style={{ color: '#030814' }}>Signing In...</span>
              </>
            ) : (
              <span style={{ color: '#030814' }}>Sign In to Dashboard →</span>
            )}
          </button>
        </form>

        {/* Sign up link */}
        <p className="text-xs text-mute text-center pt-1">
          New here?{' '}
          <Link to="/signup" className="text-[#00d2ff] font-bold hover:underline">
            Sign Up & Connect PayPal →
          </Link>
        </p>

        {/* Security / Credentials Helper Pill */}
        <div className="mt-6 pt-5 text-left" style={{ borderTop: '1px solid rgba(0, 210, 255, 0.3)' }}>
          <p className="text-xs text-white/80">
            Demo pre-filled. Tap either button to open the full experience.
          </p>
          <div className="mt-3 flex gap-2">
            <span 
              className="text-[11px] px-2.5 py-1 rounded-full text-white bg-transparent"
              style={{ border: '1px solid #00d2ff' }}
            >
              🔒 256-Bit Encrypted
            </span>
            <span 
              className="text-[11px] px-2.5 py-1 rounded-full text-white bg-transparent"
              style={{ border: '1px solid #00d2ff' }}
            >
              🛡️ Read-Only
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
