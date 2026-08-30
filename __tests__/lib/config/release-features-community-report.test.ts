import { describe, expect, it } from "vitest";

import {
  createReleaseFeatureConfig,
  releaseFeatureRegistry,
} from "@/lib/config/release-features";

describe("communityReport release flag", () => {
  it("H6-FLAG-01 defaults off", () => {
    expect(releaseFeatureRegistry.communityReport.defaultEnabled).toBe(false);
    expect(releaseFeatureRegistry.communityReport.envKey).toBe(
      "TOOOLVIBES_COMMUNITY_REPORT_ENABLED",
    );
  });

  it("H6-FLAG-06 report flag does not enable read or write", () => {
    const config = createReleaseFeatureConfig({
      TOOOLVIBES_COMMUNITY_REPORT_ENABLED: "1",
    });
    expect(config.communityReport.enabled).toBe(true);
    expect(config.communityRead.enabled).toBe(false);
    expect(config.communityWrite.enabled).toBe(false);
  });
});
