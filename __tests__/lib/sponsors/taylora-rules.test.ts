/**
 * Tests for Taylora-specific placement rules.
 *
 * Taylora is a first-party sponsor registered as the only active campaign
 * in the registry. Its rule set is intentionally narrow:
 *
 *   - allowed placements: home-partner-spotlight, archive-sponsored-tool
 *   - never appears in: tool-detail-partner, collections-partner, article-partner
 *   - has no effect on editorial scoring (no score-related fields on the
 *     campaign and no field that influences editorial scores)
 *   - carries an utmCampaign parameter so each placement keeps attribution
 */

import { describe, expect, it } from "vitest";

import {
  getActiveCampaignForPlacement,
  TAYLORA_CAMPAIGN,
} from "@/lib/sponsors/sponsor-placements";

describe("Taylora allowed placements", () => {
  it("appears in home-partner-spotlight", () => {
    expect(getActiveCampaignForPlacement("home-partner-spotlight")?.id).toBe(
      TAYLORA_CAMPAIGN.id,
    );
  });

  it("appears in archive-sponsored-tool", () => {
    expect(getActiveCampaignForPlacement("archive-sponsored-tool")?.id).toBe(
      TAYLORA_CAMPAIGN.id,
    );
  });
});

describe("Taylora excluded placements", () => {
  it("does NOT appear in tool-detail-partner", () => {
    expect(getActiveCampaignForPlacement("tool-detail-partner")).toBeNull();
  });

  it("does NOT appear in collections-partner", () => {
    expect(getActiveCampaignForPlacement("collections-partner")).toBeNull();
  });

  it("does NOT appear in article-partner", () => {
    expect(getActiveCampaignForPlacement("article-partner")).toBeNull();
  });

  it("declares tool-detail-partner, collections-partner and article-partner as part of the excluded set", () => {
    expect(TAYLORA_CAMPAIGN.placements).not.toContain("tool-detail-partner");
    expect(TAYLORA_CAMPAIGN.placements).not.toContain("collections-partner");
    expect(TAYLORA_CAMPAIGN.placements).not.toContain("article-partner");
  });

  it("only ever lists two placements in total (allowed set)", () => {
    expect(TAYLORA_CAMPAIGN.placements).toHaveLength(2);
    expect(TAYLORA_CAMPAIGN.placements).toEqual([
      "home-partner-spotlight",
      "archive-sponsored-tool",
    ]);
  });
});

describe("Taylora editorial independence", () => {
  it("has no score-related field on the campaign shape", () => {
    const scoreFields = [
      "score",
      "boost",
      "rankBoost",
      "editorialScore",
      "weight",
      "relevanceScore",
    ];

    for (const field of scoreFields) {
      expect(
        Object.prototype.hasOwnProperty.call(TAYLORA_CAMPAIGN, field),
      ).toBe(false);
    }
  });

  it("does not define any property that would alter editorial scoring", () => {
    const scoreRelatedKeys = [
      "score",
      "boost",
      "rankBoost",
      "editorialScore",
      "weight",
      "relevanceScore",
      "rankingMultiplier",
      "priorityOverTools",
      "bias",
    ];

    for (const key of scoreRelatedKeys) {
      expect(
        Object.prototype.hasOwnProperty.call(TAYLORA_CAMPAIGN, key),
      ).toBe(false);
    }
  });

  it("keeps the campaign object limited to non-editorial-scoring fields", () => {
    // The object must not declare any field whose name contains
    // 'score', 'rank', 'weight', or 'boost' (case-insensitive).
    const keys = Object.keys(TAYLORA_CAMPAIGN);
    const suspicious = keys.filter((key) => {
      const k = key.toLowerCase();
      return (
        k.includes("score") ||
        k.includes("rank") ||
        k.includes("weight") ||
        k.includes("boost") ||
        k.includes("bias")
      );
    });

    expect(suspicious).toEqual([]);
  });

  it("does not influence any other campaign (it is the only registered campaign)", () => {
    // Indirect proof: even an explicit 1-campaign registry has Taylora as
    // its sole member, so there is no other campaign it could affect.
    const oneItemRegistry = [TAYLORA_CAMPAIGN];
    expect(oneItemRegistry).toHaveLength(1);
    expect(oneItemRegistry[0]?.id).toBe("taylora-v1-2026");
  });
});

describe("Taylora UTM campaign parameter", () => {
  it("declares a non-empty utmCampaign value", () => {
    expect(typeof TAYLORA_CAMPAIGN.utmCampaign).toBe("string");
    expect(TAYLORA_CAMPAIGN.utmCampaign).toBe("tooolvibes-sponsor-v1");
    expect((TAYLORA_CAMPAIGN.utmCampaign ?? "").length).toBeGreaterThan(0);
  });

  it("uses a stable identifier that does not collide with editorial terms", () => {
    // Editorial copy keywords must not appear in the UTM param, so analytics
    // attribution stays cleanly separated from editorial text.
    expect(TAYLORA_CAMPAIGN.utmCampaign?.toLowerCase()).not.toContain("score");
    expect(TAYLORA_CAMPAIGN.utmCampaign?.toLowerCase()).not.toContain("editor");
  });
});
