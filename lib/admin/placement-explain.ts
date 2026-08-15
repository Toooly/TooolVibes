import { getManagedCampaigns, getPlacementOverride } from "@/lib/sponsors/commercial-overrides";
import { resolvePartnerCampaign } from "@/lib/sponsors/partner-resolver";
import { isCampaignActive, type SponsorRouteKey } from "@/lib/sponsors/sponsor-placements";

export const PLACEMENT_SURFACES = [
  { key: "home-featured-tool", label: "Home partner", surface: "/", route: "home" as SponsorRouteKey, strategy: "rotation" as const, offset: 0 },
  { key: "catalog-native-sponsor", label: "Archivio sponsor", surface: "/archivio", route: "archivio" as SponsorRouteKey, strategy: "rotation" as const, offset: 1 },
  { key: "tool-sponsored-alternative", label: "Scheda tool", surface: "/toools/[slug]", route: "tool-detail" as SponsorRouteKey, strategy: "contextual" as const, offset: 0 },
  { key: "collection-native-sponsor", label: "Fine raccolta", surface: "/collections/[slug]", route: "collections" as SponsorRouteKey, strategy: "contextual" as const, offset: 0 },
  { key: "guide-inline-promo", label: "Guida / articolo", surface: "/posts/[slug]", route: "posts" as SponsorRouteKey, strategy: "contextual" as const, offset: 0 },
];

export function explainPlacement(key: string) {
  const surface = PLACEMENT_SURFACES.find((item) => item.key === key) ?? PLACEMENT_SURFACES[0];
  const override = getPlacementOverride(key);
  const campaigns = getManagedCampaigns();
  const resolved = resolvePartnerCampaign({
    placementKey: key,
    route: surface.route,
    strategy: surface.strategy,
    rotationOffset: surface.offset,
  });
  const eligible = campaigns.filter((campaign) => isCampaignActive(campaign));
  const reason =
    override.mode === "off"
      ? "Hai spento questo spazio. Resta vuoto."
      : override.mode === "pin"
        ? resolved
          ? `Hai fissato ${resolved.name}. Resta visibile finché resta attiva.`
          : "Hai fissato una campagna che ora non può comparire (pausa, date o conflitto)."
        : resolved
          ? `${resolved.name} vince oggi tra ${eligible.length} campagne attive, in base a priorità e peso.`
          : "Nessuna campagna attiva può comparire qui.";
  return { surface, override, resolved, eligible, reason };
}
