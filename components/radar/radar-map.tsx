"use client";

/**
 * Accessible SVG Radar map (spec §27).
 *
 * Semantic DOM, keyboard-selectable blips, 44px effective touch targets via
 * transparent hit circles, and a parallel semantic list for screen readers
 * (rendered by the parent). No canvas, no render loop, no random layout.
 */

import { useId } from "react";

import {
  RADAR_CATEGORY_PALETTE,
  type RadarCategory,
} from "@/lib/radar/radar-domain";
import {
  assertRadarPointsInBounds,
  layoutRadarPoints,
  RADAR_CENTER,
  type RadarPoint,
} from "@/lib/radar/radar-geometry";
import type { RadarTool } from "@/lib/radar/radar-domain";

export type RadarMapProps = {
  tools: readonly RadarTool[];
  categories: readonly RadarCategory[];
  selectedId: string | null;
  highlightedId?: string | null;
  onSelect: (toolId: string) => void;
  /** Compact ring count on very small screens. */
  compact?: boolean;
};

/** viewBox units → effective px at a 320px-wide render (≈44px touch target). */
const HIT_RADIUS_VIEWBOX = 7;

export function RadarMap({
  tools,
  categories,
  selectedId,
  highlightedId,
  onSelect,
  compact = false,
}: RadarMapProps) {
  const titleId = useId();
  const layout = layoutRadarPoints(tools, { jitter: true });

  if (process.env.NODE_ENV !== "production") {
    if (!assertRadarPointsInBounds(layout.points)) {
      // Loud in development: a semantic geometry invariant has been violated.
      console.error("[radar-map] point outside instrument bounds");
    }
  }

  const colorByCategory = new Map(
    categories.map((category) => [
      category.id,
      RADAR_CATEGORY_PALETTE[category.colorIndex % RADAR_CATEGORY_PALETTE.length],
    ]),
  );
  const pointById = new Map(layout.points.map((point) => [point.id, point]));
  const rings = compact ? [0.45, 0.75, 1] : [0.35, 0.55, 0.75, 1];

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
          Mappa radiale dei segnali del Radar. Settore = categoria, raggio ={" "}
          {layout.radiusBasis === "recency" ? "recenza del lancio" : "posizione in classifica"}
          , dimensione = attenzione (voti + commenti), colore = categoria.
        </title>

        <g className="tv-rx-map__grid" aria-hidden="true">
          {rings.map((ratio) => (
            <circle
              key={ratio}
              cx={RADAR_CENTER}
              cy={RADAR_CENTER}
              r={42 * ratio}
              className="tv-rx-map__ring"
            />
          ))}
          <line x1="8" y1="50" x2="92" y2="50" className="tv-rx-map__axis" />
          <line x1="50" y1="8" x2="50" y2="92" className="tv-rx-map__axis" />
          {categories.map((category) => {
            const index = categories.findIndex((entry) => entry.id === category.id);
            const angle = ((index * (360 / Math.max(categories.length, 1)) - 90) * Math.PI) / 180;
            return (
              <line
                key={category.id}
                x1={RADAR_CENTER}
                y1={RADAR_CENTER}
                x2={RADAR_CENTER + 42 * Math.cos(angle)}
                y2={RADAR_CENTER + 42 * Math.sin(angle)}
                className="tv-rx-map__sector"
              />
            );
          })}
        </g>

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
            const color = tool.category
              ? (colorByCategory.get(tool.category.id) ?? RADAR_CATEGORY_PALETTE[0])
              : RADAR_CATEGORY_PALETTE[RADAR_CATEGORY_PALETTE.length - 1];
            const isSelected = selectedId === tool.id;
            const isHighlighted = highlightedId === tool.id;
            return (
              <g
                key={tool.id}
                className="tv-rx-blip"
                data-selected={isSelected ? "true" : undefined}
                data-highlighted={isHighlighted ? "true" : undefined}
                data-category={tool.category?.id ?? "altri-segnali"}
              >
                {/* 44px effective touch target (transparent). */}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={HIT_RADIUS_VIEWBOX}
                  className="tv-rx-blip__hit"
                  role="button"
                  tabIndex={0}
                  aria-label={`${tool.name}. ${tool.category?.label ?? "Altri segnali"}. ${tool.votesCount} voti, ${tool.commentsCount} commenti, posizione ${tool.rank}.`}
                  onClick={() => onSelect(tool.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onSelect(tool.id);
                    }
                  }}
                />
                <circle
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

export function radarPointForTest(
  tools: readonly RadarTool[],
  id: string,
): RadarPoint | undefined {
  return layoutRadarPoints(tools).points.find((point) => point.id === id);
}
