/**
 * TooolVibes — Canonical Haptics Service
 *
 * Platform capability contract:
 *   1. Native TooolVibes bridge (future iOS native shell) — real Taptic Engine
 *   2. navigator.vibrate() — Android Chrome/Edge, Firefox Android
 *   3. Unsupported (iOS Safari, desktop) — no-op, visual feedback only
 *
 * iOS Safari does NOT implement the Vibration API.
 * Audio-based fake haptics are FORBIDDEN — they produce unpleasant
 * crack/click sounds through the speaker and are not haptic feedback.
 *
 * On unsupported platforms this service silently returns.
 * UI pressed/active states provide visual feedback independently.
 */

export type HapticIntent = "selection" | "light" | "medium" | "success" | "warning";

export type HapticResult = "native-bridge" | "vibration" | "unsupported";

/**
 * Canonical vibration patterns (milliseconds).
 * Restrained — haptics communicate meaning, not decoration.
 */
const PATTERNS: Record<HapticIntent, number[]> = {
  selection: [8],
  light: [12],
  medium: [20],
  success: [15, 40, 15],
  warning: [10, 30, 10],
};

/**
 * Future native bridge hook.
 * When a native iOS shell (Capacitor, React Native, WKWebView bridge)
 * becomes available, register it here to get true Taptic Engine output.
 *
 * Do NOT invent a fake bridge. This is an extension point only.
 */
type NativeBridge = {
  trigger: (intent: HapticIntent) => void;
};

let nativeBridge: NativeBridge | null = null;

export function registerNativeHapticBridge(bridge: NativeBridge): void {
  nativeBridge = bridge;
}

export function clearNativeHapticBridge(): void {
  nativeBridge = null;
}

/**
 * Feature-detect the Vibration API.
 * Do NOT use user-agent or touch detection — only real capability.
 */
function hasVibration(): boolean {
  return (
    typeof navigator !== "undefined" &&
    typeof navigator.vibrate === "function"
  );
}

/**
 * Trigger haptic feedback for a meaningful interaction intent.
 *
 * Returns which platform path was used, or "unsupported" on iOS Safari / desktop.
 * NEVER throws. NEVER produces audio. NEVER fakes vibration.
 */
export function triggerHaptic(intent: HapticIntent = "light"): HapticResult {
  // 1. Native bridge (future iOS shell)
  if (nativeBridge) {
    try {
      nativeBridge.trigger(intent);
      return "native-bridge";
    } catch {
      // fall through to web vibration
    }
  }

  // 2. Web Vibration API (Android)
  if (hasVibration()) {
    try {
      const result = navigator.vibrate(PATTERNS[intent]);
      if (result !== false) {
        return "vibration";
      }
    } catch {
      // fall through to unsupported
    }
  }

  // 3. Unsupported (iOS Safari, desktop) — honest no-op
  //    Visual UI feedback (pressed/active states) handles the interaction.
  return "unsupported";
}

/**
 * Backward-compatible alias for existing callers.
 * Prefer triggerHaptic() in new code.
 */
export function haptic(pattern: "light" | "medium" | "success" | "warning" = "light"): void {
  triggerHaptic(pattern);
}
