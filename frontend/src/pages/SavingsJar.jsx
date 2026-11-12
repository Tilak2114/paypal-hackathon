// frontend/src/pages/SavingsJar.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getSubscriptions } from '../api/client';
import { playChaChingSound } from '../utils/audio';

const PRESETS = [
  { name: 'Weekend trip',   amount: 250,  emoji: '🏖️' },
  { name: 'New phone',      amount: 800,  emoji: '📱' },
  { name: 'Emergency fund', amount: 1500, emoji: '🏦' },
];

function fmt(n) { return Math.round(n).toLocaleString('en-US'); }
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
        <text x={width / 2} y={height / 2 + 2.5} textAnchor="middle" fontSize="6.5" fontWeight="900" fill="#ffffff" fontFamily="sans-serif">$</text>
        <text x="4" y="6.5" fontSize="4.5" fontWeight="bold" fill="rgba(255,255,255,0.85)" fontFamily="sans-serif">$</text>
        <text x={width - 6} y={height - 2.5} fontSize="4.5" fontWeight="bold" fill="rgba(255,255,255,0.85)" fontFamily="sans-serif">$</text>
      </g>
    </g>
  );
}

// Complete SVG Coin Component (Never cut or clipped, drops and stays in jar)
function Coin({ cx, cy, r = 7.5, rotation = 0, delay = 0 }) {
  return (
    <g transform={`translate(${cx}, ${cy}) rotate(${rotation})`}>
      <g className="money-drop-item" style={{ animationDelay: `${delay}ms` }}>
        <circle cx="0.5" cy="1" r={r} fill="rgba(0,0,0,0.4)" />
        <circle cx="0" cy="0" r={r} fill="url(#jarCoinGrad)" stroke="#b45309" strokeWidth="0.8" />
        <circle cx="0" cy="0" r={r - 1.5} fill="none" stroke="#fef08a" strokeWidth="0.5" strokeDasharray="2 1" />
        <text x="0" y={r * 0.35} textAnchor="middle" fontSize={r * 0.95} fontWeight="900" fill="#78350f" fontFamily="sans-serif">$</text>
      </g>
    </g>
  );
}

