import { describe, expect, it } from "vitest";

import {
  createReleaseFeatureConfig,
  ReleaseFeatureConfigError,
  releaseFeatureRegistry,
} from "@/lib/config/release-features";

describe("communityRead release flag", () => {
  it("H4-FLAG defaults off", () => {
    const definition = releaseFeatureRegistry.communityRead;
    expect(definition.envKey).toBe("TOOOLVIBES_COMMUNITY_READ_ENABLED");
    expect(definition.defaultEnabled).toBe(false);
    expect(createReleaseFeatureConfig().communityRead.enabled).toBe(false);
  });

  it("resolves explicit overrides", () => {
    expect(
      createReleaseFeatureConfig({
        TOOOLVIBES_COMMUNITY_READ_ENABLED: "1",
      }).communityRead.enabled,
    ).toBe(true);
    expect(
      createReleaseFeatureConfig({
        TOOOLVIBES_COMMUNITY_READ_ENABLED: "0",
      }).communityRead.enabled,
    ).toBe(false);
  });

  it("rejects malformed values", () => {
    expect(() =>
      createReleaseFeatureConfig({
        TOOOLVIBES_COMMUNITY_READ_ENABLED: "maybe",
      }),
    ).toThrow(ReleaseFeatureConfigError);
  });
});
