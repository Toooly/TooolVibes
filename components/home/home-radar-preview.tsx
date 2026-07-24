"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, type CSSProperties } from "react";
import { ArrowRight, Bookmark, Compass, GitCompare, Radar, Sparkles } from "lucide-react";

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

const FALLBACK_ICON_MAP = {
  Bookmark,
  Compass,
  GitCompare,
  Radar,
  Sparkles,
} as const;

export type RadarFallbackRoute = {
  id: string;
  label: string;
  href: string;
  color: string;
  icon: keyof typeof FALLBACK_ICON_MAP;
  badge?: string;
};

type HomeRadarPreviewProps = {
  /** When Product Hunt data is not available, the instrument shows these
   *  5 named route destinations around the TooolVibes center. Real
   *  Product Hunt items take over as soon as the live payload is ready,
   *  without re-mounting the stage chrome (TV disc, ticks, scan). */
  fallbackNodes: RadarFallbackRoute[];
};

/** Five node positions around the TooolVibes center — even clock
 *  distribution (every 72°) so the instrument reads as a coherent
 *  signal acquisition ring at any viewport. Mirrors the same slot
 *  convention as `nodeLayout` in `desktop-radar-nodes.tsx` so the
 *  live Product Hunt items and the fallback route destinations share
 *  the same geometry. */
const FALLBACK_NODE_LAYOUT = [
  { x: 50, y: 16, angle: -90, rank: 1, size: 1.08 },
  { x: 82, y: 38, angle: -18, rank: 2, size: 1.0 },
  { x: 72, y: 78, angle: 54, rank: 3, size: 0.98 },
  { x: 28, y: 78, angle: 126, rank: 4, size: 0.98 },
  { x: 18, y: 38, angle: 198, rank: 5, size: 1.0 },
] as const;

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
      return "Anteprima delle rotte principali in attesa del feed live.";
    default:
      return message ?? "Anteprima statica · il feed live tornerà al più presto.";
  }
}

function FallbackNode({
  route,
  index,
}: {
  route: RadarFallbackRoute;
  index: number;
}) {
  const layout = FALLBACK_NODE_LAYOUT[index] ?? FALLBACK_NODE_LAYOUT[0];
  const Icon = FALLBACK_ICON_MAP[route.icon];
  const nodeStyle = {
    "--node-x": `${layout.x}%`,
    "--node-y": `${layout.y}%`,
    "--node-angle": `${layout.angle}deg`,
    "--node-counter-angle": `${-layout.angle}deg`,
    "--node-scale": layout.size,
    "--node-color": route.color,
  } as CSSProperties;

  return (
    <Link
      href={route.href}
      className="home-radar-node home-radar-node--fallback"
      style={nodeStyle}
      aria-label={`Apri ${route.label}`}
    >
      <span className="home-radar-node__ring" aria-hidden="true" />
      <span className="home-radar-node__body" aria-hidden="true">
        <Icon size={18} aria-hidden="true" />
      </span>
      <span className="home-radar-node__label">
        <strong>{route.label}</strong>
        <small>{route.badge ?? "Apri rotta"}</small>
      </span>
      <span className="home-radar-node__badge" aria-hidden="true">
        #{layout.rank}
      </span>
    </Link>
  );
}

/**
 * Home Radar — adaptive signal instrument.
 *
 * Stage chrome (TV center disc, perimeter ticks, scan trace, status
 * pills) is always present so the section never feels empty. When the
 * Product Hunt live payload is ready, DesktopRadarNodes takes over the
 * 5 node positions with the real items. When it is not, the 5 named
 * fallback routes occupy the same coordinates so the instrument
 * retains its dignity in loading / empty / missing-token / error
 * states.
 */
export function HomeRadarPreview({ fallbackNodes }: HomeRadarPreviewProps) {
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

          {/* Fallback nodes — 5 named route destinations. These occupy
              the same node coordinates as the live Product Hunt items
              so the live layer drops in without geometry changes. */}
          <div
            className="home-radar-preview__nodes"
            data-mode="fallback"
            aria-hidden={hasLiveData}
          >
            {fallbackNodes.slice(0, 5).map((route, index) => (
              <FallbackNode key={route.id} route={route} index={index} />
            ))}
          </div>

          {/* Live Product Hunt nodes — overlay on top of the fallback
              when desktop + data is ready. Hidden at <1024 so the mobile
              hero never triggers the PH query. */}
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
