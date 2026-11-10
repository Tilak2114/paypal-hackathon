// frontend/src/pages/Login.jsx
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function Login() {
  const { login, loginWithPayPal, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [paypalLoading, setPaypalLoading] = useState(false);

  // If already logged in, navigate
  React.useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Please fill in both email and password.");
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handlePayPalOAuth = async () => {
    setError(null);
    setPaypalLoading(true);
    try {
      await loginWithPayPal();
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || "PayPal authentication failed.");
    } finally {
      setPaypalLoading(false);
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-120px)] flex items-center justify-start max-w-7xl mx-auto px-6 sm:px-12 py-12 relative z-10">
      <div 
        className="w-full max-w-md rounded-3xl p-8 sm:p-10 backdrop-blur-md relative space-y-6 text-left"
        style={{
          background: 'transparent',
          border: '2px solid #00d2ff',
          boxShadow: '0 0 35px rgba(0, 210, 255, 0.25)'
        }}
      >
        {/* Brand Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-mint/10 text-mint text-xs font-bold border border-mint/30">
            <span>🛡️</span>
            <span>Sentinel Safe Auth</span>
          </div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-white">
            Sign In to Your Vault
          </h1>
          <p className="text-xs text-mute">
            Audit your subscriptions, manage PayPal billing, and stop accidental charges.
          </p>
        </div>

        {/* Inline Error */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-coral/15 border border-coral/30 text-xs text-coral font-medium flex items-center gap-2" role="alert">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* OAuth Continue with PayPal Button */}
        <button
          type="button"
          onClick={handlePayPalOAuth}
          disabled={paypalLoading || loading}
          className="w-full py-3.5 px-6 rounded-full font-bold text-xs text-white transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          style={{
            background: 'linear-gradient(135deg, #0070ba, #003087)',
            boxShadow: '0 6px 18px rgba(0, 112, 186, 0.4)'
          }}
        >
          {paypalLoading ? (
            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <span className="font-display font-black text-[#00d2ff]">P</span>
              <span>Continue with PayPal Sandbox</span>
            </>
          )}
        </button>

        <div className="flex items-center gap-3 text-mute/50 text-xs">
          <div className="flex-1 h-px bg-line/40" />
          <span>or sign in with email</span>
          <div className="flex-1 h-px bg-line/40" />
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-mute block mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@domain.com"
              className="w-full px-4 py-3 rounded-2xl bg-bg border border-line text-white text-sm focus:outline-none focus:border-mint transition-colors"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-mute">
                Password
              </label>
              <button
                type="button"
                onClick={() => alert("Password reset link sent to demo account inbox.")}
                className="text-[11px] text-mint hover:underline cursor-pointer"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-4 py-3 rounded-2xl bg-bg border border-line text-white text-sm focus:outline-none focus:border-mint transition-colors pr-12"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-mute hover:text-white"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || paypalLoading}
            className="w-full py-3.5 px-6 rounded-full font-bold text-xs text-navy bg-mint transition-all cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,210,255,0.4)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-navy/20 border-t-navy rounded-full animate-spin" />
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <p className="text-xs text-mute text-center pt-2">
          Don't have an account yet?{' '}
          <Link to="/signup" className="text-mint font-bold hover:underline">
            Sign Up & Connect PayPal
          </Link>
        </p>
      </div>
    </div>
  );
}
