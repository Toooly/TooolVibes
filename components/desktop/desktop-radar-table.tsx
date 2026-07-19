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
    <div className="desktop-radar-table__body" aria-hidden="true">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="desktop-radar-table__row is-loading">
          <span className="desktop-radar-table__rank" />
          <span className="desktop-radar-table__visual" />
          <span className="desktop-radar-table__copy">
            <span />
            <small />
          </span>
          <span className="desktop-radar-table__metric" />
          <span className="desktop-radar-table__open" />
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
      className="desktop-radar-table"
      aria-label="Classifica Product Hunt"
      aria-busy={isLoading}
    >
      <div className="desktop-radar-table__topbar">
        <span className="desktop-radar-table__updated">{updatedLabel}</span>
      </div>

      <div className="desktop-radar-table__head" aria-hidden="true">
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
              className="mx-4 mt-4 rounded-[18px] border border-white/10 bg-white/[0.055] p-4 text-sm leading-6 text-white/70"
              role="status"
            >
              {payload?.message ?? "Aggiornamento live non riuscito."} Ultima
              classifica reale sincronizzata:{" "}
              {formatUtcTimeLabel(payload?.updatedAt ?? "")}.
            </p>
          )}
          <div className="desktop-radar-table__body">
            {items.slice(0, 10).map((item, index) => (
              <a
                key={item.id}
                href={item.productHuntUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="desktop-radar-table__row"
              >
                <span className="desktop-radar-table__rank">#{index + 1}</span>
                <span className="desktop-radar-table__visual">
                  {item.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.thumbnailUrl} alt="" loading="lazy" />
                  ) : (
                    <span>{item.name.slice(0, 2).toUpperCase()}</span>
                  )}
                </span>
                <span className="desktop-radar-table__copy">
                  <strong>{item.name}</strong>
                  <small>{item.tagline}</small>
                </span>
                <span className="desktop-radar-table__metric">{formatSignal(item)}</span>
                <span className="desktop-radar-table__open">
                  Apri
                  <ExternalLink size={13} aria-hidden="true" />
                </span>
              </a>
            ))}
          </div>
        </>
      ) : (
        <div className="desktop-radar-table__empty">
          <strong>
            {radarState === "empty"
              ? "Nessun segnale Product Hunt in questo intervallo."
              : (payload?.message ?? "Classifica Product Hunt non disponibile.")}
          </strong>
          <span>Il radar resta vuoto finche non tornano dati reali.</span>
        </div>
      )}
    </section>
  );
}
