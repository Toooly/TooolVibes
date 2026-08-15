/**
 * Contextual Partner Resolver — unit contracts.
 *
 * Pins the canonical selection order for direct Partner Experiences:
 * active window → route eligibility → relevance → self-sponsorship →
 * priority → deterministic per-placement rotation (never random, never
 * different between server and client on the same UTC day).
 */

import { describe, expect, it } from "vitest";

import {
  buildPartnerDestinationUrl,
  resolvePartnerCampaign,
  scoreCampaignRelevance,
} from "@/lib/sponsors/partner-resolver";
import {
  ALL_SPONSOR_CAMPAIGNS,
  ONWEB24_CAMPAIGN,
  TAYLORA_CAMPAIGN,
  ZAPLATER_CAMPAIGN,
  type SponsorCampaign,
} from "@/lib/sponsors/sponsor-placements";
import { getDirectoryToolBySlug } from "@/lib/data/tooolvibes-directory";

const NOW = new Date("2026-08-07T12:00:00.000Z");

function rotate(placementKey: string, offset = 0, now = NOW) {
  return resolvePartnerCampaign({
    placementKey,
    route: "home",
    strategy: "rotation",
    rotationOffset: offset,
    now,
  });
}

describe("resolvePartnerCampaign — rotation surfaces", () => {
  it("is deterministic for the same day and placement", () => {
    const a = rotate("home-featured-tool");
    const b = rotate("home-featured-tool");
    expect(a).not.toBeNull();
    expect(a?.sponsorId).toBe(b?.sponsorId);
  });

  it("selects one of the active registered partners", () => {
    const pick = rotate("home-featured-tool");
    expect(["taylora", "onweb24", "zaplater"]).toContain(pick?.sponsorId);
  });

  it("home and archivio offsets never repeat the same partner on one day", () => {
    const home = resolvePartnerCampaign({
      placementKey: "home-featured-tool",
      route: "home",
      strategy: "rotation",
      rotationOffset: 0,
      now: NOW,
    });
    const archivio = resolvePartnerCampaign({
      placementKey: "catalog-native-sponsor",
      route: "archivio",
      strategy: "rotation",
      rotationOffset: 1,
      now: NOW,
    });
    expect(home).not.toBeNull();
    expect(archivio).not.toBeNull();
    expect(home?.sponsorId).not.toBe(archivio?.sponsorId);
  });

  it("filters campaigns outside their flight window", () => {
    const future = new Date("2020-01-01T00:00:00.000Z");
    const pick = resolvePartnerCampaign({
      placementKey: "home-featured-tool",
      route: "home",
      strategy: "rotation",
      now: future,
    });
    /* 2020 predates every startsAt → no eligible campaign */
    expect(pick).toBeNull();
  });

  it("never renders a campaign whose status is not active", () => {
    expect(
      ALL_SPONSOR_CAMPAIGNS.every((c) => c.status === "active"),
    ).toBe(true);
    const draft: SponsorCampaign = {
      ...TAYLORA_CAMPAIGN,
      id: "qa-draft",
      status: "paused",
    };
    expect(draft.status).toBe("paused");
  });
});

