import { describe, expect, it } from "vitest";

import {
  partnerSegmentsForToolSlug,
  partnerSegmentsForToolSlugs,
} from "@/lib/sponsors/partner-context";
import { resolvePartnerCampaign } from "@/lib/sponsors/partner-resolver";

const NOW = new Date("2026-08-07T12:00:00Z");

describe("partner-context matching depth", () => {
  it("derives canonical segments for a known directory tool", () => {
    expect(partnerSegmentsForToolSlug("windsor-ai")).toEqual(
      expect.arrayContaining(["marketing", "automation"]),
    );
    expect(partnerSegmentsForToolSlug("meku")).toContain("website-builder");
  });

  it("returns no segments for a slug absent from the directory", () => {
    /* A guide about a tool we do not catalogue must never force a partner. */
    expect(partnerSegmentsForToolSlug("reclaim-ai")).toEqual([]);
    expect(partnerSegmentsForToolSlug("definitely-not-a-tool")).toEqual([]);
  });

  it("unions segments across a collection of tools without duplicates", () => {
    const segments = partnerSegmentsForToolSlugs(["vidau", "synthesia-ai"]);
    expect(segments).toContain("ai-video");
    expect(new Set(segments).size).toBe(segments.length);
  });

  it("resolves a relevant partner for a collection from its tool segments", () => {
    const segments = partnerSegmentsForToolSlugs(["vidau", "synthesia-ai", "imagine-art", "frase-ai"]);
    const campaign = resolvePartnerCampaign({
      placementKey: "collection-native-sponsor",
      route: "collections",
      strategy: "contextual",
      tags: segments,
      text: "Creator Video Stack",
      now: NOW,
    });
    expect(campaign?.name).toBe("Taylora");
  });

  it("resolves ZapLater for a marketing/automation subject (windsor post)", () => {
    const campaign = resolvePartnerCampaign({
      placementKey: "guide-inline-promo",
      route: "posts",
      strategy: "contextual",
      toolSlug: "windsor-ai",
      tags: partnerSegmentsForToolSlug("windsor-ai"),
      text: "Windsor AI",
      now: NOW,
    });
    expect(campaign?.name).toBe("ZapLater");
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
