import { describe, expect, it, vi, beforeEach } from "vitest";
import { triggerHaptic, registerNativeHapticBridge, clearNativeHapticBridge } from "@/lib/haptics";

describe("haptics service", () => {
  beforeEach(() => {
    clearNativeHapticBridge();
    vi.restoreAllMocks();
  });

  it("TEST A: calls navigator.vibrate with canonical pattern when supported", () => {
    const vibrate = vi.fn().mockReturnValue(true);
    (navigator as unknown as Record<string, unknown>).vibrate = vibrate;

    const result = triggerHaptic("light");

    expect(result).toBe("vibration");
    expect(vibrate).toHaveBeenCalledWith([12]);
  });

  it("TEST A2: selection uses tiny pattern", () => {
    const vibrate = vi.fn().mockReturnValue(true);
    (navigator as unknown as Record<string, unknown>).vibrate = vibrate;

    triggerHaptic("selection");
    expect(vibrate).toHaveBeenCalledWith([8]);
  });

  it("TEST B: iOS Safari (no vibrate) returns unsupported, NO audio, NO exception", () => {
    const vibrate = (navigator as unknown as Record<string, unknown>).vibrate;
    delete (navigator as unknown as Record<string, unknown>).vibrate;

    // Capture any AudioContext construction
    const AudioContextSpy = vi.fn();
    (globalThis as unknown as Record<string, unknown>).AudioContext = AudioContextSpy;
    (globalThis as unknown as Record<string, unknown>).webkitAudioContext = AudioContextSpy;

    // Capture any Audio construction
    const AudioSpy = vi.fn();
    (globalThis as unknown as Record<string, unknown>).Audio = AudioSpy;

    let result: string | undefined;
    expect(() => {
      result = triggerHaptic("light");
    }).not.toThrow();

    expect(result).toBe("unsupported");
    expect(AudioContextSpy).not.toHaveBeenCalled();
    expect(AudioSpy).not.toHaveBeenCalled();

    // Restore
    (navigator as unknown as Record<string, unknown>).vibrate = vibrate;
  });

  it("TEST B2: all intents return unsupported on iOS without throwing", () => {
    delete (navigator as unknown as Record<string, unknown>).vibrate;

    for (const intent of ["selection", "light", "medium", "success", "warning"] as const) {
      expect(() => triggerHaptic(intent)).not.toThrow();
      expect(triggerHaptic(intent)).toBe("unsupported");
    }
  });

  it("TEST C: native bridge wins over navigator.vibrate", () => {
    const vibrate = vi.fn().mockReturnValue(true);
    (navigator as unknown as Record<string, unknown>).vibrate = vibrate;
    const bridgeTrigger = vi.fn();
    registerNativeHapticBridge({ trigger: bridgeTrigger });

    const result = triggerHaptic("medium");

    expect(result).toBe("native-bridge");
    expect(bridgeTrigger).toHaveBeenCalledWith("medium");
    expect(vibrate).not.toHaveBeenCalled();
  });

  it("TEST C2: native bridge error falls through to vibration", () => {
    const vibrate = vi.fn().mockReturnValue(true);
    (navigator as unknown as Record<string, unknown>).vibrate = vibrate;
    registerNativeHapticBridge({
      trigger: () => {
        throw new Error("bridge error");
      },
    });

    const result = triggerHaptic("light");

    expect(result).toBe("vibration");
    expect(vibrate).toHaveBeenCalled();
  });
});
