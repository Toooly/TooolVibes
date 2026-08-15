import { getHomepageControls } from "@/lib/content/homepage-controls";
import { getExplicitManagedCampaigns, getManagedPartners } from "@/lib/sponsors/managed-commercial";
import { getManagedCampaigns } from "@/lib/sponsors/commercial-overrides";

export function findMediaUsage(src: string) {
  if (!src) return [];
  const hits: string[] = [];
  const home = getHomepageControls();
  if (home.announcement.image === src) hits.push("Homepage announcement");
  for (const partner of getManagedPartners()) {
    if (partner.logo === src || partner.brandPlate === src) hits.push(`Partner ${partner.name}`);
  }
  for (const campaign of getExplicitManagedCampaigns()) {
    if (campaign.image === src) hits.push(`Campagna ${campaign.name}`);
  }
  for (const campaign of getManagedCampaigns()) {
    if (campaign.image === src || campaign.brandAsset?.src === src) {
      const label = `Creatività ${campaign.name}`;
      if (!hits.includes(label)) hits.push(label);
    }
  }
  return hits;
}
