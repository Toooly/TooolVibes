import { describe, expect, it } from "vitest";

import {
  DEFAULT_REWARD_PREFERENCES,
  parseRewardPreferences,
} from "@/lib/rewards/preferences";

describe("reward preferences — Phase 6 suppressMajorCelebrations", () => {
  it("defaults suppressMajorCelebrations to false", () => {
    expect(DEFAULT_REWARD_PREFERENCES.suppressMajorCelebrations).toBe(false);
  });

  it("parses legacy stored preferences without the new field", () => {
    const parsed = parseRewardPreferences({
      version: 1,
      reduceRewardAnimations: true,
      muteRewardSounds: false,
      suppressAutomaticAchievements: false,
      quietMode: true,
    });
    expect(parsed.reduceRewardAnimations).toBe(true);
    expect(parsed.quietMode).toBe(true);
    expect(parsed.suppressMajorCelebrations).toBe(false);
  });

  it("round-trips the new preference when present", () => {
    const parsed = parseRewardPreferences({
      version: 1,
      reduceRewardAnimations: false,
      muteRewardSounds: true,
      suppressAutomaticAchievements: false,
      quietMode: false,
      suppressMajorCelebrations: true,
    });
    expect(parsed.suppressMajorCelebrations).toBe(true);
    expect(parsed.muteRewardSounds).toBe(true);
  });

  it("rejects malformed payloads back to defaults", () => {
    const parsed = parseRewardPreferences({ version: 2, quietMode: "yes" });
    expect(parsed).toEqual(DEFAULT_REWARD_PREFERENCES);
  });
});
