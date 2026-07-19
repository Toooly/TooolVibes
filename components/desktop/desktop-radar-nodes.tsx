"use client";

import { useMemo, type CSSProperties } from "react";

import {
  resolveRadarDataState,
  type ProductHuntRange,
  type RadarDataState,
} from "@/lib/radar/product-hunt-contract";
import { useProductHuntRadar } from "@/lib/radar/use-product-hunt-radar";

/**
 * Nodi desktop del Radar (B44 / DESK-804).
 *
 * Nessun fallback inventato (chiusura gap B36): i nodi esistono solo con
 * dati reali Product Hunt; loading/empty/missing-token/error mostrano uno
 * stato onesto dentro lo stage. Dati e cache arrivano dalla query condivisa
 * `useProductHuntRadar` (una request per key con tabella e header).
 */

const DESKTOP_RADAR_NODE_COUNT = 5;

const nodeLayout = [
  { x: 50, y: 22, angle: -90, radius: "clamp(10.8rem, 14vw, 13rem)", delay: -0.1, size: 1.06 },
  { x: 76, y: 41, angle: -18, radius: "clamp(11.6rem, 15vw, 14.4rem)", delay: -1.08, size: 0.98 },
  { x: 66, y: 72, angle: 42, radius: "clamp(10.4rem, 13.2vw, 12.8rem)", delay: -2.02, size: 1 },
  { x: 34, y: 72, angle: 138, radius: "clamp(10.4rem, 13.2vw, 12.8rem)", delay: -3.05, size: 0.96 },
  { x: 24, y: 41, angle: 198, radius: "clamp(11.6rem, 15vw, 14.4rem)", delay: -4.18, size: 0.92 },
];

function resolveStageStatusCopy(
  state: Exclude<RadarDataState, "ready">,
  message?: string,
): string {
  switch (state) {
    case "loading":
      return "Connessione al feed Product Hunt…";
    case "empty":
      return "Nessun segnale Product Hunt in questo intervallo.";
    default:
      return message ?? "Feed Product Hunt non disponibile.";
  }
}

export function DesktopRadarNodes({ range }: { range: ProductHuntRange }) {
  const { payload, isLoading } = useProductHuntRadar(range);
  const radarState = resolveRadarDataState(payload);

  const nodes = useMemo(() => {
    if (radarState !== "ready") return [];

    const pool = (payload?.items ?? []).slice(0, DESKTOP_RADAR_NODE_COUNT);
    const maxVotes = Math.max(...pool.map((item) => item.votesCount || 1), 1);

    return pool.map((item, index) => {
      const layout = nodeLayout[index] ?? nodeLayout[0];
      const heat = Math.max(0.7, Math.min(1.18, (item.votesCount || 1) / maxVotes + 0.42));
      return {
        ...item,
        layout,
        heat,
        index,
      };
    });
  }, [payload?.items, radarState]);

  if (radarState !== "ready") {
    return (
      <div
        className={`desktop-radar-nodes${isLoading ? "" : " is-loaded"}`}
        aria-label="Top 5 tool nel radar live"
        aria-busy={isLoading}
      >
        <p
          className="absolute left-1/2 top-1/2 z-[6] w-full max-w-[16rem] -translate-x-1/2 -translate-y-1/2 text-center text-sm font-medium text-white/65"
          role={radarState === "loading" ? undefined : "status"}
        >
          {resolveStageStatusCopy(radarState, payload?.message)}
        </p>
      </div>
    );
  }

  return (
    <div
      className="desktop-radar-nodes is-loaded"
      aria-label="Top 5 tool nel radar live"
    >
      {nodes.map((node) => {
        const iconStyle = node.thumbnailUrl
          ? ({ "--node-img": `url("${node.thumbnailUrl}")` } as CSSProperties)
          : undefined;
        const nodeStyle = {
          "--node-x": `${node.layout.x}%`,
          "--node-y": `${node.layout.y}%`,
          "--node-angle": `${node.layout.angle}deg`,
          "--node-counter-angle": `${-node.layout.angle}deg`,
          "--node-radius": node.layout.radius,
          "--node-delay": `${node.layout.delay}s`,
          "--node-scale": node.layout.size,
          "--node-heat": node.heat,
        } as CSSProperties;

        return (
          <a
            key={node.id}
            href={node.productHuntUrl}
            target={node.productHuntUrl.startsWith("http") ? "_blank" : undefined}
            rel={node.productHuntUrl.startsWith("http") ? "noopener noreferrer" : undefined}
            className="desktop-radar-node"
            style={nodeStyle}
            aria-label={`${node.name}. ${node.votesCount} voti, posizione ${node.index + 1}`}
          >
            <span className="desktop-radar-node__halo" aria-hidden="true" />
            <span className="desktop-radar-node__ring" aria-hidden="true" />
            <span className="desktop-radar-node__body" style={iconStyle}>
              {node.thumbnailUrl ? null : (
                <span className="desktop-radar-node__initials">
                  {node.name.slice(0, 2).toUpperCase()}
                </span>
              )}
            </span>
            <span className="desktop-radar-node__label">
              <strong>{node.name}</strong>
              <small>{node.votesCount || "in scansione"} voti</small>
            </span>
            {node.index === 0 ? <span className="desktop-radar-node__badge">Caldo</span> : null}
          </a>
        );
      })}
    </div>
  );
}
