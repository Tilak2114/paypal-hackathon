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

    // 1. Play the cash register "cha-ching!" sound
    playChaChingSound();

    // 2. Animate liquid rising smoothly from previous level to fuller level
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

    // 3. Drop bouncing coins into the jar
    const newCoins = [
      { id: 1, left: 45, delay: 100 },
      { id: 2, left: 55, delay: 280 },
      { id: 3, left: 50, delay: 460 },
    ];
    setCoins(newCoins);

    // 4. Auto-dismiss smoothly
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
      className={`fixed top-24 right-8 z-50 transition-all duration-500 transform ${
        visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-4 scale-95 pointer-events-none'
      }`}
      style={{
        filter: 'drop-shadow(0 15px 35px rgba(0, 210, 255, 0.45))',
      }}
    >
      {/* Pure floating Jar with NO outer border and NO card box */}
      <div className="relative w-32 h-48 flex items-center justify-center p-1">
        <svg viewBox="0 0 120 180" className="w-full h-full overflow-visible">
          <defs>
            <clipPath id="popupJarClip">
              <path d="M43,26 L36,44 Q18,52 17,68 L16,155 Q16,170 60,170 Q104,170 104,155 L103,68 Q102,52 84,44 L77,26 Z" />
            </clipPath>

            <linearGradient id="popupLiquidGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00d2ff" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0.8" />
            </linearGradient>

            <linearGradient id="popupGlassGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgba(255,255,255,0.20)" />
              <stop offset="40%" stopColor="rgba(255,255,255,0.04)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.14)" />
            </linearGradient>

            <linearGradient id="popupLidGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4a5a8a" />
              <stop offset="60%" stopColor="#1e2d55" />
              <stop offset="100%" stopColor="#0d1830" />
            </linearGradient>
          </defs>

          {/* Jar Base Drop Shadow */}
          <ellipse cx="60" cy="173" rx="40" ry="5" fill="rgba(0,0,0,0.5)" />

          {/* Glass Interior */}
          <path
            d="M43,26 L36,44 Q18,52 17,68 L16,155 Q16,170 60,170 Q104,170 104,155 L103,68 Q102,52 84,44 L77,26 Z"
            fill="url(#popupGlassGrad)"
          />

          {/* Rising Liquid with Wave */}
          <g clipPath="url(#popupJarClip)">
            {/* Liquid Body */}
            <rect x="0" y={waveY} width="130" height={190 - waveY} fill="url(#popupLiquidGrad)" />

            {/* Sine Wave Ripple */}
            <path className="wave-anim" d={wavePath} fill="#00d2ff" fillOpacity="0.85" />

            {/* Liquid surface light line */}
            <rect x="0" y={waveY - 1} width="130" height="2" fill="rgba(255,255,255,0.4)" />

            {/* Bottom inner glow */}
            <ellipse cx="60" cy="164" rx="36" ry="5" fill="rgba(0, 210, 255, 0.3)" />
          </g>

          {/* Glass Outer Contour */}
          <path
            d="M43,26 L36,44 Q18,52 17,68 L16,155 Q16,170 60,170 Q104,170 104,155 L103,68 Q102,52 84,44 L77,26 Z"
            fill="none"
            stroke="rgba(0, 210, 255, 0.45)"
            strokeWidth="1.5"
          />

          {/* Left Glass Highlight Reflection */}
          <ellipse cx="28" cy="105" rx="4.5" ry="46" fill="rgba(255,255,255,0.18)" clipPath="url(#popupJarClip)" />

          {/* Jar Lid - Fully inside viewBox so it never gets cut */}
          <rect x="33" y="10" width="54" height="17" rx="5" fill="url(#popupLidGrad)" stroke="rgba(0, 210, 255, 0.5)" strokeWidth="1" />
          <rect x="39" y="12" width="42" height="3" rx="1.5" fill="rgba(255,255,255,0.22)" />
        </svg>

        {/* Dropping Coins Overlay */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {coins.map((coin) => (
            <div
              key={coin.id}
              className="coin-anim absolute flex items-center justify-center rounded-full"
              style={{
                width: 17,
                height: 17,
                left: `calc(${coin.left}% - 8px)`,
                animationDelay: `${coin.delay}ms`,
                background: 'radial-gradient(circle at 35% 32%, #ffe066, #c89400)',
                border: '1.5px solid #d4a200',
                boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                color: '#7a4f00',
                fontSize: 8.5,
                fontWeight: 900,
              }}
            >
              ₹
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
