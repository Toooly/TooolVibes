/**
 * Tests for the TooolVibes sponsor registry.
 *
 * Covers the canonical SponsorCampaign type, the TAYLORA_CAMPAIGN singleton
 * (the first and currently only registered first-party sponsor), the
 * deterministic resolver functions and the legacy monetization-key mapping.
 */

import { describe, expect, it } from "vitest";

import {
  ALL_SPONSOR_CAMPAIGNS,
  getActiveCampaignForPlacement,
  getActiveCampaigns,
  isCampaignActive,
  SPONSOR_TO_MONETIZATION_KEY,
  TAYLORA_CAMPAIGN,
  type SponsorCampaign,
  type SponsorPlacementId,
} from "@/lib/sponsors/sponsor-placements";

describe("TAYLORA_CAMPAIGN", () => {
  it("is defined with the expected canonical fields", () => {
    expect(TAYLORA_CAMPAIGN).toBeDefined();
    expect(TAYLORA_CAMPAIGN.id).toBe("taylora-v1-2026");
    expect(TAYLORA_CAMPAIGN.sponsorId).toBe("taylora");
    expect(TAYLORA_CAMPAIGN.toolSlug).toBe("taylora");
    expect(TAYLORA_CAMPAIGN.name).toBe("Taylora");
    expect(TAYLORA_CAMPAIGN.disclosure).toBe("Partner di TooolVibes");
    expect(TAYLORA_CAMPAIGN.destinationUrl).toBe(
      "https://discover.taylora.com/it/",
    );
    expect(TAYLORA_CAMPAIGN.status).toBe("active");
    expect(TAYLORA_CAMPAIGN.placements).toEqual([
      "home-partner-spotlight",
      "archive-sponsored-tool",
    ]);
    expect(TAYLORA_CAMPAIGN.utmCampaign).toBe("taylora");
    expect(TAYLORA_CAMPAIGN.creativeVariant).toBe("taylora-flow");
    expect(TAYLORA_CAMPAIGN.creativeTheme?.monogram).toBe("T");
  });
});

describe("isCampaignActive", () => {
  const base: SponsorCampaign = {
    ...TAYLORA_CAMPAIGN,
    id: "qa-base",
  };

  it("returns true when status is active and within the date window", () => {
    expect(isCampaignActive(base)).toBe(true);
  });

  it("returns false when status is draft", () => {
    expect(isCampaignActive({ ...base, status: "draft" })).toBe(false);
  });

  it("returns false when status is scheduled", () => {
    expect(isCampaignActive({ ...base, status: "scheduled" })).toBe(false);
  });

  it("returns false when status is paused", () => {
    expect(isCampaignActive({ ...base, status: "paused" })).toBe(false);
  });

  it("returns false when status is completed", () => {
    expect(isCampaignActive({ ...base, status: "completed" })).toBe(false);
  });

  it("returns false when startsAt is in the future", () => {
    const future = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
      .toISOString()
      .slice(0, 10);
    expect(isCampaignActive({ ...base, startsAt: future })).toBe(false);
  });

  it("returns false when endsAt is in the past", () => {
    const past = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7)
      .toISOString()
      .slice(0, 10);
    expect(isCampaignActive({ ...base, endsAt: past })).toBe(false);
  });

  it("returns true when both startsAt and endsAt are absent", () => {
    const campaign: SponsorCampaign = {
      ...base,
      id: "qa-open",
      startsAt: undefined,
      endsAt: undefined,
    };
    expect(isCampaignActive(campaign)).toBe(true);
  });
});

describe("getActiveCampaignForPlacement", () => {
  it("returns Taylora for home-partner-spotlight", () => {
    const result = getActiveCampaignForPlacement("home-partner-spotlight");
    expect(result).not.toBeNull();
    expect(result?.id).toBe(TAYLORA_CAMPAIGN.id);
    expect(result?.sponsorId).toBe("taylora");
  });

  it("returns Taylora for archive-sponsored-tool", () => {
    const result = getActiveCampaignForPlacement("archive-sponsored-tool");
    expect(result).not.toBeNull();
    expect(result?.id).toBe(TAYLORA_CAMPAIGN.id);
  });

  it("returns null when no campaign targets the placement", () => {
    const result = getActiveCampaignForPlacement("article-partner");
    expect(result).toBeNull();
  });

  it("returns null for placements Taylora does not cover", () => {
    const unassigned: SponsorPlacementId[] = [
      "tool-detail-partner",
      "collections-partner",
    ];
    for (const placementId of unassigned) {
      expect(getActiveCampaignForPlacement(placementId)).toBeNull();
    }
  });
});

describe("getActiveCampaigns", () => {
  it("returns the active partner campaigns from the default registry", () => {
    /* Commercial inventory finalization: Taylora, OnWeb24 and ZapLater are
       the active direct partners (equal rotation weight). */
    const campaigns = getActiveCampaigns();
    expect(campaigns.map((c) => c.sponsorId).sort()).toEqual([
      "onweb24",
      "taylora",
      "zaplater",
    ]);
    expect(campaigns[0]?.id).toBe(TAYLORA_CAMPAIGN.id);
  });

  it("accepts an explicit campaign list", () => {
    expect(getActiveCampaigns([])).toEqual([]);
    expect(getActiveCampaigns([TAYLORA_CAMPAIGN])).toHaveLength(1);
    expect(
      getActiveCampaigns([
        { ...TAYLORA_CAMPAIGN, id: "paused-copy", status: "paused" },
      ]),
    ).toEqual([]);
  });
});

describe("SPONSOR_TO_MONETIZATION_KEY", () => {
  it("maps the canonical Taylora placements to the legacy placement keys", () => {
    expect(SPONSOR_TO_MONETIZATION_KEY["home-partner-spotlight"]).toBe(
      "home-featured-tool",
    );
    expect(SPONSOR_TO_MONETIZATION_KEY["archive-sponsored-tool"]).toBe(
      "catalog-native-sponsor",
    );
    expect(SPONSOR_TO_MONETIZATION_KEY["tool-detail-partner"]).toBe(
      "tool-sponsored-alternative",
    );
  });

  it("maps every known placement id to a non-empty string", () => {
    const ids = Object.keys(SPONSOR_TO_MONETIZATION_KEY);
    expect(ids.length).toBeGreaterThanOrEqual(5);

    for (const id of ids) {
      const value = SPONSOR_TO_MONETIZATION_KEY[
        id as keyof typeof SPONSOR_TO_MONETIZATION_KEY
      ];
      expect(typeof value).toBe("string");
      expect(value.length).toBeGreaterThan(0);
    }
  });
});

describe("ALL_SPONSOR_CAMPAIGNS", () => {
  it("contains no duplicate campaign ids", () => {
    const ids = ALL_SPONSOR_CAMPAIGNS.map((c) => c.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it("includes Taylora in the default registry", () => {
    expect(ALL_SPONSOR_CAMPAIGNS).toContain(TAYLORA_CAMPAIGN);
  });
});

describe("deterministic resolution", () => {
  it("returns the same campaign for the same placement on repeated calls", () => {
    const first = getActiveCampaignForPlacement("home-partner-spotlight");
    const second = getActiveCampaignForPlacement("home-partner-spotlight");
    expect(first).toEqual(second);
    expect(first?.id).toBe(second?.id);
  });

  it("returns the same campaign list on repeated global lookups", () => {
    const first = getActiveCampaigns();
    const second = getActiveCampaigns();
    expect(first).toEqual(second);
    expect(first.map((c) => c.id)).toEqual(second.map((c) => c.id));
  });
});
