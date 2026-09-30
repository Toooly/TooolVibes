/**
 * TooolVibes — Canonical Haptics Service (compat surface)
 *
 * CANONICAL IMPLEMENTATION lives in `@/lib/feedback`.
 * This module re-exports it so existing callers keep working.
 * New code must import from `@/lib/feedback` directly.
 *
 * Routing: native bridge -> navigator.vibrate -> silent no-op.
 * Audio fake haptics are FORBIDDEN (iOS crack/click).
 */
export { feedback, clearNativeFeedbackBridge as clearNativeHapticBridge } from "@/lib/feedback";
export type { FeedbackIntent as HapticIntent, FeedbackResult as HapticResult } from "@/lib/feedback";

import { feedback, registerNativeFeedbackBridge } from "@/lib/feedback";
import type { FeedbackIntent } from "@/lib/feedback";

type LegacyBridge = { trigger: (intent: FeedbackIntent) => void };

/** Legacy bridge adapter: { trigger } -> canonical { feedback }. */
export function registerNativeHapticBridgeCompat(bridge: LegacyBridge): void {
  registerNativeFeedbackBridge({ feedback: (intent) => bridge.trigger(intent) });
}

export type LegacyPattern = "selection" | "light" | "medium" | "success" | "warning";

/**
 * Trigger haptic feedback for a meaningful interaction intent.
 * Returns which platform path was used, or "unsupported" on iOS Safari / desktop.
 * NEVER throws. NEVER produces audio. NEVER fakes vibration.
 */
export function registerNativeHapticBridge(bridge: LegacyBridge): void {
  registerNativeHapticBridgeCompat(bridge);
}

/** Legacy result names: "native-bridge" instead of canonical "native". */
export function triggerHaptic(intent: LegacyPattern = "light"): "native-bridge" | "vibration" | "unsupported" {
  const result = feedback[intent]();
  return result === "native" ? "native-bridge" : result;
}

/**
 * Backward-compatible alias for existing callers.
 * Prefer triggerHaptic() in new code, feedback.* in newest code.
 */
export function haptic(pattern: "light" | "medium" | "success" | "warning" = "light"): void {
  triggerHaptic(pattern);
}
