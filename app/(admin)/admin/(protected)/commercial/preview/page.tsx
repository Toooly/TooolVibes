import { CommercialSubnav } from "@/components/admin/commercial-subnav";
import { SectionHeader } from "@/components/ui/section-header";
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
    <div className="space-y-6">
      <CommercialSubnav current="/admin/commercial/preview" />
      <SectionHeader
        eyebrow="Commercial"
        title="Preview campagne"
        description="Nessuna pubblicazione richiesta. Ogni placement mostra superficie, partner, campagna, creatività, CTA, destinazione, modalità e stato."
      />
      <div className="space-y-4">
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
            <article key={surface.key} className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-200/70">
                    {override.mode} · {surface.surface}
                  </p>
                  <h2 className="mt-1 text-xl font-semibold text-white">{surface.label}</h2>
                  <p className="text-sm text-white/50">{surface.key}</p>
                </div>
                <p className="text-sm text-white/55">{shown ? shown.status : "vuoto"}</p>
              </div>
              {shown ? (
                <div className="mt-4 grid gap-4 sm:grid-cols-[auto_1fr]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={shown.brandAsset?.src ?? shown.image ?? "/icon.svg"}
                    alt=""
                    className="h-20 w-32 rounded-2xl bg-black/30 object-contain"
                  />
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-white/40">{shown.sponsorId}</p>
                    <p className="mt-1 text-lg font-semibold text-white">{shown.headline}</p>
                    <p className="mt-1 text-sm text-white/65">{shown.description}</p>
                    <p className="mt-3 text-sm font-semibold text-white">
                      {shown.ctaLabel} → {shown.destinationUrl}
                    </p>
                    <p className="mt-1 text-xs text-white/45">{shown.disclosure}</p>
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-sm text-white/60">Nessuna campagna visibile. La superficie pubblica resta pulita.</p>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
