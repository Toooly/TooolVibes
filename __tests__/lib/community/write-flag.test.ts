import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/config/release-features", () => ({
  releaseFeatures: {
    communityRead: { enabled: true },
    communityWrite: { enabled: true },
  },
}));

vi.mock("@/lib/community/read-flag", () => ({
  isCommunityReadEnabled: () => true,
}));

import { isCommunityWriteUiEnabled } from "@/lib/community/write-flag";

describe("community write UI flag", () => {
  it("H5-FLAG-03 requires both flags via helper contract", () => {
    expect(isCommunityWriteUiEnabled()).toBe(true);
  });
});
