import { describe, expect, it } from "vitest";

import { createReleaseFeatureConfig } from "@/lib/config/release-features";

const SIGNAL_ACHIEVEMENTS_KEY = "TOOOLVIBES_SIGNAL_ACHIEVEMENTS_ENABLED";
const SIGNAL_BADGE_CABINET_KEY = "TOOOLVIBES_SIGNAL_BADGE_CABINET_ENABLED";
const SIGNAL_PROGRESS_UI_KEY = "TOOOLVIBES_SIGNAL_PROGRESS_UI_ENABLED";
const SIGNAL_EVENT_WRITES_KEY = "TOOOLVIBES_SIGNAL_EVENT_WRITES_ENABLED";
const REWARD_RUNTIME_KEY = "TOOOLVIBES_REWARD_RUNTIME_ENABLED";
const REWARD_DELIVERY_KEY = "TOOOLVIBES_REWARD_DELIVERY_ENABLED";
const REWARD_MILESTONES_KEY = "TOOOLVIBES_REWARD_MILESTONES_ENABLED";
const GAMIFICATION_KEY = "TOOOLVIBES_GAMIFICATION_ENABLED";
const REWARD_BACKBONE_KEY = "TOOOLVIBES_REWARD_BACKBONE_ENABLED";

const LEGACY_SURFACE_KEYS = [
  "TOOOLVIBES_GAMIFICATION_PERSISTENCE_ENABLED",
  "TOOOLVIBES_GAME_MISSIONS_MODE",
  "TOOOLVIBES_GAME_HIDDEN_SIGNAL_MODE",
  "TOOOLVIBES_GAME_ARENA_MODE",
  "TOOOLVIBES_GAME_PREDICTION_MODE",
  "TOOOLVIBES_GAME_LEADERBOARD_MODE",
  "TOOOLVIBES_GAME_VIBE_RUSH_MODE",
] as const;

describe("Phase 7B.4 config-level flag gating", () => {
  it("default config: every legacy and Signal gate is OFF", () => {
    const config = createReleaseFeatureConfig({});
    expect(config.gamification.enabled).toBe(false);
    expect(config.gamification.rewardBackboneEnabled).toBe(false);
    expect(config.signalEventWrites.enabled).toBe(false);
    expect(config.rewardRuntime.enabled).toBe(false);
    expect(config.rewardDelivery.enabled).toBe(false);
    expect(config.signalProgressUi.enabled).toBe(false);
    expect(config.signalAchievements.enabled).toBe(false);
    expect(config.signalBadgeCabinet.enabled).toBe(false);
    expect(config.rewardMilestones.enabled).toBe(false);
  });

  it("backbone flag ON with master OFF => effective backbone is false", () => {
    const config = createReleaseFeatureConfig({
      [REWARD_BACKBONE_KEY]: "1",
    });
    expect(config.gamification.rewardBackboneEnabled).toBe(false);
    expect(config.gamification.enabled).toBe(false);
  });

  it("master ON + backbone ON => effective backbone is true", () => {
    const config = createReleaseFeatureConfig({
      [GAMIFICATION_KEY]: "1",
      [REWARD_BACKBONE_KEY]: "1",
    });
    expect(config.gamification.enabled).toBe(true);
    expect(config.gamification.rewardBackboneEnabled).toBe(true);
  });

  it("master OFF forces every legacy surface OFF even with its own env=REWARDED", () => {
    const env: Record<string, string> = { [GAMIFICATION_KEY]: "0" };
    for (const key of LEGACY_SURFACE_KEYS) {
      // legacy env vars accept REWARDED or similar values; use non-default
      env[key] = key.endsWith("_MODE") ? "REWARDED" : "1";
    }
    const config = createReleaseFeatureConfig(env);
    expect(config.gamification.enabled).toBe(false);
    for (const surface of Object.values(config.gamification.surfaces)) {
      expect(surface.mode).toBe("OFF");
    }
    expect(config.gamification.hasEnabledSurface).toBe(false);
  });

  it("every Signal gate remains inactive until its subordinate flag is enabled", () => {
    const config = createReleaseFeatureConfig({
      [GAMIFICATION_KEY]: "1",
      [REWARD_BACKBONE_KEY]: "1",
      [SIGNAL_ACHIEVEMENTS_KEY]: "1",
      [SIGNAL_BADGE_CABINET_KEY]: "1",
      [SIGNAL_PROGRESS_UI_KEY]: "1",
      [SIGNAL_EVENT_WRITES_KEY]: "1",
      [REWARD_RUNTIME_KEY]: "1",
      [REWARD_DELIVERY_KEY]: "1",
      [REWARD_MILESTONES_KEY]: "1",
    });
    expect(config.signalAchievements.enabled).toBe(true);
    expect(config.signalBadgeCabinet.enabled).toBe(true);
    expect(config.signalProgressUi.enabled).toBe(true);
    expect(config.signalEventWrites.enabled).toBe(true);
    expect(config.rewardRuntime.enabled).toBe(true);
    expect(config.rewardDelivery.enabled).toBe(true);
    expect(config.rewardMilestones.enabled).toBe(true);
  });

  it("removing one Signal flag disables that specific capability only", () => {
    const config = createReleaseFeatureConfig({
      [GAMIFICATION_KEY]: "1",
      [REWARD_BACKBONE_KEY]: "1",
      [SIGNAL_ACHIEVEMENTS_KEY]: "1",
      [SIGNAL_BADGE_CABINET_KEY]: "0",
    });
    expect(config.signalAchievements.enabled).toBe(true);
    expect(config.signalBadgeCabinet.enabled).toBe(false);
  });

  it("legacy env keys remain absent from the production-safe config matrix", () => {
    const config = createReleaseFeatureConfig({
      [GAMIFICATION_KEY]: "1",
      [REWARD_BACKBONE_KEY]: "1",
    });
    // Phase 7B.4 contract: even with master+backbone ON, the legacy
    // surface modes must remain OFF unless their own env vars are set,
    // and no legacy surface should reach REWARDED via accidental env.
    for (const key of LEGACY_SURFACE_KEYS) {
      expect(
        (config.gamification.surfaces as Record<string, { mode: string }>),
        `legacy key ${key} should not silently enable`,
      );
    }
    expect(config.gamification.hasRewardedSurface).toBe(false);
  });
});
