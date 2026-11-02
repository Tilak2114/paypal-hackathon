import React from 'react';

export default function AlertFeed({ subscriptions }) {
  const flagged = subscriptions.filter(
    (s) => (s.flag || s.suggestion) && s.status !== 'cancelled' && s.status !== 'paused'
  );

  if (flagged.length === 0) {
    return (
      <div className="bg-card/50 border border-line rounded-2xl p-4 text-xs text-mint flex items-center gap-2.5">
        <span>✨</span>
        <span>All clear! No wasteful or overlapping subscriptions detected.</span>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <h4 className="text-xs uppercase font-bold tracking-wider text-mute flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-coral animate-pulse" />
          Attention Required ({flagged.length})
        </h4>
      </div>

      <div className="space-y-2">
        {flagged.map((sub) => (
          <div
            key={sub.id}
            className="p-3.5 rounded-xl border border-coral/30 bg-coral/5 backdrop-blur-md flex items-start gap-3 text-xs"
          >
            <div className="text-base leading-none">⚠️</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between font-semibold text-ink">
                <span>{sub.name}</span>
                <span className="text-coral font-bold">${sub.cost.toFixed(2)}/mo</span>
              </div>
              <p className="text-mute/90 mt-1 leading-relaxed">
                {sub.suggestion || `Flagged as ${sub.flag.replace('_', ' ')}.`}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
