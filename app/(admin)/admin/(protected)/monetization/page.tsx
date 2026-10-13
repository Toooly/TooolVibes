import { LocalizedText, LocalizedAttributes } from "@/components/i18n/localized-text";
import Link from "@/components/ui/app-link";

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
      <LocalizedAttributes><ControlCenterHeader
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
      /></LocalizedAttributes>

      <div className="tv-cc-editor-grid">
        <div className="space-y-3">
          {publicPlacements.map((placement) => (
            <article key={placement.key} className="tv-cc-panel">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="tv-cc-panel__kicker"><LocalizedText>{placement.surface}</LocalizedText> / <LocalizedText>{placement.format}</LocalizedText></p>
                  <h2 className="tv-cc-panel__title"><LocalizedText>{placement.packageName}</LocalizedText></h2>
                </div>
                <span className="tv-cc-metric"><LocalizedText>{statusLabel[placement.status]}</LocalizedText></span>
              </div>
              <p className="tv-cc-panel__desc"><LocalizedText>{placement.body}</LocalizedText></p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="tv-cc-panel">
                  <p className="tv-cc-panel__kicker"><LocalizedText>{"Audience"}</LocalizedText></p>
                  <p className="tv-cc-panel__desc"><LocalizedText>{placement.audience}</LocalizedText></p>
                </div>
                <div className="tv-cc-panel">
                  <p className="tv-cc-panel__kicker"><LocalizedText>{"CTA"}</LocalizedText></p>
                  <p className="tv-cc-panel__desc"><LocalizedText>{placement.ctaLabel}</LocalizedText> / {placement.href}</p>
                </div>
              </div>
            </article>
          ))}
        </div>

        <aside className="space-y-3">
          <div className="tv-cc-panel">
            <p className="tv-cc-panel__kicker"><LocalizedText>{"Regola"}</LocalizedText></p>
            <h2 className="tv-cc-panel__title"><LocalizedText>{"Native first"}</LocalizedText></h2>
            <p className="tv-cc-panel__desc"><LocalizedText>{"Ogni sponsor entra con contesto, disclosure e utilità. Se non aiuta la scelta del tool, non entra. "}</LocalizedText></p>
          </div>
          <div className="tv-cc-panel">
            <p className="tv-cc-panel__kicker"><LocalizedText>{"Da collegare dopo"}</LocalizedText></p>
            <p className="tv-cc-panel__desc"><LocalizedText>{"Campagne datate, reporting e CRUD Supabase restano fuori da questa vista."}</LocalizedText></p>
          </div>
          {plannedPlacements.length > 0 ? (
            <div className="tv-cc-panel">
              <p className="tv-cc-panel__kicker"><LocalizedText>{"Non ancora visibili"}</LocalizedText></p>
              <div className="mt-3 grid gap-2">
                {plannedPlacements.map((placement) => (
                  <div key={placement.key}>
                    <p className="text-sm font-semibold"><LocalizedText>{placement.surface}</LocalizedText></p>
                    <p className="tv-cc-card__meta"><LocalizedText>{placement.packageName}</LocalizedText></p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          <Link href="/admin/commercial/placements" className="tv-cc-btn tv-cc-btn--secondary"><LocalizedText>{"Apri placement "}</LocalizedText></Link>
        </aside>
      </div>
    </div>
  );
}
