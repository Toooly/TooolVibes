"use client";

import { useMemo, useState } from "react";
import { ExternalLink, Radar } from "lucide-react";

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

function formatCompactSignal(votesCount: number, commentsCount: number) {
  if (votesCount > 0 && commentsCount > 0) {
    return `${votesCount} voti · ${commentsCount} commenti`;
  }

  if (votesCount > 0) {
    return `${votesCount} voti`;
  }

  return "Segnale in verifica";
}

export function DesktopVibeRadar({
  initialVisual,
}: {
  initialVisual: RadarDesktopVisual;
}) {
  const [activeRange, setActiveRange] = useState<ProductHuntRange>("day");
  const [activeVisual, setActiveVisual] =
    useState<RadarDesktopVisual>(initialVisual);

  // Provenienza condivisa con le visual: stessa key, stessa cache, nessuna
  // request aggiuntiva rispetto alla visual montata.
  const { payload, isFetching, isLoading, refetch } =
    useProductHuntRadar(activeRange);
  const radarState = resolveRadarDataState(payload);
  const isStaleFallback = radarState === "ready" && payload?.stale === true;
  const topSignals = useMemo(
    () =>
      radarState === "ready" ? (payload?.items ?? []).slice(0, 5) : [],
    [payload?.items, radarState],
  );
  const sourceLabel =
    radarState === "ready"
      ? isStaleFallback
        ? `Ultima sincronizzazione Product Hunt: ${formatUtcTimeLabel(payload?.updatedAt ?? "")}`
        : `Dati live Product Hunt, aggiornati alle ${formatUtcTimeLabel(payload?.updatedAt ?? "")}`
      : radarState === "loading"
        ? "Connessione al feed Product Hunt"
        : radarState === "empty"
          ? "Nessun lancio Product Hunt in questo intervallo"
          : radarState === "missing-token"
            ? "Feed Product Hunt non configurato"
            : "Feed Product Hunt non disponibile";
  const activeRangeLabel =
    radarRangeTabs.find((range) => range.key === activeRange)?.label ??
    activeRange;
  const updatedAtLabel =
    radarState === "ready"
      ? formatUtcTimeLabel(payload?.updatedAt ?? "")
      : "--:--";
  const signalCount =
    radarState === "ready"
      ? String(payload?.items.length ?? 0)
      : radarState === "empty"
        ? "0"
        : "—";
  const signalIndexStatus =
    radarState === "loading"
      ? "In attesa dei primi segnali reali."
      : radarState === "empty"
        ? "Nessun segnale Product Hunt in questo intervallo."
        : payload?.message ?? "Indice live non disponibile in questo momento.";

  return (
    <div className="radar-command radar-command--desktop">
      <section className="radar-command__shell" aria-labelledby="radar-page-title">
        <header className="radar-command__header" data-orbit-shield>
          <div>
            <p className="radar-command__eyebrow">Product Hunt signal desk</p>
            <h1 id="radar-page-title">Radar</h1>
            <p className="radar-command__subtitle">
              Lanci reali, ordinati per periodo. Nessun dato simulato.
            </p>
          </div>
        </header>

        <div className="radar-command__workspace">
          <div
            className="radar-command__rail"
            role="group"
            aria-label="Controlli e stato del Radar"
          >
            <p className="radar-command__source" role="status" aria-live="polite">
              {sourceLabel}
            </p>

            <div className="radar-command__meta" aria-label="Stato del Radar">
              <span className="radar-command__meta-item">
                <span className="radar-command__meta-label">Ultimo scan</span>
                <span className="radar-command__meta-value">
                  {updatedAtLabel}
                </span>
              </span>
              <span className="radar-command__meta-item">
                <span className="radar-command__meta-label">Segnali</span>
                <span className="radar-command__meta-value">
                  {signalCount}
                </span>
              </span>
              <span className="radar-command__meta-item">
                <span className="radar-command__meta-label">Periodo</span>
                <span className="radar-command__meta-value">
                  {activeRangeLabel}
                </span>
              </span>
            </div>

            {radarState === "error" && (
              <button
                type="button"
                className="radar-command__retry"
                disabled={isFetching}
                onClick={refetch}
              >
                {isFetching ? "Nuovo tentativo…" : "Riprova connessione"}
              </button>
            )}

            <div className="radar-command__controls">
              <div className="radar-control-group" role="group" aria-labelledby="radar-range-label">
                <span id="radar-range-label" className="radar-control-group__label">Periodo</span>
                <div className="radar-control-group__options">
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
              </div>
              <div className="radar-control-group" role="group" aria-labelledby="radar-view-label">
                <span id="radar-view-label" className="radar-control-group__label">Vista</span>
                <div className="radar-control-group__options">
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
            </div>
          </div>

          <div
            id="radar-results"
            className="radar-command__results"
            data-view={activeVisual}
            aria-busy={isLoading || isFetching}
          >
            {activeVisual === "nodes" ? (
              <div className="radar-command-radar-view">
                <div
                  className="radar-command-field"
                  role="region"
                  aria-label="Radar visuale Product Hunt"
                  data-state={radarState}
                >
                  <span className="radar-command-field__ring radar-command-field__ring--outer" aria-hidden="true" />
                  <span className="radar-command-field__ring radar-command-field__ring--inner" aria-hidden="true" />
                  <span className="radar-command-field__axis" aria-hidden="true" />
                  {radarState === "ready" && (
                    <span
                      className="radar-command-field__sweep"
                      aria-hidden="true"
                    />
                  )}
                  <span className="radar-command-field__core" aria-hidden="true">
                    <Radar />
                  </span>
                  <DesktopRadarNodes
                    range={activeRange}
                    presentation="command"
                  />
                </div>

                <aside
                  className="radar-signal-index"
                  aria-labelledby="radar-signal-index-title"
                  data-state={radarState}
                >
                  <header className="radar-signal-index__header">
                    <div>
                      <p>Indice live</p>
                      <h2 id="radar-signal-index-title">Top segnali</h2>
                    </div>
                    <span>{signalCount}</span>
                  </header>

                  {radarState === "ready" ? (
                    <ol className="radar-signal-index__list">
                      {topSignals.map((item, index) => (
                        <li key={item.id}>
                          <a
                            href={item.productHuntUrl}
                            target={
                              item.productHuntUrl.startsWith("http")
                                ? "_blank"
                                : undefined
                            }
                            rel={
                              item.productHuntUrl.startsWith("http")
                                ? "noopener noreferrer"
                                : undefined
                            }
                            className="radar-signal-index__row"
                            aria-label={`${item.name}. ${formatCompactSignal(item.votesCount, item.commentsCount)}. Apri su Product Hunt.`}
                          >
                            <span className="radar-signal-index__rank">
                              {String(index + 1).padStart(2, "0")}
                            </span>
                            <span className="radar-signal-index__visual">
                              {item.thumbnailUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={item.thumbnailUrl}
                                  alt=""
                                  loading="lazy"
                                />
                              ) : (
                                <span>
                                  {item.name.slice(0, 2).toUpperCase()}
                                </span>
                              )}
                            </span>
                            <span className="radar-signal-index__copy">
                              <strong>{item.name}</strong>
                              <small>{item.tagline}</small>
                            </span>
                            <span className="radar-signal-index__metric">
                              {item.votesCount > 0
                                ? `${item.votesCount} voti`
                                : "In verifica"}
                            </span>
                            <ExternalLink size={13} aria-hidden="true" />
                          </a>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p
                      className="radar-signal-index__status"
                      role="status"
                      aria-live="polite"
                    >
                      {signalIndexStatus}
                    </p>
                  )}
                </aside>
              </div>
            ) : (
              <DesktopRadarTable range={activeRange} />
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
