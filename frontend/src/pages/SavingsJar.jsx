// frontend/src/pages/SavingsJar.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getSubscriptions } from '../api/client';
import { playChaChingSound } from '../utils/audio';

const PRESETS = [
  { name: 'Weekend trip',   amount: 5000,  emoji: '🏖️' },
  { name: 'New phone',      amount: 20000, emoji: '📱' },
  { name: 'Emergency fund', amount: 10000, emoji: '🏦' },
];

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

// Complete SVG Banknote Component (Never cut or clipped, drops and stays in jar)
function Banknote({ x, y, width = 58, height = 23, rotation = 0, delay = 0 }) {
  return (
    <g transform={`translate(${x}, ${y}) rotate(${rotation})`}>
      <g className="money-drop-item" style={{ animationDelay: `${delay}ms` }}>
        {/* Soft shadow */}
        <rect x="-1" y="1" width={width} height={height} rx="2" fill="rgba(0,0,0,0.4)" />
        {/* Main bill surface */}
        <rect x="0" y="0" width={width} height={height} rx="2.5" fill="url(#jarBillGrad)" stroke="#047857" strokeWidth="0.8" />
        {/* Security dashed line */}
        <rect x="2" y="2" width={width - 4} height={height - 4} rx="1.5" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.6" strokeDasharray="3 1" />
        {/* Center medallion */}
        <ellipse cx={width / 2} cy={height / 2} rx="8" ry="6" fill="#047857" fillOpacity="0.45" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5" />
        <text x={width / 2} y={height / 2 + 2.5} textAnchor="middle" fontSize="6.5" fontWeight="900" fill="#ffffff" fontFamily="sans-serif">₹</text>
        <text x="4" y="6.5" fontSize="4.5" fontWeight="bold" fill="rgba(255,255,255,0.85)" fontFamily="sans-serif">₹</text>
        <text x={width - 6} y={height - 2.5} fontSize="4.5" fontWeight="bold" fill="rgba(255,255,255,0.85)" fontFamily="sans-serif">₹</text>
      </g>
    </g>
  );
}

// Complete SVG Coin Component (Never cut or clipped, drops and stays in jar)
function Coin({ cx, cy, r = 8, rotation = 0, delay = 0 }) {
  return (
    <g transform={`translate(${cx}, ${cy}) rotate(${rotation})`}>
      <g className="money-drop-item" style={{ animationDelay: `${delay}ms` }}>
        <circle cx="0.5" cy="1" r={r} fill="rgba(0,0,0,0.4)" />
        <circle cx="0" cy="0" r={r} fill="url(#jarCoinGrad)" stroke="#b45309" strokeWidth="0.8" />
        <circle cx="0" cy="0" r={r - 1.5} fill="none" stroke="#fef08a" strokeWidth="0.5" strokeDasharray="2 1" />
        <text x="0" y={r * 0.35} textAnchor="middle" fontSize={r * 0.95} fontWeight="900" fill="#78350f" fontFamily="sans-serif">₹</text>
      </g>
    </g>
  );
}

