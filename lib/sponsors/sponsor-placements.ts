/**
 * TooolVibes Sponsor System — canonical registry.
 *
 * Direct first-party sponsorships: manually curated, editorial,
 * clearly labelled, sold and controlled by TooolVibes.
 * Separate from TinyAdz third-party programmatic advertising.
 */

export type SponsorCampaignStatus =
  | "draft"
  | "scheduled"
  | "active"
  | "paused"
  | "completed";

export type SponsorPlacementId =
  | "home-partner-spotlight"
  | "archive-sponsored-tool"
  | "tool-detail-partner"
  | "collections-partner"
  | "article-partner";

export type SponsorCampaign = {
  id: string;
  sponsorId: string;
  toolSlug?: string;
  name: string;
  logo: string | null;
  eyebrow: string;
  headline: string;
  description: string;
  contextualReason?: string;
  ctaLabel: string;
  destinationUrl: string;
  image?: string | null;
  accent?: string;
  disclosure: string;
  placements: SponsorPlacementId[];
  status: SponsorCampaignStatus;
  startsAt?: string;
  endsAt?: string;
  priority?: number;
  utmCampaign?: string;
};

function isWithinDateWindow(startsAt?: string, endsAt?: string): boolean {
  const now = Date.now();
  if (startsAt) {
    const start = Date.parse(startsAt);
    if (!Number.isNaN(start) && now < start) return false;
  }
  if (endsAt) {
    const end = Date.parse(endsAt);
    if (!Number.isNaN(end) && now > end) return false;
  }
  return true;
}

export function isCampaignActive(campaign: SponsorCampaign): boolean {
  return (
    campaign.status === "active" &&
    isWithinDateWindow(campaign.startsAt, campaign.endsAt)
  );
}

export function getActiveCampaignForPlacement(
  placementId: SponsorPlacementId,
  campaigns: readonly SponsorCampaign[] = ALL_SPONSOR_CAMPAIGNS,
): SponsorCampaign | null {
  const active = campaigns
    .filter((c) => isCampaignActive(c) && c.placements.includes(placementId))
    .sort((a, b) => (a.priority ?? 50) - (b.priority ?? 50));

  return active[0] ?? null;
}

export function getActiveCampaigns(
  campaigns?: readonly SponsorCampaign[],
): SponsorCampaign[] {
  return (campaigns ?? ALL_SPONSOR_CAMPAIGNS).filter(isCampaignActive);
}

// ============================================================
// TAYLORA — canonical first sponsor campaign
// ============================================================
export const TAYLORA_CAMPAIGN: SponsorCampaign = {
  id: "taylora-v1-2026",
  sponsorId: "taylora",
  toolSlug: "taylora",
  name: "Taylora",
  logo: null,
  eyebrow: "Partner di TooolVibes",
  headline:
    "Distribuisci contenuti digitali protetti senza complicare l'esperienza del tuo pubblico.",
  description:
    "Taylora è la piattaforma che permette a creator, coach ed editori di vendere e distribuire contenuti digitali protetti — corsi, membership, download — senza costruire un'infrastruttura tecnica.",
  contextualReason:
    "Partner selezionato per chi vuole distribuire contenuti digitali protetti senza perdere il controllo dell'esperienza.",
  ctaLabel: "Scopri Taylora",
  destinationUrl: "https://taylora.com",
  disclosure: "Partner di TooolVibes",
  placements: ["home-partner-spotlight", "archive-sponsored-tool"],
  status: "active",
  startsAt: "2026-08-01",
  priority: 1,
  utmCampaign: "tooolvibes-sponsor-v1",
};

export const ALL_SPONSOR_CAMPAIGNS: readonly SponsorCampaign[] = [
  TAYLORA_CAMPAIGN,
];

// ============================================================
// PLACEMENT ID → legacy monetization placement key mapping
// ============================================================
export const SPONSOR_TO_MONETIZATION_KEY: Record<
  SponsorPlacementId,
  string
> = {
  "home-partner-spotlight": "home-featured-tool",
  "archive-sponsored-tool": "catalog-native-sponsor",
  "tool-detail-partner": "tool-sponsored-alternative",
  "collections-partner": "collection-native-sponsor",
  "article-partner": "guide-inline-promo",
};
