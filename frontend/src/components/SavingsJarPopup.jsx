// frontend/src/components/SavingsJarPopup.jsx
import React, { useEffect, useState, useRef } from 'react';
import { playChaChingSound } from '../utils/audio';

const JAR_TOP = 25;
const JAR_BOT = 148;
const JAR_H   = JAR_BOT - JAR_TOP;

function buildWavePath(waveY) {
  const A = 4, P = 45, startX = -P;
  let d = `M ${startX},${waveY} `;
  for (let x = startX; x < startX + 300; x += P) {
    d += `C ${x + P * 0.28},${waveY - A} ${x + P * 0.72},${waveY + A} ${x + P},${waveY} `;
  }
  d += `L ${startX + 350},180 L ${startX},180 Z`;
  return d;
}

export default function SavingsJarPopup({ isOpen, onClose, fromFill = 0.25, toFill = 0.65 }) {
  const [currentFill, setCurrentFill] = useState(fromFill);
  const [coins, setCoins] = useState([]);
  const [visible, setVisible] = useState(false);
  const animRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setVisible(false);
      return;
    }

    setVisible(true);

    // 1. Play the cash register "cha-ching!" sound!
    playChaChingSound();

    // 2. Start liquid lower, animate rising smoothly to new higher level
    setCurrentFill(fromFill);
    const startY = JAR_BOT - fromFill * JAR_H;
    const targetY = JAR_BOT - toFill * JAR_H;

    const startTime = performance.now();
    const duration = 1200; // 1.2s smooth rise

    const step = (now) => {
      const elapsed = Math.min((now - startTime) / duration, 1);
      // Ease-out cubic
      const ease = 1 - Math.pow(1 - elapsed, 3);
      const curY = startY + (targetY - startY) * ease;
      const fillPct = (JAR_BOT - curY) / JAR_H;
      setCurrentFill(fillPct);

      if (elapsed < 1) {
        animRef.current = requestAnimationFrame(step);
      }
    };

    animRef.current = requestAnimationFrame(step);

    // 3. Drop bouncing gold coins into the jar
    const newCoins = [
      { id: 1, left: 45, delay: 100 },
      { id: 2, left: 55, delay: 280 },
      { id: 3, left: 50, delay: 460 },
    ];
    setCoins(newCoins);

    // 4. Auto-dismiss after animation completes and displays
    const timer = setTimeout(() => {
      setVisible(false);
      if (onClose) setTimeout(onClose, 400);
    }, 4200);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      clearTimeout(timer);
    };
  }, [isOpen, fromFill, toFill, onClose]);

  if (!isOpen && !visible) return null;

  const waveY = JAR_BOT - currentFill * JAR_H;
  const wavePath = buildWavePath(waveY);

  return (
    <div
      className={`fixed top-6 right-6 z-50 transition-all duration-500 transform ${
        visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-4 scale-95 pointer-events-none'
      }`}
      style={{
        filter: 'drop-shadow(0 15px 35px rgba(0, 210, 255, 0.35))',
      }}
    >
      <div
        className="relative rounded-3xl p-5 flex flex-col items-center justify-center backdrop-blur-2xl border"
        style={{
          background: 'rgba(8, 16, 36, 0.92)',
          border: '1.5px solid rgba(0, 210, 255, 0.5)',
          boxShadow: '0 0 30px rgba(0, 210, 255, 0.25), inset 0 0 20px rgba(0, 210, 255, 0.08)',
          width: '160px',
        }}
      >
        {/* Subtle close button */}
        <button
          type="button"
          onClick={() => {
            setVisible(false);
            if (onClose) setTimeout(onClose, 300);
          }}
          className="absolute top-2 right-2.5 text-xs text-[#8295b5] hover:text-white transition-colors cursor-pointer w-5 h-5 flex items-center justify-center rounded-full hover:bg-white/10"
          aria-label="Close"
        >
          ✕
        </button>

        {/* Animated Jar SVG */}
        <div className="relative w-28 h-40 flex items-center justify-center" aria-hidden="true">
          <svg viewBox="0 0 110 160" className="w-full h-full overflow-visible">
            <defs>
              <clipPath id="popupJarClip">
                <path d="M38,22 L32,38 Q16,45 15,60 L14,142 Q14,156 55,156 Q96,156 96,142 L95,60 Q94,45 78,38 L72,22 Z" />
              </clipPath>

              <linearGradient id="popupLiquidGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00d2ff" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#2563eb" stopOpacity="0.8" />
              </linearGradient>

              <linearGradient id="popupGlassGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="rgba(255,255,255,0.18)" />
                <stop offset="40%" stopColor="rgba(255,255,255,0.03)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0.12)" />
              </linearGradient>
            </defs>

            {/* Jar Base Shadow */}
            <ellipse cx="55" cy="158" rx="36" ry="4" fill="rgba(0,0,0,0.4)" />

            {/* Glass Interior */}
            <path
              d="M38,22 L32,38 Q16,45 15,60 L14,142 Q14,156 55,156 Q96,156 96,142 L95,60 Q94,45 78,38 L72,22 Z"
              fill="url(#popupGlassGrad)"
            />

            {/* Rising Liquid with Wave */}
            <g clipPath="url(#popupJarClip)">
              {/* Liquid Body */}
              <rect x="0" y={waveY} width="120" height={170 - waveY} fill="url(#popupLiquidGrad)" />

              {/* Sine Wave Ripple */}
              <path className="wave-anim" d={wavePath} fill="#00d2ff" fillOpacity="0.85" />

              {/* Liquid surface light line */}
              <rect x="0" y={waveY - 1} width="120" height="2" fill="rgba(255,255,255,0.4)" />

              {/* Bottom inner glow */}
              <ellipse cx="55" cy="152" rx="32" ry="4" fill="rgba(0, 210, 255, 0.25)" />
            </g>

            {/* Glass Outer Contour */}
            <path
              d="M38,22 L32,38 Q16,45 15,60 L14,142 Q14,156 55,156 Q96,156 96,142 L95,60 Q94,45 78,38 L72,22 Z"
              fill="none"
              stroke="rgba(0, 210, 255, 0.45)"
              strokeWidth="1.5"
            />

            {/* Left Glass Highlight Reflection */}
            <ellipse cx="26" cy="95" rx="4" ry="42" fill="rgba(255,255,255,0.15)" clipPath="url(#popupJarClip)" />

            {/* Jar Lid */}
            <rect x="28" y="6" width="54" height="18" rx="5" fill="#1e2d55" stroke="rgba(0, 210, 255, 0.5)" strokeWidth="1" />
            <rect x="34" y="8" width="42" height="3" rx="1.5" fill="rgba(255,255,255,0.2)" />
          </svg>

          {/* Dropping Coins Overlay */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {coins.map((coin) => (
              <div
                key={coin.id}
                className="coin-anim absolute flex items-center justify-center rounded-full"
                style={{
                  width: 16,
                  height: 16,
                  left: `calc(${coin.left}% - 8px)`,
                  animationDelay: `${coin.delay}ms`,
                  background: 'radial-gradient(circle at 35% 32%, #ffe066, #c89400)',
                  border: '1.5px solid #d4a200',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                  color: '#7a4f00',
                  fontSize: 8,
                  fontWeight: 900,
                }}
              >
                ₹
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
