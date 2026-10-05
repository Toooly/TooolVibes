"use client";

/**
 * HomeRadarPreview - MVP 1.0 glanceable signal snapshot (NOT a mini /radar).
 *
 * FROZEN SURFACE. Home is a frozen system: this component's behaviour and
 * appearance must not change. It is kept in its own module so the full
 * logged-only Radar experience can evolve independently.
 */

import Link from "next/link";
import { useMemo } from "react";
import { ArrowRight, ChevronUp, MessageCircle } from "lucide-react";

import { resolveRadarUiModel } from "@/lib/radar/radar-ui-model";
import { useProductHuntRadar } from "@/lib/radar/use-product-hunt-radar";

// =====================================================================
// HomeRadarPreview — MVP 1.0 glanceable signal snapshot (NOT a mini /radar)
// Purpose: in ~5 seconds show what is happening now + invite to full Radar.
// =====================================================================
export function HomeRadarPreview() {
  const { payload, isLoading, isFetching } = useProductHuntRadar("day");
  const model = useMemo(
    () => resolveRadarUiModel(payload, "day"),
    [payload],
  );

  const top = model.items.slice(0, 5);

  return (
    <div
      className="tv-home-radar tv-home-radar--snapshot"
      data-state={model.state}
      data-refreshing={isFetching && !isLoading ? "true" : undefined}
      aria-busy={isLoading}
      aria-labelledby="tv-home-radar-title"
    >
      <header className="tv-home-radar__header">
        <div className="tv-home-radar__header-main">
          <h2 id="tv-home-radar-title">Cosa sta emergendo adesso</h2>
        </div>
        <span className="tv-home-radar__status" data-state={model.state} aria-hidden="true">
          <span />
        </span>
      </header>

      <p className="tv-home-radar__meta-line" aria-label="Sintesi segnali di oggi">
        {isLoading ? (
          <span className="tv-home-radar__meta-skeleton" aria-hidden="true" />
        ) : (
          <>
            {model.signalCount ?? 0} segnali
            {" · "}
            Product Hunt
            {" · "}
            aggiornato {model.updatedAtLabel}
            {model.state === "stale" ? (
              <span className="tv-home-radar__stale-mark"> · dati recenti</span>
            ) : null}
          </>
        )}
      </p>

      {isLoading ? (
        <div className="tv-home-radar__skeleton" aria-hidden="true">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="tv-home-radar__skeleton-row">
              <span className="tv-home-radar__skeleton-rank" />
              <span className="tv-home-radar__skeleton-body">
                <span className="tv-home-radar__skeleton-line tv-home-radar__skeleton-line--name" />
                <span className="tv-home-radar__skeleton-line tv-home-radar__skeleton-line--tag" />
              </span>
              <span className="tv-home-radar__skeleton-metric" />
            </div>
          ))}
        </div>
      ) : top.length > 0 ? (
        <ol className="tv-home-radar__launches" aria-label="Top lanci del periodo">
          {top.map((item, index) => {
            return (
              <li key={item.id}>
                <a
                  href={item.productHuntUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tv-home-radar__launch"
                >
                  <span className="tv-home-radar__launch-rank" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="tv-home-radar__launch-body">
                    <strong>{item.name}</strong>
                    <em>{item.tagline || "Lancio su Product Hunt"}</em>
                  </span>
                  <span className="tv-home-radar__launch-metrics">
                    <span className="tv-home-radar__launch-votes">
                      <ChevronUp size={12} aria-hidden="true" />
                      {item.votesCount > 0 ? item.votesCount : "n/d"}
                    </span>
                    {item.commentsCount > 0 ? (
                      <span className="tv-home-radar__launch-comments">
                        <MessageCircle size={10} aria-hidden="true" />
                        {item.commentsCount}
                      </span>
                    ) : null}
                  </span>
                  <span
                    className="tv-home-radar__launch-bar"
                    aria-hidden="true"
                  />
                </a>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="tv-home-radar__empty" role="status">
          {model.state === "error" || model.state === "missing-token"
            ? "Segnali non disponibili in questo momento. Nessun dato simulato."
            : "Nessun lancio nel periodo. Apri il Radar completo per altri intervalli."}
        </p>
      )}

      {top.length > 0 ? (
        <p className="tv-home-radar__hint" aria-hidden="true">
          {top.length} segnali in evidenza · Apri Radar per tutti i segnali
        </p>
      ) : null}
      <Link
        href="/radar"
        className="tv-home-radar__cta tv-gold-cta"
        aria-label="Apri il Radar completo dei nuovi lanci"
      >
        <span className="tv-gold-cta__glow" aria-hidden="true" />
        <span className="tv-gold-cta__label">Apri Radar</span>
        <ArrowRight size={14} aria-hidden="true" />
      </Link>
    </div>
  );
}
