/**
 * Cross-platform haptic feedback utility.
 *
 * iOS Safari does NOT support navigator.vibrate() — the Vibration API is
 * not implemented in Safari. On iOS, we use the Web Audio API to produce
 * a very short, low-volume click through the speaker. The physical speaker
 * movement creates a subtle tactile sensation on the device chassis.
 *
 * Android Chrome/Edge/Firefox: navigator.vibrate() (true haptic).
 * iOS Safari/Chrome: Web Audio click fallback.
 * Desktop: no-op.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (audioCtx) return audioCtx;
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    audioCtx = new Ctx();
    return audioCtx;
  } catch {
    return null;
  }
}

/** Play a tiny click via Web Audio (iOS Safari fallback). */
function audioClick(volume = 0.06, duration = 0.012) {
  const ctx = getAudioContext();
  if (!ctx) return;

  // Resume context if suspended (required on iOS after user gesture)
  if (ctx.state === "suspended") {
    void ctx.resume();
  }

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = "square";
    osc.frequency.value = 280;

    const now = ctx.currentTime;
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.start(now);
    osc.stop(now + duration);
  } catch {
    // silent fail
  }
}

export type HapticPattern =
  | "light" // single tick — nav taps, threshold cross
  | "medium" // stronger tick — button press
  | "success" // double pulse — pull-to-refresh release
  | "warning"; // triple — cancel/error

const PATTERNS: Record<HapticPattern, { vibrate: number[]; audio: () => void }> = {
  light: {
    vibrate: [8],
    audio: () => audioClick(0.05, 0.01),
  },
  medium: {
    vibrate: [14],
    audio: () => audioClick(0.08, 0.015),
  },
  success: {
    vibrate: [12, 40, 12],
    audio: () => {
      audioClick(0.07, 0.012);
      setTimeout(() => audioClick(0.07, 0.012), 60);
    },
  },
  warning: {
    vibrate: [6, 30, 6, 30, 6],
    audio: () => {
      audioClick(0.06, 0.01);
      setTimeout(() => audioClick(0.06, 0.01), 40);
      setTimeout(() => audioClick(0.06, 0.01), 80);
    },
  },
};

export function haptic(pattern: HapticPattern = "light"): void {
  if (typeof window === "undefined") return;

  const p = PATTERNS[pattern];

  // 1. Try native vibration (Android, Chrome, some PWAs)
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(p.vibrate);
      return; // native worked — skip audio
    } catch {
      // fall through to audio
    }
  }

  // 2. iOS Safari / Web Audio fallback
  p.audio();
}
