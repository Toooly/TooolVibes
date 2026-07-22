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
    <div className="radar-command radar-command--desktop">
      <section className="radar-command__shell" aria-labelledby="radar-page-title">
        <header className="radar-command__header" data-orbit-shield>
          <div>
            <h1 id="radar-page-title">Radar</h1>
            <p className="radar-command__subtitle">Classifica Product Hunt</p>
          </div>
          <p className="radar-command__source" role="status" aria-live="polite">
            {sourceLabel}
          </p>
        </header>

        <div className="radar-command__controls">
          <div className="radar-control-group" role="group" aria-labelledby="radar-range-label">
            <span id="radar-range-label" className="radar-control-group__label">Periodo</span>
            {radarRangeTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                aria-pressed={activeRange === tab.key}
                aria-controls="radar-results"
                className="radar-control-group__button"
                onClick={() => setActiveRange(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="radar-control-group" role="group" aria-labelledby="radar-view-label">
            <span id="radar-view-label" className="radar-control-group__label">Vista</span>
            {radarVisualOptions.map((option) => (
              <button
                key={option.key}
                type="button"
                aria-pressed={activeVisual === option.key}
                aria-controls="radar-results"
                className="radar-control-group__button"
                onClick={() => setActiveVisual(option.key)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div id="radar-results" className="radar-command__results" data-view={activeVisual}>
          {activeVisual === "nodes" ? (
            <div className="radar-command-field" role="region" aria-label="Radar visuale Product Hunt">
              {threeDEnabled && <Radar3DLayer />}
              <span className="radar-command-field__ring radar-command-field__ring--outer" aria-hidden="true" />
              <span className="radar-command-field__ring radar-command-field__ring--inner" aria-hidden="true" />
              <span className="radar-command-field__axis" aria-hidden="true" />
              <span className="radar-command-field__sweep" aria-hidden="true" />
              <span className="radar-command-field__core" aria-hidden="true">
                <Radar />
              </span>
              <DesktopRadarNodes range={activeRange} presentation="command" />
            </div>
          ) : (
            <DesktopRadarTable range={activeRange} />
          )}
        </div>
      </section>
    </div>
  );
}
