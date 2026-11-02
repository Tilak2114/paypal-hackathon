import React, { useEffect, useState } from 'react';

export default function SavingsMeter({ totalMonthly, activeMonthly }) {
  const savedMonthly = Math.max(0, totalMonthly - activeMonthly);
  const yearlySavings = savedMonthly * 12;

  // Animated counter state
  const [displayMonthly, setDisplayMonthly] = useState(activeMonthly);
  const [displayYearly, setDisplayYearly] = useState(yearlySavings);

  useEffect(() => {
    let frame;
    const startTime = performance.now();
    const duration = 500;
    const startM = displayMonthly;
    const startY = displayYearly;

    const tick = (now) => {
      const p = Math.min((now - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setDisplayMonthly(startM + (activeMonthly - startM) * ease);
      setDisplayYearly(startY + (yearlySavings - startY) * ease);

      if (p < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [activeMonthly, yearlySavings]);

  const percentage = totalMonthly > 0 ? (activeMonthly / totalMonthly) * 100 : 0;

  return (
    <div className="bg-gradient-to-br from-card to-bg2/40 border border-line rounded-3xl p-6 backdrop-blur-xl relative overflow-hidden shadow-2xl">
      {/* Decorative gradient glow */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-mint/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-36 h-36 bg-coral/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-5">
        <div>
          <span className="text-xs uppercase font-bold tracking-wider text-mute">Active Monthly Spend</span>
          <div className="font-display font-extrabold text-4xl sm:text-5xl text-ink tracking-tight mt-1 flex items-baseline gap-1">
            <span>${displayMonthly.toFixed(2)}</span>
            <span className="text-xs font-normal text-mute">/month</span>
          </div>
        </div>

        {/* Dynamic spend ratio bar */}
        <div>
          <div className="h-2.5 w-full bg-white/10 rounded-full overflow-hidden p-0.5">
            <div
              className="h-full bg-gradient-to-r from-mint to-indigo-400 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[11px] text-mute mt-1.5 font-medium">
            <span>{percentage.toFixed(0)}% retained</span>
            <span>Total base: ${totalMonthly.toFixed(2)}</span>
          </div>
        </div>

        <div className="pt-2 border-t border-line/60">
          <span className="text-xs uppercase font-bold tracking-wider text-mint flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-mint animate-ping" />
            Projected Yearly Savings
          </span>
          <div className="font-display font-black text-4xl sm:text-5xl text-mint tracking-tight mt-1">
            ${displayYearly.toFixed(2)}
          </div>
          <p className="text-xs text-mute mt-1">
            Calculated from {savedMonthly > 0 ? `$${savedMonthly.toFixed(2)}/mo` : '$0/mo'} paused or cancelled via PayPal.
          </p>
        </div>

        {/* PayPal API Badge */}
        <div className="pt-3 flex items-center gap-2.5 text-xs text-mute/90">
          <span className="px-2.5 py-0.5 bg-blue-600 text-white font-extrabold rounded-md text-[11px] tracking-wide shadow-sm">
            PayPal
          </span>
          <span>Integrated with Subscriptions & Billing API</span>
        </div>
      </div>
    </div>
  );
}
