"use client";

/**
 * Accessible SVG Radar map (spec §27).
 *
 * Semantic DOM, keyboard-selectable blips, 44px effective touch targets via
 * transparent hit circles, and a parallel semantic list for screen readers
 * (rendered by the parent). No canvas, no render loop, no random layout.
 *
 * GEOMETRY MEANING (see `RADAR_VISUAL_SEMANTICS`):
 *   angle  → RadarTopicCluster sector
 *   radius → age within the selected range (center = now, edge = oldest)
 *   size   → relative attention (sqrt-scaled)
 *   colour → RadarTopicCluster
 */

import { useId } from "react";

import {
  RADAR_CATEGORY_PALETTE,
  type RadarClusterSummary,
} from "@/lib/radar/radar-domain";
import {
  assertRadarPointsInBounds,
  layoutRadarPoints,
  radarRingLabels,
  RADAR_CENTER,
  RADAR_RING_CENTER_LABEL,
  type RadarPoint,
} from "@/lib/radar/radar-geometry";
import type { RadarTool } from "@/lib/radar/radar-domain";
import type { ProductHuntRange } from "@/lib/radar/product-hunt-contract";

export type RadarMapProps = {
  tools: readonly RadarTool[];
  clusters: readonly RadarClusterSummary[];
  /** Selected time range — radius encodes age inside it. */
  range: ProductHuntRange;
  selectedId: string | null;
  highlightedId?: string | null;
  onSelect: (toolId: string) => void;
};

/** viewBox units → effective px at a 320px-wide render (≈44px touch target). */
const HIT_RADIUS_VIEWBOX = 7;

