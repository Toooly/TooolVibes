import Link from "next/link";

import { CommercialSubnav } from "@/components/admin/commercial-subnav";
import { ControlCenterHeader } from "@/components/admin/control-center-header";
import {
  getMonetizationPlacementStats,
  monetizationPlacements,
  type MonetizationStatus,
} from "@/lib/monetization/placements";

const statusLabel: Record<MonetizationStatus, string> = {
  ready: "Attivo",
  reserved: "Prenotabile",
  planned: "In arrivo",
};

export default function AdminMonetizationPage() {
  const stats = getMonetizationPlacementStats();
  const publicPlacements = monetizationPlacements.filter((placement) => placement.visible);
  const plannedPlacements = monetizationPlacements.filter((placement) => !placement.visible);

  return (
    <div className="space-y-5">
      <CommercialSubnav current="/admin/monetization" />
      <ControlCenterHeader
        kicker="Monetizzazione"
        title="Inventory nativa"
        description="Spazi partner mappati nel prodotto."
        primaryHref="/affiliati"
        primaryLabel="Pagina partner"
        metrics={[
          { label: "slot", value: stats.total },
          { label: "visibili", value: stats.visible },
          { label: "prenotabili", value: stats.reserved },
          { label: "pianificati", value: stats.planned },
        ]}
      />

      <div className="tv-cc-editor-grid">
        <div className="space-y-3">
          {publicPlacements.map((placement) => (
            <article key={placement.key} className="tv-cc-panel">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="tv-cc-panel__kicker">{placement.surface} / {placement.format}</p>
                  <h2 className="tv-cc-panel__title">{placement.packageName}</h2>
                </div>
                <span className="tv-cc-metric">{statusLabel[placement.status]}</span>
              </div>
              <p className="tv-cc-panel__desc">{placement.body}</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="tv-cc-panel">
                  <p className="tv-cc-panel__kicker">Audience</p>
                  <p className="tv-cc-panel__desc">{placement.audience}</p>
                </div>
                <div className="tv-cc-panel">
                  <p className="tv-cc-panel__kicker">CTA</p>
                  <p className="tv-cc-panel__desc">{placement.ctaLabel} / {placement.href}</p>
                </div>
              </div>
            </article>
          ))}
        </div>

        <aside className="space-y-3">
          <div className="tv-cc-panel">
            <p className="tv-cc-panel__kicker">Regola</p>
            <h2 className="tv-cc-panel__title">Native first</h2>
            <p className="tv-cc-panel__desc">
              Ogni sponsor entra con contesto, disclosure e utilità. Se non aiuta la scelta del tool, non entra.
            </p>
          </div>
          <div className="tv-cc-panel">
            <p className="tv-cc-panel__kicker">Da collegare dopo</p>
            <p className="tv-cc-panel__desc">Campagne datate, reporting e CRUD Supabase restano fuori da questa vista.</p>
          </div>
          {plannedPlacements.length > 0 ? (
            <div className="tv-cc-panel">
              <p className="tv-cc-panel__kicker">Non ancora visibili</p>
              <div className="mt-3 grid gap-2">
                {plannedPlacements.map((placement) => (
                  <div key={placement.key}>
                    <p className="text-sm font-semibold">{placement.surface}</p>
                    <p className="tv-cc-card__meta">{placement.packageName}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          <Link href="/admin/commercial/placements" className="tv-cc-btn tv-cc-btn--secondary">
            Apri placement
          </Link>
        </aside>
      </div>
    </div>
  );
}
