// frontend/src/pages/SavingsJar.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getSubscriptions } from '../api/client';

const PRESETS = [
  { name: 'Weekend trip',   amount: 5000,  emoji: '🏖️' },
  { name: 'New phone',      amount: 20000, emoji: '📱' },
  { name: 'Emergency fund', amount: 10000, emoji: '🏦' },
];

// Jar dimensions (viewBox: 0 0 200 280)
const JAR_BOTTOM_Y = 265;
const JAR_TOP_Y    = 65;
const JAR_HEIGHT   = JAR_BOTTOM_Y - JAR_TOP_Y;

function fmt(n) { return Math.round(n).toLocaleString('en-IN'); }
function reducedMotion() { return window.matchMedia('(prefers-reduced-motion:reduce)').matches; }

// Confetti when goal is achieved
function launchConfetti(canvas) {
  if (reducedMotion() || !canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const cols = ['#00d2ff', '#10b981', '#ffd700', '#818cf8', '#60a5fa', '#f97316', '#4ade80'];
  const pts = Array.from({ length: 130 }, () => ({
    x: Math.random() * canvas.width,
    y: -30 - Math.random() * 120,
    w: 6 + Math.random() * 10,
    h: 4 + Math.random() * 4,
    col: cols[Math.floor(Math.random() * cols.length)],
    rot: Math.random() * Math.PI * 2,
    rv: (Math.random() - 0.5) * 0.18,
    vx: (Math.random() - 0.5) * 4.5,
    vy: 1.8 + Math.random() * 3.5,
    alpha: 1,
  }));
  let frame = 0;
  (function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;
    for (const p of pts) {
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.rv;
      if (p.y > canvas.height * 0.55) p.alpha -= 0.018;
      if (p.alpha > 0 && p.y < canvas.height + 20) {
        alive = true;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = Math.max(p.alpha, 0);
        ctx.fillStyle = p.col;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
    }
    frame++;
    if (alive && frame < 320) requestAnimationFrame(draw);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  })();
}

// SVG Banknote Component
function Banknote({ x, y, width = 56, height = 24, rotation = 0, opacity = 1 }) {
  return (
    <g transform={`translate(${x}, ${y}) rotate(${rotation})`} opacity={opacity}>
      <rect x="-1" y="1" width={width} height={height} rx="2" fill="rgba(0,0,0,0.35)" />
      <rect x="0" y="0" width={width} height={height} rx="2.5" fill="url(#jarBillGrad)" stroke="#047857" strokeWidth="0.8" />
      <rect x="2" y="2" width={width - 4} height={height - 4} rx="1.5" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.6" strokeDasharray="3 1" />
      <ellipse cx={width / 2} cy={height / 2} rx="8" ry="6" fill="#047857" fillOpacity="0.45" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5" />
      <text x={width / 2} y={height / 2 + 2.5} textAnchor="middle" fontSize="6.5" fontWeight="900" fill="#ffffff" fontFamily="sans-serif">$</text>
      <text x="4" y="6.5" fontSize="4.5" fontWeight="bold" fill="rgba(255,255,255,0.85)" fontFamily="sans-serif">$</text>
      <text x={width - 6} y={height - 2.5} fontSize="4.5" fontWeight="bold" fill="rgba(255,255,255,0.85)" fontFamily="sans-serif">$</text>
    </g>
  );
}

// SVG Coin Component
function Coin({ cx, cy, r = 8, rotation = 0, opacity = 1 }) {
  return (
    <g transform={`translate(${cx}, ${cy}) rotate(${rotation})`} opacity={opacity}>
      <circle cx="0.5" cy="1" r={r} fill="rgba(0,0,0,0.4)" />
      <circle cx="0" cy="0" r={r} fill="url(#jarCoinGrad)" stroke="#b45309" strokeWidth="0.8" />
      <circle cx="0" cy="0" r={r - 1.5} fill="none" stroke="#fef08a" strokeWidth="0.5" strokeDasharray="2 1" />
      <text x="0" y={r * 0.35} textAnchor="middle" fontSize={r * 0.95} fontWeight="900" fill="#78350f" fontFamily="sans-serif">$</text>
    </g>
  );
}

export default function SavingsJar() {
  const [saved, setSaved]           = useState(0);
  const [displaySaved, setDisplay]  = useState(0);
  const [goal, setGoal]             = useState(5000);
  const [goalName, setGoalName]     = useState('Weekend trip');
  const [activePreset, setPreset]   = useState(0);
  const [goalHit, setGoalHit]       = useState(false);
  const [fillY, setFillY]           = useState(JAR_BOTTOM_Y);
  const [coins, setCoins]           = useState([]);
  const [customName, setCustomName] = useState('');
  const [customAmt, setCustomAmt]   = useState('');

  const balAnimRef  = useRef(null);
  const fillAnimRef = useRef(null);
  const canvasRef   = useRef(null);
  const goalHitRef  = useRef(false);

  // Calculate target fill Y based on savings and goal
  const calculateTargetY = (currentSaved, currentGoal) => {
    const pct = Math.min(Math.max(currentSaved / currentGoal, 0), 1);
    if (pct <= 0) return 256;
    return JAR_BOTTOM_Y - pct * JAR_HEIGHT;
  };

  // Animate fill level
  const animateFill = useCallback((newSaved, newGoal) => {
    const target = calculateTargetY(newSaved, newGoal);
    if (fillAnimRef.current) cancelAnimationFrame(fillAnimRef.current);

    if (reducedMotion()) {
      setFillY(target);
      return;
    }

    const start = performance.now();
    const dur = 900;
    let fromY = JAR_BOTTOM_Y;
    setFillY((prev) => { fromY = prev; return prev; });

    function step(now) {
      const t = Math.min((now - start) / dur, 1);
      const e = 1 - Math.pow(1 - t, 3);
      const y = fromY + (target - fromY) * e;
      setFillY(y);
      if (t < 1) fillAnimRef.current = requestAnimationFrame(step);
    }

    fillAnimRef.current = requestAnimationFrame(step);
  }, []);

  // Count-up balance
  const countUp = useCallback((from, to) => {
    if (balAnimRef.current) cancelAnimationFrame(balAnimRef.current);
    if (reducedMotion()) { setDisplay(to); return; }
    const start = performance.now();
    const dur = 750;
    function step(now) {
      const t = Math.min((now - start) / dur, 1);
      const e = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (to - from) * e));
      if (t < 1) balAnimRef.current = requestAnimationFrame(step);
    }
    balAnimRef.current = requestAnimationFrame(step);
  }, []);

  // Load savings dynamically
  useEffect(() => {
    async function initSavings() {
      try {
        const subs = await getSubscriptions();
        const cancelledTotal = subs
          .filter((s) => s.status === 'cancelled')
          .reduce((sum, s) => sum + (s.cost || 0) * 12, 0);

        const storedSaved = parseFloat(localStorage.getItem('churnguard_saved') || '0');
        const total = Math.max(cancelledTotal, storedSaved, 1800); // realistic starter amount if empty

        setSaved(total);
        countUp(0, total);
        animateFill(total, goal);

        // Falling coins into jar
        setCoins([
          { id: 1, left: 42, delay: 120, type: 'coin' },
          { id: 2, left: 56, delay: 280, type: 'bill' },
          { id: 3, left: 48, delay: 450, type: 'coin' },
        ]);
      } catch (err) {
        console.warn('Savings load error, fallback to default:', err);
        setSaved(2400);
        countUp(0, 2400);
        animateFill(2400, goal);
      }
    }
    initSavings();
  }, [countUp, animateFill, goal]);

  // Goal trigger check
  useEffect(() => {
    if (saved >= goal && !goalHitRef.current) {
      goalHitRef.current = true;
      setGoalHit(true);
      launchConfetti(canvasRef.current);
    } else if (saved < goal) {
      goalHitRef.current = false;
      setGoalHit(false);
    }
  }, [saved, goal]);

  const selectPreset = (idx) => {
    setPreset(idx);
    const p = PRESETS[idx];
    setGoal(p.amount);
    setGoalName(p.name);
    animateFill(saved, p.amount);
  };

  const handleCustomGoal = (e) => {
    e.preventDefault();
    const amt = parseFloat(customAmt);
    if (!amt || amt <= 0) return;
    const name = customName.trim() || 'Custom Goal';
    setGoal(amt);
    setGoalName(name);
    setPreset(-1);
    setCustomAmt('');
    setCustomName('');
    animateFill(saved, amt);
  };

  const pctProgress = Math.min(Math.round((saved / goal) * 100), 100);

  return (
    <div className="relative w-full min-h-[calc(100vh-120px)] flex flex-col items-center justify-start px-4 sm:px-6 py-8 z-10">
      {/* Confetti canvas */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-50"
        aria-hidden="true"
      />

      <div className="w-full max-w-4xl flex flex-col items-center text-center space-y-8">
        {/* Page Title */}
        <div className="space-y-2">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold"
            style={{
              background: 'rgba(0, 210, 255, 0.1)',
              color: '#00d2ff',
              border: '1px solid rgba(0, 210, 255, 0.35)',
            }}
          >
            <span>💰</span>
            <span>Sentinel Cash &amp; Savings Vault</span>
          </div>
          <h1 className="font-display font-black text-3xl sm:text-5xl text-white tracking-tight">
            Subscription Savings Jar
          </h1>
          <p className="text-xs sm:text-sm text-[#8295b5] max-w-lg mx-auto">
            Every cancelled or audited subscription immediately drops real cash back into your vault.
          </p>
        </div>

        {/* Counter readout */}
        <div className="space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#8295b5]">
            Annualized Cash Saved
          </span>
          <div
            className="font-display font-black tracking-tighter leading-none"
            style={{ fontSize: 54, color: '#00d2ff', textShadow: '0 0 45px rgba(0, 210, 255, 0.45)' }}
            aria-live="polite"
          >
            ₹{fmt(displaySaved)}
          </div>
        </div>

        {/* ── Mason Jar Container (Shape from sketch) ── */}
        <div className="relative" style={{ width: 230, height: 320 }} aria-hidden="true">
          <svg
            viewBox="0 0 200 280"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full overflow-visible"
          >
            <defs>
              {/* Mason Jar Interior Clip Path (matches the sketch contour) */}
              <clipPath id="masonJarClip">
                <path d="M 36,55 C 28,68 12,82 12,102 L 12,242 C 12,264 32,268 100,268 C 168,268 188,264 188,242 L 188,102 C 188,82 172,68 164,55 Z" />
              </clipPath>

              {/* Dynamic Fill Clip Path (masks the money stack height) */}
              <clipPath id="moneyLevelClip">
                <rect x="0" y={fillY} width="200" height={280 - fillY} />
              </clipPath>

              {/* Banknote Green Gradient */}
              <linearGradient id="jarBillGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="50%" stopColor="#059669" />
                <stop offset="100%" stopColor="#047857" />
              </linearGradient>

              {/* Gold Coin Metallic Gradient */}
              <radialGradient id="jarCoinGrad" cx="35%" cy="30%" r="65%">
                <stop offset="0%" stopColor="#fffbeb" />
                <stop offset="25%" stopColor="#fde047" />
                <stop offset="70%" stopColor="#eab308" />
                <stop offset="100%" stopColor="#b45309" />
              </radialGradient>

              {/* Frosted Glass Jar Fill Gradient */}
              <linearGradient id="jarGlassGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="rgba(255,255,255,0.12)" />
                <stop offset="50%" stopColor="rgba(255,255,255,0.02)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0.08)" />
              </linearGradient>

              {/* Subtle money glow */}
              <linearGradient id="moneySurfaceGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(16, 185, 129, 0.4)" />
                <stop offset="100%" stopColor="transparent" />
              </linearGradient>
            </defs>

            {/* Jar Base Drop Shadow */}
            <ellipse cx="100" cy="274" rx="76" ry="6.5" fill="rgba(0,0,0,0.5)" />

            {/* Glass Interior Surface */}
            <path
              d="M 36,55 C 28,68 12,82 12,102 L 12,242 C 12,264 32,268 100,268 C 168,268 188,264 188,242 L 188,102 C 188,82 172,68 164,55 Z"
              fill="url(#jarGlassGrad)"
            />

            {/* ── MONEY NOTES & COINS PILE (Clipped inside jar and fill level) ── */}
            <g clipPath="url(#masonJarClip)">
              <g clipPath="url(#moneyLevelClip)">
                {/* Ambient Cash Glow at bottom */}
                <rect x="10" y="50" width="180" height="220" fill="url(#moneySurfaceGlow)" opacity="0.35" />

                {/* ── LAYER 1: BASE TIER (Always present when money saved) ── */}
                <Banknote x={26} y={238} width={58} height={23} rotation={-6} />
                <Banknote x={110} y={236} width={62} height={23} rotation={8} />
                <Banknote x={62} y={244} width={70} height={24} rotation={1} />
                <Coin cx={42} cy={252} r={8.5} />
                <Coin cx={85} cy={256} r={8} />
                <Coin cx={130} cy={252} r={9} />
                <Coin cx={162} cy={248} r={8} />
                <Coin cx={105} cy={258} r={7.5} />

                {/* ── LAYER 2: LOWER-MID TIER (y: 200 to 235) ── */}
                <Banknote x={18} y={212} width={62} height={23} rotation={14} />
                <Banknote x={112} y={208} width={64} height={23} rotation={-12} />
                <Banknote x={58} y={220} width={72} height={24} rotation={-3} />
                <Coin cx={48} cy={224} r={8.5} />
                <Coin cx={116} cy={226} r={8} />
                <Coin cx={150} cy={218} r={8.5} />
                <Coin cx={32} cy={206} r={7.5} />
                <Coin cx={88} cy={218} r={8} />

                {/* ── LAYER 3: MID TIER (y: 165 to 200) ── */}
                <Banknote x={28} y={174} width={66} height={24} rotation={-9} />
                <Banknote x={98} y={178} width={65} height={24} rotation={11} />
                <Banknote x={54} y={186} width={72} height={24} rotation={4} />
                <Coin cx={68} cy={168} r={8.5} />
                <Coin cx={136} cy={182} r={9} />
                <Coin cx={40} cy={188} r={8} />
                <Coin cx={160} cy={172} r={8} />

                {/* ── LAYER 4: UPPER-MID TIER (y: 130 to 165) ── */}
                <Banknote x={22} y={138} width={65} height={24} rotation={15} />
                <Banknote x={102} y={134} width={68} height={24} rotation={-10} />
                <Banknote x={58} y={146} width={74} height={24} rotation={-2} />
                <Coin cx={52} cy={134} r={8.5} />
                <Coin cx={120} cy={144} r={8} />
                <Coin cx={152} cy={136} r={8} />
                <Coin cx={34} cy={154} r={8} />
                <Coin cx={86} cy={140} r={8.5} />

                {/* ── LAYER 5: TOP TIER (y: 95 to 130) ── */}
                <Banknote x={28} y={102} width={66} height={24} rotation={-12} />
                <Banknote x={98} y={104} width={66} height={24} rotation={8} />
                <Banknote x={56} y={114} width={74} height={24} rotation={3} />
                <Coin cx={44} cy={98} r={8.5} />
                <Coin cx={126} cy={108} r={8.5} />
                <Coin cx={86} cy={96} r={8} />
                <Coin cx={155} cy={104} r={7.5} />

                {/* ── LAYER 6: BRIM TIER (y: 65 to 95) ── */}
                <Banknote x={38} y={68} width={60} height={22} rotation={10} />
                <Banknote x={92} y={66} width={62} height={22} rotation={-8} />
                <Coin cx={66} cy={64} r={8} />
                <Coin cx={118} cy={68} r={8.5} />
                <Coin cx={92} cy={76} r={8} />
                <Coin cx={145} cy={72} r={7.5} />

                {/* Surface Gold/Emerald Shimmer line */}
                <ellipse cx="100" cy={fillY + 3} rx="65" ry="3" fill="rgba(254, 240, 138, 0.65)" />
              </g>
            </g>

            {/* ── MASON JAR OUTLINE & GLASS HIGHLIGHTS (Matches uploaded sketch) ── */}
            {/* 1. Main outer contour */}
            <path
              d="M 36,55 C 28,68 12,82 12,102 L 12,242 C 12,264 32,268 100,268 C 168,268 188,264 188,242 L 188,102 C 188,82 172,68 164,55 Z"
              fill="none"
              stroke="#00d2ff"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="drop-shadow(0 0 8px rgba(0, 210, 255, 0.4))"
            />

            {/* 2. Screw Thread Ring 2 (lower horizontal bead) */}
            <rect
              x="24"
              y="42"
              width="152"
              height="13"
              rx="6.5"
              fill="rgba(11, 22, 46, 0.7)"
              stroke="#00d2ff"
              strokeWidth="2.2"
            />

            {/* 3. Screw Thread Ring 1 (upper horizontal bead) */}
            <rect
              x="24"
              y="28"
              width="152"
              height="13"
              rx="6.5"
              fill="rgba(11, 22, 46, 0.7)"
              stroke="#00d2ff"
              strokeWidth="2.2"
            />

            {/* 4. Top Rim / Flat rounded Lid */}
            <rect
              x="32"
              y="12"
              width="136"
              height="15"
              rx="7"
              fill="rgba(11, 22, 46, 0.85)"
              stroke="#00d2ff"
              strokeWidth="2.5"
            />
            <text
              x="100"
              y="22.5"
              textAnchor="middle"
              fontSize="7"
              fontWeight="900"
              fill="rgba(0, 210, 255, 0.7)"
              letterSpacing="1.5"
              fontFamily="sans-serif"
            >
              SENTINEL VAULT
            </text>

            {/* 5. Left vertical inner glass reflection stroke (from sketch) */}
            <path
              d="M 22,85 L 22,145"
              stroke="rgba(255,255,255,0.75)"
              strokeWidth="3.2"
              strokeLinecap="round"
              fill="none"
            />

            {/* 6. Lower-left corner curve reflection stroke (from sketch) */}
            <path
              d="M 22,228 C 22,250 34,258 58,258"
              stroke="rgba(255,255,255,0.75)"
              strokeWidth="3.2"
              strokeLinecap="round"
              fill="none"
            />

            {/* 7. Lower-right corner curve reflection stroke (from sketch) */}
            <path
              d="M 178,185 L 178,235 C 178,250 168,258 145,258"
              stroke="rgba(255,255,255,0.75)"
              strokeWidth="3.2"
              strokeLinecap="round"
              fill="none"
            />

            {/* 8. Top-right shoulder soft shine */}
            <path
              d="M 158,62 C 170,72 176,82 176,96"
              stroke="rgba(255,255,255,0.4)"
              strokeWidth="2.2"
              strokeLinecap="round"
              fill="none"
            />
          </svg>

          {/* Animated Falling Coins / Banknotes Overlay */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
            {coins.map((coin) => (
              <div
                key={coin.id}
                className="coin-anim absolute flex items-center justify-center rounded-full"
                style={{
                  width: coin.type === 'bill' ? 28 : 22,
                  height: coin.type === 'bill' ? 16 : 22,
                  left: `calc(${coin.left}% - 12px)`,
                  animationDelay: `${coin.delay}ms`,
                  background: coin.type === 'bill'
                    ? 'linear-gradient(135deg, #10b981, #047857)'
                    : 'radial-gradient(circle at 35% 32%, #ffe066, #c89400)',
                  border: coin.type === 'bill' ? '1px solid #064e3b' : '2px solid #d4a200',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.5)',
                  color: coin.type === 'bill' ? '#ffffff' : '#7a4f00',
                  fontSize: 10,
                  fontWeight: 900,
                  borderRadius: coin.type === 'bill' ? 4 : '50%',
                }}
                aria-hidden="true"
              >
                $
              </div>
            ))}
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full max-w-sm space-y-2">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-[#8295b5]">Target: {goalName}</span>
            <span style={{ color: '#00d2ff' }}>{pctProgress}% reached</span>
          </div>

          <div
            className="w-full h-2.5 rounded-full overflow-hidden"
            style={{ background: 'rgba(0, 210, 255, 0.1)', border: '1px solid rgba(0, 210, 255, 0.2)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${pctProgress}%`,
                background: 'linear-gradient(90deg, #10b981, #00d2ff)',
                boxShadow: '0 0 12px rgba(0, 210, 255, 0.5)',
              }}
            />
          </div>
        </div>

        {/* Preset Goals Pills */}
        <div className="space-y-3 w-full max-w-md">
          <span className="text-xs font-bold uppercase tracking-wider text-[#8295b5]">
            Select Goal Target
          </span>
          <div className="flex flex-wrap justify-center gap-2.5">
            {PRESETS.map((p, idx) => (
              <button
                key={p.name}
                onClick={() => selectPreset(idx)}
                className="px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                style={
                  activePreset === idx
                    ? {
                        background: '#00d2ff',
                        color: '#050a17',
                        boxShadow: '0 0 15px rgba(0, 210, 255, 0.4)',
                      }
                    : {
                        background: 'rgba(11, 22, 46, 0.8)',
                        border: '1px solid rgba(0, 210, 255, 0.2)',
                        color: '#8295b5',
                      }
                }
              >
                <span>{p.emoji}</span>
                <span>{p.name} (₹{fmt(p.amount)})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Goal Input */}
        <form onSubmit={handleCustomGoal} className="flex items-center gap-2 max-w-sm w-full">
          <input
            type="text"
            placeholder="Custom target name..."
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            className="flex-1 px-3.5 py-2.5 rounded-xl text-xs bg-[#0b162e] border border-[#00d2ff]/25 text-white placeholder-[#8295b5] focus:outline-none focus:border-[#00d2ff]"
          />
          <input
            type="number"
            placeholder="Amount ₹"
            value={customAmt}
            onChange={(e) => setCustomAmt(e.target.value)}
            className="w-24 px-3.5 py-2.5 rounded-xl text-xs bg-[#0b162e] border border-[#00d2ff]/25 text-white placeholder-[#8295b5] focus:outline-none focus:border-[#00d2ff]"
          />
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#050a17] bg-[#00d2ff] hover:scale-105 transition-all shadow-[0_0_12px_rgba(0,210,255,0.3)] cursor-pointer"
          >
            Set
          </button>
        </form>
      </div>
    </div>
  );
}
