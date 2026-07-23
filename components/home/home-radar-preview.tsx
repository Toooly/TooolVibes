"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Radar } from "lucide-react";

const HOME_RADAR_DESKTOP_QUERY = "(min-width: 1024px)";

const DesktopRadarNodes = dynamic(
  () =>
    import("@/components/desktop/desktop-radar-nodes").then(
      (mod) => mod.DesktopRadarNodes,
    ),
);

/**
 * Desktop-only window into the canonical Product Hunt Radar.
 *
 * The data-bearing child is mounted only when the desktop media query
 * matches, so mobile keeps the existing Home tree and does not trigger a
 * hidden Product Hunt request. DesktopRadarNodes owns the single shared
 * query for the fixed daily range; no second header/query consumer is used.
 */
export function HomeRadarPreview() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;

    const media = window.matchMedia(HOME_RADAR_DESKTOP_QUERY);
    const update = () => setIsDesktop(media.matches);

    update();
    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", update);
      return () => media.removeEventListener("change", update);
    }

    media.addListener(update);
    return () => media.removeListener(update);
  }, []);

  return (
    <section
      className="home-radar-preview"
      aria-labelledby="home-radar-preview-title"
    >
      <div className="home-radar-preview__inner">
        <div className="home-radar-preview__copy">
          <p className="home-radar-preview__source">
            <span aria-hidden="true" />
            Feed Product Hunt · dati non simulati
          </p>
          <h2 id="home-radar-preview-title">Radar live</h2>
          <p>
            Leggi i lanci del giorno come segnali, apri quelli più rilevanti
            e passa alla vista completa quando vuoi approfondire.
          </p>
          <Link href="/radar" className="home-radar-preview__cta">
            Apri il Radar completo
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>

        <div
          className="home-radar-preview__stage"
          aria-label="Anteprima dei segnali Product Hunt del giorno"
        >
          <span className="home-radar-preview__ticks" aria-hidden="true" />
          <span className="home-radar-preview__axis" aria-hidden="true" />
          <span className="home-radar-preview__signal-count" aria-hidden="true">
            <span>SIGNAL</span>
            <strong aria-hidden="true">07</strong>
          </span>
          <span className="home-radar-preview__range-label" aria-hidden="true">
            24H · LIVE
          </span>
          <span className="home-radar-preview__core" aria-hidden="true">
            <Radar />
          </span>
          {isDesktop ? (
            <DesktopRadarNodes range="day" />
          ) : (
            <span className="home-radar-preview__loading" role="status">
              Sintonizzazione dei segnali…
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
