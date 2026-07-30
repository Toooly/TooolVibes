import { vi } from "vitest";
vi.mock("server-only", () => ({}));

import { describe, expect, it } from "vitest";

import { createReleaseFeatureConfig } from "@/lib/config/release-features";
import {
  canDeliverSignalRewards,
  canReadSignalProgressionUi,
  canWriteSignalEvents,
} from "@/lib/signal-progression/flags";

describe("signal progression flags", () => {
  it("defaults to no writes, delivery, or progress UI", () => {
    const config = createReleaseFeatureConfig();
    expect(config.signalEventWrites.enabled).toBe(false);
    expect(config.rewardDelivery.enabled).toBe(false);
    expect(config.signalProgressUi.enabled).toBe(false);
    expect(canWriteSignalEvents(config)).toBe(false);
    expect(canDeliverSignalRewards(config)).toBe(false);
    expect(canReadSignalProgressionUi(config)).toBe(false);
  });

  it("requires backbone for writes", () => {
    const config = createReleaseFeatureConfig({
      TOOOLVIBES_GAMIFICATION_ENABLED: "1",
      TOOOLVIBES_REWARD_BACKBONE_ENABLED: "1",
      TOOOLVIBES_SIGNAL_EVENT_WRITES_ENABLED: "1",
    });
    expect(canWriteSignalEvents(config)).toBe(true);
  });

  it("requires runtime + delivery + backbone for delivery", () => {
    const config = createReleaseFeatureConfig({
      TOOOLVIBES_GAMIFICATION_ENABLED: "1",
      TOOOLVIBES_REWARD_BACKBONE_ENABLED: "1",
      TOOOLVIBES_REWARD_RUNTIME_ENABLED: "1",
      TOOOLVIBES_REWARD_DELIVERY_ENABLED: "1",
    });
    expect(canDeliverSignalRewards(config)).toBe(true);
  });

  it("requires backbone + progress UI for hub read", () => {
    const config = createReleaseFeatureConfig({
      TOOOLVIBES_GAMIFICATION_ENABLED: "1",
      TOOOLVIBES_REWARD_BACKBONE_ENABLED: "1",
      TOOOLVIBES_SIGNAL_PROGRESS_UI_ENABLED: "1",
    });
    expect(canReadSignalProgressionUi(config)).toBe(true);
  });
});
