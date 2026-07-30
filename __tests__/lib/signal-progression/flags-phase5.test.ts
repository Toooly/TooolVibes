import { describe, expect, it } from "vitest";
import { createReleaseFeatureConfig } from "@/lib/config/release-features";
import {
  canReadSignalProgress,
  canWriteSignalEvents,
} from "@/lib/signal-progression/flags";

describe("phase5 flags default OFF", () => {
  it("defaults block writes and progress UI", () => {
    const config = createReleaseFeatureConfig({});
    expect(canWriteSignalEvents(config)).toBe(false);
    expect(canReadSignalProgress(config)).toBe(false);
  });

  it("enables when backbone + subordinate flags on", () => {
    const config = createReleaseFeatureConfig({
      TOOOLVIBES_GAMIFICATION_ENABLED: "true",
      TOOOLVIBES_REWARD_BACKBONE_ENABLED: "true",
      TOOOLVIBES_SIGNAL_EVENT_WRITES_ENABLED: "true",
      TOOOLVIBES_SIGNAL_PROGRESS_UI_ENABLED: "true",
    });
    expect(canWriteSignalEvents(config)).toBe(true);
    expect(canReadSignalProgress(config)).toBe(true);
  });
});
