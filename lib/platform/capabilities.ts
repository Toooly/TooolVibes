"use client";

/**
 * TooolVibes — Canonical Platform Capability Layer
 *
 * ONE place for every runtime question. Feature detection first;
 * UA/platform inference only where no capability API can answer.
 *
 * No component may perform ad-hoc UA sniffing, standalone checks,
 * or Capacitor detection. Import from here.
 */

export type RuntimePlatform = "ios" | "android" | "desktop" | "unknown";

export type PlatformCapabilities = {
  platform: RuntimePlatform;
  isWeb: boolean;
  isNative: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isStandalone: boolean;
  isPWA: boolean;
  supportsWebVibration: boolean;
  supportsNativeHaptics: boolean;
  supportsInstallPrompt: boolean;
  supportsPush: boolean;
  supportsShare: boolean;
  supportsDeepLinks: boolean;
};

declare global {
  interface Window {
    Capacitor?: { isNative?: boolean; platform?: string };
  }
}

function detectNativeBridge(): { isNative: boolean; platform: RuntimePlatform } {
  if (typeof window === "undefined") return { isNative: false, platform: "unknown" };
  const cap = window.Capacitor;
  const nativeFlag =
    cap?.isNative === true ||
    document.documentElement.hasAttribute("data-tv-native");
  if (!nativeFlag) return { isNative: false, platform: "unknown" };
  const raw = (cap?.platform ?? document.documentElement.getAttribute("data-tv-native") ?? "").toLowerCase();
  if (raw === "ios") return { isNative: true, platform: "ios" };
  if (raw === "android") return { isNative: true, platform: "android" };
  return { isNative: true, platform: "unknown" };
}

function inferMobilePlatform(): RuntimePlatform {
  if (typeof navigator === "undefined") return "unknown";
  // Inference only: no vibration/standalone/install API exposes the OS.
  const ua = navigator.userAgent || "";
  const touch = typeof window !== "undefined" && "ontouchstart" in window;
  if (/iPad|iPhone|iPod/i.test(ua)) return "ios";
  if (/Android/i.test(ua)) return "android";
  if (touch && typeof window !== "undefined" && Math.min(window.screen.width, window.screen.height) < 820) {
    return "unknown";
  }
  return "desktop";
}

export function getPlatformCapabilities(): PlatformCapabilities {
  if (typeof window === "undefined") {
    return {
      platform: "unknown",
      isWeb: true,
      isNative: false,
      isIOS: false,
      isAndroid: false,
      isStandalone: false,
      isPWA: false,
      supportsWebVibration: false,
      supportsNativeHaptics: false,
      supportsInstallPrompt: false,
      supportsPush: false,
      supportsShare: false,
      supportsDeepLinks: true,
    };
  }
  const native = detectNativeBridge();
  const inferred = native.isNative && native.platform !== "unknown" ? native.platform : inferMobilePlatform();
  const isIOS = inferred === "ios";
  const isAndroid = inferred === "android";

  const standalone =
    (typeof window.matchMedia === "function" &&
      window.matchMedia("(display-mode: standalone)").matches) ||
    (navigator as unknown as { standalone?: boolean }).standalone === true ||
    document.referrer.startsWith("android-app://");

  const supportsWebVibration =
    typeof navigator.vibrate === "function";

  // Native haptics exist only when a registered bridge is present.
  // Never claim Taptic/Haptic capability from UA alone.
  const supportsNativeHaptics = native.isNative;

  const supportsInstallPrompt =
    !native.isNative && !standalone && "BeforeInstallPromptEvent" in window;

  const supportsPush =
    "serviceWorker" in navigator && "PushManager" in window;

  const supportsShare = typeof navigator.share === "function";

  return {
    platform: inferred,
    isWeb: !native.isNative,
    isNative: native.isNative,
    isIOS,
    isAndroid,
    isStandalone: standalone || native.isNative,
    isPWA: standalone || native.isNative,
    supportsWebVibration,
    supportsNativeHaptics,
    supportsInstallPrompt,
    supportsPush,
    supportsShare,
    supportsDeepLinks: true,
  };
}

/** SSR-safe standalone check for gating install education. */
export function isStandaloneContext(): boolean {
  if (typeof window === "undefined") return false;
  return getPlatformCapabilities().isStandalone;
}
