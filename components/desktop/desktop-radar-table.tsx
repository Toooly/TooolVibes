"use client";

import { useMemo } from "react";
import { ExternalLink } from "lucide-react";

import {
  formatUtcTimeLabel,
  resolveRadarDataState,
  type ProductHuntItem,
  type ProductHuntRange,
} from "@/lib/radar/product-hunt-contract";
import { useProductHuntRadar } from "@/lib/radar/use-product-hunt-radar";

/**
 * Tabella desktop del Radar (B44 / DESK-804 / PERF-1202).
 *
 * Il range è controllato dalla composizione (`DesktopVibeRadar`): i tab di
 * periodo vivono nella control bar condivisa, così lo switch di visual non
 * perde la selezione. Dati e cache arrivano dalla query condivisa
 * `useProductHuntRadar` (una request per key, switch di visual servito da
 * cache). Timestamp e fallback seguono il contratto B36: label UTC
 * deterministiche e banner stale dichiarato, nessun dato inventato.
 */

function formatSignal(item: ProductHuntItem) {
  if (item.votesCount > 0 && item.commentsCount > 0) {
    return `${item.votesCount} voti / ${item.commentsCount} commenti`;
  }

  if (item.votesCount > 0) {
    return `${item.votesCount} voti`;
  }

  return "Segnale in verifica";
}

function DesktopRadarTableSkeleton() {
  return (
    <div className="radar-command-table__body" aria-hidden="true">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="radar-command-table__row is-loading">
          <span className="radar-command-table__rank" />
          <span className="radar-command-table__visual" />
          <span className="radar-command-table__copy">
            <span />
            <small />
          </span>
          <span className="radar-command-table__metric" />
          <span className="radar-command-table__open" />
        </div>
      ))}
    </div>
  );
}

export function DesktopRadarTable({ range }: { range: ProductHuntRange }) {
  const { payload, isLoading } = useProductHuntRadar(range);
  const radarState = resolveRadarDataState(payload);
  const items = useMemo(() => payload?.items ?? [], [payload?.items]);
  const isStaleFallback = radarState === "ready" && payload?.stale === true;

  const updatedLabel =
    radarState === "loading"
      ? "Aggiornamento in corso…"
      : radarState === "ready"
        ? isStaleFallback
          ? `Ultima sync: ${formatUtcTimeLabel(payload?.updatedAt ?? "")}`
          : `Aggiornato: ${formatUtcTimeLabel(payload?.updatedAt ?? "")}`
        : "Aggiornamento non disponibile";

  return (
    <section
      className="radar-command-table"
      aria-label="Classifica Product Hunt"
      aria-busy={isLoading}
    >
      <div className="radar-command-table__topbar">
        <span className="radar-command-table__updated">{updatedLabel}</span>
      </div>

      <div className="radar-command-table__head" aria-hidden="true">
        <span>#</span>
        <span>Tool</span>
        <span>Segnale</span>
        <span>Link</span>
      </div>

      {radarState === "loading" ? (
        <DesktopRadarTableSkeleton />
      ) : radarState === "ready" ? (
        <>
          {isStaleFallback && (
            <p
              className="radar-command__notice"
              role="status"
              aria-live="polite"
            >
              {payload?.message ?? "Aggiornamento live non riuscito."} Ultima
              classifica reale sincronizzata:{" "}
              {formatUtcTimeLabel(payload?.updatedAt ?? "")}.
            </p>
          )}
          <div className="radar-command-table__body">
            {items.slice(0, 10).map((item, index) => (
              <a
                key={item.id}
                href={item.productHuntUrl}
                target={item.productHuntUrl.startsWith("http") ? "_blank" : undefined}
                rel={item.productHuntUrl.startsWith("http") ? "noopener noreferrer" : undefined}
                className="radar-command-table__row"
                aria-label={`${item.name}. ${formatSignal(item)}. Apri su Product Hunt.`}
              >
                <span className="radar-command-table__rank">#{index + 1}</span>
                <span className="radar-command-table__visual">
                  {item.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.thumbnailUrl} alt="" loading="lazy" />
                  ) : (
                    <span>{item.name.slice(0, 2).toUpperCase()}</span>
                  )}
                </span>
                <span className="radar-command-table__copy">
                  <strong>{item.name}</strong>
                  <small>{item.tagline}</small>
                </span>
                <span className="radar-command-table__metric">{formatSignal(item)}</span>
                <span className="radar-command-table__open">
                  Apri
                  <ExternalLink size={13} aria-hidden="true" />
                </span>
              </a>
            ))}
          </div>
        </>
      ) : (
        <div className="radar-command-table__empty" role="status" aria-live="polite">
          <strong>
            {radarState === "empty"
              ? "Nessun segnale Product Hunt in questo intervallo."
              : (payload?.message ?? "Classifica Product Hunt non disponibile.")}
          </strong>
          <span>Il radar resta vuoto finché non tornano dati reali.</span>
        </div>
      )}
    </section>
  );
}