// Fixed positions of whole banknotes and coins sitting naturally in the jar
// Items unlock progressively from bottom to top based directly on saved vs goal ratio
const PILE_ITEMS = [
  // ── Tier 1: Base (0% - 15%) ──
  { id: 'b1', type: 'note', x: 28, y: 244, w: 56, h: 22, rot: -7, threshold: 0.03 },
  { id: 'c1', type: 'coin', cx: 104, cy: 254, r: 8, threshold: 0.06 },
  { id: 'b2', type: 'note', x: 106, y: 242, w: 58, h: 22, rot: 8, threshold: 0.09 },
  { id: 'c2', type: 'coin', cx: 50, cy: 252, r: 8.5, threshold: 0.12 },
  { id: 'b3', type: 'note', x: 62, y: 246, w: 66, h: 23, rot: 1, threshold: 0.15 },

  // ── Tier 2: Lower-mid (15% - 32%) ──
  { id: 'c3', type: 'coin', cx: 146, cy: 244, r: 8, threshold: 0.18 },
  { id: 'b4', type: 'note', x: 24, y: 222, w: 58, h: 22, rot: 12, threshold: 0.22 },
  { id: 'c4', type: 'coin', cx: 78, cy: 232, r: 8.5, threshold: 0.25 },
  { id: 'b5', type: 'note', x: 108, y: 220, w: 60, h: 22, rot: -10, threshold: 0.28 },
  { id: 'c5', type: 'coin', cx: 126, cy: 228, r: 8, threshold: 0.32 },

  // ── Tier 3: Mid (32% - 50%) ──
  { id: 'b6', type: 'note', x: 55, y: 218, w: 68, h: 23, rot: -2, threshold: 0.36 },
  { id: 'c6', type: 'coin', cx: 38, cy: 206, r: 8, threshold: 0.39 },
  { id: 'b7', type: 'note', x: 25, y: 190, w: 62, h: 23, rot: -8, threshold: 0.43 },
  { id: 'b8', type: 'note', x: 102, y: 192, w: 62, h: 23, rot: 10, threshold: 0.46 },
  { id: 'c7', type: 'coin', cx: 88, cy: 196, r: 8.5, threshold: 0.50 },

  // ── Tier 4: Upper-mid (50% - 70%) ──
  { id: 'b9', type: 'note', x: 50, y: 182, w: 70, h: 23, rot: 3, threshold: 0.54 },
  { id: 'c8', type: 'coin', cx: 148, cy: 188, r: 8, threshold: 0.58 },
  { id: 'c9', type: 'coin', cx: 56, cy: 166, r: 8.5, threshold: 0.62 },
  { id: 'b10', type: 'note', x: 22, y: 152, w: 64, h: 23, rot: 11, threshold: 0.66 },
  { id: 'b11', type: 'note', x: 104, y: 154, w: 64, h: 23, rot: -9, threshold: 0.70 },

  // ── Tier 5: High (70% - 86%) ──
  { id: 'c10', type: 'coin', cx: 130, cy: 160, r: 8, threshold: 0.74 },
  { id: 'b12', type: 'note', x: 54, y: 146, w: 70, h: 23, rot: -3, threshold: 0.78 },
  { id: 'c11', type: 'coin', cx: 44, cy: 134, r: 8.5, threshold: 0.82 },
  { id: 'b13', type: 'note', x: 28, y: 118, w: 62, h: 22, rot: -10, threshold: 0.86 },

  // ── Tier 6: Brim (86% - 100%) ──
  { id: 'b14', type: 'note', x: 96, y: 120, w: 62, h: 22, rot: 8, threshold: 0.90 },
  { id: 'c12', type: 'coin', cx: 118, cy: 124, r: 8, threshold: 0.93 },
  { id: 'b15', type: 'note', x: 52, y: 110, w: 68, h: 22, rot: 3, threshold: 0.96 },
  { id: 'c13', type: 'coin', cx: 72, cy: 94, r: 8.5, threshold: 0.98 },
  { id: 'b16', type: 'note', x: 48, y: 82, w: 64, h: 22, rot: -4, threshold: 1.00 },
];

