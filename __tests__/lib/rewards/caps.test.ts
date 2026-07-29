import { describe, expect, it } from "vitest";

import {
  REWARD_PRESENTATION_CAPS,
  canPresentTier,
  recordPresentation,
  type PresentationLogEntry,
} from "@/lib/rewards/caps";

describe("presentation caps", () => {
  it("limits micro presentations per hour", () => {
    const now = Date.now();
    let log: PresentationLogEntry[] = [];
    for (let i = 0; i < REWARD_PRESENTATION_CAPS.microPerHour; i += 1) {
      expect(canPresentTier("micro", log, now)).toBe(true);
      log = recordPresentation(log, {
        grantId: `g${i}`,
        tier: "micro",
        presentedAtMs: now - i * 1000,
      });
    }
    expect(canPresentTier("micro", log, now)).toBe(false);
  });

  it("limits achievement presentations per day", () => {
    const now = Date.now();
    let log: PresentationLogEntry[] = [];
    for (let i = 0; i < REWARD_PRESENTATION_CAPS.achievementPerDay; i += 1) {
      expect(canPresentTier("achievement", log, now)).toBe(true);
      log = recordPresentation(log, {
        grantId: `a${i}`,
        tier: "achievement",
        presentedAtMs: now - i * 1000,
      });
    }
    expect(canPresentTier("achievement", log, now)).toBe(false);
  });
});
