import { describe, expect, it, vi, afterEach } from "vitest";
import { getPlatformCapabilities } from "@/lib/platform/capabilities";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("platform capabilities", () => {
  it("exposes the full capability shape with safe defaults", () => {
    const caps = getPlatformCapabilities();
    expect(typeof caps.isWeb).toBe("boolean");
    expect(typeof caps.isStandalone).toBe("boolean");
    expect(typeof caps.supportsWebVibration).toBe("boolean");
    expect(typeof caps.supportsNativeHaptics).toBe("boolean");
    expect(typeof caps.supportsInstallPrompt).toBe("boolean");
    expect(typeof caps.supportsPush).toBe("boolean");
    expect(typeof caps.supportsShare).toBe("boolean");
    expect(caps.supportsDeepLinks).toBe(true);
  });

  it("never claims native haptics without a bridge", () => {
    const caps = getPlatformCapabilities();
    expect(caps.supportsNativeHaptics).toBe(false);
    expect(caps.isNative).toBe(false);
  });

  it("no audio surface exists on the capability layer", () => {
    const caps = getPlatformCapabilities();
    expect("supportsAudioHaptics" in caps).toBe(false);
    expect(JSON.stringify(caps)).not.toMatch(/audio/i);
  });
});
