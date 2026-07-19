import { describe, expect, it } from "vitest";

import {
  createReleaseFeatureConfig,
  ReleaseFeatureConfigError,
  releaseFeatureRegistry,
} from "@/lib/config/release-features";

describe("compareDecision release flag (B35)", () => {
  it("is registered with owner, env key and a safe enabled default", () => {
    const definition = releaseFeatureRegistry.compareDecision;

    expect(definition.owner.length).toBeGreaterThan(0);
    expect(definition.envKey).toBe("TOOOLVIBES_COMPARE_DECISION_ENABLED");
    expect(definition.defaultEnabled).toBe(true);
  });

  it("defaults to enabled and resolves explicit boolean overrides", () => {
    expect(createReleaseFeatureConfig().compareDecision.enabled).toBe(true);
    expect(
      createReleaseFeatureConfig({
        TOOOLVIBES_COMPARE_DECISION_ENABLED: "0",
      }).compareDecision.enabled,
    ).toBe(false);
    expect(
      createReleaseFeatureConfig({
        TOOOLVIBES_COMPARE_DECISION_ENABLED: "true",
      }).compareDecision.enabled,
    ).toBe(true);
  });

  it("rejects malformed flag values", () => {
    expect(() =>
      createReleaseFeatureConfig({
        TOOOLVIBES_COMPARE_DECISION_ENABLED: "maybe",
      }),
    ).toThrow(ReleaseFeatureConfigError);
  });
});
