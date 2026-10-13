import { LocalizedText, LocalizedAttributes } from "@/components/i18n/localized-text";
import { CommercialSubnav } from "@/components/admin/commercial-subnav";
import { ControlCenterHeader } from "@/components/admin/control-center-header";
import { getManagedCampaigns, getPlacementOverride } from "@/lib/sponsors/commercial-overrides";
import { resolvePartnerCampaign } from "@/lib/sponsors/partner-resolver";
import { type SponsorRouteKey } from "@/lib/sponsors/sponsor-placements";

const SURFACES: {
  key: string;
  label: string;
  surface: string;
  route: SponsorRouteKey;
  strategy: "rotation" | "contextual";
  offset: number;
}[] = [
  { key: "home-featured-tool", label: "Home partner", surface: "/", route: "home", strategy: "rotation", offset: 0 },
  { key: "catalog-native-sponsor", label: "Archivio sponsor", surface: "/archivio", route: "archivio", strategy: "rotation", offset: 1 },
  { key: "tool-sponsored-alternative", label: "Scheda tool", surface: "/toools/[slug]", route: "tool-detail", strategy: "contextual", offset: 0 },
  { key: "collection-native-sponsor", label: "Fine raccolta", surface: "/collections/[slug]", route: "collections", strategy: "contextual", offset: 0 },
  { key: "guide-inline-promo", label: "Guida / articolo", surface: "/posts/[slug]", route: "posts", strategy: "contextual", offset: 0 },
];

export default function AdminCommercialPreviewPage() {
  const campaigns = getManagedCampaigns();

  return (
    <div className="space-y-5">
      <CommercialSubnav current="/admin/commercial/preview" />
      <LocalizedAttributes><ControlCenterHeader
        kicker="Commercial"
        title="Preview campagne"
        description="Ogni placement mostra superficie, campagna, CTA e modalità."
      /></LocalizedAttributes>
      <div className="space-y-3">
        {SURFACES.map((surface) => {
          const override = getPlacementOverride(surface.key);
          const resolved = resolvePartnerCampaign({
            placementKey: surface.key,
            route: surface.route,
            strategy: surface.strategy,
            rotationOffset: surface.offset,
          });
          const pinned = override.campaignId
            ? campaigns.find((campaign) => campaign.id === override.campaignId)
            : null;
          const shown = resolved ?? pinned ?? null;
          return (
            <article key={surface.key} className="tv-cc-panel">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="tv-cc-panel__kicker"><LocalizedText>{override.mode}</LocalizedText> · <LocalizedText>{surface.surface}</LocalizedText></p>
                  <h2 className="tv-cc-panel__title"><LocalizedText>{surface.label}</LocalizedText></h2>
                  <p className="tv-cc-card__meta"><LocalizedText>{surface.key}</LocalizedText></p>
                </div>
                <span className="tv-cc-metric"><LocalizedText>{shown ? shown.status : "vuoto"}</LocalizedText></span>
              </div>
              {shown ? (
                <div className="mt-4 grid gap-4 sm:grid-cols-[auto_1fr]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <LocalizedAttributes><img
                    src={shown.brandAsset?.src ?? shown.image ?? "/icon.svg"}
                    alt=""
                    className="h-20 w-32 rounded-2xl object-contain"
                    style={{ background: "var(--tv-surface-elevated)" }}
                  /></LocalizedAttributes>
                  <div>
                    <p className="tv-cc-card__meta"><LocalizedText>{shown.sponsorId}</LocalizedText></p>
                    <p className="tv-cc-panel__title"><LocalizedText>{shown.headline}</LocalizedText></p>
                    <p className="tv-cc-panel__desc"><LocalizedText>{shown.description}</LocalizedText></p>
                    <p className="mt-3 text-sm font-semibold">
                      <LocalizedText>{shown.ctaLabel}</LocalizedText> → <LocalizedText>{shown.destinationUrl}</LocalizedText>
                    </p>
                    <p className="tv-cc-card__meta"><LocalizedText>{shown.disclosure}</LocalizedText></p>
                  </div>
                </div>
              ) : (
                <p className="tv-cc-panel__desc"><LocalizedText>{"Nessuna campagna visibile. La superficie pubblica resta pulita."}</LocalizedText></p>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
