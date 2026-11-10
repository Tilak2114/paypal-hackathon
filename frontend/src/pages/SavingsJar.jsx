import React, { useState, useEffect, useRef, useCallback } from 'react';

// ── Sample demo subscriptions ────────────────────────────────────────────────
const DEMO_SUBS = [
  { id: 'streamly', name: 'Streamly',  price: 649,  icon: '📺', bg: 'rgba(124,58,237,.18)',  color: '#a78bfa' },
  { id: 'tunewave', name: 'TuneWave',  price: 119,  icon: '🎵', bg: 'rgba(5,150,105,.18)',   color: '#34d399' },
  { id: 'fitclub',  name: 'FitClub',   price: 1500, icon: '💪', bg: 'rgba(225,29,72,.16)',   color: '#fb7185' },
  { id: 'pixelpro', name: 'PixelPro',  price: 899,  icon: '🎨', bg: 'rgba(217,119,6,.18)',   color: '#fbbf24' },
];

const PRESETS = [
  { name: 'Weekend trip',   amount: 5000,  emoji: '🏖️' },
  { name: 'New phone',      amount: 20000, emoji: '📱' },
  { name: 'Emergency fund', amount: 10000, emoji: '🏦' },
];

// ── Jar SVG geometry ─────────────────────────────────────────────────────────
const JAR_TOP = 40;
const JAR_BOT = 266;
const JAR_H   = JAR_BOT - JAR_TOP;

function getTargetWaveY(saved, goal) {
  const pct = Math.min(saved / goal, 1);
  if (pct <= 0) return JAR_BOT + 60;
  return JAR_BOT - pct * JAR_H;
}

function buildWavePath(waveY) {
  const A = 7, P = 80, startX = -P;
  let d = `M ${startX},${waveY} `;
  for (let x = startX; x < startX + 500; x += P) {
    d += `C ${x + P * .28},${waveY - A} ${x + P * .72},${waveY + A} ${x + P},${waveY} `;
  }
  d += `L ${startX + 580},320 L ${startX},320 Z`;
  return d;
}

function fmt(n) { return Math.round(n).toLocaleString('en-IN'); }
function reducedMotion() { return window.matchMedia('(prefers-reduced-motion:reduce)').matches; }

