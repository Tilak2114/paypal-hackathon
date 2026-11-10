// Web Audio API cash-register "cha-ching!" synthesizer (Zero external dependencies)
export function playChaChingSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    // Browser autoplay policy might require resuming suspended context
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;

    // Helper: metallic bell tone with rich harmonics
    const playChime = (freq, startTime, duration = 0.6, volume = 0.3) => {
      const osc = ctx.createOscillator();
      const oscHarmonic = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      oscHarmonic.type = 'triangle';
      oscHarmonic.frequency.setValueAtTime(freq * 2.02, startTime); // metallic shimmer

      gain.gain.setValueAtTime(volume, startTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gain);
      oscHarmonic.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      oscHarmonic.start(startTime);
      osc.stop(startTime + duration);
      oscHarmonic.stop(startTime + duration);
    };

    // 1. First register drawer bell ("Cha-")
    playChime(1174.66, now, 0.4, 0.28); // D6
    playChime(1760.00, now + 0.03, 0.45, 0.22); // A6

    // 2. Main bright cash drawer bell strike ("-Ching!!")
    playChime(2349.32, now + 0.12, 0.9, 0.38); // D7
    playChime(2793.83, now + 0.14, 0.85, 0.28); // F7
    playChime(3520.00, now + 0.16, 0.7, 0.22); // A7

    // 3. Crisp coins rattling inside drawer
    for (let i = 0; i < 5; i++) {
      const coinTime = now + 0.10 + i * 0.04;
      const coinOsc = ctx.createOscillator();
      const coinGain = ctx.createGain();
      coinOsc.type = 'square';
      coinOsc.frequency.setValueAtTime(3200 + Math.random() * 2400, coinTime);

      coinGain.gain.setValueAtTime(0.09, coinTime);
      coinGain.gain.exponentialRampToValueAtTime(0.001, coinTime + 0.05);

      coinOsc.connect(coinGain);
      coinGain.connect(ctx.destination);

      coinOsc.start(coinTime);
      coinOsc.stop(coinTime + 0.05);
    }
  } catch (err) {
    console.warn('Audio synthesis unavailable:', err);
  }
}
