import { savePlacementOverrideAction } from "@/lib/admin/control-center-actions";
import { ALL_SPONSOR_CAMPAIGNS, type SponsorPlacementId } from "@/lib/sponsors/sponsor-placements";
import { explainPlacement } from "@/lib/admin/placement-explain";
import { AdminSaveBanner } from "@/components/admin/admin-save-banner";
import { SectionHeader } from "@/components/ui/section-header";
import { CommercialSubnav } from "@/components/admin/commercial-subnav";

const PLACEMENTS: { id: SponsorPlacementId; key: string; label: string; surface: string }[] = [
  { id: "home-partner-spotlight", key: "home-featured-tool", label: "Home partner", surface: "/" },
  { id: "archive-sponsored-tool", key: "catalog-native-sponsor", label: "Archivio sponsor", surface: "/archivio" },
  { id: "tool-detail-partner", key: "tool-sponsored-alternative", label: "Scheda tool", surface: "/toools/[slug]" },
  { id: "collections-partner", key: "collection-native-sponsor", label: "Fine raccolta", surface: "/collections/[slug]" },
  { id: "article-partner", key: "guide-inline-promo", label: "Guida / articolo", surface: "/posts/[slug]" },
];

export default async function AdminPlacementsPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const params = await searchParams;
  return (
    <div className="space-y-6">
      <AdminSaveBanner saved={params.saved} />
      <CommercialSubnav current="/admin/commercial/placements" />
      <SectionHeader invert
        eyebrow="Commercial"
        title="Placement"
        description="Ogni superficie può restare in AUTO, fissare una campagna o spegnersi. TinyAdz non è in questo elenco."
      />
      <div className="space-y-4">
        {PLACEMENTS.map((placement) => {
          const explained = explainPlacement(placement.key);
          const override = explained.override;
          return (
            <form
              key={placement.id}
              action={savePlacementOverrideAction}
              className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5"
            >
              <input type="hidden" name="placementKey" value={placement.key} />
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-white">{placement.label}</h2>
                  <p className="text-sm text-white/50">{placement.surface} · {placement.key}</p>
                  <p className="mt-2 text-sm text-white/70">{explained.reason}</p>
                  <p className="text-xs text-white/45">Ora: {explained.resolved?.name ?? "nessuna"} · eleggibili {explained.eligible.length}</p>
                </div>
                <button type="submit" className="min-h-11 rounded-full border border-white/15 px-4 text-sm font-semibold text-white">
                  Salva
                </button>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="text-sm text-white/70">
                  Modalità
                  <select
                    name="mode"
                    defaultValue={override.mode}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white"
                  >
                    <option value="auto">AUTO · resolver</option>
                    <option value="pin">PIN campagna</option>
                    <option value="off">Disattiva placement</option>
                  </select>
                </label>
                <label className="text-sm text-white/70">
                  Campagna
                  <select
                    name="campaignId"
                    defaultValue={override.campaignId ?? ""}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white"
                  >
                    <option value="">Nessuna</option>
                    {ALL_SPONSOR_CAMPAIGNS.map((campaign) => (
                      <option key={campaign.id} value={campaign.id}>
                        {campaign.name} · {campaign.status}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </form>
          );
        })}
      </div>
    </div>
  );
}
