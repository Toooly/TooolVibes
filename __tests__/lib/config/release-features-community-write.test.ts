import { describe, expect, it } from "vitest";

import {
  createReleaseFeatureConfig,
  releaseFeatureRegistry,
} from "@/lib/config/release-features";

describe("communityWrite release flag", () => {
  it("H5-FLAG defaults off and does not enable read", () => {
    expect(releaseFeatureRegistry.communityWrite.defaultEnabled).toBe(false);
    expect(releaseFeatureRegistry.communityWrite.envKey).toBe("TOOOLVIBES_COMMUNITY_WRITE_ENABLED");
    const config = createReleaseFeatureConfig({
      TOOOLVIBES_COMMUNITY_WRITE_ENABLED: "1",
    });
    expect(config.communityWrite.enabled).toBe(true);
    expect(config.communityRead.enabled).toBe(false);
  });
});
