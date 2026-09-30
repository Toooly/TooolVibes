"use client";

/**
 * TooolVibes — ONE UI-facing feedback API.
 *
 * All components use this abstraction. Routing priority:
 *   1. Native iOS/Android haptics (registered bridge — real Taptic Engine)
 *   2. Supported web navigator.vibrate() (Android; centralized patterns)
 *   3. Silent visual-only fallback (iOS Safari, desktop) — honest no-op
 *
 * FORBIDDEN: audio fallback, oscillators, sound files, hidden-switch hacks,
 * fake success claims. Unsupported platforms return "unsupported" and the
 * pressed/active visual states carry the interaction.
 */

import { getPlatformCapabilities } from "@/lib/platform/capabilities";

export type FeedbackIntent =
  | "selection"
  | "light"
  | "medium"
  | "success"
  | "warning"
  | "error";

export type FeedbackResult = "native" | "vibration" | "unsupported";

type NativeFeedbackBridge = {
  feedback: (intent: FeedbackIntent) => void;
};

let nativeBridge: NativeFeedbackBridge | null = null;

/** Called once by the native shell bootstrap. Never invent a fake bridge. */
export function registerNativeFeedbackBridge(bridge: NativeFeedbackBridge): void {
  nativeBridge = bridge;
}

export function clearNativeFeedbackBridge(): void {
  nativeBridge = null;
}

/** Centralized web vibration patterns (ms). Components must not invent arrays. */
const WEB_PATTERNS: Record<FeedbackIntent, number[]> = {
  selection: [8],
  light: [12],
  medium: [20],
  success: [15, 40, 15],
  warning: [10, 30, 10],
  error: [25, 40, 25],
};

function vibrate(pattern: number[]): boolean {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") {
    return false;
  }
  try {
    return navigator.vibrate(pattern) !== false;
  } catch {
    return false;
  }
}

function run(intent: FeedbackIntent): FeedbackResult {
  // 1. Native bridge wins everywhere it exists.
  if (nativeBridge) {
    try {
      nativeBridge.feedback(intent);
      return "native";
    } catch {
      // fall through to web vibration
    }
  }
  // 2. Web Vibration API where genuinely supported.
  if (vibrate(WEB_PATTERNS[intent])) return "vibration";
  // 3. Honest silent fallback.
  return "unsupported";
}

export const feedback = {
  selection(): FeedbackResult {
    return run("selection");
  },
  light(): FeedbackResult {
    return run("light");
  },
  medium(): FeedbackResult {
    return run("medium");
  },
  success(): FeedbackResult {
    return run("success");
  },
  warning(): FeedbackResult {
    return run("warning");
  },
  error(): FeedbackResult {
    return run("error");
  },
  /** Capability snapshot for conditional UI (never for fake haptics). */
  capabilities() {
    return getPlatformCapabilities();
  },
};

export type { FeedbackIntent as HapticIntent, FeedbackResult as HapticResult };
