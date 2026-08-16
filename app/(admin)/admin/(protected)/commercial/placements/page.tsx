import { savePlacementOverrideAction } from "@/lib/admin/control-center-actions";
import { ALL_SPONSOR_CAMPAIGNS, type SponsorPlacementId } from "@/lib/sponsors/sponsor-placements";
import { explainPlacement } from "@/lib/admin/placement-explain";
import { AdminSaveBanner } from "@/components/admin/admin-save-banner";
import { CommercialSubnav } from "@/components/admin/commercial-subnav";
import { ControlCenterHeader } from "@/components/admin/control-center-header";

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
    <div className="space-y-5">
      <AdminSaveBanner saved={params.saved} />
      <CommercialSubnav current="/admin/commercial/placements" />
      <ControlCenterHeader
        kicker="Commercial"
        title="Placement"
        description="AUTO, PIN o OFF per ogni superficie. TinyAdz non è in questo elenco."
      />
      <div className="space-y-3">
        {PLACEMENTS.map((placement) => {
          const explained = explainPlacement(placement.key);
          const override = explained.override;
          return (
            <form key={placement.id} action={savePlacementOverrideAction} className="tv-cc-panel">
              <input type="hidden" name="placementKey" value={placement.key} />
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="tv-cc-card__title">{placement.label}</h2>
                  <p className="tv-cc-card__meta">{placement.surface} · {placement.key}</p>
                  <p className="tv-cc-panel__desc">{explained.reason}</p>
                  <p className="tv-cc-card__meta">Ora: {explained.resolved?.name ?? "nessuna"} · eleggibili {explained.eligible.length}</p>
                </div>
                <button type="submit" className="tv-cc-btn tv-cc-btn--primary">Salva</button>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label>
                  <span className="tv-cc-label">Modalità</span>
                  <select name="mode" defaultValue={override.mode} className="tv-cc-field">
                    <option value="auto">AUTO · resolver</option>
                    <option value="pin">PIN campagna</option>
                    <option value="off">Disattiva placement</option>
                  </select>
                </label>
                <label>
                  <span className="tv-cc-label">Campagna</span>
                  <select name="campaignId" defaultValue={override.campaignId ?? ""} className="tv-cc-field">
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
