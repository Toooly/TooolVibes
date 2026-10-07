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
  compressVisualRadiusForOverview,
  layoutRadarPoints,
  radarRingLabels,
  resolveRadarTap,
  RADAR_CENTER,
  RADAR_COMPASS_SECTOR_SPAN_DEG,
  RADAR_HIT_RADIUS_VIEWBOX,
  RADAR_TAP_AMBIGUITY_EPSILON,
  RADAR_RING_CENTER_LABEL,
  type RadarPoint,
  type RadarTapCandidate,
} from "@/lib/radar/radar-geometry";
import type { ProductHuntRange } from "@/lib/radar/product-hunt-contract";
import { radarOverviewHiddenLabel } from "@/lib/radar/radar-lod";
import {
  radarCameraZoom,
  type RadarCameraPlan,
} from "@/lib/radar/radar-camera";
import {
  radarScreenToViewBox,
  radarViewBoxToDisplay,
  type RadarPoint2,
} from "@/lib/radar/radar-projection";
import type { RadarSpiderPlan } from "@/lib/radar/radar-spiderfy";

/** Width of the transparent sector-rim affordance, viewBox units (§4). */
const RADAR_SECTOR_HIT_WIDTH = 9;

export type RadarMapProps = {
  /**
   * The FULL dataset. Geometry is ALWAYS computed from this, so filtering or
   * searching can never move an existing point (spec §2).
   */
  layoutTools: readonly RadarTool[];
  /** Ids currently visible (filter/search). `null`/absent = all visible. */
  visibleIds?: ReadonlySet<string> | null;
  /**
   * Ids that may actually be selected. Cluster FOCUS sets this to the focused
   * cluster only — its contextual neighbours are painted but NON-INTERACTIVE
   * (spec §6). `null`/absent = everything visible is interactive.
   */
  interactiveIds?: ReadonlySet<string> | null;
  clusters: readonly RadarClusterSummary[];
  /** Selected time range — radius encodes age inside it. */
  range: ProductHuntRange;
  selectedId: string | null;
  highlightedId?: string | null;
  onSelect: (toolId: string) => void;
  /** Fired when a tap is genuinely ambiguous — parent shows the chooser. */
  onAmbiguous?: (candidates: readonly RadarTapCandidate[]) => void;
  /**
   * Level-1 semantic camera (spec §4-§5). A viewport transform only — the
   * semantic coordinates in `layoutTools` are never recomputed.
   */
  camera?: RadarCameraPlan | null;
  /**
   * Residual-collision fan-out (spec §9). Spiderfied nodes draw at their leg
   * position; their semantic anchor is untouched.
   */
  spider?: RadarSpiderPlan | null;
  /**
   * Level-0 hidden counts per cluster (spec §3) — shown as a small "+N" badge
   * on the representative node instead of a free-standing stack marker.
   */
  hiddenCounts?: ReadonlyMap<string, number> | null;
  /** Tapping a sector rim / affordance enters CLUSTER FOCUS (spec §4). */
  onSelectSector?: (clusterId: string) => void;
  /** Tapping empty space collapses an open spider (spec §9). */
  onCollapseSpider?: () => void;
  /**
   * Closure §4 — a collision group too large to fan out safely (more than
   * RADAR_SPIDER_MAX_GROUP members) opens the fallback bottom sheet instead.
   */
  onSelectChooserGroup?: (groupId: string) => void;
  /**
   * Spec §1/§3 — the canonical DISPLAY positions for every marker that has been
   * displaced (Sector Lens and/or spiderfy). Painting AND hit-testing both use
   * these; the semantic coordinate is never touched.
   */
  displayOverrides?: ReadonlyMap<string, RadarPoint2> | null;
  /**
   * When set, the map is in CLUSTER FOCUS: every member of this cluster is
   * prominent and all other sectors are dimmed for compass context only.
   */
  focusedClusterId?: string | null;
};

