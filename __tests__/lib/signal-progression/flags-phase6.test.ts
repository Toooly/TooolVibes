import { vi } from "vitest";
vi.mock("server-only", () => ({}));

import { describe, expect, it } from "vitest";
import { createReleaseFeatureConfig } from "@/lib/config/release-features";
import {
  canEvaluateSignalAchievements,
  canPresentRewardMilestones,
  canReadSignalBadgeCabinet,
} from "@/lib/signal-progression/flags";
import { buildSignalClientFlagSnapshot } from "@/lib/signal-progression/client-flags";

const ALL_ON = {
  TOOOLVIBES_GAMIFICATION_ENABLED: "true",
  TOOOLVIBES_REWARD_BACKBONE_ENABLED: "true",
  TOOOLVIBES_REWARD_RUNTIME_ENABLED: "true",
  TOOOLVIBES_SIGNAL_PROGRESS_UI_ENABLED: "true",
  TOOOLVIBES_SIGNAL_ACHIEVEMENTS_ENABLED: "true",
  TOOOLVIBES_SIGNAL_BADGE_CABINET_ENABLED: "true",
  TOOOLVIBES_REWARD_MILESTONES_ENABLED: "true",
} as const;

describe("phase6 flags default OFF", () => {
  it("defaults block achievements, cabinet and milestones independently", () => {
    const config = createReleaseFeatureConfig({});
    expect(canEvaluateSignalAchievements(config)).toBe(false);
    expect(canReadSignalBadgeCabinet(config)).toBe(false);
    expect(canPresentRewardMilestones(config)).toBe(false);
  });

  it("enables each system only with backbone + its own flag", () => {
    const config = createReleaseFeatureConfig(ALL_ON);
    expect(canEvaluateSignalAchievements(config)).toBe(true);
    expect(canReadSignalBadgeCabinet(config)).toBe(true);
    expect(canPresentRewardMilestones(config)).toBe(true);
  });

  it("achievements flag alone is not enough without backbone", () => {
    const config = createReleaseFeatureConfig({
      TOOOLVIBES_SIGNAL_ACHIEVEMENTS_ENABLED: "true",
    });
    expect(canEvaluateSignalAchievements(config)).toBe(false);
  });

  it("cabinet requires progress UI too (independent from achievements flag)", () => {
    const config = createReleaseFeatureConfig({
      ...ALL_ON,
      TOOOLVIBES_SIGNAL_PROGRESS_UI_ENABLED: "false",
    });
    expect(canEvaluateSignalAchievements(config)).toBe(true);
    expect(canReadSignalBadgeCabinet(config)).toBe(false);
  });

  it("milestones require runtime and their own flag", () => {
    const noMilestones = createReleaseFeatureConfig({
      ...ALL_ON,
      TOOOLVIBES_REWARD_MILESTONES_ENABLED: "false",
    });
    expect(canPresentRewardMilestones(noMilestones)).toBe(false);

    const noRuntime = createReleaseFeatureConfig({
      ...ALL_ON,
      TOOOLVIBES_REWARD_RUNTIME_ENABLED: "false",
    });
    expect(canPresentRewardMilestones(noRuntime)).toBe(false);
  });

  it("gamification kill switch disables all phase6 gates", () => {
    const config = createReleaseFeatureConfig({
      ...ALL_ON,
      TOOOLVIBES_GAMIFICATION_ENABLED: "false",
    });
    expect(canEvaluateSignalAchievements(config)).toBe(false);
    expect(canReadSignalBadgeCabinet(config)).toBe(false);
    expect(canPresentRewardMilestones(config)).toBe(false);
  });
});

describe("phase6 client flag snapshot", () => {
  const base = {
    gamificationEnabled: true,
    rewardBackboneEnabled: true,
    signalEventWritesEnabled: true,
    signalProgressUiEnabled: true,
    rewardDeliveryEnabled: true,
    rewardRuntimeEnabled: true,
    signalAchievementsEnabled: true,
    signalBadgeCabinetEnabled: true,
    rewardMilestonesEnabled: true,
  };

  it("maps all phase6 flags when everything is on", () => {
    const snap = buildSignalClientFlagSnapshot(base);
    expect(snap.achievementsEnabled).toBe(true);
    expect(snap.badgeCabinetEnabled).toBe(true);
    expect(snap.milestonesEnabled).toBe(true);
  });

  it("cabinet follows progress UI even when its own flag is on", () => {
    const snap = buildSignalClientFlagSnapshot({
      ...base,
      signalProgressUiEnabled: false,
    });
    expect(snap.badgeCabinetEnabled).toBe(false);
    expect(snap.achievementsEnabled).toBe(true);
  });

  it("milestones follow runtime even when their own flag is on", () => {
    const snap = buildSignalClientFlagSnapshot({
      ...base,
      rewardRuntimeEnabled: false,
    });
    expect(snap.milestonesEnabled).toBe(false);
  });

  it("backbone off disables every phase6 client gate", () => {
    const snap = buildSignalClientFlagSnapshot({
      ...base,
      rewardBackboneEnabled: false,
    });
    expect(snap.achievementsEnabled).toBe(false);
    expect(snap.badgeCabinetEnabled).toBe(false);
    expect(snap.milestonesEnabled).toBe(false);
  });
});
