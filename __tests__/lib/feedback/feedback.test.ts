import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  feedback,
  registerNativeFeedbackBridge,
  clearNativeFeedbackBridge,
} from "@/lib/feedback";

describe("canonical feedback service", () => {
  beforeEach(() => {
    clearNativeFeedbackBridge();
    vi.restoreAllMocks();
  });

  it("routes to web vibration with centralized patterns", () => {
    const vibrate = vi.fn().mockReturnValue(true);
    vi.stubGlobal("navigator", { vibrate });
    expect(feedback.light()).toBe("vibration");
    expect(vibrate).toHaveBeenCalledWith([12]);
    expect(feedback.error()).toBe("vibration");
    expect(vibrate).toHaveBeenCalledWith([25, 40, 25]);
  });

  it("unsupported platform: silent no-op, no audio, no throw", () => {
    vi.stubGlobal("navigator", {});
    const AudioSpy = vi.fn();
    vi.stubGlobal("AudioContext", AudioSpy);
    for (const intent of ["selection", "light", "medium", "success", "warning", "error"] as const) {
      expect(() => feedback[intent]()).not.toThrow();
      expect(feedback[intent]()).toBe("unsupported");
    }
    expect(AudioSpy).not.toHaveBeenCalled();
  });

  it("native bridge wins and maps all intents", () => {
    const seen: string[] = [];
    registerNativeFeedbackBridge({ feedback: (intent) => void seen.push(intent) });
    for (const intent of ["selection", "light", "medium", "success", "warning", "error"] as const) {
      expect(feedback[intent]()).toBe("native");
    }
    expect(seen).toEqual(["selection", "light", "medium", "success", "warning", "error"]);
  });

  it("bridge error falls through to vibration", () => {
    const vibrate = vi.fn().mockReturnValue(true);
    vi.stubGlobal("navigator", { vibrate });
    registerNativeFeedbackBridge({
      feedback: () => {
        throw new Error("bridge down");
      },
    });
    expect(feedback.light()).toBe("vibration");
  });

  it("vibrate returning false falls through to unsupported", () => {
    vi.stubGlobal("navigator", { vibrate: vi.fn().mockReturnValue(false) });
    expect(feedback.light()).toBe("unsupported");
  });
});
