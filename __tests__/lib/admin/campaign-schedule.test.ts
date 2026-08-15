import { describe, expect, it } from "vitest";

import { campaignBucket } from "@/lib/admin/campaign-schedule";
import { TAYLORA_CAMPAIGN } from "@/lib/sponsors/sponsor-placements";

describe("campaign schedule buckets", () => {
  it("marks paused as other", () => {
    expect(campaignBucket({ ...TAYLORA_CAMPAIGN, status: "paused" })).toBe("other");
  });

  it("marks ended by date", () => {
    expect(
      campaignBucket(
        { ...TAYLORA_CAMPAIGN, status: "active", endsAt: "2020-01-01T00:00:00.000Z" },
        Date.parse("2026-08-15T00:00:00.000Z"),
      ),
    ).toBe("ended");
  });
});