export function RadarMap({
  layoutTools,
  visibleIds,
  interactiveIds,
  clusters,
  range,
  selectedId,
  highlightedId,
  onSelect,
  onAmbiguous,
  camera,
  spider,
  hiddenCounts,
  onSelectSector,
  onCollapseSpider,
  onSelectChooserGroup,
  displayOverrides,
  focusedClusterId,
}: RadarMapProps) {
  const titleId = useId();
  const fieldId = useId();
  const glowId = useId();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const cameraRef = useRef<SVGGElement | null>(null);

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

  const colorByCluster = new Map<string, string>(
    clusters.map((cluster) => [
      cluster.id as string,
      RADAR_CATEGORY_PALETTE[cluster.colorIndex % RADAR_CATEGORY_PALETTE.length],
    ]),
  );
  const pointById = new Map(layout.points.map((point) => [point.id, point]));
  const labelByCluster = new Map<string, string>(
    clusters.map((cluster) => [cluster.id as string, cluster.label]),
  );
  const rings = radarRingLabels(range);

  const isVisible = (id: string) => !visibleIds || visibleIds.has(id);

  // Spec §1/§3 — ONE display map drives both painting and hit-testing. The
  // Sector Lens and spiderfy both contribute display positions; the semantic
  // coordinate is never mutated.
  const displayPointById = new Map<string, RadarPoint2>(displayOverrides ?? []);

  // Spec §1 — taps must land where the user SEES the marker. `tapPoints` are
  // the DISPLAY positions, never the semantic ones.
  const tapPoints = layout.points.map((entry) => {
    const display = displayPointById.get(entry.id);
    return display ? { ...entry, x: display.x, y: display.y } : entry;
  });

  // Closure §6 — a spider that has been collapsed stops painting entirely.
  const activeSpiderGroups = spider?.groups ?? [];

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<SVGSVGElement>) => {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      // Spec §1/§2 — SCREEN -> VIEWBOX -> DISPLAY through the canonical
      // projection. The camera group's real screen matrix is authoritative; the
      // analytic mapping is the fallback and lives in `radar-projection` so the
      // transform maths exists in exactly one place.
      const view = radarScreenToViewBox(
        { x: event.clientX, y: event.clientY },
        rect,
      );

      // THE zoom tap fix. The camera paints a GLOBAL point p at
      // `zoom * (p - center) + 50`, so the raw viewBox coordinate is NOT the
      // global coordinate once the camera has zoomed in. Invert it here so a
      // tap lands on the signal the user actually sees.
      //
      // The mapping is taken from the camera group's REAL screen matrix rather
      // than recomputed from `zoom`/`center`, so it is exact whether the
      // transform is applied through the SVG attribute or the CSS property.
      const zoom = radarCameraZoom(camera);
      let global = radarViewBoxToDisplay(view, camera);
      const ctm = cameraRef.current?.getScreenCTM?.() ?? null;
      if (ctm) {
        try {
          const local = new DOMPoint(event.clientX, event.clientY).matrixTransform(ctm.inverse());
          if (Number.isFinite(local.x) && Number.isFinite(local.y)) {
            global = { x: local.x, y: local.y };
          }
        } catch {
          // Singular matrix — fall back to the analytic mapping above.
        }
      }
      // Hit radii are defined in global units at zoom 1 (a ~50px touch target).
      // Dividing by the zoom keeps that target the same physical size on screen
      // at every zoom level instead of ballooning with the camera.
      const hitRadius = RADAR_HIT_RADIUS_VIEWBOX / zoom;
      const ambiguityEpsilon = RADAR_TAP_AMBIGUITY_EPSILON / zoom;

      // §4 — the sector rim is a CLUSTER FOCUS entry point. It is resolved
      // before signal candidates so a rim tap never opens the chooser.
      if (onSelectSector && !focusedClusterId) {
        const radius = Math.sqrt(
          (global.x - RADAR_CENTER) * (global.x - RADAR_CENTER) +
            (global.y - RADAR_CENTER) * (global.y - RADAR_CENTER),
        );
        if (radius > 30) {
          const raw = (Math.atan2(global.y - RADAR_CENTER, global.x - RADAR_CENTER) * 180) / Math.PI + 90;
          const angle = ((raw % 360) + 360) % 360;
          const span = RADAR_COMPASS_SECTOR_SPAN_DEG;
          const sectorIndex = Math.min(
            layout.clusterOrder.length - 1,
            Math.floor(angle / span),
          );
          const clusterId = layout.clusterOrder[sectorIndex];
          if (clusterId) {
            onSelectSector(clusterId);
            return;
          }
        }
      }

      // Only visible, interactive points may be selected.
      const visiblePoints = tapPoints.filter((point) => {
        if (visibleIds && !visibleIds.has(point.id)) return false;
        if (interactiveIds && !interactiveIds.has(point.id)) return false;
        return true;
      });
      const resolution = resolveRadarTap(visiblePoints, global.x, global.y, {
        hitRadius,
        ambiguityEpsilon,
      });

      if (resolution.kind === "selected") {
        onSelect(resolution.id);
        return;
      }
      // §9 — tapping empty space collapses an open spider.
      if (spider && spider.spideredIds.size > 0) {
        onCollapseSpider?.();
      }
      // Closure §4 — a collision group that is too large to fan out is
      // presented as the fallback bottom sheet rather than spiderfied.
      if (spider && onSelectChooserGroup) {
        for (const group of spider.chooserGroups) {
          const hit = group.memberIds.some((id) => {
            const entry = tapPoints.find((point) => point.id === id);
            return (
              entry &&
              Math.sqrt((entry.x - global.x) ** 2 + (entry.y - global.y) ** 2) <=
                hitRadius
            );
          });
          if (hit) {
            onSelectChooserGroup(group.key);
            return;
          }
        }
      }
      if (resolution.kind === "ambiguous" && onAmbiguous) {
        onAmbiguous(resolution.candidates);
      }
    },
    [
      camera,
      focusedClusterId,
      interactiveIds,
      layout.clusterOrder,
      onAmbiguous,
      onCollapseSpider,
      onSelect,
      onSelectChooserGroup,
      onSelectSector,
      tapPoints,
      spider,
      visibleIds,
    ],
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

        {/* §5 — pure camera transform. Semantic coordinates are unchanged. */}
        {/* §5 — pure camera transform. Semantic coordinates are unchanged.
            The attribute is the fallback; the CSS property is what animates
            (an SVG `transform` ATTRIBUTE is not transitionable). */}
        <g
          ref={cameraRef}
          transform={camera?.transform ?? undefined}
          style={
            camera
              ? {
                  transform: camera.transform,
                  transformBox: "view-box",
                  transformOrigin: "0 0",
                }
              : undefined
          }
          className="tv-rx-map__camera"
        >

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

        {/* §14 — the outer rim is a subtle fixed cluster compass: one short
            low-opacity arc per canonical sector, in that cluster's colour.
            Static, no filled wedge, no rainbow. In cluster focus the owning
            segment reads slightly clearer and the others soften. */}
        <g className="tv-rx-map__compass">
          {layout.clusterOrder.map((clusterId, index) => {
            const span = RADAR_COMPASS_SECTOR_SPAN_DEG;
            const start = index * span + span * 0.12;
            const end = index * span + span * 0.88;
            const a1 = ((start - 90) * Math.PI) / 180;
            const a2 = ((end - 90) * Math.PI) / 180;
            const r = 42;
            const x1 = RADAR_CENTER + r * Math.cos(a1);
            const y1 = RADAR_CENTER + r * Math.sin(a1);
            const x2 = RADAR_CENTER + r * Math.cos(a2);
            const y2 = RADAR_CENTER + r * Math.sin(a2);
            const color =
              colorByCluster.get(clusterId) ??
              RADAR_CATEGORY_PALETTE[index % RADAR_CATEGORY_PALETTE.length];
            const arcPath = `M ${x1.toFixed(3)} ${y1.toFixed(3)} A ${r} ${r} 0 0 1 ${x2.toFixed(3)} ${y2.toFixed(3)}`;
            return (
              <g key={`rim-${clusterId}`}>
                <path
                  d={arcPath}
                  className="tv-rx-map__compass-arc"
                  data-focused={
                    focusedClusterId && clusterId === focusedClusterId
                      ? "true"
                      : undefined
                  }
                  data-dimmed={
                    focusedClusterId && clusterId !== focusedClusterId
                      ? "true"
                      : undefined
                  }
                  stroke={color}
                  aria-hidden="true"
                />
                {onSelectSector ? (
                  <path
                    d={arcPath}
                    className="tv-rx-map__compass-hit"
                    strokeWidth={RADAR_SECTOR_HIT_WIDTH}
                    fill="none"
                    role="button"
                    tabIndex={focusedClusterId ? -1 : 0}
                    aria-disabled={focusedClusterId ? true : undefined}
                    aria-label={`Apri il settore ${labelByCluster.get(clusterId) ?? clusterId}`}
                    onPointerDown={(event) => {
                      event.stopPropagation();
                      if (!focusedClusterId) onSelectSector(clusterId);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        if (!focusedClusterId) onSelectSector(clusterId);
                      }
                    }}
                  />
                ) : null}
              </g>
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
          r={14}
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
            const basePoint = pointById.get(tool.id);
            if (!basePoint) return null;
            // §9 — a spiderfied leg draws at its fan-out position. The semantic
            // coordinate in `basePoint` is never mutated.
            const point: RadarPoint = {
              ...basePoint,
              ...(displayPointById.get(tool.id) ?? {}),
            };
            // Spec §16 — Level-0 Overview compresses the RENDERED radius range
            // ~20% so a high-attention marker cannot dominate the quiet
            // overview. The attention value and its sqrt ordering are untouched.
            const drawnRadius = focusedClusterId
              ? point.size
              : compressVisualRadiusForOverview(point.size);
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
            const isFocusOut =
              focusedClusterId !== null &&
              focusedClusterId !== undefined &&
              tool.topicCluster.id !== focusedClusterId;
            // §6 — contextual neighbours are painted but never selectable.
            const isInteractive = !interactiveIds || interactiveIds.has(tool.id);
            const context = isFocusOut
              ? "focus-out"
              : isSelected
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
                style={{ transform: `translate(${point.x}px, ${point.y}px)` }}
                data-selected={isSelected ? "true" : undefined}
                data-highlighted={isHighlighted ? "true" : undefined}
                data-category={tool.topicCluster.id}
                data-cluster={tool.topicCluster.id}
                data-context={context}
                data-age-unknown={point.ageKnown ? undefined : "true"}
                data-catalog-status={tool.catalogStatus}
                data-focus={isFocusOut ? "out" : undefined}
              >
                {/* 44px effective touch target (transparent). Keyboard-only
                    focus; pointer selection is resolved centrally above. */}
                <circle
                  cx={0}
                  cy={0}
                  r={RADAR_HIT_RADIUS_VIEWBOX}
                  className="tv-rx-blip__hit"
                  role="button"
                  data-interactive={isInteractive ? "true" : "false"}
                  aria-disabled={isInteractive ? undefined : true}
                  tabIndex={isInteractive ? 0 : -1}
                  aria-label={blipAriaLabel(tool, point)}
                  onKeyDown={
                    isInteractive
                      ? (event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            onSelect(tool.id);
                          }
                        }
                      : undefined
                  }
                />
                {(isSelected || isHighlighted) && (
                  <circle
                    style={{ pointerEvents: "none" }}
                    cx={0}
                    cy={0}
                    r={drawnRadius * 2.7}
                    fill={color}
                    className="tv-rx-blip__halo"
                    aria-hidden="true"
                  />
                )}
                {isSelected && (
                  <circle
                    style={{ pointerEvents: "none" }}
                    cx={0}
                    cy={0}
                    r={drawnRadius * 1.95}
                    fill="none"
                    className="tv-rx-blip__ring"
                    aria-hidden="true"
                  />
                )}
                {/* §13 — a restrained instrument keyline separates touching
                    same-colour shapes. Surface token, never a white ring. */}
                <circle
                  style={{ pointerEvents: "none" }}
                  cx={0}
                  cy={0}
                  r={drawnRadius}
                  fill={color}
                  stroke="var(--tv-color-surface-base, #0b0620)"
                  strokeWidth={0.42}
                  strokeOpacity={0.85}
                  className="tv-rx-blip__dot"
                  aria-hidden="true"
                />
                {/* Static specular highlight — gives the dot a bead/material
                    quality without any animation or extra glow. */}
                <circle
                  style={{ pointerEvents: "none" }}
                  cx={-drawnRadius * 0.28}
                  cy={-drawnRadius * 0.28}
                  r={Math.max(drawnRadius * 0.3, 0.5)}
                  fill="var(--tv-color-ink-100, #f5f3ff)"
                  className="tv-rx-blip__glint"
                  aria-hidden="true"
                />
                {/* §5 — entity type marker, WITHOUT changing the cluster colour:
                    an external signal is a solid cluster-coloured dot; a
                    catalog-linked signal keeps that colour plus a neutral inner
                    marker. */}
                {tool.catalogStatus === "linked" ? (
                  <circle
                    style={{ pointerEvents: "none" }}
                    cx={0}
                    cy={0}
                    r={Math.max(drawnRadius * 0.42, 0.75)}
                    className="tv-rx-blip__entity"
                    aria-hidden="true"
                  />
                ) : null}
                {(() => {
                  const hidden = hiddenCounts?.get(tool.topicCluster.id) ?? 0;
                  if (hidden <= 0) return null;
                  return (
                    <text
                      style={{ pointerEvents: "none" }}
                      x={drawnRadius + 1.6}
                      y={-drawnRadius - 0.9}
                      textAnchor="start"
                      className="tv-rx-map__hidden-badge"
                      fontSize="2.9"
                    >
                      {radarOverviewHiddenLabel(hidden)}
                    </text>
                  );
                })()}
              </g>
            );
          })}
        </g>

        {/* Closure §2/§3 — restrained connectors: semantic anchor -> display
            point. Thin, low opacity, no bright spokes, no bloom. */}
        {activeSpiderGroups.length > 0 ? (
          <g className="tv-rx-spider" aria-hidden="true">
            {activeSpiderGroups.flatMap((group) =>
              group.connectors.map((connector, index) => (
                <line
                  key={`${group.key}-${index}`}
                  x1={connector.from.x}
                  y1={connector.from.y}
                  x2={connector.to.x}
                  y2={connector.to.y}
                  className="tv-rx-spider__leg"
                />
              )),
            )}
          </g>
        ) : null}
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
