// frontend/src/components/SavingsJarPopup.jsx
import React, { useEffect, useState, useRef } from 'react';
import { playChaChingSound } from '../utils/audio';

// Banknote helper component
function BanknoteMini({ x, y, width = 36, height = 15, rotation = 0 }) {
  return (
    <g transform={`translate(${x}, ${y}) rotate(${rotation})`}>
      <rect x="-0.5" y="0.5" width={width} height={height} rx="1.5" fill="rgba(0,0,0,0.35)" />
      <rect x="0" y="0" width={width} height={height} rx="1.5" fill="url(#popupBillGrad)" stroke="#047857" strokeWidth="0.6" />
      <rect x="1.5" y="1.5" width={width - 3} height={height - 3} rx="1" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.4" strokeDasharray="2 1" />
      <ellipse cx={width / 2} cy={height / 2} rx="5" ry="4" fill="#047857" fillOpacity="0.4" />
      <text x={width / 2} y={height / 2 + 1.8} textAnchor="middle" fontSize="4.5" fontWeight="900" fill="#ffffff" fontFamily="sans-serif">$</text>
    </g>
  );
}

// Coin helper component
function CoinMini({ cx, cy, r = 5.5, rotation = 0 }) {
  return (
    <g transform={`translate(${cx}, ${cy}) rotate(${rotation})`}>
      <circle cx="0.4" cy="0.6" r={r} fill="rgba(0,0,0,0.4)" />
      <circle cx="0" cy="0" r={r} fill="url(#popupCoinGrad)" stroke="#b45309" strokeWidth="0.6" />
      <circle cx="0" cy="0" r={r - 1} fill="none" stroke="#fef08a" strokeWidth="0.4" />
      <text x="0" y={r * 0.35} textAnchor="middle" fontSize={r * 0.95} fontWeight="900" fill="#78350f" fontFamily="sans-serif">$</text>
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

  // ViewBox: 0 0 120 170
  // Bottom: 160, Top: 36
  const popupFillY = 160 - currentFill * (160 - 36);
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
          {/* ── Mason Jar (Shape from sketch) ── */}
          <div className="relative w-24 h-32 flex-shrink-0">
            <svg viewBox="0 0 120 170" className="w-full h-full overflow-visible">
              <defs>
                {/* Mason Jar Clip Path (scaled to 120x170) */}
                <clipPath id="popupMasonJarClip">
                  <path d="M 22,34 C 17,42 7,50 7,62 L 7,146 C 7,160 19,162 60,162 C 101,162 113,160 113,146 L 113,62 C 113,50 103,42 98,34 Z" />
                </clipPath>

                {/* Fill level clip */}
                <clipPath id="popupMoneyLevelClip">
                  <rect x="0" y={popupFillY} width="120" height={170 - popupFillY} />
                </clipPath>

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
                  <stop offset="0%" stopColor="rgba(255,255,255,0.12)" />
                  <stop offset="50%" stopColor="rgba(255,255,255,0.02)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0.08)" />
                </linearGradient>
              </defs>

              {/* Base shadow */}
              <ellipse cx="60" cy="166" rx="44" ry="4" fill="rgba(0,0,0,0.5)" />

              {/* Jar glass background */}
              <path
                d="M 22,34 C 17,42 7,50 7,62 L 7,146 C 7,160 19,162 60,162 C 101,162 113,160 113,146 L 113,62 C 113,50 103,42 98,34 Z"
                fill="url(#popupGlassGrad)"
              />

              {/* ── Banknotes and Coins Inside ── */}
              <g clipPath="url(#popupMasonJarClip)">
                <g clipPath="url(#popupMoneyLevelClip)">
                  {/* Base tier */}
                  <BanknoteMini x={16} y={142} width={38} height={15} rotation={-6} />
                  <BanknoteMini x={66} y={140} width={40} height={15} rotation={8} />
                  <BanknoteMini x={38} y={146} width={44} height={16} rotation={1} />
                  <CoinMini cx={26} cy={152} r={5.5} />
                  <CoinMini cx={52} cy={154} r={5.2} />
                  <CoinMini cx={82} cy={152} r={5.5} />
                  <CoinMini cx={100} cy={148} r={5} />

                  {/* Mid tier */}
                  <BanknoteMini x={12} y={120} width={40} height={15} rotation={14} />
                  <BanknoteMini x={68} y={118} width={42} height={15} rotation={-12} />
                  <BanknoteMini x={36} y={126} width={44} height={16} rotation={-3} />
                  <CoinMini cx={30} cy={128} r={5.5} />
                  <CoinMini cx={72} cy={130} r={5.2} />
                  <CoinMini cx={94} cy={124} r={5} />

                  {/* Upper-mid tier */}
                  <BanknoteMini x={16} y={96} width={42} height={16} rotation={-9} />
                  <BanknoteMini x={60} y={98} width={40} height={15} rotation={11} />
                  <BanknoteMini x={34} y={104} width={45} height={16} rotation={4} />
                  <CoinMini cx={44} cy={92} r={5.2} />
                  <CoinMini cx={86} cy={100} r={5.5} />
                  <CoinMini cx={25} cy={105} r={5} />

                  {/* Top tier */}
                  <BanknoteMini x={14} y={72} width={42} height={16} rotation={15} />
                  <BanknoteMini x={62} y={70} width={42} height={16} rotation={-10} />
                  <BanknoteMini x={36} y={78} width={45} height={16} rotation={-2} />
                  <CoinMini cx={32} cy={70} r={5.5} />
                  <CoinMini cx={74} cy={76} r={5.2} />
                  <CoinMini cx={94} cy={72} r={5} />

                  {/* Brim tier */}
                  <BanknoteMini x={22} y={48} width={38} height={15} rotation={-12} />
                  <BanknoteMini x={58} y={50} width={38} height={15} rotation={8} />
                  <CoinMini cx={28} cy={46} r={5.2} />
                  <CoinMini cx={78} cy={52} r={5.2} />
                  <CoinMini cx={54} cy={44} r={5} />

                  {/* Shimmer line at surface */}
                  <ellipse cx="60" cy={popupFillY + 2} rx="40" ry="2" fill="rgba(254, 240, 138, 0.7)" />
                </g>
              </g>

              {/* ── Mason Jar Outline (from sketch) ── */}
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

              {/* Glass Inner Reflection Marks (from sketch) */}
              <path d="M 13,52 L 13,90" stroke="rgba(255,255,255,0.75)" strokeWidth="2" strokeLinecap="round" fill="none" />
              <path d="M 13,138 C 13,151 21,156 36,156" stroke="rgba(255,255,255,0.75)" strokeWidth="2" strokeLinecap="round" fill="none" />
              <path d="M 107,110 L 107,142 C 107,151 101,156 86,156" stroke="rgba(255,255,255,0.75)" strokeWidth="2" strokeLinecap="round" fill="none" />
            </svg>

            {/* Dropping Coins & Notes */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
              {coins.map((coin) => (
                <div
                  key={coin.id}
                  className="coin-anim absolute flex items-center justify-center rounded-full"
                  style={{
                    width: coin.type === 'bill' ? 18 : 14,
                    height: coin.type === 'bill' ? 11 : 14,
                    left: `calc(${coin.left}% - 8px)`,
                    animationDelay: `${coin.delay}ms`,
                    background: coin.type === 'bill'
                      ? 'linear-gradient(135deg, #10b981, #047857)'
                      : 'radial-gradient(circle at 35% 32%, #ffe066, #c89400)',
                    border: coin.type === 'bill' ? '1px solid #064e3b' : '1px solid #d4a200',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
                    color: coin.type === 'bill' ? '#ffffff' : '#7a4f00',
                    fontSize: 7.5,
                    fontWeight: 900,
                    borderRadius: coin.type === 'bill' ? 2.5 : '50%',
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
