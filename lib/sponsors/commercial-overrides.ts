import overridesJson from "@/data/commercial-overrides.json";
import { getJsonManagedCampaigns } from "@/lib/sponsors/managed-commercial";
import {
  ALL_SPONSOR_CAMPAIGNS,
  SPONSOR_TO_MONETIZATION_KEY,
  type SponsorCampaign,
  type SponsorCampaignStatus,
  type SponsorPlacementId,
} from "@/lib/sponsors/sponsor-placements";

export type PlacementOverrideMode = "auto" | "pin" | "off";

export type PlacementOverride = {
  mode: PlacementOverrideMode;
  campaignId?: string | null;
};

export type CampaignOverride = {
  status?: SponsorCampaignStatus;
  startsAt?: string | null;
  endsAt?: string | null;
  priority?: number;
  rotationWeight?: number;
  eyebrow?: string;
  headline?: string;
  description?: string;
  ctaLabel?: string;
  destinationUrl?: string;
  image?: string | null;
};

export type CommercialOverrides = {
  placements: Record<string, PlacementOverride>;
  campaigns?: Record<string, CampaignOverride>;
};

export function normalizePlacementKey(placementKey: string): string {
  return (
    SPONSOR_TO_MONETIZATION_KEY[placementKey as SponsorPlacementId] ?? placementKey
  );
}

export function getCommercialOverrides(): CommercialOverrides {
  const raw = overridesJson as Partial<CommercialOverrides>;
  return {
    placements: raw.placements ?? {},
    campaigns: raw.campaigns ?? {},
  };
}

export function getPlacementOverride(
  placementKey: string,
  overrides?: CommercialOverrides,
): PlacementOverride {
  const source = overrides ?? getCommercialOverrides();
  const mapped = normalizePlacementKey(placementKey);
  return (
    source.placements[mapped] ??
    source.placements[placementKey] ?? { mode: "auto" }
  );
}

export function applyCampaignOverride(
  campaign: SponsorCampaign,
  override?: CampaignOverride,
): SponsorCampaign {
  if (!override) return campaign;
  return {
    ...campaign,
    status: override.status ?? campaign.status,
    startsAt: override.startsAt === undefined ? campaign.startsAt : override.startsAt ?? undefined,
    endsAt: override.endsAt === undefined ? campaign.endsAt : override.endsAt ?? undefined,
    priority: override.priority ?? campaign.priority,
    rotationWeight: override.rotationWeight ?? campaign.rotationWeight,
    eyebrow: override.eyebrow?.trim() || campaign.eyebrow,
    headline: override.headline?.trim() || campaign.headline,
    description: override.description?.trim() || campaign.description,
    ctaLabel: override.ctaLabel?.trim() || campaign.ctaLabel,
    destinationUrl: override.destinationUrl?.trim() || campaign.destinationUrl,
    image: override.image === undefined ? campaign.image : override.image,
  };
}

export function getManagedCampaigns(
  overrides?: CommercialOverrides,
  campaigns: readonly SponsorCampaign[] = ALL_SPONSOR_CAMPAIGNS,
): SponsorCampaign[] {
  const source = overrides ?? getCommercialOverrides();
  const extras = getJsonManagedCampaigns();
  const seen = new Set(campaigns.map((campaign) => campaign.id));
  const merged = [
    ...campaigns,
    ...extras.filter((campaign) => !seen.has(campaign.id)),
  ];
  return merged.map((campaign) =>
    applyCampaignOverride(campaign, source.campaigns?.[campaign.id]),
  );
}

export function applyPlacementOverride(
  placementKey: string,
  autoResolved: SponsorCampaign | null,
  campaigns: readonly SponsorCampaign[] = ALL_SPONSOR_CAMPAIGNS,
  overrides: CommercialOverrides = getCommercialOverrides(),
): SponsorCampaign | null {
  const override = getPlacementOverride(placementKey, overrides);
  if (override.mode === "off") return null;
  if (override.mode === "pin" && override.campaignId) {
    return campaigns.find((campaign) => campaign.id === override.campaignId) ?? autoResolved;
  }
  return autoResolved;
}

export function listManagedPartners(
  campaigns: readonly SponsorCampaign[] = getManagedCampaigns(),
) {
  const byId = new Map<string, { id: string; name: string; campaigns: number }>();
  for (const campaign of campaigns) {
    const current = byId.get(campaign.sponsorId);
    if (current) {
      current.campaigns += 1;
    } else {
      byId.set(campaign.sponsorId, {
        id: campaign.sponsorId,
        name: campaign.name,
        campaigns: 1,
      });
    }
  }
  return [...byId.values()];
}
