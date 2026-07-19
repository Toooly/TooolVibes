import { describe, expect, it } from "vitest";

import {
  createReleaseFeatureConfig,
  ReleaseFeatureConfigError,
  releaseFeatureRegistry,
} from "@/lib/config/release-features";

describe("unifiedSearch release flag (B31)", () => {
  it("is registered with owner, env key and a safe enabled default", () => {
    const definition = releaseFeatureRegistry.unifiedSearch;

    expect(definition.owner.length).toBeGreaterThan(0);
    expect(definition.envKey).toBe("TOOOLVIBES_UNIFIED_SEARCH_ENABLED");
    expect(definition.defaultEnabled).toBe(true);
  });

  it("defaults to enabled and resolves explicit boolean overrides", () => {
    expect(createReleaseFeatureConfig().unifiedSearch.enabled).toBe(true);
    expect(
      createReleaseFeatureConfig({
        TOOOLVIBES_UNIFIED_SEARCH_ENABLED: "0",
      }).unifiedSearch.enabled,
    ).toBe(false);
    expect(
      createReleaseFeatureConfig({
        TOOOLVIBES_UNIFIED_SEARCH_ENABLED: "true",
      }).unifiedSearch.enabled,
    ).toBe(true);
  });

  it("rejects malformed flag values", () => {
    expect(() =>
      createReleaseFeatureConfig({
        TOOOLVIBES_UNIFIED_SEARCH_ENABLED: "maybe",
      }),
    ).toThrow(ReleaseFeatureConfigError);
  });
});
