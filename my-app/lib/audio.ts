// Web Audio API harmonic chime generator (zero external assets needed)

let audioCtx: AudioContext | null = null;

export function playWishChime() {
  if (typeof window === 'undefined') return;

  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }

    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const now = audioCtx.currentTime;

    // Harmonic bell chord: Root (528Hz Solfeggio "love/miracle frequency"), 5th (792Hz), octave (1056Hz)
    const frequencies = [528, 792, 1056, 1320];

    frequencies.forEach((freq, index) => {
      if (!audioCtx) return;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = index === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now + index * 0.04);

      // Volume envelope with silky soft attack and bell decay
      const baseGain = 0.08 / (index + 1);
      gain.gain.setValueAtTime(0.0001, now + index * 0.04);
      gain.gain.exponentialRampToValueAtTime(baseGain, now + index * 0.04 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.00001, now + index * 0.04 + 1.6);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(now + index * 0.04);
      osc.stop(now + index * 0.04 + 1.8);
    });
  } catch {
    // Graceful fallback if audio is blocked or unsupported
  }
}
