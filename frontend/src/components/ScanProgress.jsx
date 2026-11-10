// frontend/src/components/ScanProgress.jsx
import React, { useState, useEffect } from 'react';
import { mockAuthApi } from '../mock/auth';

const STAGES = [
  { id: 1, label: 'Reading transactions ledger...', minProgress: 0 },
  { id: 2, label: 'Spotting recurring charges & hidden spikes...', minProgress: 35 },
  { id: 3, label: 'Matching to app directory & checking trials...', minProgress: 70 },
];

export default function ScanProgress({ onScanComplete, onSkip }) {
  const [progress, setProgress] = useState(10);
  const [stageIndex, setStageIndex] = useState(0);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    mockAuthApi.startScan();

    // Poll status
    const pollInterval = setInterval(async () => {
      const status = await mockAuthApi.getScanStatus();
      setProgress(status.progress);

      if (status.progress >= 70) {
        setStageIndex(2);
      } else if (status.progress >= 35) {
        setStageIndex(1);
      } else {
        setStageIndex(0);
      }

      if (status.state === 'done' || status.progress >= 100) {
        clearInterval(pollInterval);
        setTimeout(() => {
          if (onScanComplete) onScanComplete();
        }, 600);
      }
    }, 350);

    // 60-second timeout
    const timeoutId = setTimeout(() => {
      clearInterval(pollInterval);
      setTimedOut(true);
    }, 60000);

    return () => {
      clearInterval(pollInterval);
      clearTimeout(timeoutId);
    };
  }, [onScanComplete]);

  const handleRetry = () => {
    setTimedOut(false);
    setProgress(15);
    setStageIndex(0);
    mockAuthApi.startScan();
  };

  return (
    <div 
      className="rounded-3xl p-8 sm:p-12 space-y-8 text-center max-w-lg mx-auto"
      style={{
        background: 'var(--card-surface)',
        border: '1px solid var(--card-border)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
      }}
    >
      {/* Animated Radar Pulse Icon */}
      <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border border-mint/30 animate-ping opacity-75" />
        <div className="absolute inset-2 rounded-full border border-mint/50 animate-pulse" />
        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#0070ba] to-mint flex items-center justify-center text-white text-2xl shadow-[0_0_30px_rgba(0,210,255,0.5)]">
          🔍
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="font-display font-black text-2xl text-white">
          {timedOut ? "Scan is taking longer than expected" : "Analyzing Your PayPal Account"}
        </h3>
        <p className="text-xs text-mute max-w-sm mx-auto">
          {timedOut
            ? "Your bank or PayPal sandbox ledger took too long to respond. You can retry or skip to dashboard."
            : "Churn Guard is auditing your ledger to isolate ongoing subscriptions, dormant accounts, and trial periods."}
        </p>
      </div>

      {!timedOut ? (
        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="w-full h-3 bg-bg2 rounded-full overflow-hidden border border-line/40 p-0.5">
              <div 
                className="h-full bg-gradient-to-r from-[#0070ba] to-mint rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-mute font-semibold">
              <span>Auditing...</span>
              <span className="text-mint font-bold">{progress}%</span>
            </div>
          </div>

          {/* Stepped Checklist */}
          <div className="space-y-3 text-left bg-bg/60 p-4 rounded-2xl border border-line/30">
            {STAGES.map((s, idx) => {
              const isPast = stageIndex > idx;
              const isCurrent = stageIndex === idx;
              return (
                <div key={s.id} className="flex items-center gap-3 text-xs">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                    isPast 
                      ? 'bg-mint text-navy' 
                      : isCurrent 
                      ? 'border border-mint text-mint animate-pulse' 
                      : 'border border-line/40 text-mute/40'
                  }`}>
                    {isPast ? '✓' : idx + 1}
                  </div>
                  <span className={`${isCurrent ? 'text-white font-bold' : isPast ? 'text-mute' : 'text-mute/50'}`}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Timeout Controls */
        <div className="space-y-3 pt-2">
          <button
            type="button"
            onClick={handleRetry}
            className="w-full py-3 px-6 rounded-full font-bold text-xs text-white bg-mint text-navy shadow-lg hover:scale-105 cursor-pointer"
          >
            🔄 Retry Scan
          </button>
          <button
            type="button"
            onClick={onSkip}
            className="w-full py-2.5 px-6 rounded-full font-semibold text-xs text-mute hover:text-white transition-colors cursor-pointer"
          >
            Skip, I'll review my statement later →
          </button>
        </div>
      )}
    </div>
  );
}
