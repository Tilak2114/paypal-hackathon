// frontend/src/components/SavingsJarPopup.jsx
import React, { useEffect, useState, useRef } from 'react';
import { playChaChingSound } from '../utils/audio';

// Banknote helper component (Never clipped, drops and stays)
function BanknoteMini({ x, y, width = 38, height = 15, rotation = 0, delay = 0 }) {
  return (
    <g transform={`translate(${x}, ${y}) rotate(${rotation})`}>
      <g className="money-drop-mini" style={{ animationDelay: `${delay}ms` }}>
        <rect x="-0.5" y="0.5" width={width} height={height} rx="1.5" fill="rgba(0,0,0,0.35)" />
        <rect x="0" y="0" width={width} height={height} rx="1.5" fill="url(#popupBillGrad)" stroke="#047857" strokeWidth="0.6" />
        <rect x="1.5" y="1.5" width={width - 3} height={height - 3} rx="1" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.4" strokeDasharray="2 1" />
        <ellipse cx={width / 2} cy={height / 2} rx="5" ry="4" fill="#047857" fillOpacity="0.4" />
        <text x={width / 2} y={height / 2 + 1.8} textAnchor="middle" fontSize="4.5" fontWeight="900" fill="#ffffff" fontFamily="sans-serif">$</text>
      </g>
    </g>
  );
}

// Coin helper component (Never clipped, drops and stays)
function CoinMini({ cx, cy, r = 5.5, rotation = 0, delay = 0 }) {
  return (
    <g transform={`translate(${cx}, ${cy}) rotate(${rotation})`}>
      <g className="money-drop-mini" style={{ animationDelay: `${delay}ms` }}>
        <circle cx="0.4" cy="0.6" r={r} fill="rgba(0,0,0,0.4)" />
        <circle cx="0" cy="0" r={r} fill="url(#popupCoinGrad)" stroke="#b45309" strokeWidth="0.6" />
        <circle cx="0" cy="0" r={r - 1} fill="none" stroke="#fef08a" strokeWidth="0.4" />
        <text x="0" y={r * 0.35} textAnchor="middle" fontSize={r * 0.95} fontWeight="900" fill="#78350f" fontFamily="sans-serif">$</text>
      </g>
    </g>
  );
}

// Sparkle particle component
function Sparkle({ delay, left, top, size = 3 }) {
  return (
    <div
      className="absolute rounded-full animate-pulse"
      style={{
        width: size,
        height: size,
        left,
        top,
        background: 'radial-gradient(circle, #00d2ff, transparent)',
        boxShadow: '0 0 6px 2px rgba(0, 210, 255, 0.6)',
        animationDelay: `${delay}ms`,
        animationDuration: '1.5s',
      }}
    />
  );
}

