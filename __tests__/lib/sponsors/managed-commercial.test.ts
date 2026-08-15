import { describe, expect, it } from "vitest";

import { resolvePartnerCampaign } from "@/lib/sponsors/partner-resolver";
import { partnerToCampaign, type ManagedPartner } from "@/lib/sponsors/managed-commercial";

const partner: ManagedPartner = {
  id: "qa-zero-code",
  name: "QA Zero Code",
  status: "active",
  brandPlate: "/media/library/qa-plate.webp",
  defaultCta: "Apri",
  destinationUrl: "https://example.com",
};

describe("managed partners", () => {
  it("creates a publishable campaign without registry code", () => {
    const campaign = partnerToCampaign(partner);
    expect(campaign.brandAsset?.src).toBe("/media/library/qa-plate.webp");
    expect(campaign.sponsorId).toBe("qa-zero-code");
    const resolved = resolvePartnerCampaign(
      {
        placementKey: "home-featured-tool",
        route: "home",
        strategy: "rotation",
        now: new Date("2026-08-15T12:00:00.000Z"),
      },
      {
        campaigns: [campaign],
        overrides: { placements: { "home-featured-tool": { mode: "pin", campaignId: campaign.id } } },
      },
    );
    expect(resolved?.id).toBe(campaign.id);
  });

  it("draft partners do not win AUTO", () => {
    const campaign = partnerToCampaign({ ...partner, status: "draft" });
    const resolved = resolvePartnerCampaign(
      {
        placementKey: "home-featured-tool",
        route: "home",
        strategy: "rotation",
        now: new Date("2026-08-15T12:00:00.000Z"),
      },
      { campaigns: [campaign], overrides: { placements: {} } },
    );
    expect(resolved).toBeNull();
  });
});
