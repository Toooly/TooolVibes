import type { SponsorCampaign } from "@/lib/sponsors/sponsor-placements";

export type CampaignBucket = "active" | "upcoming" | "ending" | "ended" | "other";

export function campaignBucket(campaign: SponsorCampaign, now = Date.now()): CampaignBucket {
  const start = campaign.startsAt ? Date.parse(campaign.startsAt) : null;
  const end = campaign.endsAt ? Date.parse(campaign.endsAt) : null;
  if (campaign.status === "completed" || campaign.status === "paused" || (end !== null && !Number.isNaN(end) && end < now)) {
    return campaign.status === "paused" ? "other" : "ended";
  }
  if (campaign.status === "scheduled" || (start !== null && !Number.isNaN(start) && start > now)) return "upcoming";
  if (end !== null && !Number.isNaN(end) && end - now < 14 * 24 * 60 * 60 * 1000) return "ending";
  if (campaign.status === "active") return "active";
  return "other";
}

export const CAMPAIGN_BUCKET_LABEL: Record<CampaignBucket, string> = {
  active: "Attive ora",
  upcoming: "In arrivo",
  ending: "In scadenza",
  ended: "Concluse",
  other: "Bozze e in pausa",
};
