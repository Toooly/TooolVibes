import { describe, expect, it } from "vitest";

import {
  canPresentTier,
  recordPresentation,
  REWARD_PRESENTATION_CAPS,
  type PresentationLogEntry,
} from "@/lib/rewards/caps";

describe("milestone presentation caps", () => {
  it("caps automatic milestone presentations at one per day", () => {
    expect(REWARD_PRESENTATION_CAPS.milestonePerDay).toBe(1);
    const now = Date.now();
    expect(canPresentTier("milestone", [], now)).toBe(true);

    const log: PresentationLogEntry[] = recordPresentation([], {
      grantId: "grant_mst_cap_0001",
      tier: "milestone",
      presentedAtMs: now,
    });
    expect(canPresentTier("milestone", log, now + 60_000)).toBe(false);
    // Next day the cap resets.
    expect(canPresentTier("milestone", log, now + 25 * 60 * 60 * 1000)).toBe(true);
  });

  it("milestone cap is independent from micro and achievement caps", () => {
    const now = Date.now();
    let log: PresentationLogEntry[] = [];
    log = recordPresentation(log, {
      grantId: "grant_mst_cap_0002",
      tier: "milestone",
      presentedAtMs: now,
    });
    expect(canPresentTier("micro", log, now)).toBe(true);
    expect(canPresentTier("achievement", log, now)).toBe(true);
    expect(canPresentTier("milestone", log, now)).toBe(false);
  });
});
