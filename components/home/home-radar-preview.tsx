"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";

import {
  resolveRadarDataState,
  type ProductHuntRange,
  type RadarDataState,
} from "@/lib/radar/product-hunt-contract";
import { useProductHuntRadar } from "@/lib/radar/use-product-hunt-radar";

const HOME_RADAR_DESKTOP_QUERY = "(min-width: 1024px)";

const DesktopRadarNodes = dynamic(
  () =>
    import("@/components/desktop/desktop-radar-nodes").then(
      (mod) => mod.DesktopRadarNodes,
    ),
);

/**
 * Resolve the in-stage status copy for every non-ready data state.
 * The copy must be factual and never imply live data when unavailable.
 */
function resolveStageStatusCopy(
  state: Exclude<RadarDataState, "ready">,
  message?: string,
): string {
  switch (state) {
    case "loading":
      return "Sintonizzazione del feed Product Hunt…";
    case "empty":
      return "Nessun lancio Product Hunt in questo intervallo.";
    case "missing-token":
      return "Feed Product Hunt non configurato in questo ambiente.";
    default:
      return message ?? "Feed Product Hunt non disponibile in questo momento.";
  }
}

/**
 * Home Radar — adaptive signal instrument bound to the real Product Hunt
 * pipeline (WS-C.2.A revised).
 *
 * Stage chrome (TV center disc, perimeter ticks, scan trace, signal
 * count, range badge) is always present so the section retains its
 * visual identity at every viewport and every data state.
 *
 * The 5 node slots are bound EXCLUSIVELY to the real Product Hunt
 * items. We never substitute navigation concepts (Catalogo, Radar,
 * Salvati, Confronto, Tool scelto) for live tool data — those are
 * routing labels, not signals. When the feed is not ready, the 5
 * slots stay empty and a single in-stage status pill carries the
 * factual state copy.
 */
export function HomeRadarPreview() {
  const [isDesktop, setIsDesktop] = useState(false);
  const { payload } = useProductHuntRadar("day" as ProductHuntRange);
  const dataState = resolveRadarDataState(payload);
  const hasLiveData = dataState === "ready";

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

  const status = !hasLiveData
    ? resolveStageStatusCopy(dataState, payload?.message)
    : null;

  return (
    <section
      className="home-radar-preview"
      aria-labelledby="home-radar-preview-title"
      data-radar-state={dataState}
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
          <Link href="/radar" className="btn btn--primary btn--lg home-radar-preview__cta">
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
            <strong aria-hidden="true">
              {hasLiveData ? String(payload?.items.length ?? 0).padStart(2, "0") : "—"}
            </strong>
          </span>
          <span className="home-radar-preview__range-label" aria-hidden="true">
            24H · {hasLiveData ? "LIVE" : "PREVIEW"}
          </span>

          {/* TV center brand disc — always present, the focal acquisition
              point of the instrument. Uses the canonical TooolVibes logo. */}
          <span className="home-radar-preview__core" aria-hidden="true">
            <Image
              src="/brand/tooolvibes-logo.png"
              alt=""
              width={56}
              height={56}
              className="home-radar-preview__core-logo"
              priority
            />
            <span className="home-radar-preview__core-aura" aria-hidden="true" />
            <span className="home-radar-preview__core-ring" aria-hidden="true" />
          </span>

          {/* Live Product Hunt nodes — bound to the real PH payload. The
              5 slots are occupied by real items only. When the feed is
              not ready, the stage is intentionally empty (no fake nodes). */}
          {isDesktop && hasLiveData ? (
            <div className="home-radar-preview__nodes" data-mode="live" aria-hidden="false">
              <DesktopRadarNodes range="day" />
            </div>
          ) : null}

          {/* Status pill — only present when no live data. Honest
              in-stage copy, never implies live data. */}
          {status ? (
            <p className="home-radar-preview__status" role="status" aria-live="polite">
              {status}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
