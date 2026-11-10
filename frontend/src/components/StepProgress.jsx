// frontend/src/components/StepProgress.jsx
import React from 'react';

const STEPS = [
  { id: 1, label: 'Account' },
  { id: 2, label: 'Profile' },
  { id: 3, label: 'Connect' },
  { id: 4, label: 'Scanning' },
  { id: 5, label: 'Review' },
];

export default function StepProgress({ currentStep, onStepClick }) {
  return (
    <div className="w-full max-w-2xl mx-auto py-4 px-2" role="progressbar" aria-valuenow={currentStep} aria-valuemin="1" aria-valuemax="5">
      <div className="flex items-center justify-between relative">
        {/* Background track line */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-line -translate-y-1/2 z-0" />
        
        {/* Active progress fill */}
        <div 
          className="absolute top-1/2 left-0 h-0.5 bg-mint -translate-y-1/2 z-0 transition-all duration-500 ease-out"
          style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
        />

        {STEPS.map((step) => {
          const isDone = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center">
              <button
                type="button"
                onClick={() => onStepClick && isDone && onStepClick(step.id)}
                disabled={!isDone}
                aria-current={isCurrent ? 'step' : undefined}
                className={`w-9 h-9 rounded-full flex items-center justify-center font-display font-bold text-xs transition-all duration-300 ${
                  isCurrent
                    ? 'bg-mint text-navy ring-4 ring-mint/30 shadow-[0_0_20px_rgba(0,210,255,0.6)] scale-110'
                    : isDone
                    ? 'bg-[#0070ba] text-white shadow-md cursor-pointer hover:scale-105'
                    : 'bg-bg2 text-mute/60 border border-line/40'
                }`}
              >
                {isDone ? '✓' : step.id}
              </button>
              <span
                className={`mt-2 text-[11px] font-semibold tracking-wide transition-colors ${
                  isCurrent ? 'text-mint' : isDone ? 'text-white' : 'text-mute/50'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