// Whole items placed inside the jar (Calibrated safely above the jar bottom)
const POPUP_ITEMS = [
  // Tier 1: Base (0% - 20%)
  { id: 'pb1', type: 'note', x: 20, y: 132, w: 36, h: 14, rot: -5, threshold: 0.05 },
  { id: 'pb2', type: 'note', x: 62, y: 130, w: 38, h: 14, rot: 7, threshold: 0.08 },
  { id: 'pc1', type: 'coin', cx: 30, cy: 140, r: 5, threshold: 0.12 },
  { id: 'pb3', type: 'note', x: 40, y: 134, w: 40, h: 14, rot: 1, threshold: 0.16 },
  { id: 'pc2', type: 'coin', cx: 58, cy: 142, r: 5, threshold: 0.18 },
  { id: 'pc3', type: 'coin', cx: 80, cy: 138, r: 5, threshold: 0.20 },

  // Tier 2: Lower-mid (20% - 40%)
  { id: 'pb4', type: 'note', x: 16, y: 114, w: 38, h: 14, rot: 12, threshold: 0.25 },
  { id: 'pc4', type: 'coin', cx: 34, cy: 120, r: 5, threshold: 0.28 },
  { id: 'pb5', type: 'note', x: 66, y: 112, w: 38, h: 14, rot: -10, threshold: 0.32 },
  { id: 'pb6', type: 'note', x: 38, y: 118, w: 42, h: 14, rot: -2, threshold: 0.36 },
  { id: 'pc5', type: 'coin', cx: 72, cy: 122, r: 5, threshold: 0.38 },
  { id: 'pc6', type: 'coin', cx: 90, cy: 116, r: 4.8, threshold: 0.40 },

  // Tier 3: Mid (40% - 65%)
  { id: 'pb7', type: 'note', x: 18, y: 92, w: 40, h: 14, rot: -8, threshold: 0.45 },
  { id: 'pc7', type: 'coin', cx: 44, cy: 88, r: 5, threshold: 0.48 },
  { id: 'pb8', type: 'note', x: 60, y: 94, w: 38, h: 14, rot: 9, threshold: 0.52 },
  { id: 'pb9', type: 'note', x: 36, y: 98, w: 42, h: 14, rot: 3, threshold: 0.56 },
  { id: 'pc8', type: 'coin', cx: 84, cy: 94, r: 5, threshold: 0.60 },
  { id: 'pc9', type: 'coin', cx: 28, cy: 100, r: 4.8, threshold: 0.64 },

  // Tier 4: Top (65% - 85%)
  { id: 'pb10', type: 'note', x: 16, y: 70, w: 40, h: 14, rot: 13, threshold: 0.68 },
  { id: 'pc10', type: 'coin', cx: 34, cy: 68, r: 5, threshold: 0.72 },
  { id: 'pb11', type: 'note', x: 62, y: 68, w: 40, h: 14, rot: -9, threshold: 0.76 },
  { id: 'pb12', type: 'note', x: 38, y: 74, w: 42, h: 14, rot: -2, threshold: 0.80 },
  { id: 'pc11', type: 'coin', cx: 74, cy: 72, r: 5, threshold: 0.83 },

  // Tier 5: Brim (85% - 100%)
  { id: 'pb13', type: 'note', x: 24, y: 46, w: 36, h: 14, rot: -10, threshold: 0.88 },
  { id: 'pb14', type: 'note', x: 58, y: 48, w: 36, h: 14, rot: 7, threshold: 0.92 },
  { id: 'pc12', type: 'coin', cx: 30, cy: 44, r: 4.8, threshold: 0.95 },
  { id: 'pc13', type: 'coin', cx: 76, cy: 48, r: 4.8, threshold: 0.98 },
];