export function RadarMap({
  tools,
  clusters,
  range,
  selectedId,
  highlightedId,
  onSelect,
}: RadarMapProps) {
  const titleId = useId();
  const fieldId = useId();
  const glowId = useId();
  const layout = layoutRadarPoints(tools, { rangeHours: rangeHoursFor(range) });

  if (process.env.NODE_ENV !== "production") {
    if (!assertRadarPointsInBounds(layout.points)) {
      // Loud in development: a semantic geometry invariant has been violated.
      console.error("[radar-map] point outside instrument bounds");
    }
  }

  const colorByCluster = new Map(
    clusters.map((cluster) => [
      cluster.id,
      RADAR_CATEGORY_PALETTE[cluster.colorIndex % RADAR_CATEGORY_PALETTE.length],
    ]),
  );
  const pointById = new Map(layout.points.map((point) => [point.id, point]));
  const rings = radarRingLabels(range);

  return (
    <div className="tv-rx-map" data-basis={layout.radiusBasis}>
      <svg
        className="tv-rx-map__svg"
        viewBox="0 0 100 100"
        role="group"
        aria-labelledby={titleId}
        preserveAspectRatio="xMidYMid meet"
      >
        <title id={titleId}>
          Mappa radiale dei segnali del Radar. Settore = area Radar, distanza
          dal centro = quando è emerso (al centro = più recente), dimensione =
          attenzione relativa (voti + commenti), colore = area Radar.
        </title>

        <defs>
          <radialGradient id={fieldId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" className="tv-rx-map__field-stop tv-rx-map__field-stop--core" />
            <stop offset="55%" className="tv-rx-map__field-stop tv-rx-map__field-stop--mid" />
            <stop offset="100%" className="tv-rx-map__field-stop tv-rx-map__field-stop--edge" />
          </radialGradient>
          <radialGradient id={glowId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" className="tv-rx-map__glow-stop tv-rx-map__glow-stop--in" />
            <stop offset="100%" className="tv-rx-map__glow-stop tv-rx-map__glow-stop--out" />
          </radialGradient>
        </defs>

        {/* Static translucent instrument field. No animated gradient, no blur. */}
        <circle
          cx={RADAR_CENTER}
          cy={RADAR_CENTER}
          r={42}
          className="tv-rx-map__field"
          fill={`url(#${fieldId})`}
          aria-hidden="true"
        />
        <circle
          cx={RADAR_CENTER}
          cy={RADAR_CENTER}
          r={42}
          className="tv-rx-map__field-rim"
          aria-hidden="true"
        />

        <g className="tv-rx-map__grid" aria-hidden="true">
          {rings.map((ring, index) => (
            <circle
              key={ring.label}
              cx={RADAR_CENTER}
              cy={RADAR_CENTER}
              r={42 * ring.ratio}
              className="tv-rx-map__ring"
              data-ring-index={String(index)}
              data-ring-outer={index >= rings.length - 2 ? "true" : undefined}
            />
          ))}
          <line x1="8" y1="50" x2="92" y2="50" className="tv-rx-map__axis" />
          <line x1="50" y1="8" x2="50" y2="92" className="tv-rx-map__axis" />
          {layout.clusterOrder.map((clusterId, index) => {
            const angle = ((index * (360 / Math.max(layout.sectorCount, 1)) - 90) * Math.PI) / 180;
            return (
              <line
                key={clusterId}
                x1={RADAR_CENTER}
                y1={RADAR_CENTER}
                x2={RADAR_CENTER + 42 * Math.cos(angle)}
                y2={RADAR_CENTER + 42 * Math.sin(angle)}
                className="tv-rx-map__sector"
              />
            );
          })}
        </g>

        {/* §11 — minimal time labels along ONE axis only (12 o'clock). */}
        <g className="tv-rx-map__time-axis" aria-hidden="true">
          <text
            x={RADAR_CENTER}
            y={RADAR_CENTER - 3}
            textAnchor="middle"
            className="tv-rx-map__ring-label"
            fontSize="3.1"
          >
            {RADAR_RING_CENTER_LABEL}
          </text>
          {rings.map((ring) => (
            <text
              key={`label-${ring.label}`}
              x={RADAR_CENTER}
              y={RADAR_CENTER - 42 * ring.ratio - 1.1}
              textAnchor="middle"
              className="tv-rx-map__ring-label"
              fontSize="3.1"
            >
              {ring.label}
            </text>
          ))}
        </g>

        {/* Subtle static core. Purely static gradient/opacity. */}
        <circle
          cx={RADAR_CENTER}
          cy={RADAR_CENTER}
          r={15}
          className="tv-rx-map__core-glow"
          fill={`url(#${glowId})`}
          aria-hidden="true"
        />
        <circle
          cx={RADAR_CENTER}
          cy={RADAR_CENTER}
          r={7}
          className="tv-rx-map__core"
          aria-hidden="true"
        />

        <g className="tv-rx-map__points">
          {tools.map((tool) => {
            const point = pointById.get(tool.id);
            if (!point) return null;
            const color =
              colorByCluster.get(tool.topicCluster.id) ??
              RADAR_CATEGORY_PALETTE[tool.topicCluster.colorIndex % RADAR_CATEGORY_PALETTE.length];
            const isSelected = selectedId === tool.id;
            const isHighlighted = highlightedId === tool.id;
            const selectedClusterId = selectedId
              ? (pointById.get(selectedId)?.clusterId ?? null)
              : null;
            const context = isSelected
              ? "selected"
              : selectedClusterId === null
                ? "idle"
                : tool.topicCluster.id === selectedClusterId
                  ? "same-cluster"
                  : "other-cluster";
            return (
              <g
                key={tool.id}
                className="tv-rx-blip"
                data-selected={isSelected ? "true" : undefined}
                data-highlighted={isHighlighted ? "true" : undefined}
                data-category={tool.topicCluster.id}
                data-cluster={tool.topicCluster.id}
                data-context={context}
                data-age-unknown={point.ageKnown ? undefined : "true"}
                data-catalog-status={tool.catalogStatus}
                onClick={() => onSelect(tool.id)}
                style={{ cursor: "pointer" }}
              >
                {/* 44px effective touch target (transparent). */}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={HIT_RADIUS_VIEWBOX}
                  className="tv-rx-blip__hit"
                  role="button"
                  tabIndex={0}
                  aria-label={blipAriaLabel(tool, point)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onSelect(tool.id);
                    }
                  }}
                />
                {(isSelected || isHighlighted) && (
                  <circle
                    style={{ pointerEvents: "none" }}
                    cx={point.x}
                    cy={point.y}
                    r={point.size * 2.7}
                    fill={color}
                    className="tv-rx-blip__halo"
                    aria-hidden="true"
                  />
                )}
                {isSelected && (
                  <circle
                    style={{ pointerEvents: "none" }}
                    cx={point.x}
                    cy={point.y}
                    r={point.size * 1.95}
                    fill="none"
                    className="tv-rx-blip__ring"
                    aria-hidden="true"
                  />
                )}
                <circle
                  style={{ pointerEvents: "none" }}
                  cx={point.x}
                  cy={point.y}
                  r={point.size}
                  fill={color}
                  className="tv-rx-blip__dot"
                  aria-hidden="true"
                />
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}

function rangeHoursFor(range: ProductHuntRange): number {
  return range === "week" ? 168 : range === "month" ? 720 : 24;
}

function blipAriaLabel(tool: RadarTool, point: RadarPoint): string {
  const emerged =
    point.ageKnown && point.ageHours !== null
      ? `emerso ${formatAgeHours(point.ageHours)} fa`
      : "data di lancio sconosciuta";
  return `${tool.name}. Area ${tool.topicCluster.label}. ${emerged}. ${tool.votesCount} voti, ${tool.commentsCount} commenti, posizione ${tool.rank}.`;
}

function formatAgeHours(ageHours: number): string {
  if (ageHours < 1) return "meno di un'ora";
  if (ageHours < 48) return `${Math.round(ageHours)} ore`;
  return `${Math.round(ageHours / 24)} giorni`;
}

export function radarPointForTest(
  tools: readonly RadarTool[],
  id: string,
  range: ProductHuntRange = "day",
): RadarPoint | undefined {
  return layoutRadarPoints(tools, { rangeHours: rangeHoursFor(range) }).points.find(
    (point) => point.id === id,
  );
}
