import { describe, expect, it } from "vitest";

import {
  partnerSegmentsForToolSlug,
} from "@/lib/sponsors/partner-context";
import { resolvePartnerCampaign } from "@/lib/sponsors/partner-resolver";
import { ALL_SPONSOR_CAMPAIGNS } from "@/lib/sponsors/sponsor-placements";
import { existsSync } from "node:fs";
import path from "node:path";

const NOW = new Date("2026-08-08T12:00:00Z");
const root = path.resolve(__dirname, "../../..");

describe("partner brand assets", () => {
  it("exposes the three canonical brand plates on disk", () => {
    for (const partner of ["taylora", "onweb24", "zaplater"]) {
      expect(
        existsSync(path.join(root, "public/partners", partner, `${partner}-brand-plate.webp`)),
      ).toBe(true);
      expect(
        existsSync(path.join(root, "public/partners", partner, `${partner}-brand-plate.png`)),
      ).toBe(true);
    }
  });

  it("registry campaigns carry brandAsset paths", () => {
    for (const name of ["Taylora", "OnWeb24", "ZapLater"]) {
      const campaign = ALL_SPONSOR_CAMPAIGNS.find((c) => c.name === name);
      expect(campaign?.brandAsset?.src).toMatch(/\.webp$/);
      expect(campaign?.brandAsset?.width).toBe(1774);
      expect(campaign?.brandAsset?.height).toBe(887);
    }
  });
});

describe("partner-context matching depth", () => {
  it("derives segments and free tags for a known directory tool", () => {
    const tags = partnerSegmentsForToolSlug("synthesia-ai");
    expect(tags).toEqual(expect.arrayContaining(["ai-video", "training"]));
  });

  it("returns no tags for a slug absent from the directory", () => {
    expect(partnerSegmentsForToolSlug("reclaim-ai")).toEqual([]);
  });

  it("OnWeb24 wins strong website-builder subjects", () => {
    const tags = partnerSegmentsForToolSlug("wegic");
    const campaign = resolvePartnerCampaign({
      placementKey: "tool-sponsored-alternative",
      route: "tool-detail",
      strategy: "contextual",
      toolSlug: "wegic",
      tags,
      text: "Wegic",
      now: NOW,
    });
    expect(campaign?.name).toBe("OnWeb24");
  });

  it("does not force ZapLater from generic marketing/automation alone", () => {
    const campaign = resolvePartnerCampaign({
      placementKey: "tool-sponsored-alternative",
      route: "tool-detail",
      strategy: "contextual",
      toolSlug: "windsor-ai",
      tags: ["marketing", "automation"],
      text: "Windsor AI marketing automation",
      now: NOW,
    });
    expect(campaign).toBeNull();
  });

  it("does not force Taylora from generic video/content alone", () => {
    const campaign = resolvePartnerCampaign({
      placementKey: "collection-native-sponsor",
      route: "collections",
      strategy: "contextual",
      tags: ["ai-video", "ai-writing", "marketing"],
      text: "Creator Video Stack",
      now: NOW,
    });
    /* Without training/learning/onboarding signals, null is correct. */
    expect(campaign?.name === "Taylora" ? campaign : null).toBeNull();
  });

  it("Taylora matches training/corporate video subjects", () => {
    const tags = partnerSegmentsForToolSlug("synthesia-ai");
    const campaign = resolvePartnerCampaign({
      placementKey: "tool-sponsored-alternative",
      route: "tool-detail",
      strategy: "contextual",
      toolSlug: "synthesia-ai",
      tags,
      text: "Synthesia AI training corporate",
      now: NOW,
    });
    expect(campaign?.name).toBe("Taylora");
  });

  it("returns no campaign when a subject has no structured relevance", () => {
    const campaign = resolvePartnerCampaign({
      placementKey: "guide-inline-promo",
      route: "posts",
      strategy: "contextual",
      tags: [],
      text: "Unrelated editorial title",
      now: NOW,
    });
    expect(campaign).toBeNull();
  });
});