export default function SavingsJarPopup({ isOpen, onClose, fromFill = 0.25, toFill = 0.65, savedAmount }) {
  const [currentFill, setCurrentFill] = useState(fromFill);
  const [coins, setCoins] = useState([]);
  const [visible, setVisible] = useState(false);
  const [showText, setShowText] = useState(false);
  const [countUp, setCountUp] = useState(0);
  const animRef = useRef(null);

  const displayAmount = savedAmount || 12.99;

  useEffect(() => {
    if (!isOpen) {
      setVisible(false);
      setShowText(false);
      return;
    }

    setVisible(true);

    // 1. Play cha-ching
    playChaChingSound();

    // 2. Animate fill level rising
    setCurrentFill(fromFill);
    const startTime = performance.now();
    const duration = 1400;

    const step = (now) => {
      const elapsed = Math.min((now - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - elapsed, 3);
      const fillPct = fromFill + (toFill - fromFill) * ease;
      setCurrentFill(fillPct);

      if (elapsed < 1) {
        animRef.current = requestAnimationFrame(step);
      }
    };

    animRef.current = requestAnimationFrame(step);

    // 3. Falling coins & bills into jar
    setCoins([
      { id: 1, left: 42, delay: 150, type: 'coin' },
      { id: 2, left: 56, delay: 350, type: 'bill' },
      { id: 3, left: 48, delay: 550, type: 'coin' },
    ]);

    // 4. Show savings text
    const textTimer = setTimeout(() => setShowText(true), 750);

    // 5. Count-up animation
    let countFrame;
    const countStart = performance.now();
    const countDuration = 1000;
    const countStep = (now) => {
      const p = Math.min((now - countStart) / countDuration, 1);
      const easeP = 1 - Math.pow(1 - p, 2);
      setCountUp(easeP * displayAmount);
      if (p < 1) countFrame = requestAnimationFrame(countStep);
    };
    const countDelay = setTimeout(() => {
      countFrame = requestAnimationFrame(countStep);
    }, 800);

    // 6. Auto-dismiss
    const timer = setTimeout(() => {
      setVisible(false);
      if (onClose) setTimeout(onClose, 500);
    }, 5200);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      if (countFrame) cancelAnimationFrame(countFrame);
      clearTimeout(timer);
      clearTimeout(textTimer);
      clearTimeout(countDelay);
    };
  }, [isOpen, fromFill, toFill, onClose, displayAmount]);

  if (!isOpen && !visible) return null;

  const fillPercent = Math.round(currentFill * 100);

  // Visible items strictly based on current fill ratio
  const visibleItems = POPUP_ITEMS.filter((item) => currentFill >= item.threshold);

  return (
    <div
      className={`fixed top-20 right-6 z-50 transition-all duration-700 ease-out transform ${
        visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-8 scale-90 pointer-events-none'
      }`}
    >
      {/* Glassmorphic card wrapper */}
      <div
        className="relative rounded-2xl p-5 pb-4 backdrop-blur-xl"
        style={{
          background: 'rgba(5, 10, 23, 0.9)',
          border: '1px solid rgba(0, 210, 255, 0.35)',
          boxShadow: `
            0 0 40px rgba(0, 210, 255, 0.25),
            0 20px 60px rgba(0, 0, 0, 0.6),
            inset 0 1px 0 rgba(255, 255, 255, 0.1)
          `,
          minWidth: 285,
        }}
      >
        {/* Sparkle particles */}
        <Sparkle delay={0} left="15%" top="10%" size={3} />
        <Sparkle delay={300} left="80%" top="15%" size={4} />
        <Sparkle delay={600} left="25%" top="85%" size={3} />
        <Sparkle delay={900} left="75%" top="80%" size={3} />

        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
            style={{
              background: 'linear-gradient(135deg, rgba(0,210,255,0.2), rgba(0,210,255,0.05))',
              border: '1px solid rgba(0,210,255,0.4)',
            }}
          >
            💰
          </div>
          <span className="text-[11px] font-bold tracking-wider uppercase text-[#00d2ff]">
            Savings Jar
          </span>

          <button
            onClick={() => {
              setVisible(false);
              if (onClose) setTimeout(onClose, 400);
            }}
            className="ml-auto text-white/30 hover:text-white/80 transition-colors text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Jar + Amount Row */}
        <div className="flex items-center gap-4">
          {/* ── Mason Jar (Shape from sketch, clean cyan outline, no white marks) ── */}
          <div className="relative w-24 h-32 flex-shrink-0">
            <svg viewBox="0 0 120 170" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="popupBillGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="50%" stopColor="#059669" />
                  <stop offset="100%" stopColor="#047857" />
                </linearGradient>

                <radialGradient id="popupCoinGrad" cx="35%" cy="30%" r="65%">
                  <stop offset="0%" stopColor="#fffbeb" />
                  <stop offset="30%" stopColor="#fde047" />
                  <stop offset="70%" stopColor="#eab308" />
                  <stop offset="100%" stopColor="#b45309" />
                </radialGradient>

                <linearGradient id="popupGlassGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="rgba(0, 210, 255, 0.08)" />
                  <stop offset="50%" stopColor="rgba(0, 210, 255, 0.02)" />
                  <stop offset="100%" stopColor="rgba(0, 210, 255, 0.06)" />
                </linearGradient>

                {/* Inner Jar Containment Clip */}
                <clipPath id="popupGlassInnerClip">
                  <path d="M 22,34 C 17,42 9,50 9,62 L 9,144 C 9,158 20,160 60,160 C 100,160 111,158 111,144 L 111,62 C 111,50 103,42 98,34 Z" />
                </clipPath>
              </defs>

              {/* Base shadow */}
              <ellipse cx="60" cy="166" rx="44" ry="4" fill="rgba(0,0,0,0.5)" />

              {/* Jar glass background */}
              <path
                d="M 22,34 C 17,42 7,50 7,62 L 7,146 C 7,160 19,162 60,162 C 101,162 113,160 113,146 L 113,62 C 113,50 103,42 98,34 Z"
                fill="url(#popupGlassGrad)"
              />

              {/* ── WHOLE Banknotes and Coins Dropping & Staying Inside (Contained in glass, No spill) ── */}
              <g clipPath="url(#popupGlassInnerClip)">
                {visibleItems.map((item, idx) => {
                  const staggerDelay = Math.min(idx * 45, 450);
                  if (item.type === 'note') {
                    return (
                      <BanknoteMini
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
                    <CoinMini
                      key={item.id}
                      cx={item.cx}
                      cy={item.cy}
                      r={item.r}
                      delay={staggerDelay}
                    />
                  );
                })}
              </g>

              {/* ── Mason Jar Clean Cyan Outline (NO white highlights) ── */}
              <path
                d="M 22,34 C 17,42 7,50 7,62 L 7,146 C 7,160 19,162 60,162 C 101,162 113,160 113,146 L 113,62 C 113,50 103,42 98,34 Z"
                fill="none"
                stroke="#00d2ff"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Ring 2 (lower bead) */}
              <rect x="15" y="26" width="90" height="8" rx="4" fill="rgba(11,22,46,0.7)" stroke="#00d2ff" strokeWidth="1.4" />

              {/* Ring 1 (upper bead) */}
              <rect x="15" y="17" width="90" height="8" rx="4" fill="rgba(11,22,46,0.7)" stroke="#00d2ff" strokeWidth="1.4" />

              {/* Top Lid */}
              <rect x="20" y="7" width="80" height="9" rx="4.5" fill="rgba(11,22,46,0.85)" stroke="#00d2ff" strokeWidth="1.5" />
            </svg>
          </div>

          {/* Text content */}
          <div className="flex-1 space-y-2">
            {/* Saved Amount */}
            <div
              className={`transition-all duration-700 ${
                showText ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
              }`}
            >
              <p className="text-[10px] uppercase tracking-wider text-white/50 font-semibold mb-0.5">
                Cash Added to Jar
              </p>
              <p
                className="text-2xl font-black font-display"
                style={{
                  background: 'linear-gradient(135deg, #10b981, #00d2ff)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                ${countUp.toFixed(2)}
              </p>
            </div>

            {/* Fill bar */}
            <div
              className={`transition-all duration-700 delay-200 ${
                showText ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] text-white/50 font-medium">Vault level</span>
                <span className="text-[9px] font-bold text-[#00d2ff]">
                  {fillPercent}%
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full overflow-hidden bg-[#00d2ff]/10">
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: `${fillPercent}%`,
                    background: 'linear-gradient(90deg, #10b981, #00d2ff)',
                    boxShadow: '0 0 8px rgba(0, 210, 255, 0.5)',
                  }}
                />
              </div>
            </div>

            {/* Motivational message */}
            <p
              className={`text-[10px] text-white/60 italic transition-all duration-700 delay-500 ${
                showText ? 'opacity-100' : 'opacity-0'
              }`}
            >
              Smart move! 🎉
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