// ── Confetti ─────────────────────────────────────────────────────────────────
function launchConfetti(canvas) {
  if (reducedMotion() || !canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const cols = ['#00d2ff','#ff6f91','#ffd700','#818cf8','#60a5fa','#f97316','#4ade80'];
  const pts = Array.from({ length: 130 }, () => ({
    x: Math.random() * canvas.width,
    y: -30 - Math.random() * 120,
    w: 6 + Math.random() * 10, h: 4 + Math.random() * 4,
    col: cols[Math.floor(Math.random() * cols.length)],
    rot: Math.random() * Math.PI * 2,
    rv: (Math.random() - .5) * .18,
    vx: (Math.random() - .5) * 4.5,
    vy: 1.8 + Math.random() * 3.5,
    alpha: 1,
  }));
  let frame = 0;
  (function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;
    for (const p of pts) {
      p.x += p.vx; p.y += p.vy; p.rot += p.rv;
      if (p.y > canvas.height * .55) p.alpha -= .018;
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

// ── Main component ───────────────────────────────────────────────────────────
export default function SavingsJar() {
  const [saved, setSaved]           = useState(0);
  const [displaySaved, setDisplay]  = useState(0);
  const [goal, setGoal]             = useState(5000);
  const [goalName, setGoalName]     = useState('Weekend trip');
  const [activePreset, setPreset]   = useState(0);
  const [cancelled, setCancelled]   = useState(new Set());
  const [goalHit, setGoalHit]       = useState(false);
  const [waveY, setWaveY]           = useState(JAR_BOT + 60);
  const [wavePath, setWavePath]     = useState(buildWavePath(JAR_BOT + 60));
  const [coins, setCoins]           = useState([]);
  const [customName, setCustomName] = useState('');
  const [customAmt, setCustomAmt]   = useState('');

  const balAnimRef  = useRef(null);
  const fillAnimRef = useRef(null);
  const canvasRef   = useRef(null);
  const goalHitRef  = useRef(false);

  // ── Animate jar fill ──────────────────────────────────────────────────────
  const animateFill = useCallback((newSaved, newGoal) => {
    const target = getTargetWaveY(newSaved, newGoal);
    if (fillAnimRef.current) cancelAnimationFrame(fillAnimRef.current);
    if (reducedMotion()) {
      setWaveY(target);
      setWavePath(buildWavePath(target));
      return;
    }
    const start = performance.now(), dur = 850;
    let fromY = null;
    setWaveY(prev => { fromY = prev; return prev; });

    (function step(now) {
      const t = Math.min((now - start) / dur, 1);
      const e = 1 - Math.pow(1 - t, 3);
      const y = fromY + (target - fromY) * e;
      setWaveY(y);
      setWavePath(buildWavePath(y));
      if (t < 1) fillAnimRef.current = requestAnimationFrame(step);
    })(performance.now());
  }, []);

  // ── Count-up balance ──────────────────────────────────────────────────────
  const countUp = useCallback((from, to) => {
    if (balAnimRef.current) cancelAnimationFrame(balAnimRef.current);
    if (reducedMotion()) { setDisplay(to); return; }
    const start = performance.now(), dur = 680;
    (function step(now) {
      const t = Math.min((now - start) / dur, 1);
      const e = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (to - from) * e));
      if (t < 1) balAnimRef.current = requestAnimationFrame(step);
    })(performance.now());
  }, []);

  // ── Coin drop ─────────────────────────────────────────────────────────────
  const dropCoins = useCallback((n) => {
    if (reducedMotion()) return;
    const newCoins = Array.from({ length: n }, (_, i) => ({
      id: Date.now() + i,
      left: 50 + (Math.random() - .5) * 54,
      delay: i * 95,
    }));
    setCoins(prev => [...prev, ...newCoins]);
    setTimeout(() => {
      setCoins(prev => prev.filter(c => !newCoins.some(nc => nc.id === c.id)));
    }, 1400);
  }, []);

  // ── Cancel subscription ───────────────────────────────────────────────────
  const handleCancel = useCallback((sub) => {
    if (cancelled.has(sub.id)) return;
    const gain = sub.price * 12;
    setCancelled(prev => new Set([...prev, sub.id]));
    setSaved(prev => {
      const next = prev + gain;
      countUp(prev, next);
      animateFill(next, goal);
      // Check goal
      if (!goalHitRef.current && next >= goal) {
        goalHitRef.current = true;
        setGoalHit(true);
        setTimeout(() => launchConfetti(canvasRef.current), 100);
      }
      return next;
    });
    dropCoins(3);
  }, [cancelled, goal, countUp, animateFill, dropCoins]);

  // ── Undo cancel ───────────────────────────────────────────────────────────
  const handleUndo = useCallback((sub) => {
    if (!cancelled.has(sub.id)) return;
    const gain = sub.price * 12;
    setCancelled(prev => { const s = new Set(prev); s.delete(sub.id); return s; });
    setSaved(prev => {
      const next = Math.max(0, prev - gain);
      countUp(prev, next);
      animateFill(next, goal);
      if (next < goal) { goalHitRef.current = false; setGoalHit(false); }
      return next;
    });
  }, [cancelled, goal, countUp, animateFill]);

  // ── Pick preset goal ─────────────────────────────────────────────────────
  const pickPreset = useCallback((preset, idx) => {
    setGoal(preset.amount);
    setGoalName(preset.name);
    setPreset(idx);
    setGoalHit(false);
    goalHitRef.current = false;
    setCustomName('');
    setCustomAmt('');
    setSaved(prev => { animateFill(prev, preset.amount); return prev; });
  }, [animateFill]);

  // ── Apply custom goal ─────────────────────────────────────────────────────
  const applyCustom = useCallback(() => {
    const name = customName.trim();
    const amt  = parseInt(customAmt);
    if (!name || !amt || amt < 1) return;
    setGoal(amt);
    setGoalName(name);
    setPreset(-1);
    setGoalHit(false);
    goalHitRef.current = false;
    setSaved(prev => { animateFill(prev, amt); return prev; });
  }, [customName, customAmt, animateFill]);

  // ── Progress values ───────────────────────────────────────────────────────
  const pct  = Math.min(saved / goal, 1);
  const pPct = Math.round(pct * 100);
  const remaining = Math.max(goal - saved, 0);

  let progressHint = '';
  if (saved > 0 && pct < 1) {
    progressHint = pct >= .9 ? '🔥 Almost there!' : `₹${fmt(remaining)} to go`;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-8 py-10 space-y-6">

      {/* Confetti canvas */}
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-50" />

      {/* Page header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h1 className="font-display font-black text-3xl sm:text-4xl text-white tracking-tight">
            Savings Jar
          </h1>
          <p className="text-sm mt-1" style={{ color: '#8295b5' }}>
            Cancel forgotten subscriptions and watch your savings grow.
          </p>
        </div>
        <span
          className="text-[10.5px] font-bold tracking-widest uppercase px-3 py-1.5 rounded-full"
          style={{ color: '#00d2ff', background: 'rgba(0,210,255,.10)', border: '1px solid rgba(0,210,255,.22)' }}
        >
          Demo mode
        </span>
      </div>

      {/* ── Goal selector card ── */}
      <div
        className="rounded-3xl p-5 space-y-4"
        style={{ background: 'rgba(11,22,46,.75)', border: '1px solid rgba(0,210,255,.18)' }}
      >
        <p className="text-[10.5px] font-bold tracking-widest uppercase" style={{ color: '#8295b5' }}>
          Set a savings goal
        </p>

        {/* Preset chips */}
        <div className="flex flex-wrap gap-2" role="group" aria-label="Preset savings goals">
          {PRESETS.map((p, i) => (
            <button
              key={p.name}
              aria-pressed={activePreset === i}
              onClick={() => pickPreset(p, i)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer"
              style={activePreset === i
                ? { background: 'rgba(0,210,255,.14)', border: '1.5px solid #00d2ff', color: '#00d2ff' }
                : { background: 'rgba(255,255,255,.04)', border: '1.5px solid rgba(255,255,255,.12)', color: '#8295b5' }
              }
            >
              {p.emoji} {p.name}
              <span style={{ color: '#00d2ff', fontWeight: 800 }}>₹{fmt(p.amount)}</span>
            </button>
          ))}
        </div>

        {/* Custom goal row */}
        <div className="flex gap-2 items-end">
          <div className="flex flex-col gap-1 flex-1">
            <label htmlFor="cname" className="text-[10px] font-medium" style={{ color: '#8295b5' }}>Goal name</label>
            <input
              id="cname"
              type="text"
              maxLength={30}
              placeholder="e.g. Vacation"
              value={customName}
              onChange={e => setCustomName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && applyCustom()}
              className="rounded-xl px-3 py-2 text-sm text-white placeholder-[#8295b5] outline-none transition-all"
              style={{ background: 'rgba(255,255,255,.05)', border: '1.5px solid rgba(255,255,255,.12)' }}
              onFocus={e => e.target.style.borderColor = '#00d2ff'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,.12)'}
            />
          </div>
          <div className="flex flex-col gap-1" style={{ maxWidth: 110 }}>
            <label htmlFor="camt" className="text-[10px] font-medium" style={{ color: '#8295b5' }}>Amount (₹)</label>
            <input
              id="camt"
              type="number"
              min="1"
              placeholder="0"
              value={customAmt}
              onChange={e => setCustomAmt(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && applyCustom()}
              className="rounded-xl px-3 py-2 text-sm text-white placeholder-[#8295b5] outline-none w-full transition-all"
              style={{ background: 'rgba(255,255,255,.05)', border: '1.5px solid rgba(255,255,255,.12)' }}
              onFocus={e => e.target.style.borderColor = '#00d2ff'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,.12)'}
            />
          </div>
          <button
            onClick={applyCustom}
            className="px-4 py-2 rounded-xl text-xs font-black cursor-pointer transition-all hover:opacity-85 hover:-translate-y-px active:translate-y-0 flex-shrink-0"
            style={{ background: '#00d2ff', color: '#050a17' }}
          >
            Set Goal
          </button>
        </div>
      </div>

      {/* ── Jar + balance + progress ── */}
      <div
        className="rounded-3xl p-6 flex flex-col items-center gap-5"
        style={{ background: 'rgba(11,22,46,.75)', border: '1px solid rgba(0,210,255,.18)' }}
      >
        {/* Balance */}
        <div className="text-center">
          <p className="text-[11px] font-semibold tracking-wider uppercase mb-1" style={{ color: '#8295b5' }}>
            Money saved
          </p>
          <div
            className="font-display font-black tracking-tighter leading-none"
            style={{ fontSize: 52, color: '#00d2ff', textShadow: '0 0 48px rgba(0,210,255,.4)' }}
            aria-live="polite"
            aria-atomic="true"
          >
            ₹{fmt(displaySaved)}
          </div>
        </div>

        {/* SVG Jar */}
        <div className="relative" style={{ width: 190, height: 272 }} aria-hidden="true">
          <svg
            viewBox="0 0 190 272"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full overflow-visible"
          >
            <defs>
              {/* Jar interior clip */}
              <clipPath id="jclip">
                <path d="M65,37 L54,66 Q28,78 27,103 L25,245 Q25,268 95,268 Q165,268 165,245 L163,103 Q162,78 136,66 L125,37 Z"/>
              </clipPath>
              {/* Gradients */}
              <linearGradient id="liqg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00d2ff" stopOpacity=".90"/>
                <stop offset="100%" stopColor="#2563eb" stopOpacity=".72"/>
              </linearGradient>
              <linearGradient id="glassg" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="rgba(255,255,255,.14)"/>
                <stop offset="40%" stopColor="rgba(255,255,255,.03)"/>
                <stop offset="100%" stopColor="rgba(255,255,255,.08)"/>
              </linearGradient>
              <linearGradient id="rimg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4a5a8a"/>
                <stop offset="55%" stopColor="#1e2d55"/>
                <stop offset="100%" stopColor="#0d1830"/>
              </linearGradient>
            </defs>

            {/* Drop shadow */}
            <ellipse cx="95" cy="273" rx="62" ry="6" fill="rgba(0,0,0,.35)"/>

            {/* Glass body (behind liquid) */}
            <path
              d="M65,37 L54,66 Q28,78 27,103 L25,245 Q25,268 95,268 Q165,268 165,245 L163,103 Q162,78 136,66 L125,37 Z"
              fill="url(#glassg)"
            />

            {/* Liquid + wave (clipped) */}
            <g clipPath="url(#jclip)">
              {/* Liquid body */}
              <rect x="-5" y={waveY} width="210" height={320 - waveY} fill="url(#liqg)"/>
              {/* Animated wave surface */}
              <path
                className="wave-anim"
                d={wavePath}
                fill="#00d2ff"
                fillOpacity=".78"
              />
              {/* Surface shimmer line */}
              <rect x="-5" y={waveY - 1} width="210" height="2.5" fill="rgba(255,255,255,.22)"/>
              {/* Inner bottom glow */}
              <ellipse cx="95" cy="262" rx="52" ry="6" fill="rgba(0,210,255,.08)"/>
            </g>

            {/* Glass body outline */}
            <path
              d="M65,37 L54,66 Q28,78 27,103 L25,245 Q25,268 95,268 Q165,268 165,245 L163,103 Q162,78 136,66 L125,37 Z"
              fill="none"
              stroke="rgba(255,255,255,.24)"
              strokeWidth="1.5"
            />

            {/* Left wide highlight */}
            <ellipse cx="45" cy="168" rx="7" ry="78" fill="rgba(255,255,255,.10)" clipPath="url(#jclip)"/>
            {/* Left thin accent */}
            <path d="M37,100 Q35,175 37,245" stroke="rgba(255,255,255,.07)" strokeWidth="3" strokeLinecap="round" fill="none" clipPath="url(#jclip)"/>
            {/* Shoulder gleam */}
            <path d="M56,70 Q40,80 32,100" stroke="rgba(255,255,255,.18)" strokeWidth="2.5" strokeLinecap="round" fill="none"/>

            {/* Lid */}
            <rect x="49" y="8" width="92" height="30" rx="8" fill="url(#rimg)" stroke="rgba(255,255,255,.18)" strokeWidth="1"/>
            <rect x="58" y="11" width="74" height="4" rx="2" fill="rgba(255,255,255,.10)"/>
            <text x="95" y="29" textAnchor="middle" fontSize="8.5" fill="rgba(255,255,255,.35)" fontFamily="DM Sans,system-ui,sans-serif" fontWeight="600" letterSpacing=".9">
              CHURN GUARD
            </text>
            {/* Rim base */}
            <rect x="52" y="37" width="86" height="5" fill="rgba(255,255,255,.04)"/>
          </svg>

          {/* Coin drop overlay */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
            {coins.map(coin => (
              <div
                key={coin.id}
                className="coin-anim absolute flex items-center justify-center rounded-full"
                style={{
                  width: 22, height: 22,
                  left: `calc(${coin.left}% - 11px)`,
                  animationDelay: `${coin.delay}ms`,
                  background: 'radial-gradient(circle at 35% 32%, #ffe066, #c89400)',
                  border: '2px solid #d4a200',
                  boxShadow: '0 2px 8px rgba(0,0,0,.45)',
                  color: '#7a4f00',
                  fontSize: 9,
                  fontWeight: 800,
                }}
                aria-hidden="true"
              >
                ₹
              </div>
            ))}
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full max-w-xs space-y-2">
          <div
            className="h-2 rounded-full overflow-hidden"
            style={{ background: 'rgba(255,255,255,.08)' }}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={pPct}
            aria-label="Savings progress toward goal"
          >
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${pPct}%`,
                background: 'linear-gradient(90deg, #00d2ff, #2563eb)',
                boxShadow: '0 0 10px rgba(0,210,255,.5)',
                transitionTimingFunction: 'cubic-bezier(.34,1.4,.64,1)',
              }}
            />
          </div>

          <div className="text-center text-xs font-medium" style={{ color: '#8295b5' }}>
            {saved === 0 ? (
              <span>Goal: <span style={{ color: '#00d2ff', fontWeight: 700 }}>{goalName}</span> — ₹{fmt(goal)}</span>
            ) : pct >= 1 ? (
              <span style={{ color: '#00d2ff', fontWeight: 700 }}>₹{fmt(saved)} of ₹{fmt(goal)} 🎉 Goal complete!</span>
            ) : (
              <span>
                <span style={{ color: '#00d2ff', fontWeight: 700 }}>₹{fmt(saved)}</span>
                <span> of ₹{fmt(goal)} </span>
                {progressHint && <span style={{ color: '#00d2ff', fontWeight: 700 }}>{progressHint}</span>}
              </span>
            )}
          </div>

          {/* Goal reached banner */}
          {goalHit && (
            <div
              className="flex items-center justify-center gap-2 py-2.5 px-5 rounded-full text-sm font-black jar-pop goal-pulse"
              style={{ background: 'rgba(0,210,255,.12)', border: '1px solid rgba(0,210,255,.35)', color: '#00d2ff' }}
              role="status"
              aria-live="polite"
            >
              🎉 Goal reached — you crushed it!
            </div>
          )}
        </div>
      </div>

      {/* ── Subscriptions ── */}
      <div
        className="rounded-3xl p-5 space-y-3"
        style={{ background: 'rgba(11,22,46,.75)', border: '1px solid rgba(0,210,255,.18)' }}
      >
        <p className="text-[10.5px] font-bold tracking-widest uppercase" style={{ color: '#8295b5' }}>
          Your subscriptions — cancel to save
        </p>

        <div className="space-y-2.5" role="list">
          {DEMO_SUBS.map(sub => {
            const done = cancelled.has(sub.id);
            const yr   = sub.price * 12;
            return (
              <div
                key={sub.id}
                role="listitem"
                className="flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300"
                style={{
                  background: 'rgba(255,255,255,.035)',
                  border: done
                    ? '1px dashed rgba(0,210,255,.22)'
                    : '1px solid rgba(255,255,255,.10)',
                  opacity: done ? .5 : 1,
                }}
              >
                {/* Icon */}
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: sub.bg }}
                >
                  {sub.icon}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-display font-bold text-white text-[15px]">{sub.name}</div>
                  <div className="flex items-center gap-2 flex-wrap mt-0.5">
                    <span className="text-xs font-semibold" style={{ color: '#ff6f91' }}>
                      ₹{fmt(sub.price)}/mo
                    </span>
                    {done ? (
                      <span
                        className="text-[10.5px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(0,210,255,.12)', color: '#00d2ff' }}
                      >
                        +₹{fmt(yr)}/yr saved
                      </span>
                    ) : (
                      <span className="text-[11px]" style={{ color: '#8295b5' }}>₹{fmt(yr)}/yr</span>
                    )}
                  </div>
                </div>

                {/* Action */}
                {done ? (
                  <button
                    onClick={() => handleUndo(sub)}
                    aria-label={`Undo cancel ${sub.name}`}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all hover:border-white/30 hover:text-white flex-shrink-0"
                    style={{ background: 'rgba(255,255,255,.05)', border: '1.5px solid rgba(255,255,255,.12)', color: '#8295b5' }}
                  >
                    ↩ Undo
                  </button>
                ) : (
                  <button
                    onClick={() => handleCancel(sub)}
                    aria-label={`Cancel ${sub.name}, saves ₹${fmt(yr)} per year`}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all flex-shrink-0"
                    style={{
                      background: 'rgba(255,111,145,.12)',
                      border: '1.5px solid rgba(255,111,145,.30)',
                      color: '#ff6f91',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,111,145,.22)'; e.currentTarget.style.borderColor = '#ff6f91'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,111,145,.12)'; e.currentTarget.style.borderColor = 'rgba(255,111,145,.30)'; }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Totals footer */}
        {cancelled.size > 0 && (
          <div
            className="flex items-center justify-between pt-3 mt-1 border-t text-xs font-semibold"
            style={{ borderColor: 'rgba(0,210,255,.12)', color: '#8295b5' }}
          >
            <span>{cancelled.size} subscription{cancelled.size > 1 ? 's' : ''} cancelled</span>
            <span style={{ color: '#00d2ff' }}>
              ₹{fmt(DEMO_SUBS.filter(s => cancelled.has(s.id)).reduce((acc, s) => acc + s.price * 12, 0))}/yr saved
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
