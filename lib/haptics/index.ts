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
let gestureListenerAttached = false;

function ensureAudioContext(): AudioContext | null {
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

function resumeAudioContext() {
  const ctx = ensureAudioContext();
  if (ctx && ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }
}

// Pre-resume AudioContext on first user gesture (iOS requirement)
function attachGestureListener() {
  if (gestureListenerAttached || typeof window === "undefined") return;
  gestureListenerAttached = true;
  const resume = () => {
    resumeAudioContext();
    window.removeEventListener("touchstart", resume);
    window.removeEventListener("touchend", resume);
    window.removeEventListener("click", resume);
    window.removeEventListener("pointerdown", resume);
  };
  window.addEventListener("touchstart", resume, { once: true, passive: true });
  window.addEventListener("touchend", resume, { once: true, passive: true });
  window.addEventListener("click", resume, { once: true });
  window.addEventListener("pointerdown", resume, { once: true, passive: true });
}

// Attach on module load
if (typeof window !== "undefined") {
  attachGestureListener();
}

/**
 * Produce a sharp transient click via Web Audio.
 * The burst drives the speaker cone physically, felt as a pulse on the chassis.
 */
function audioPulse(volume = 0.3, durationMs = 18, freq = 220) {
  const ctx = ensureAudioContext();
  if (!ctx) return;

  // Resume synchronously — iOS Safari requires this inside the user gesture
  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Sharp attack + fast decay for a crisp click
    osc.type = "square";
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.4, now + durationMs / 1000);

    const dur = durationMs / 1000;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.002); // 2ms attack
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + dur + 0.01);
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

  // 1. Try native vibration (Android Chrome/Edge).
  //    iOS Safari does NOT implement navigator.vibrate — the property
  //    is completely absent, not a stub returning false.
  let nativeWorked = false;
  try {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      nativeWorked = navigator.vibrate(p.vibrate) === true;
    }
  } catch {
    nativeWorked = false;
  }

  // 2. On iOS (and any platform where vibration failed), use Web Audio
  //    to create a speaker transient felt as a tactile pulse.
  //    The AudioContext MUST be resumed synchronously inside the user
  //    gesture — iOS Safari blocks autoplay otherwise.
  if (!nativeWorked) {
    const ctx = ensureAudioContext();
    if (ctx && ctx.state === "suspended") {
      // Synchronous resume attempt — iOS unlocks the context here
      ctx.resume().catch(() => {});
    }
    p.audio();
  }
}
