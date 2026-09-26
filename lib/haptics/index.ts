/**
 * Cross-platform haptic feedback.
 *
 * iOS Safari does NOT implement navigator.vibrate() — the Vibration API
 * has never shipped in Safari. On iOS, we use the Web Audio API to produce
 * a sharp transient click through the speaker. The physical speaker cone
 * movement creates a perceptible tactile pulse on the device chassis.
 *
 * Android Chrome/Edge: navigator.vibrate() (true haptic motor).
 * iOS Safari/Chrome (WebKit): Web Audio transient click.
 * Desktop: no-op.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (audioCtx) return audioCtx;
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) return null;
    audioCtx = new Ctx();
    return audioCtx;
  } catch {
    return null;
  }
}

/**
 * Produce a sharp transient click via Web Audio.
 * The burst drives the speaker cone physically, felt as a pulse on the chassis.
 */
function audioPulse(volume = 0.2, durationMs = 25, freq = 180) {
  const ctx = getAudioContext();
  if (!ctx) return;

  // Must resume inside a user-gesture context (iOS requirement)
  if (ctx.state === "suspended") {
    void ctx.resume();
  }

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const shaper = ctx.createWaveShaper();

    // Soft clip curve for sharper transient
    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const x = (i / 256) * 2 - 1;
      curve[i] = Math.tanh(x * 3);
    }
    shaper.curve = curve;

    osc.connect(shaper);
    shaper.connect(gain);
    gain.connect(ctx.destination);

    osc.type = "square";
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.5, now + durationMs / 1000);

    const dur = durationMs / 1000;
    gain.gain.setValueAtTime(volume, now);
    gain.gain.setValueAtTime(volume, now + dur * 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    osc.start(now);
    osc.stop(now + dur);
  } catch {
    // silent
  }
}

export type HapticPattern = "light" | "medium" | "success" | "warning";

const PATTERNS: Record<
  HapticPattern,
  { vibrate: number[]; audio: () => void }
> = {
  light: {
    vibrate: [15],
    audio: () => audioPulse(0.2, 22, 200),
  },
  medium: {
    vibrate: [25],
    audio: () => audioPulse(0.28, 30, 160),
  },
  success: {
    vibrate: [18, 50, 18],
    audio: () => {
      audioPulse(0.25, 25, 200);
      setTimeout(() => audioPulse(0.25, 25, 200), 70);
    },
  },
  warning: {
    vibrate: [10, 35, 10, 35, 10],
    audio: () => {
      audioPulse(0.18, 18, 280);
      setTimeout(() => audioPulse(0.18, 18, 280), 50);
      setTimeout(() => audioPulse(0.18, 18, 280), 100);
    },
  },
};

export function haptic(pattern: HapticPattern = "light"): void {
  if (typeof window === "undefined") return;
  const p = PATTERNS[pattern];

  // 1. Try native vibration — but CHECK the return value.
  //    navigator.vibrate() returns false when no motor exists
  //    (iOS WebKit stub, desktop browsers). Must NOT skip audio.
  let nativeWorked = false;
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      nativeWorked = navigator.vibrate(p.vibrate) === true;
    } catch {
      nativeWorked = false;
    }
  }

  // 2. Always play audio fallback when native vibration is unavailable
  //    or didn't actually fire. On Android the native motor fires and
  //    the click is inaudible; on iOS the click IS the tactile feedback.
  if (!nativeWorked) {
    p.audio();
  }
}
