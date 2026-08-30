import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/config/release-features", () => ({
  releaseFeatures: {
    communityRead: { enabled: true },
    communityWrite: { enabled: false },
    communityReport: { enabled: true },
  },
}));

vi.mock("@/lib/community/read-flag", () => ({
  isCommunityReadEnabled: () => true,
}));

import {
  isCommunityReportFlagEnabled,
  isCommunityReportUiEnabled,
} from "@/lib/community/report-flag";

describe("community report UI flag", () => {
  it("H6-FLAG-04 report UI requires read + report", () => {
    expect(isCommunityReportFlagEnabled()).toBe(true);
    expect(isCommunityReportUiEnabled()).toBe(true);
  });

  it("H6-FLAG-05 write flag stays independent of report UI", () => {
    // write is mocked off while report UI is enabled: reporting does not
    // require communityWrite.
    expect(isCommunityReportUiEnabled()).toBe(true);
  });
});
