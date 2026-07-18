import { describe, expect, it } from "vitest";

import {
  createReleaseFeatureConfig,
  ReleaseFeatureConfigError,
  releaseFeatureRegistry,
} from "@/lib/config/release-features";

describe("compareObjective release flag (B34)", () => {
  it("is registered with owner, env key and a safe enabled default", () => {
    const definition = releaseFeatureRegistry.compareObjective;

    expect(definition.owner.length).toBeGreaterThan(0);
    expect(definition.envKey).toBe("TOOOLVIBES_COMPARE_OBJECTIVE_ENABLED");
    expect(definition.defaultEnabled).toBe(true);
  });

  it("defaults to enabled and resolves explicit boolean overrides", () => {
    expect(createReleaseFeatureConfig().compareObjective.enabled).toBe(true);
    expect(
      createReleaseFeatureConfig({
        TOOOLVIBES_COMPARE_OBJECTIVE_ENABLED: "0",
      }).compareObjective.enabled,
    ).toBe(false);
    expect(
      createReleaseFeatureConfig({
        TOOOLVIBES_COMPARE_OBJECTIVE_ENABLED: "true",
      }).compareObjective.enabled,
    ).toBe(true);
  });

  it("rejects malformed flag values", () => {
    expect(() =>
      createReleaseFeatureConfig({
        TOOOLVIBES_COMPARE_OBJECTIVE_ENABLED: "maybe",
      }),
    ).toThrow(ReleaseFeatureConfigError);
  });
});
