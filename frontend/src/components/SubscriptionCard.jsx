import React, { useRef } from 'react';
import PayPalActionButtons from './PayPalActionButtons';

export default function SubscriptionCard({ sub, onPause, onCancel, onUndo }) {
  const cardRef = useRef(null);
  const isInactive = sub.status === 'paused' || sub.status === 'cancelled';

  // 3D Tilt Effect on mousemove
  const handleMouseMove = (e) => {
    if (!cardRef.current || isInactive) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    cardRef.current.style.transform = `perspective(800px) rotateY(${x * 12}deg) rotateX(${-y * 12}deg) translateY(-2px)`;
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    cardRef.current.style.transform = 'perspective(800px) rotateY(0deg) rotateX(0deg) translateY(0px)';
  };

  const getTagBadge = () => {
    if (sub.status === 'paused') {
      return (
        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-mint/15 text-mint border border-mint/20">
          Paused
        </span>
      );
    }
    if (sub.status === 'cancelled') {
      return (
        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-coral/15 text-coral border border-coral/20">
          Cancelled
        </span>
      );
    }
    if (sub.flag === 'overlap') {
      return (
        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-coral/20 text-coral border border-coral/30 animate-pulse">
          Overlap Warning
        </span>
      );
    }
    if (sub.flag === 'trial_ending') {
      return (
        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
          Trial Ending
        </span>
      );
    }
    if (sub.flag === 'unused' || sub.flag === 'low_usage') {
      return (
        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-400/20 text-purple-300 border border-purple-400/30">
          Unused
        </span>
      );
    }
    return null;
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative p-5 rounded-2xl border transition-all duration-300 backdrop-blur-md ${
        isInactive
          ? 'opacity-40 bg-card/40 border-line/40'
          : sub.flag
          ? 'bg-gradient-to-r from-card to-card/70 border-coral/40 shadow-lg shadow-coral/5'
          : 'bg-card border-line hover:border-mint/40 hover:shadow-lg hover:shadow-mint/5'
      }`}
      style={{ transitionProperty: 'opacity, background-color, border-color, box-shadow, transform' }}
    >
      <div className="flex items-center justify-between gap-4">
        {/* Left: Icon & Details */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center font-display font-black text-slate-950 text-lg shadow-inner flex-shrink-0"
            style={{ backgroundColor: sub.color || '#34f0c8' }}
          >
            {sub.name.charAt(0)}
          </div>

          <div className="truncate">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-display font-bold text-ink text-base tracking-tight truncate">
                {sub.name}
              </h3>
              {getTagBadge()}
            </div>
            <div className="text-xs text-mute mt-0.5 flex items-center gap-2">
              <span>{sub.lastUsed}</span>
              <span>•</span>
              <span className={`font-medium ${isInactive ? 'line-through text-mute/60' : 'text-ink/90'}`}>
                ${sub.cost.toFixed(2)}/mo
              </span>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex-shrink-0">
          <PayPalActionButtons
            sub={sub}
            onPause={onPause}
            onCancel={onCancel}
            onUndo={onUndo}
          />
        </div>
      </div>

      {/* Suggestion prompt if present */}
      {sub.suggestion && !isInactive && (
        <div className="mt-3.5 pt-3 border-t border-line/50 text-xs text-mute flex items-center gap-2">
          <span className="text-coral">💡</span>
          <span className="text-ink/80 italic">{sub.suggestion}</span>
        </div>
      )}
    </div>
  );
}
