import React, { useState } from 'react';

export default function PayPalActionButtons({ sub, onPause, onCancel, onUndo }) {
  const [loadingAction, setLoadingAction] = useState(null);

  const handleAction = async (actionType, fn) => {
    try {
      setLoadingAction(actionType);
      await fn(sub.id);
    } finally {
      setLoadingAction(null);
    }
  };

  if (sub.source === 'external' || sub.managedByPaypal === false) {
    return (
      <div className="flex items-center gap-2">
        <span 
          className="text-[11px] font-semibold px-3 py-1 rounded-full text-mute/80"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
          title="Imported from statement audit. Not managed via PayPal."
        >
          🔒 Bank Audit Only
        </span>
      </div>
    );
  }

  if (sub.status === 'paused' || sub.status === 'cancelled') {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleAction('undo', onUndo)}
          disabled={loadingAction !== null}
          className="text-xs font-semibold px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
          style={{
            border: '1px solid rgba(0, 210, 255, 0.5)',
            color: '#00d2ff',
            background: 'rgba(0, 210, 255, 0.1)'
          }}
        >
          {loadingAction === 'undo' ? (
            <span className="w-3 h-3 border-2 border-t-transparent rounded-full animate-spin inline-block" style={{ borderColor: '#00d2ff', borderTopColor: 'transparent' }} />
          ) : (
            <span>↺</span>
          )}
          Undo
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => handleAction('pause', onPause)}
        disabled={loadingAction !== null}
        className="text-xs font-semibold px-3 py-1.5 rounded-full border border-line text-white/80 hover:text-white hover:bg-white/10 transition-all flex items-center gap-1.5 cursor-pointer"
      >
        {loadingAction === 'pause' ? (
          <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
        ) : (
          <span>⏸</span>
        )}
        Pause
      </button>

      <button
        onClick={() => handleAction('cancel', onCancel)}
        disabled={loadingAction !== null}
        className="text-xs font-semibold px-3 py-1.5 rounded-full border border-coral/30 text-coral/90 hover:text-coral hover:bg-coral/10 hover:border-coral transition-all flex items-center gap-1.5 cursor-pointer"
      >
        {loadingAction === 'cancel' ? (
          <span className="w-3 h-3 border-2 border-coral border-t-transparent rounded-full animate-spin inline-block" />
        ) : (
          <span>✕</span>
        )}
        Cancel
      </button>
    </div>
  );
}
