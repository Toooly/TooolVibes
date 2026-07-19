"use client";

import { useState } from "react";
import { Radar } from "lucide-react";

import { Radar3DLayer } from "@/components/3d-maestoso/radar-3d-layer";
import { DesktopRadarNodes } from "@/components/desktop/desktop-radar-nodes";
import { DesktopRadarTable } from "@/components/desktop/desktop-radar-table";
import {
  formatUtcTimeLabel,
  resolveRadarDataState,
  type ProductHuntRange,
} from "@/lib/radar/product-hunt-contract";
import type { RadarDesktopVisual } from "@/lib/radar/radar-view-config";
import { useProductHuntRadar } from "@/lib/radar/use-product-hunt-radar";

/**
 * Composizione desktop unica del Radar (B44 / DESK-804).
 *
 * - Una sola visual montata alla volta (`nodes` XOR `table`): la primary
 *   arriva da config (`initialVisual`), il toggle lazy monta l'altra solo
 *   su richiesta utente, senza mai sovrapporre i due tree.
 * - Il range vive qui: lo switch di visual non perde la selezione e la
 *   query condivisa (`useProductHuntRadar`, stessa key per range) serve
 *   header, nodi e tabella con UNA sola request per key.
 */

const radarRangeTabs: { key: ProductHuntRange; label: string }[] = [
  { key: "day", label: "Giorno" },
  { key: "week", label: "Settimana" },
  { key: "month", label: "Mese" },
];

const radarVisualOptions: { key: RadarDesktopVisual; label: string }[] = [
  { key: "table", label: "Tabella" },
  { key: "nodes", label: "Radar" },
];

export function DesktopVibeRadar({
  threeDEnabled,
  initialVisual,
}: {
  threeDEnabled: boolean;
  initialVisual: RadarDesktopVisual;
}) {
  const [activeRange, setActiveRange] = useState<ProductHuntRange>("day");
  const [activeVisual, setActiveVisual] =
    useState<RadarDesktopVisual>(initialVisual);

  // Provenienza condivisa con le visual: stessa key, stessa cache, nessuna
  // request aggiuntiva rispetto alla visual montata.
  const { payload } = useProductHuntRadar(activeRange);
  const radarState = resolveRadarDataState(payload);
  const isStaleFallback = radarState === "ready" && payload?.stale === true;
  const sourceLabel =
    radarState === "ready"
      ? isStaleFallback
        ? `Ultima sincronizzazione Product Hunt: ${formatUtcTimeLabel(payload?.updatedAt ?? "")}`
        : `Dati live Product Hunt, aggiornati alle ${formatUtcTimeLabel(payload?.updatedAt ?? "")}`
      : radarState === "loading"
        ? "Connessione al feed Product Hunt"
        : "Feed Product Hunt non disponibile";

  return (
    <div className="desktop-vibe desktop-vibe-radar">
      <section className="desktop-vibe-section desktop-vibe-radar-hero desktop-vibe-radar-hero--simple">
        <div className="desktop-vibe-copy desktop-vibe-radar-title" data-orbit-shield>
          <h1>Radar Live</h1>
        </div>

        <div className="grid w-full justify-items-center gap-4">
          <div className="grid justify-items-center gap-1 text-center" data-orbit-shield>
            <p className="desktop-vibe-eyebrow">Classifica live</p>
            <h2 className="text-xl font-bold text-white/90 sm:text-2xl">
              Classifica Product Hunt
            </h2>
            <p className="text-[0.8rem] font-medium text-white/55">
              {sourceLabel}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <div
              className="desktop-radar-table__tabs"
              role="tablist"
              aria-label="Periodo classifica"
            >
              {radarRangeTabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={activeRange === tab.key}
                  className={activeRange === tab.key ? "is-active" : undefined}
                  onClick={() => setActiveRange(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div
              className="desktop-radar-table__tabs"
              role="group"
              aria-label="Visualizzazione desktop"
            >
              {radarVisualOptions.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  aria-pressed={activeVisual === option.key}
                  className={activeVisual === option.key ? "is-active" : undefined}
                  onClick={() => setActiveVisual(option.key)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {activeVisual === "nodes" ? (
            <div className="desktop-vibe-radar-stage" aria-label="Radar 3D Product Hunt">
              {threeDEnabled && <Radar3DLayer />}
              <span className="desktop-vibe-radar-sweep-line" aria-hidden="true" />
              <span className="desktop-vibe-radar-core" aria-hidden="true">
                <Radar />
              </span>
              <DesktopRadarNodes range={activeRange} />
            </div>
          ) : (
            <div id="rankings" className="w-full max-w-[72rem]">
              <DesktopRadarTable range={activeRange} />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
