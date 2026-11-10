// frontend/src/pages/Signup.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import StepProgress from '../components/StepProgress';
import PasswordMeter, { calculatePasswordStrength } from '../components/PasswordMeter';
import PayPalConnectCard from '../components/PayPalConnectCard';
import StatementUpload from '../components/StatementUpload';
import ScanProgress from '../components/ScanProgress';
import DetectedList from '../components/DetectedList';
import { mockAuthApi } from '../mock/auth';

export default function Signup() {
  const { signup, connectPayPal } = useAuth();
  const navigate = useNavigate();
  const stepHeadingRef = useRef(null);

  const [step, setStep] = useState(1);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Step 1: Account
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Step 2: Profile
  const [country, setCountry] = useState('US');
  const [currency, setCurrency] = useState('USD');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [referral, setReferral] = useState('');

  // Step 3: Connect Mode ('oauth' | 'upload')
  const [connectMode, setConnectMode] = useState('oauth');
  const [connectingPayPal, setConnectingPayPal] = useState(false);

  // Step 5: Detected Subscriptions
  const [detectedSubs, setDetectedSubs] = useState([]);
  const [confirmingSubs, setConfirmingSubs] = useState(false);

  // Accessibility: move focus to step heading whenever step changes
  useEffect(() => {
    if (stepHeadingRef.current) {
      stepHeadingRef.current.focus();
    }
  }, [step]);

  // Advance to Step 2
  const handleAccountSubmit = (e) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    const strength = calculatePasswordStrength(password);
    if (!strength.meetsMin) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    if (!termsAccepted) {
      setError("You must accept the terms of service to proceed.");
      return;
    }

    setStep(2);
  };

  // Advance to Step 3
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validate DOB if given (must be 18+)
    if (dob) {
      const birthDate = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      if (age < 18) {
        setError("You must be at least 18 years old to manage PayPal subscriptions.");
        return;
      }
    }

    setLoading(true);
    try {
      await signup({ name, email, country, currency, phone, dob, referral });
      setStep(3);
    } catch (err) {
      setError(err.message || "Failed to create account profile.");
    } finally {
      setLoading(false);
    }
  };

  // Step 3: OAuth Connect Handler
  const handleOAuthConnect = async () => {
    setConnectingPayPal(true);
    setError(null);
    try {
      await connectPayPal("sandbox-judge@paypal.com");
      // Advance to scanning
      setStep(4);
    } catch (err) {
      setError(err.message || "PayPal connection failed.");
    } finally {
      setConnectingPayPal(false);
    }
  };

  // Step 3: Statement Upload Handler
  const handleStatementSuccess = async (file) => {
    await mockAuthApi.uploadStatement(file);
    setStep(4);
  };

  // Step 4: Scan Complete Handler
  const handleScanComplete = async () => {
    const list = await mockAuthApi.getDetectedSubscriptions();
    setDetectedSubs(list);
    setStep(5);
  };

  // Step 5: Confirm Bulk Subscriptions
  const handleConfirmSubscriptions = async (selectedList) => {
    setConfirmingSubs(true);
    try {
      await mockAuthApi.confirmBulkSubscriptions(selectedList);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || "Failed to save subscriptions.");
      setConfirmingSubs(false);
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-120px)] flex flex-col items-center justify-start px-4 sm:px-6 py-8 relative z-10">
      {/* Wizard Progress Bar */}
      <StepProgress currentStep={step} onStepClick={(s) => setStep(s)} />

      <div 
        className="w-full max-w-2xl rounded-3xl p-6 sm:p-10 backdrop-blur-xl relative space-y-6 text-left mt-4"
        style={{
          background: 'var(--card-surface)',
          border: '1px solid var(--card-border)',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)'
        }}
      >
        {/* Step Heading (Focused for A11y) */}
        <div className="space-y-1">
          <span className="text-[10px] font-bold tracking-widest uppercase text-mint">
            Step {step} of 5
          </span>
          <h1
            ref={stepHeadingRef}
            tabIndex={-1}
            className="font-display font-black text-2xl sm:text-3xl text-white outline-none"
          >
            {step === 1 && "Create Your Churn Guard Account"}
            {step === 2 && "Customize Your Profile"}
            {step === 3 && "Connect Your PayPal Account"}
            {step === 4 && "Scanning Ledger"}
            {step === 5 && "Review Detected Subscriptions"}
          </h1>
          <p className="text-xs text-mute">
            {step === 1 && "Start auditing your subscriptions. Credentials stay strictly with PayPal."}
            {step === 2 && "Tailor renewal alerts and local currency conversions."}
            {step === 3 && "We connect read-only to spot recurring charges and notify you before renewals."}
            {step === 4 && "Locating recurring charges, active free trials, and silent price increases."}
            {step === 5 && "Verify your subscriptions before we start tracking and protecting your wallet."}
          </p>
        </div>

        {/* Inline Error */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-coral/15 border border-coral/30 text-xs text-coral font-medium flex items-center gap-2" role="alert">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* ── STEP 1: ACCOUNT ─────────────────────────────────────────── */}
        {step === 1 && (
          <form noValidate onSubmit={handleAccountSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-mute block mb-1">
                Full Name <span className="text-mint">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Aahana Rao"
                className="w-full px-4 py-3 rounded-2xl bg-bg border border-line text-white text-sm focus:outline-none focus:border-mint"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-mute block mb-1">
                Email Address <span className="text-mint">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="aahana@example.com"
                className="w-full px-4 py-3 rounded-2xl bg-bg border border-line text-white text-sm focus:outline-none focus:border-mint"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-mute block mb-1">
                Password <span className="text-mint">*</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters..."
                className="w-full px-4 py-3 rounded-2xl bg-bg border border-line text-white text-sm focus:outline-none focus:border-mint"
                required
              />
              <PasswordMeter password={password} />
            </div>

            <div>
              <label className="text-xs font-semibold text-mute block mb-1">
                Confirm Password <span className="text-mint">*</span>
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="w-full px-4 py-3 rounded-2xl bg-bg border border-line text-white text-sm focus:outline-none focus:border-mint"
                required
              />
            </div>

            <div className="flex items-start gap-2.5 pt-2">
              <input
                type="checkbox"
                id="terms"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="w-4 h-4 rounded border-line text-mint focus:ring-mint mt-0.5 cursor-pointer"
                required
              />
              <label htmlFor="terms" className="text-xs text-mute cursor-pointer">
                I agree to the Churn Guard Privacy Charter. I understand credentials stay with PayPal and funds are never moved without my explicit click.
              </label>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3.5 px-6 rounded-full font-bold text-xs text-navy bg-mint transition-all cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,210,255,0.4)] hover:scale-[1.02]"
              >
                <span>Continue to Profile</span>
                <span>→</span>
              </button>
            </div>

            <p className="text-xs text-mute text-center pt-2">
              Already have an account?{' '}
              <Link to="/login" className="text-mint font-bold hover:underline">
                Sign in
              </Link>
            </p>
          </form>
        )}

        {/* ── STEP 2: PROFILE ─────────────────────────────────────────── */}
        {step === 2 && (
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-mute block mb-1">
                  Country / Region <span className="text-mint">*</span>
                </label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-bg border border-line text-white text-sm"
                >
                  <option value="US">United States (USD)</option>
                  <option value="IN">India (INR)</option>
                  <option value="GB">United Kingdom (GBP)</option>
                  <option value="EU">European Union (EUR)</option>
                  <option value="CA">Canada (CAD)</option>
                  <option value="AU">Australia (AUD)</option>
                </select>
                <span className="text-[10px] text-mute/80 mt-1 block">
                  Used to match subscription currency rules.
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-mute block mb-1">
                  Preferred Currency <span className="text-mint">*</span>
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-bg border border-line text-white text-sm"
                >
                  <option value="USD">USD ($)</option>
                  <option value="INR">INR (₹)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
                <span className="text-[10px] text-mute/80 mt-1 block">
                  Dashboard charts will display totals in this currency.
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-mute block mb-1">
                  Mobile Number <span className="text-[10px] text-mute/60">(Optional)</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-4 py-3 rounded-2xl bg-bg border border-line text-white text-sm"
                />
                <span className="text-[10px] text-mute/80 mt-1 block">
                  Optional: For high-priority SMS renewal alarms before trials end.
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-mute block mb-1">
                  Date of Birth <span className="text-[10px] text-mute/60">(Optional, 18+)</span>
                </label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-bg border border-line text-white text-sm"
                />
                <span className="text-[10px] text-mute/80 mt-1 block">
                  PayPal billing agreements require users to be at least 18.
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-mute block mb-1">
                How did you hear about us? <span className="text-[10px] text-mute/60">(Optional)</span>
              </label>
              <select
                value={referral}
                onChange={(e) => setReferral(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-bg border border-line text-white text-sm"
              >
                <option value="">Select an option</option>
                <option value="hackathon">PayPal Hackathon 2026</option>
                <option value="social">Twitter / X / LinkedIn</option>
                <option value="friend">Friend or Colleague</option>
                <option value="search">Search Engine</option>
              </select>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-6 py-3.5 rounded-full text-xs font-semibold text-mute hover:text-white"
              >
                ← Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3.5 px-6 rounded-full font-bold text-xs text-navy bg-mint transition-all cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,210,255,0.4)] hover:scale-[1.02]"
              >
                {loading ? "Saving..." : "Save Profile & Connect PayPal →"}
              </button>
            </div>
          </form>
        )}

        {/* ── STEP 3: CONNECT PAYPAL ──────────────────────────────────── */}
        {step === 3 && (
          <div>
            {connectMode === 'oauth' ? (
              <PayPalConnectCard
                onConnect={handleOAuthConnect}
                connecting={connectingPayPal}
                onSwitchToUpload={() => setConnectMode('upload')}
              />
            ) : (
              <StatementUpload
                onUploadSuccess={handleStatementSuccess}
                onBackToOAuth={() => setConnectMode('oauth')}
              />
            )}
          </div>
        )}

        {/* ── STEP 4: SCANNING PROGRESS ────────────────────────────────── */}
        {step === 4 && (
          <ScanProgress
            onScanComplete={handleScanComplete}
            onSkip={() => setStep(5)}
          />
        )}

        {/* ── STEP 5: REVIEW DETECTED SUBSCRIPTIONS ───────────────────── */}
        {step === 5 && (
          <DetectedList
            subscriptions={detectedSubs}
            onConfirm={handleConfirmSubscriptions}
            loading={confirmingSubs}
          />
        )}
      </div>
    </div>
  );
}