// Fixed positions of whole banknotes and coins sitting naturally in the jar
// Densely packed and overlapping so that when full, there are no big empty gaps
const PILE_ITEMS = [
  // ── Tier 1: Base Floor (0% - 16%) ──
  { id: 'b1', type: 'note', x: 26, y: 226, w: 56, h: 21, rot: -6, threshold: 0.02 },
  { id: 'c1', type: 'coin', cx: 96, cy: 236, r: 7.5, threshold: 0.04 },
  { id: 'b2', type: 'note', x: 104, y: 224, w: 58, h: 21, rot: 7, threshold: 0.07 },
  { id: 'c2', type: 'coin', cx: 52, cy: 236, r: 8, threshold: 0.09 },
  { id: 'b3', type: 'note', x: 58, y: 227, w: 66, h: 21, rot: 1, threshold: 0.12 },
  { id: 'c3', type: 'coin', cx: 136, cy: 232, r: 7.5, threshold: 0.14 },
  { id: 'b3b', type: 'note', x: 42, y: 220, w: 60, h: 21, rot: -3, threshold: 0.16 },

  // ── Tier 2: Lower-mid (16% - 35%) ──
  { id: 'b4', type: 'note', x: 24, y: 204, w: 58, h: 21, rot: 11, threshold: 0.19 },
  { id: 'c4', type: 'coin', cx: 80, cy: 212, r: 8, threshold: 0.22 },
  { id: 'b5', type: 'note', x: 102, y: 202, w: 60, h: 21, rot: -9, threshold: 0.25 },
  { id: 'b6', type: 'note', x: 54, y: 206, w: 68, h: 21, rot: -1, threshold: 0.28 },
  { id: 'c5', type: 'coin', cx: 126, cy: 210, r: 7.5, threshold: 0.30 },
  { id: 'c6', type: 'coin', cx: 38, cy: 208, r: 8, threshold: 0.33 },
  { id: 'b6b', type: 'note', x: 74, y: 198, w: 60, h: 21, rot: 5, threshold: 0.35 },

  // ── Tier 3: Mid (35% - 55%) ──
  { id: 'b7', type: 'note', x: 24, y: 178, w: 62, h: 21, rot: -8, threshold: 0.38 },
  { id: 'c7', type: 'coin', cx: 92, cy: 184, r: 8, threshold: 0.41 },
  { id: 'b8', type: 'note', x: 98, y: 180, w: 62, h: 21, rot: 9, threshold: 0.44 },
  { id: 'b9', type: 'note', x: 50, y: 184, w: 70, h: 21, rot: 2, threshold: 0.47 },
  { id: 'c8', type: 'coin', cx: 142, cy: 186, r: 7.5, threshold: 0.50 },
  { id: 'c9', type: 'coin', cx: 44, cy: 182, r: 8, threshold: 0.52 },
  { id: 'b9b', type: 'note', x: 70, y: 174, w: 62, h: 21, rot: -4, threshold: 0.55 },

  // ── Tier 4: Upper-mid (55% - 75%) ──
  { id: 'b10', type: 'note', x: 22, y: 150, w: 64, h: 21, rot: 10, threshold: 0.58 },
  { id: 'c10', type: 'coin', cx: 88, cy: 156, r: 8, threshold: 0.61 },
  { id: 'b11', type: 'note', x: 100, y: 152, w: 64, h: 21, rot: -8, threshold: 0.64 },
  { id: 'b12', type: 'note', x: 52, y: 156, w: 70, h: 21, rot: -2, threshold: 0.67 },
  { id: 'c11', type: 'coin', cx: 138, cy: 154, r: 7.5, threshold: 0.70 },
  { id: 'c12', type: 'coin', cx: 42, cy: 152, r: 8, threshold: 0.72 },
  { id: 'b12b', type: 'note', x: 68, y: 144, w: 62, h: 21, rot: 4, threshold: 0.75 },

  // ── Tier 5: High (75% - 90%) ──
  { id: 'b13', type: 'note', x: 26, y: 120, w: 62, h: 21, rot: -9, threshold: 0.78 },
  { id: 'c13', type: 'coin', cx: 84, cy: 126, r: 8, threshold: 0.80 },
  { id: 'b14', type: 'note', x: 96, y: 122, w: 62, h: 21, rot: 8, threshold: 0.83 },
  { id: 'b15', type: 'note', x: 52, y: 126, w: 68, h: 21, rot: 3, threshold: 0.85 },
  { id: 'c14', type: 'coin', cx: 130, cy: 124, r: 7.5, threshold: 0.87 },
  { id: 'c15', type: 'coin', cx: 46, cy: 122, r: 8, threshold: 0.89 },
  { id: 'b15b', type: 'note', x: 66, y: 114, w: 60, h: 21, rot: -3, threshold: 0.91 },

  // ── Tier 6: Brim (90% - 100%) ──
  { id: 'b16', type: 'note', x: 34, y: 92, w: 60, h: 21, rot: 8, threshold: 0.93 },
  { id: 'c16', type: 'coin', cx: 98, cy: 96, r: 8, threshold: 0.95 },
  { id: 'b17', type: 'note', x: 88, y: 92, w: 62, h: 21, rot: -7, threshold: 0.97 },
  { id: 'c17', type: 'coin', cx: 62, cy: 92, r: 8, threshold: 0.98 },
  { id: 'b18', type: 'note', x: 48, y: 80, w: 64, h: 21, rot: -2, threshold: 1.00 },
];

