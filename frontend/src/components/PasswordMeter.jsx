// frontend/src/components/PasswordMeter.jsx
import React from 'react';

export function calculatePasswordStrength(password) {
  if (!password) return { score: 0, label: '', color: '', meetsMin: false };

  const hasLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  let score = 0;
  if (hasLength) score++;
  if (hasUpper) score++;
  if (hasNumber) score++;
  if (hasSpecial) score++;

  let label = 'Weak';
  let color = '#ff3d71'; // coral

  if (score >= 4) {
    label = 'Strong';
    color = '#00d2ff'; // mint cyan
  } else if (score === 3) {
    label = 'Good';
    color = '#38bdf8';
  } else if (score === 2) {
    label = 'Fair';
    color = '#fbbf24';
  }

  return {
    score,
    label,
    color,
    meetsMin: hasLength,
    checks: {
      length: hasLength,
      upper: hasUpper,
      number: hasNumber,
      special: hasSpecial
    }
  };
}

export default function PasswordMeter({ password }) {
  const { score, label, color, checks } = calculatePasswordStrength(password);

  if (!password) return null;

  return (
    <div className="space-y-2 mt-2" aria-live="polite">
      {/* Strength Bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-bg2 rounded-full overflow-hidden border border-line/30 flex gap-1 p-0.5">
          {[1, 2, 3, 4].map((level) => (
            <div
              key={level}
              className="flex-1 h-full rounded-full transition-all duration-300"
              style={{
                backgroundColor: score >= level ? color : 'transparent'
              }}
            />
          ))}
        </div>
        <span className="text-[11px] font-bold tracking-wider uppercase" style={{ color }}>
          {label}
        </span>
      </div>

      {/* Requirement Pills */}
      <div className="flex flex-wrap gap-1.5 text-[10px]">
        <span className={`px-2 py-0.5 rounded-full border transition-colors ${checks?.length ? 'bg-mint/10 border-mint/40 text-mint' : 'bg-bg2 border-line/30 text-mute'}`}>
          {checks?.length ? '✓' : '•'} 8+ chars
        </span>
        <span className={`px-2 py-0.5 rounded-full border transition-colors ${checks?.upper ? 'bg-mint/10 border-mint/40 text-mint' : 'bg-bg2 border-line/30 text-mute'}`}>
          {checks?.upper ? '✓' : '•'} Uppercase
        </span>
        <span className={`px-2 py-0.5 rounded-full border transition-colors ${checks?.number ? 'bg-mint/10 border-mint/40 text-mint' : 'bg-bg2 border-line/30 text-mute'}`}>
          {checks?.number ? '✓' : '•'} Number
        </span>
        <span className={`px-2 py-0.5 rounded-full border transition-colors ${checks?.special ? 'bg-mint/10 border-mint/40 text-mint' : 'bg-bg2 border-line/30 text-mute'}`}>
          {checks?.special ? '✓' : '•'} Symbol
        </span>
      </div>
    </div>
  );
}
