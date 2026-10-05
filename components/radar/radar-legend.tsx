"use client";

/**
 * Radar legend (spec §7). Explains every encoded visual property.
 * A property with no data meaning is NOT shown as meaningful — the halo row
 * explicitly states that it is unavailable rather than implying a signal.
 */

import { RADAR_VISUAL_SEMANTICS } from "@/lib/radar/radar-domain";

export function RadarLegend({ radiusBasis }: { radiusBasis: "recency" | "rank" }) {
  const radiusMeaning =
    radiusBasis === "recency"
      ? "Più vicino al centro = lancio più recente."
      : "Più vicino al centro = posizione più alta in classifica.";

  return (
    <details className="tv-rx-legend">
      <summary className="tv-rx-legend__summary">Come leggere la mappa</summary>
      <dl className="tv-rx-legend__list">
        <div className="tv-rx-legend__row">
          <dt>{RADAR_VISUAL_SEMANTICS.angle.label}</dt>
          <dd>{RADAR_VISUAL_SEMANTICS.angle.meaning}</dd>
        </div>
        <div className="tv-rx-legend__row">
          <dt>{RADAR_VISUAL_SEMANTICS.radius.label}</dt>
          <dd>{radiusMeaning}</dd>
        </div>
        <div className="tv-rx-legend__row">
          <dt>{RADAR_VISUAL_SEMANTICS.size.label}</dt>
          <dd>{RADAR_VISUAL_SEMANTICS.size.meaning}</dd>
        </div>
        <div className="tv-rx-legend__row">
          <dt>{RADAR_VISUAL_SEMANTICS.color.label}</dt>
          <dd>{RADAR_VISUAL_SEMANTICS.color.meaning}</dd>
        </div>
        <div className="tv-rx-legend__row" data-unavailable="true">
          <dt>{RADAR_VISUAL_SEMANTICS.halo.label}</dt>
          <dd>{RADAR_VISUAL_SEMANTICS.halo.meaning}</dd>
        </div>
      </dl>
    </details>
  );
}