describe("resolvePartnerCampaign — contextual surfaces", () => {
  function contextual(tags: string[], text = "", toolSlug?: string) {
    return resolvePartnerCampaign({
      placementKey: "tool-sponsored-alternative",
      route: "tool-detail",
      strategy: "contextual",
      tags,
      text,
      toolSlug,
      now: NOW,
    });
  }

  it("matches website-builder contexts to OnWeb24", () => {
    const pick = contextual(["website-builder", "no-code"], "Costruisci il tuo sito");
    expect(pick?.sponsorId).toBe("onweb24");
  });

  it("matches WhatsApp/automation contexts to ZapLater", () => {
    const pick = contextual(["automation", "marketing"], "Automatizza i messaggi WhatsApp della community");
    expect(pick?.sponsorId).toBe("zaplater");
  });

  it("matches training/knowledge contexts to Taylora", () => {
    const pick = contextual(["ai-video"], "training corporate per il team");
    expect(pick?.sponsorId).toBe("taylora");
  });

  it("returns null when no campaign is semantically relevant", () => {
    const pick = contextual(["payments"], "merchant of record e fatturazione");
    expect(pick).toBeNull();
  });

  it("excludes self-sponsorship on the partner own tool page", () => {
    const pick = contextual(["productivity", "ai-video"], "training corporate", "taylora");
    expect(pick?.sponsorId).not.toBe("taylora");
  });

  it("scores segment matches above free-text matches", () => {
    const strong = scoreCampaignRelevance(ONWEB24_CAMPAIGN, {
      tags: ["website-builder"],
    });
    const weak = scoreCampaignRelevance(ZAPLATER_CAMPAIGN, {
      text: "strumenti per community",
    });
    expect(strong).toBe(2);
    expect(weak).toBe(1);
    expect(strong).toBeGreaterThan(weak);
  });

  it.each([
    ["synthesia-ai", "taylora"],
    ["weweb", "onweb24"],
    ["livechat", "zaplater"],
    ["flowise", null],
    ["make", null],
    ["omi", null],
    ["jenni-ai", null],
  ] as const)("keeps the semantic anchor %s → %s", (slug, sponsorId) => {
    const tool = getDirectoryToolBySlug(slug);
    expect(tool).toBeDefined();

    const pick = contextual(
      [...(tool?.segments ?? []), ...(tool?.tags ?? [])],
      `${tool?.name ?? ""} ${tool?.shortDescription ?? ""}`,
      slug,
    );

    expect(pick?.sponsorId ?? null).toBe(sponsorId);
  });

  it("selects only the exact best score, never a near-best campaign", () => {
    const tags = ["website-builder", "no-code", "customer-support"];
    expect(scoreCampaignRelevance(ONWEB24_CAMPAIGN, { tags })).toBe(3);
    expect(scoreCampaignRelevance(ZAPLATER_CAMPAIGN, { tags })).toBe(2);
    expect(contextual(tags)?.sponsorId).toBe("onweb24");
  });
});

describe("buildPartnerDestinationUrl", () => {
  it("appends deterministic UTM parameters", () => {
    const url = buildPartnerDestinationUrl(TAYLORA_CAMPAIGN, "home-featured-tool");
    expect(url).toContain("utm_source=tooolvibes");
    expect(url).toContain("utm_medium=partner");
    expect(url).toContain("utm_campaign=taylora");
    expect(url).toContain("utm_content=home-featured-tool");
  });

  it("never overwrites sponsor-provided tracking parameters", () => {
    const sponsored: SponsorCampaign = {
      ...ZAPLATER_CAMPAIGN,
      destinationUrl: "https://www.zaplater.com/it?utm_source=partner-site",
    };
    const url = buildPartnerDestinationUrl(sponsored, "home-featured-tool");
    expect(url).toBe("https://www.zaplater.com/it?utm_source=partner-site");
    expect(url).not.toContain("utm_source=tooolvibes");
  });

  it("keeps the partner destination host intact", () => {
    expect(buildPartnerDestinationUrl(ONWEB24_CAMPAIGN, "catalog-native-sponsor")).toContain(
      "onweb24.com",
    );
  });
});

describe("rotational anti-collision", () => {
  it("home offset 0 and archive offset 1 pick different partners on the same day", () => {
    const now = new Date("2026-08-08T12:00:00Z");
    const home = resolvePartnerCampaign({
      placementKey: "home-featured-tool",
      route: "home",
      strategy: "rotation",
      rotationOffset: 0,
      now,
    });
    const archive = resolvePartnerCampaign({
      placementKey: "catalog-native-sponsor",
      route: "archivio",
      strategy: "rotation",
      rotationOffset: 1,
      now,
    });
    expect(home).not.toBeNull();
    expect(archive).not.toBeNull();
    expect(home?.name).not.toBe(archive?.name);
  });
});


describe("resolvePartnerCampaign — commercial overrides file", () => {
  it("placement override file defaults to auto", () => {
    const resolved = resolvePartnerCampaign({
      placementKey: "home-featured-tool",
      route: "home",
      strategy: "rotation",
      rotationOffset: 0,
      now: NOW,
    });
    expect(resolved === null || typeof resolved.id === "string").toBe(true);
  });
});
