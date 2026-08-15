import managedCampaignsJson from "@/data/managed-campaigns.json";
import managedPartnersJson from "@/data/managed-partners.json";
import type { SponsorCampaign, SponsorCampaignStatus, SponsorPlacementId } from "@/lib/sponsors/sponsor-placements";

export type ManagedPartnerStatus = "draft" | "active" | "archived";

export type ManagedPartner = {
  id: string;
  name: string;
  status: ManagedPartnerStatus;
  website?: string;
  logo?: string;
  brandPlate?: string;
  defaultCta?: string;
  destinationUrl?: string;
  notes?: string;
  startsAt?: string;
  endsAt?: string;
  segments?: string[];
};

export type ManagedCampaign = {
  id: string;
  partnerId: string;
  name: string;
  status: SponsorCampaignStatus;
  eyebrow?: string;
  headline: string;
  description: string;
  ctaLabel: string;
  destinationUrl: string;
  image?: string | null;
  placements: SponsorPlacementId[];
  startsAt?: string;
  endsAt?: string;
  priority?: number;
  rotationWeight?: number;
  contextTags?: string[];
  categoryTags?: string[];
};

const DEFAULT_PLACEMENTS: SponsorPlacementId[] = [
  "home-partner-spotlight",
  "archive-sponsored-tool",
  "tool-detail-partner",
  "collections-partner",
  "article-partner",
];

export function getManagedPartners(): ManagedPartner[] {
  return ((managedPartnersJson as { partners?: ManagedPartner[] }).partners ?? []).filter(Boolean);
}

export function getManagedPartner(id: string) {
  return getManagedPartners().find((partner) => partner.id === id) ?? null;
}

export function getExplicitManagedCampaigns(): ManagedCampaign[] {
  return ((managedCampaignsJson as { campaigns?: ManagedCampaign[] }).campaigns ?? []).filter(Boolean);
}

export function partnerToCampaign(partner: ManagedPartner): SponsorCampaign {
  const art = partner.brandPlate || partner.logo || "";
  return {
    id: `managed-${partner.id}-default`,
    sponsorId: partner.id,
    name: partner.name,
    logo: partner.logo || null,
    eyebrow: "Partner",
    headline: partner.name,
    description: partner.notes?.trim() || `Partnership ${partner.name}.`,
    ctaLabel: partner.defaultCta?.trim() || "Scopri",
    destinationUrl: partner.destinationUrl?.trim() || partner.website?.trim() || "/",
    image: art || null,
    disclosure: "Contenuto partner",
    placements: DEFAULT_PLACEMENTS,
    status: partner.status === "active" ? "active" : partner.status === "archived" ? "completed" : "draft",
    startsAt: partner.startsAt,
    endsAt: partner.endsAt,
    priority: 40,
    rotationWeight: 1,
    categoryTags: partner.segments,
    brandAsset: art
      ? { src: art, alt: partner.name, width: 1200, height: 630, fit: "contain" }
      : undefined,
  };
}

export function managedCampaignToSponsor(
  campaign: ManagedCampaign,
  partner?: ManagedPartner | null,
): SponsorCampaign {
  const art = campaign.image || partner?.brandPlate || partner?.logo || "";
  return {
    id: campaign.id,
    sponsorId: campaign.partnerId,
    name: campaign.name,
    logo: partner?.logo || null,
    eyebrow: campaign.eyebrow?.trim() || "Partner",
    headline: campaign.headline,
    description: campaign.description,
    ctaLabel: campaign.ctaLabel,
    destinationUrl: campaign.destinationUrl,
    image: art || null,
    disclosure: "Contenuto partner",
    placements: campaign.placements.length > 0 ? campaign.placements : DEFAULT_PLACEMENTS,
    status: campaign.status,
    startsAt: campaign.startsAt,
    endsAt: campaign.endsAt,
    priority: campaign.priority ?? 40,
    rotationWeight: campaign.rotationWeight ?? 1,
    contextTags: campaign.contextTags,
    categoryTags: campaign.categoryTags ?? partner?.segments,
    brandAsset: art ? { src: art, alt: partner?.name || campaign.name, width: 1200, height: 630, fit: "contain" } : undefined,
  };
}

export function getJsonManagedCampaigns(): SponsorCampaign[] {
  const partners = getManagedPartners();
  const byId = new Map(partners.map((partner) => [partner.id, partner]));
  const explicit = getExplicitManagedCampaigns().map((campaign) =>
    managedCampaignToSponsor(campaign, byId.get(campaign.partnerId)),
  );
  const explicitPartnerIds = new Set(explicit.map((campaign) => campaign.sponsorId));
  const implied = partners
    .filter((partner) => !explicitPartnerIds.has(partner.id))
    .map(partnerToCampaign);
  return [...explicit, ...implied];
}
