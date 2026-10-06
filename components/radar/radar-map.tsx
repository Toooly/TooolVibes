"use client";

/**
 * Accessible SVG Radar map (spec §27).
 *
 * Semantic DOM, keyboard-selectable blips, 44px effective touch targets via
 * transparent hit circles, and a parallel semantic list for screen readers
 * (rendered by the parent). No canvas, no render loop, no random layout.
 *
 * GEOMETRY MEANING (see `RADAR_VISUAL_SEMANTICS`):
 *   angle  → RadarTopicCluster sector on ONE FIXED GLOBAL COMPASS
 *   radius → age within the selected range (center = now, edge = oldest)
 *   size   → relative attention (sqrt-scaled)
 *   colour → RadarTopicCluster
 *
 * TOUCH (spec §1): a physical tap is resolved by ONE central function
 * (`resolveRadarTap`) against every point's true centre, never by whatever
 * element the browser happens to hit first. When two centres are genuinely
 * indistinguishable the map reports `ambiguous` and the parent offers a chooser.
 */

import { useCallback, useId, useRef } from "react";

import {
  RADAR_CATEGORY_PALETTE,
  type RadarClusterSummary,
  type RadarTool,
} from "@/lib/radar/radar-domain";
import {
  assertRadarPointsInBounds,
  layoutRadarPoints,
  radarRingLabels,
  resolveRadarTap,
  RADAR_CENTER,
  RADAR_COMPASS_SECTOR_SPAN_DEG,
  RADAR_HIT_RADIUS_VIEWBOX,
  RADAR_RING_CENTER_LABEL,
  type RadarPoint,
  type RadarTapCandidate,
} from "@/lib/radar/radar-geometry";
import type { ProductHuntRange } from "@/lib/radar/product-hunt-contract";

export type RadarMapProps = {
  /**
   * The FULL dataset. Geometry is ALWAYS computed from this, so filtering or
   * searching can never move an existing point (spec §2).
   */
  layoutTools: readonly RadarTool[];
  /** Ids currently visible (filter/search). `null`/absent = all visible. */
  visibleIds?: ReadonlySet<string> | null;
  clusters: readonly RadarClusterSummary[];
  /** Selected time range — radius encodes age inside it. */
  range: ProductHuntRange;
  selectedId: string | null;
  highlightedId?: string | null;
  onSelect: (toolId: string) => void;
  /** Fired when a tap is genuinely ambiguous — parent shows the chooser. */
  onAmbiguous?: (candidates: readonly RadarTapCandidate[]) => void;
};

export function RadarMap({
  layoutTools,
  visibleIds,
  clusters,
  range,
  selectedId,
  highlightedId,
  onSelect,
  onAmbiguous,
}: RadarMapProps) {
  const titleId = useId();
  const fieldId = useId();
  const glowId = useId();
  const svgRef = useRef<SVGSVGElement | null>(null);

  // §2 — layout is computed from the FULL set, once per dataset.
  const layout = layoutRadarPoints(layoutTools, {
    rangeHours: rangeHoursFor(range),
  });

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

  const isVisible = (id: string) => !visibleIds || visibleIds.has(id);

  // §1 — the single place a physical tap becomes a selection.
  const handlePointerDown = useCallback(
    (event: React.PointerEvent<SVGSVGElement>) => {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      // viewBox is 0..100 and the SVG is square (aspect-ratio 1 container).
      const pointerX = ((event.clientX - rect.left) / rect.width) * 100;
      const pointerY = ((event.clientY - rect.top) / rect.height) * 100;

      // Only visible points may be selected.
      const visiblePoints = layout.points.filter(
        (point) => !visibleIds || visibleIds.has(point.id),
      );
      const resolution = resolveRadarTap(visiblePoints, pointerX, pointerY);

      if (resolution.kind === "selected") {
        onSelect(resolution.id);
        return;
      }
      if (resolution.kind === "ambiguous" && onAmbiguous) {
        onAmbiguous(resolution.candidates);
      }
    },
    [layout.points, onAmbiguous, onSelect, visibleIds],
  );

  return (
    <div className="tv-rx-map" data-basis={layout.radiusBasis}>
      <svg
        ref={svgRef}
        className="tv-rx-map__svg"
        viewBox="0 0 100 100"
        role="group"
        aria-labelledby={titleId}
        preserveAspectRatio="xMidYMid meet"
        onPointerDown={handlePointerDown}
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
          {/* Permanent compass dividers — one per cluster, always in the same
              place, so filtering can never rotate the map. */}
          {layout.clusterOrder.map((clusterId, index) => {
            const angle =
              ((index * RADAR_COMPASS_SECTOR_SPAN_DEG - 90) * Math.PI) / 180;
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
          {layoutTools.map((tool) => {
            if (!isVisible(tool.id)) return null;
            const point = pointById.get(tool.id);
            if (!point) return null;
            const color =
              colorByCluster.get(tool.topicCluster.id) ??
              RADAR_CATEGORY_PALETTE[
                tool.topicCluster.colorIndex % RADAR_CATEGORY_PALETTE.length
              ];
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
              >
                {/* 44px effective touch target (transparent). Keyboard-only
                    focus; pointer selection is resolved centrally above. */}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={RADAR_HIT_RADIUS_VIEWBOX}
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
                {/* §5 — entity type marker, WITHOUT changing the cluster colour:
                    an external signal is a solid cluster-coloured dot; a
                    catalog-linked signal keeps that colour plus a neutral inner
                    marker. */}
                {tool.catalogStatus === "linked" ? (
                  <circle
                    style={{ pointerEvents: "none" }}
                    cx={point.x}
                    cy={point.y}
                    r={Math.max(point.size * 0.42, 0.75)}
                    className="tv-rx-blip__entity"
                    aria-hidden="true"
                  />
                ) : null}
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
  const entity =
    tool.catalogStatus === "linked"
      ? "nel catalogo TooolVibes"
      : "segnale esterno di Product Hunt";
  return `${tool.name}. ${entity}. Area ${tool.topicCluster.label}. ${emerged}. ${tool.votesCount} voti, ${tool.commentsCount} commenti, posizione ${tool.rank}.`;
}

function formatAgeHours(ageHours: number): string {
  if (ageHours < 1) return "meno di un'ora";
  if (ageHours < 48) return `${Math.round(ageHours)} ore`;
  return `${Math.round(ageHours / 24)} giorni`;
}

export function radarPointForTest(
  tools: readonly RadarTool[],
  id: string,
  range: ProductHuntRange = "week",
): RadarPoint | undefined {
  return layoutRadarPoints(tools, { rangeHours: rangeHoursFor(range) }).points.find(
    (point) => point.id === id,
  );
}

export type { RadarTapCandidate };