export default function SavingsJar() {
  const [saved, setSaved]           = useState(0);
  const [displaySaved, setDisplay]  = useState(0);
  const [goal, setGoal]             = useState(5000);
  const [goalName, setGoalName]     = useState('Weekend trip');
  const [activePreset, setPreset]   = useState(0);
  const [goalHit, setGoalHit]       = useState(false);
  const [customName, setCustomName] = useState('');
  const [customAmt, setCustomAmt]   = useState('');

  const balAnimRef  = useRef(null);
  const canvasRef   = useRef(null);
  const goalHitRef  = useRef(false);

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
        const total = Math.max(cancelledTotal, storedSaved, 1800);

        setSaved(total);
        countUp(0, total);
      } catch (err) {
        console.warn('Savings load error, fallback to default:', err);
        setSaved(2400);
        countUp(0, 2400);
      }
    }
    initSavings();
  }, [countUp]);

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
  };

  const addSavings = (amt) => {
    const next = saved + amt;
    setSaved(next);
    localStorage.setItem('churnguard_saved', String(next));
    countUp(saved, next);
    playChaChingSound();
  };

  const resetSavings = () => {
    setSaved(0);
    localStorage.setItem('churnguard_saved', '0');
    countUp(saved, 0);
  };

  const ratio = Math.min(Math.max(saved / goal, 0), 1);
  const pctProgress = Math.min(Math.round(ratio * 100), 100);

  // Directly proportional to money saved vs goal:
  // Items unlock in sequence as ratio passes their threshold
  const visibleItems = PILE_ITEMS.filter((item) => ratio >= item.threshold);

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
            Every cancelled or audited subscription drops real cash and gold into your vault.
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

        {/* ── Mason Jar Container (Clean cyan outline, whole notes/coins that drop & stay) ── */}
        <div className="relative" style={{ width: 230, height: 320 }} aria-hidden="true">
          <svg
            viewBox="0 0 200 280"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full overflow-visible"
          >
            <defs>
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

              {/* Glass subtle tint */}
              <linearGradient id="jarGlassGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="rgba(0, 210, 255, 0.08)" />
                <stop offset="50%" stopColor="rgba(0, 210, 255, 0.02)" />
                <stop offset="100%" stopColor="rgba(0, 210, 255, 0.06)" />
              </linearGradient>
            </defs>

            {/* Jar Base Drop Shadow */}
            <ellipse cx="100" cy="274" rx="76" ry="6.5" fill="rgba(0,0,0,0.5)" />

            {/* Glass Interior Surface */}
            <path
              d="M 36,55 C 28,68 12,82 12,102 L 12,242 C 12,264 32,268 100,268 C 168,268 188,264 188,242 L 188,102 C 188,82 172,68 164,55 Z"
              fill="url(#jarGlassGrad)"
            />

            {/* ── WHOLE BANKNOTES & COINS DROPPING & STAYING INSIDE (NO CUTS, NO VANISHING) ── */}
            <g>
              {visibleItems.map((item, idx) => {
                const staggerDelay = Math.min(idx * 40, 500);
                if (item.type === 'note') {
                  return (
                    <Banknote
                      key={item.id}
                      x={item.x}
                      y={item.y}
                      width={item.w}
                      height={item.h}
                      rotation={item.rot}
                      delay={staggerDelay}
                    />
                  );
                }
                return (
                  <Coin
                    key={item.id}
                    cx={item.cx}
                    cy={item.cy}
                    r={item.r}
                    delay={staggerDelay}
                  />
                );
              })}
            </g>

            {/* ── MASON JAR CLEAN CYAN OUTLINE (NO WHITE HIGHLIGHTS) ── */}
            {/* 1. Main outer contour */}
            <path
              d="M 36,55 C 28,68 12,82 12,102 L 12,242 C 12,264 32,268 100,268 C 168,268 188,264 188,242 L 188,102 C 188,82 172,68 164,55 Z"
              fill="none"
              stroke="#00d2ff"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="drop-shadow(0 0 10px rgba(0, 210, 255, 0.45))"
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
              fill="#00d2ff"
              letterSpacing="1.5"
              fontFamily="sans-serif"
            >
              SENTINEL VAULT
            </text>
          </svg>
        </div>

        {/* Progress bar */}
        <div className="w-full max-w-sm space-y-2">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-[#8295b5]">Target: {goalName}</span>
            <span style={{ color: '#00d2ff' }}>{pctProgress}% reached ({visibleItems.length}/{PILE_ITEMS.length} items)</span>
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

          {/* Quick test buttons to add savings and watch money drop in */}
          <div className="flex items-center justify-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => addSavings(500)}
              className="px-3 py-1 rounded-full text-xs font-bold bg-[#00d2ff]/10 text-[#00d2ff] border border-[#00d2ff]/30 hover:bg-[#00d2ff]/20 active:scale-95 transition-all cursor-pointer flex items-center gap-1"
            >
              <span>+</span> ₹500
            </button>
            <button
              type="button"
              onClick={() => addSavings(1000)}
              className="px-3 py-1 rounded-full text-xs font-bold bg-[#00d2ff]/10 text-[#00d2ff] border border-[#00d2ff]/30 hover:bg-[#00d2ff]/20 active:scale-95 transition-all cursor-pointer flex items-center gap-1"
            >
              <span>+</span> ₹1,000
            </button>
            <button
              type="button"
              onClick={resetSavings}
              className="px-2.5 py-1 rounded-full text-[11px] text-[#8295b5] hover:text-white transition-colors cursor-pointer"
              title="Reset vault cash to 0 to watch it fill from empty"
            >
              Reset
            </button>
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