export default function SavingsJar() {
  const [saved, setSaved]           = useState(0);
  const [displaySaved, setDisplay]  = useState(0);

  // Restore persisted goal or default to Weekend trip
  const [goal, setGoal]             = useState(() => {
    try {
      const stored = localStorage.getItem('churnguard_selected_goal');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.amount) return parsed.amount;
      }
    } catch {}
    return 250;
  });

  const [goalName, setGoalName]     = useState(() => {
    try {
      const stored = localStorage.getItem('churnguard_selected_goal');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.name) return parsed.name;
      }
    } catch {}
    return 'Weekend trip';
  });

  const [activePreset, setPreset]   = useState(() => {
    try {
      const stored = localStorage.getItem('churnguard_selected_goal');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.isCustom) return -1;
        if (typeof parsed.presetIndex === 'number') return parsed.presetIndex;
      }
    } catch {}
    return 0;
  });

  const [customGoal, setCustomGoal] = useState(() => {
    try {
      const stored = localStorage.getItem('churnguard_custom_goal');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

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
        const total = Math.max(cancelledTotal, storedSaved, 120);

        setSaved(total);
        countUp(0, total);
      } catch (err) {
        console.warn('Savings load error, fallback to default:', err);
        setSaved(120);
        countUp(0, 120);
      }
    }
    initSavings();
  }, [countUp]);

  // Goal celebration check (fires once upon reaching 100%, never auto-switches goal)
  useEffect(() => {
    if (saved >= goal && !goalHitRef.current && goal > 0) {
      goalHitRef.current = true;
      launchConfetti(canvasRef.current);
    } else if (saved < goal) {
      goalHitRef.current = false;
    }
  }, [saved, goal]);

  const selectPreset = (idx) => {
    setPreset(idx);
    const p = PRESETS[idx];
    setGoal(p.amount);
    setGoalName(p.name);
    localStorage.setItem('churnguard_selected_goal', JSON.stringify({
      isCustom: false,
      presetIndex: idx,
      name: p.name,
      amount: p.amount,
    }));
  };

  const selectCustomGoal = () => {
    if (!customGoal) return;
    setPreset(-1);
    setGoal(customGoal.amount);
    setGoalName(customGoal.name);
    localStorage.setItem('churnguard_selected_goal', JSON.stringify({
      isCustom: true,
      name: customGoal.name,
      amount: customGoal.amount,
    }));
  };

  const handleCustomGoal = (e) => {
    e.preventDefault();
    const amt = parseFloat(customAmt);
    if (!amt || amt <= 0) return;
    const name = customName.trim() || 'Custom Goal';
    const newCustom = { name, amount: amt };
    setCustomGoal(newCustom);
    setGoal(amt);
    setGoalName(name);
    setPreset(-1);
    localStorage.setItem('churnguard_custom_goal', JSON.stringify(newCustom));
    localStorage.setItem('churnguard_selected_goal', JSON.stringify({
      isCustom: true,
      name,
      amount: amt,
    }));
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

  const ratio = goal > 0 ? Math.min(Math.max(saved / goal, 0), 1) : 0;
  const pctProgress = Math.min(Math.round(ratio * 100), 100);
  const isFull = saved >= goal && goal > 0;
  const extraSaved = saved > goal ? saved - goal : 0;

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
              background: isFull ? 'rgba(16, 185, 129, 0.15)' : 'rgba(0, 210, 255, 0.1)',
              color: isFull ? '#10b981' : '#00d2ff',
              border: `1px solid ${isFull ? 'rgba(16, 185, 129, 0.45)' : 'rgba(0, 210, 255, 0.35)'}`,
            }}
          >
            <span>{isFull ? '🏆' : '💰'}</span>
            <span>{isFull ? 'Vault Level: 100% • Target Completed!' : 'Sentinel Cash & Savings Vault'}</span>
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
            ${fmt(displaySaved)}
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

              {/* Inner Jar Clip - Guaranteed containment so no note or coin can ever poke outside */}
              <clipPath id="jarGlassInnerClip">
                <path d="M 36,55 C 28,68 15,82 15,102 L 15,236 C 15,258 35,263 100,263 C 165,263 185,258 185,236 L 185,102 C 185,82 172,68 164,55 Z" />
              </clipPath>
            </defs>

            {/* Jar Base Drop Shadow */}
            <ellipse cx="100" cy="274" rx="76" ry="6.5" fill="rgba(0,0,0,0.5)" />

            {/* Glass Interior Surface */}
            <path
              d="M 36,55 C 28,68 12,82 12,102 L 12,242 C 12,264 32,268 100,268 C 168,268 188,264 188,242 L 188,102 C 188,82 172,68 164,55 Z"
              fill="url(#jarGlassGrad)"
            />

            {/* ── WHOLE BANKNOTES & COINS DROPPING & STAYING INSIDE (CLIP INSIDE GLASS, NO SPILL) ── */}
            <g clipPath="url(#jarGlassInnerClip)">
              {visibleItems.map((item, idx) => {
                const staggerDelay = Math.min(idx * 35, 450);
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
              stroke={isFull ? '#10b981' : '#00d2ff'}
              strokeWidth="2.5"
            />
            <text
              x="100"
              y="22.5"
              textAnchor="middle"
              fontSize="7"
              fontWeight="900"
              fill={isFull ? '#10b981' : '#00d2ff'}
              letterSpacing="1.5"
              fontFamily="sans-serif"
            >
              {isFull ? 'VAULT LEVEL 100%' : 'SENTINEL VAULT'}
            </text>
          </svg>
        </div>

        {/* 100% Full Celebratory Banner (persists, never auto-switches goal) */}
        {isFull && (
          <div
            className="w-full max-w-md p-4 rounded-2xl flex items-center justify-between gap-3 text-left transition-all"
            style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(0, 210, 255, 0.18))',
              border: '1px solid rgba(0, 210, 255, 0.5)',
              boxShadow: '0 0 30px rgba(0, 210, 255, 0.3)',
            }}
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">🏆</span>
              <div>
                <div className="text-xs font-black uppercase tracking-wider text-[#00d2ff] flex items-center gap-1.5">
                  <span className="text-[#10b981]">Vault Level: 100%</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#10b981]/25 text-[#10b981] font-bold">
                    Goal Reached!
                  </span>
                </div>
                <div className="text-xs text-white/90 font-medium mt-0.5">
                  Target reached for <strong>{goalName}</strong>!
                  {extraSaved > 0 && (
                    <span className="text-[#00d2ff] ml-1 font-bold">
                      (+$${fmt(extraSaved)} extra saved)
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-[#8295b5] mt-0.5">
                  Your jar remains full. Ready for a new milestone? Pick or enter a target below.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Progress bar */}
        <div className="w-full max-w-sm space-y-2">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-[#8295b5]">
              Target: <strong className="text-white">{goalName}</strong>
            </span>
            <span style={{ color: isFull ? '#10b981' : '#00d2ff' }} className="font-bold">
              {isFull ? 'Vault Level: 100% (Goal Reached! 🎉)' : `Vault Level: ${pctProgress}%`} ({visibleItems.length}/{PILE_ITEMS.length} items)
            </span>
          </div>

          <div
            className="w-full h-3 rounded-full overflow-hidden"
            style={{
              background: 'rgba(0, 210, 255, 0.1)',
              border: `1px solid ${isFull ? 'rgba(16, 185, 129, 0.6)' : 'rgba(0, 210, 255, 0.25)'}`,
            }}
          >
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${pctProgress}%`,
                background: isFull
                  ? 'linear-gradient(90deg, #10b981, #00d2ff, #34d399)'
                  : 'linear-gradient(90deg, #10b981, #00d2ff)',
                boxShadow: isFull ? '0 0 16px rgba(16, 185, 129, 0.7)' : '0 0 12px rgba(0, 210, 255, 0.5)',
              }}
            />
          </div>

          {/* Quick test buttons to add savings and watch money drop in */}
          <div className="flex items-center justify-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => addSavings(25)}
              className="px-3.5 py-1 rounded-full text-xs font-bold bg-[#00d2ff]/10 text-[#00d2ff] border border-[#00d2ff]/30 hover:bg-[#00d2ff]/20 active:scale-95 transition-all cursor-pointer flex items-center gap-1"
            >
              <span>+</span> $25
            </button>
            <button
              type="button"
              onClick={() => addSavings(50)}
              className="px-3.5 py-1 rounded-full text-xs font-bold bg-[#00d2ff]/10 text-[#00d2ff] border border-[#00d2ff]/30 hover:bg-[#00d2ff]/20 active:scale-95 transition-all cursor-pointer flex items-center gap-1"
            >
              <span>+</span> $50
            </button>
            <button
              type="button"
              onClick={() => addSavings(100)}
              className="px-3.5 py-1 rounded-full text-xs font-bold bg-[#00d2ff]/10 text-[#00d2ff] border border-[#00d2ff]/30 hover:bg-[#00d2ff]/20 active:scale-95 transition-all cursor-pointer flex items-center gap-1"
            >
              <span>+</span> $100
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

        {/* Goal Targets (Presets + Custom Goal) */}
        <div className="space-y-3 w-full max-w-md">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#8295b5]">
            <span>Goal Target</span>
            {activePreset === -1 && (
              <span className="text-[#00d2ff] font-bold">Custom Target Active</span>
            )}
          </div>

          <div className="flex flex-wrap justify-center gap-2.5">
            {PRESETS.map((p, idx) => (
              <button
                key={p.name}
                type="button"
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
                <span>{p.name} (${fmt(p.amount)})</span>
              </button>
            ))}

            {/* Custom Goal Pill (Active / selectable if set) */}
            {customGoal && (
              <button
                type="button"
                onClick={selectCustomGoal}
                className="px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                style={
                  activePreset === -1
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
                <span>🎯</span>
                <span>{customGoal.name} (${fmt(customGoal.amount)})</span>
              </button>
            )}
          </div>

          {/* Custom Goal Input - Users can type any custom target name and amount */}
          <form onSubmit={handleCustomGoal} className="flex items-center gap-2 max-w-md w-full pt-1">
            <input
              id="custom-goal-input"
              type="text"
              placeholder="Or set custom goal (e.g. Bali Trip)..."
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="flex-1 px-3.5 py-2.5 rounded-xl text-xs bg-[#0b162e] border border-[#00d2ff]/25 text-white placeholder-[#8295b5] focus:outline-none focus:border-[#00d2ff]"
            />
            <input
              type="number"
              placeholder="Amount $"
              value={customAmt}
              onChange={(e) => setCustomAmt(e.target.value)}
              className="w-28 px-3.5 py-2.5 rounded-xl text-xs bg-[#0b162e] border border-[#00d2ff]/25 text-white placeholder-[#8295b5] focus:outline-none focus:border-[#00d2ff]"
            />
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#050a17] bg-[#00d2ff] hover:scale-105 transition-all shadow-[0_0_12px_rgba(0,210,255,0.3)] cursor-pointer whitespace-nowrap"
            >
              {activePreset === -1 && customGoal ? 'Update Goal' : 'Set Goal'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
