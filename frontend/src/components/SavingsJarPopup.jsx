// frontend/src/components/SavingsJarPopup.jsx
import React, { useEffect, useState, useRef } from 'react';
import { playChaChingSound } from '../utils/audio';

// Jar internal liquid bounds (matches 120x180 viewBox)
const JAR_TOP = 32;
const JAR_BOT = 158;
const JAR_H   = JAR_BOT - JAR_TOP;

function buildWavePath(waveY) {
  const A = 4, P = 45, startX = -P;
  let d = `M ${startX},${waveY} `;
  for (let x = startX; x < startX + 320; x += P) {
    d += `C ${x + P * 0.28},${waveY - A} ${x + P * 0.72},${waveY + A} ${x + P},${waveY} `;
  }
  d += `L ${startX + 350},200 L ${startX},200 Z`;
  return d;
}

// Sparkle particle component
function Sparkle({ delay, left, top, size = 4 }) {
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

    // 2. Animate liquid rising
    setCurrentFill(fromFill);
    const startY = JAR_BOT - fromFill * JAR_H;
    const targetY = JAR_BOT - toFill * JAR_H;

    const startTime = performance.now();
    const duration = 1400;

    const step = (now) => {
      const elapsed = Math.min((now - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - elapsed, 3);
      const curY = startY + (targetY - startY) * ease;
      const fillPct = (JAR_BOT - curY) / JAR_H;
      setCurrentFill(fillPct);

      if (elapsed < 1) {
        animRef.current = requestAnimationFrame(step);
      }
    };

    animRef.current = requestAnimationFrame(step);

    // 3. Coins
    const newCoins = [
      { id: 1, left: 42, delay: 150 },
      { id: 2, left: 56, delay: 350 },
      { id: 3, left: 48, delay: 550 },
    ];
    setCoins(newCoins);

    // 4. Show savings text after liquid animation
    const textTimer = setTimeout(() => setShowText(true), 800);

    // 5. Count-up animation for amount
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
    }, 900);

    // 6. Auto-dismiss
    const timer = setTimeout(() => {
      setVisible(false);
      if (onClose) setTimeout(onClose, 500);
    }, 5000);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      if (countFrame) cancelAnimationFrame(countFrame);
      clearTimeout(timer);
      clearTimeout(textTimer);
      clearTimeout(countDelay);
    };
  }, [isOpen, fromFill, toFill, onClose, displayAmount]);

  if (!isOpen && !visible) return null;

  const waveY = JAR_BOT - currentFill * JAR_H;
  const wavePath = buildWavePath(waveY);
  const fillPercent = Math.round(currentFill * 100);

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
          background: 'rgba(5, 10, 23, 0.85)',
          border: '1px solid rgba(0, 210, 255, 0.3)',
          boxShadow: `
            0 0 40px rgba(0, 210, 255, 0.2),
            0 20px 60px rgba(0, 0, 0, 0.5),
            inset 0 1px 0 rgba(255, 255, 255, 0.08)
          `,
          minWidth: 280,
        }}
      >
        {/* Sparkle particles */}
        <Sparkle delay={0} left="15%" top="10%" size={3} />
        <Sparkle delay={300} left="80%" top="15%" size={4} />
        <Sparkle delay={600} left="25%" top="85%" size={3} />
        <Sparkle delay={900} left="75%" top="80%" size={3} />
        <Sparkle delay={450} left="90%" top="50%" size={2} />

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
          <span className="text-[11px] font-bold tracking-wider uppercase" style={{ color: '#00d2ff' }}>
            Savings Jar
          </span>

          {/* Close button */}
          <button
            onClick={() => {
              setVisible(false);
              if (onClose) setTimeout(onClose, 400);
            }}
            className="ml-auto text-white/30 hover:text-white/70 transition-colors text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Jar + Amount Row */}
        <div className="flex items-center gap-4">
          {/* Jar SVG */}
          <div className="relative w-20 h-28 flex-shrink-0">
            <svg viewBox="0 0 120 180" className="w-full h-full overflow-visible">
              <defs>
                <clipPath id="popupJarClip">
                  <path d="M43,26 L36,44 Q18,52 17,68 L16,155 Q16,170 60,170 Q104,170 104,155 L103,68 Q102,52 84,44 L77,26 Z" />
                </clipPath>

                <linearGradient id="popupLiquidGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00d2ff" stopOpacity="0.95" />
                  <stop offset="50%" stopColor="#0099cc" stopOpacity="0.85" />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity="0.8" />
                </linearGradient>

                <linearGradient id="popupGlassGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.18)" />
                  <stop offset="40%" stopColor="rgba(255,255,255,0.03)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0.12)" />
                </linearGradient>

                <linearGradient id="popupLidGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4a5a8a" />
                  <stop offset="60%" stopColor="#1e2d55" />
                  <stop offset="100%" stopColor="#0d1830" />
                </linearGradient>

                {/* Glow filter for liquid */}
                <filter id="liquidGlow">
                  <feGaussianBlur stdDeviation="3" result="glow" />
                  <feMerge>
                    <feMergeNode in="glow" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Soft shadow under jar */}
              <ellipse cx="60" cy="174" rx="36" ry="4" fill="rgba(0,210,255,0.15)" />

              {/* Glass body */}
              <path
                d="M43,26 L36,44 Q18,52 17,68 L16,155 Q16,170 60,170 Q104,170 104,155 L103,68 Q102,52 84,44 L77,26 Z"
                fill="url(#popupGlassGrad)"
              />

              {/* Rising Liquid */}
              <g clipPath="url(#popupJarClip)" filter="url(#liquidGlow)">
                <rect x="0" y={waveY} width="130" height={190 - waveY} fill="url(#popupLiquidGrad)" />
                <path className="wave-anim" d={wavePath} fill="#00d2ff" fillOpacity="0.7" />
                <rect x="0" y={waveY - 1} width="130" height="1.5" fill="rgba(255,255,255,0.5)" />
                <ellipse cx="60" cy="165" rx="36" ry="4" fill="rgba(0, 210, 255, 0.25)" />
              </g>

              {/* Glass contour */}
              <path
                d="M43,26 L36,44 Q18,52 17,68 L16,155 Q16,170 60,170 Q104,170 104,155 L103,68 Q102,52 84,44 L77,26 Z"
                fill="none"
                stroke="rgba(0, 210, 255, 0.35)"
                strokeWidth="1.2"
              />

              {/* Glass reflection */}
              <ellipse cx="28" cy="100" rx="4" ry="40" fill="rgba(255,255,255,0.15)" clipPath="url(#popupJarClip)" />

              {/* Lid */}
              <rect x="33" y="10" width="54" height="17" rx="5" fill="url(#popupLidGrad)" stroke="rgba(0, 210, 255, 0.4)" strokeWidth="0.8" />
              <rect x="39" y="12" width="42" height="3" rx="1.5" fill="rgba(255,255,255,0.18)" />
            </svg>

            {/* Dropping Coins */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {coins.map((coin) => (
                <div
                  key={coin.id}
                  className="coin-anim absolute flex items-center justify-center rounded-full"
                  style={{
                    width: 14,
                    height: 14,
                    left: `calc(${coin.left}% - 7px)`,
                    animationDelay: `${coin.delay}ms`,
                    background: 'radial-gradient(circle at 35% 32%, #ffe066, #c89400)',
                    border: '1px solid #d4a200',
                    boxShadow: '0 2px 8px rgba(255, 224, 102, 0.5)',
                    color: '#7a4f00',
                    fontSize: 7,
                    fontWeight: 900,
                  }}
                >
                  $
                </div>
              ))}
            </div>
          </div>

          {/* Text content */}
          <div className="flex-1 space-y-2">
            {/* Saved Amount */}
            <div
              className={`transition-all duration-700 ${
                showText ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
              }`}
            >
              <p className="text-[10px] uppercase tracking-wider text-white/40 font-medium mb-0.5">
                You just saved
              </p>
              <p
                className="text-2xl font-black font-display"
                style={{
                  background: 'linear-gradient(135deg, #00d2ff, #00f5a0)',
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
                <span className="text-[9px] text-white/40 font-medium">Jar filled</span>
                <span className="text-[9px] font-bold" style={{ color: '#00d2ff' }}>
                  {fillPercent}%
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,210,255,0.1)' }}>
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: `${fillPercent}%`,
                    background: 'linear-gradient(90deg, #00d2ff, #00f5a0)',
                    boxShadow: '0 0 8px rgba(0, 210, 255, 0.5)',
                  }}
                />
              </div>
            </div>

            {/* Motivational text */}
            <p
              className={`text-[10px] text-white/50 italic transition-all duration-700 delay-500 ${
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
