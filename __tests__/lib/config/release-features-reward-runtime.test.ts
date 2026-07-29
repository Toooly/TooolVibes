import { describe, expect, it } from "vitest";

import {
  createReleaseFeatureConfig,
  ReleaseFeatureConfigError,
  releaseFeatureRegistry,
} from "@/lib/config/release-features";

describe("rewardRuntime release flag", () => {
  it("defaults to OFF and is independent of legacy gamification", () => {
    const config = createReleaseFeatureConfig();
    expect(releaseFeatureRegistry.rewardRuntime.defaultEnabled).toBe(false);
    expect(config.rewardRuntime.enabled).toBe(false);
    expect(config.gamification.enabled).toBe(false);
  });

  it("can enable presentation runtime without reward backbone", () => {
    const config = createReleaseFeatureConfig({
      TOOOLVIBES_REWARD_RUNTIME_ENABLED: "1",
    });
    expect(config.rewardRuntime.enabled).toBe(true);
    expect(config.gamification.rewardBackboneEnabled).toBe(false);
  });

  it("rejects malformed values", () => {
    expect(() =>
      createReleaseFeatureConfig({ TOOOLVIBES_REWARD_RUNTIME_ENABLED: "maybe" }),
    ).toThrow(ReleaseFeatureConfigError);
  });
});
