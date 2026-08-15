import { describe, expect, it } from "vitest";

import { applyPlacementOverride } from "@/lib/sponsors/commercial-overrides";
import { ONWEB24_CAMPAIGN, TAYLORA_CAMPAIGN } from "@/lib/sponsors/sponsor-placements";

describe("commercial placement overrides", () => {
  it("keeps auto resolution untouched", () => {
    expect(
      applyPlacementOverride("home-featured-tool", TAYLORA_CAMPAIGN, [TAYLORA_CAMPAIGN], {
        placements: {},
      }),
    ).toBe(TAYLORA_CAMPAIGN);
  });

  it("disables a placement", () => {
    expect(
      applyPlacementOverride("home-featured-tool", TAYLORA_CAMPAIGN, [TAYLORA_CAMPAIGN], {
        placements: { "home-featured-tool": { mode: "off" } },
      }),
    ).toBeNull();
  });

  it("pins an eligible campaign", () => {
    expect(
      applyPlacementOverride(
        "home-featured-tool",
        TAYLORA_CAMPAIGN,
        [TAYLORA_CAMPAIGN, ONWEB24_CAMPAIGN],
        {
          placements: {
            "home-featured-tool": { mode: "pin", campaignId: ONWEB24_CAMPAIGN.id },
          },
        },
      )?.id,
    ).toBe(ONWEB24_CAMPAIGN.id);
  });
});
