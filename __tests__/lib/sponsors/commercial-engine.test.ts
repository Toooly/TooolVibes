import { describe, expect, it } from "vitest";

import {
  applyCampaignOverride,
  applyPlacementOverride,
  getManagedCampaigns,
  type CommercialOverrides,
} from "@/lib/sponsors/commercial-overrides";
import { resolvePartnerCampaign } from "@/lib/sponsors/partner-resolver";
import {
  ONWEB24_CAMPAIGN,
  TAYLORA_CAMPAIGN,
  ZAPLATER_CAMPAIGN,
  type SponsorCampaign,
} from "@/lib/sponsors/sponsor-placements";

const NOW = new Date("2026-08-07T12:00:00.000Z");

const qa = {
  a: { ...TAYLORA_CAMPAIGN, id: "qa-a", sponsorId: "qa-a", status: "active" as const, priority: 10, rotationWeight: 1 },
  b: { ...ONWEB24_CAMPAIGN, id: "qa-b", sponsorId: "qa-b", status: "active" as const, priority: 10, rotationWeight: 4 },
  paused: { ...ZAPLATER_CAMPAIGN, id: "qa-paused", status: "paused" as const, priority: 99 },
  expired: {
    ...TAYLORA_CAMPAIGN,
    id: "qa-expired",
    status: "active" as const,
    startsAt: "2026-01-01T00:00:00.000Z",
    endsAt: "2026-01-31T00:00:00.000Z",
  },
  scheduled: {
    ...ONWEB24_CAMPAIGN,
    id: "qa-scheduled",
    status: "active" as const,
    startsAt: "2026-12-01T00:00:00.000Z",
  },
} satisfies Record<string, SponsorCampaign>;

function resolve(
  campaigns: SponsorCampaign[],
  overrides: CommercialOverrides,
  extra: Partial<Parameters<typeof resolvePartnerCampaign>[0]> = {},
) {
  return resolvePartnerCampaign(
    {
      placementKey: "home-featured-tool",
      route: "home",
      strategy: "rotation",
      rotationOffset: 0,
      now: NOW,
      ...extra,
    },
    { campaigns, overrides },
  );
}

describe("commercial engine", () => {
  it("AUTO keeps a deterministic pick across rerenders", () => {
    const campaigns = [qa.a, qa.b];
    const overrides: CommercialOverrides = { placements: {} };
    const first = resolve(campaigns, overrides);
    const second = resolve(campaigns, overrides);
    expect(first?.id).toBe(second?.id);
    expect(first?.id).toBeTruthy();
  });

  it("PIN selects the requested campaign", () => {
    const resolved = resolve([qa.a, qa.b], {
      placements: { "home-featured-tool": { mode: "pin", campaignId: "qa-b" } },
    });
    expect(resolved?.id).toBe("qa-b");
  });

  it("OFF hides the placement", () => {
    expect(
      resolve([qa.a, qa.b], {
        placements: { "home-featured-tool": { mode: "off" } },
      }),
    ).toBeNull();
  });

  it("higher priority wins over weight", () => {
    const resolved = resolve(
      [
        { ...qa.a, priority: 1, rotationWeight: 99 },
        { ...qa.b, priority: 50, rotationWeight: 1 },
      ],
      { placements: {} },
    );
    expect(resolved?.id).toBe("qa-b");
  });

  it("ignores paused, expired and future campaigns", () => {
    const resolved = resolve([qa.paused, qa.expired, qa.scheduled, qa.a], { placements: {} });
    expect(resolved?.id).toBe("qa-a");
  });

  it("contextual mismatch returns null instead of a random partner", () => {
    const resolved = resolvePartnerCampaign(
      {
        placementKey: "tool-sponsored-alternative",
        route: "tool-detail",
        strategy: "contextual",
        toolSlug: "unrelated",
        tags: ["accounting"],
        text: "contabilita",
        now: NOW,
      },
      {
        campaigns: [{ ...qa.a, categoryTags: ["video"], contextTags: ["youtube"] }],
        overrides: { placements: {} },
      },
    );
    expect(resolved).toBeNull();
  });

  it("self-sponsorship does not render on its own tool page", () => {
    const resolved = resolvePartnerCampaign(
      {
        placementKey: "tool-sponsored-alternative",
        route: "tool-detail",
        strategy: "rotation",
        toolSlug: qa.a.toolSlug,
        now: NOW,
      },
      { campaigns: [qa.a], overrides: { placements: {} } },
    );
    expect(resolved).toBeNull();
  });

  it("campaign overlay can pause a registry campaign", () => {
    const merged = applyCampaignOverride(TAYLORA_CAMPAIGN, { status: "paused" });
    expect(merged.status).toBe("paused");
    expect(
      resolve([merged], { placements: {} }),
    ).toBeNull();
  });

  it("managed campaigns merge overlay copy", () => {
    const [merged] = getManagedCampaigns(
      {
        placements: {},
        campaigns: { [TAYLORA_CAMPAIGN.id]: { headline: "QA headline" } },
      },
      [TAYLORA_CAMPAIGN],
    );
    expect(merged.headline).toBe("QA headline");
    expect(merged.sponsorId).toBe(TAYLORA_CAMPAIGN.sponsorId);
  });

  it("applyPlacementOverride pin/off stay isolated from TinyAdz keys", () => {
    expect(
      applyPlacementOverride("tinyadz-home", TAYLORA_CAMPAIGN, [TAYLORA_CAMPAIGN], {
        placements: { "home-featured-tool": { mode: "off" } },
      }),
    ).toBe(TAYLORA_CAMPAIGN);
  });
});
