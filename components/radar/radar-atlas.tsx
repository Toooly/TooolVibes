import type { CSSProperties } from "react";

import type { RadarClusterSummary, RadarTool } from "@/lib/radar/radar-domain";
import type { RadarPoint2 } from "@/lib/radar/radar-projection";
import type { ProductHuntRange } from "@/lib/radar/product-hunt-contract";
import { RADAR_RING_CENTER_LABEL, radarRingLabels } from "@/lib/radar/radar-geometry";

// Graphic construction only. All signal positions and time ratios are supplied
// by the canonical map; this renderer never projects, filters or resolves taps.
const polar = (radius: number, degrees: number) => {
  const angle = degrees * Math.PI / 180;
  return { x: 50 + radius * Math.sin(angle), y: 50 - radius * Math.cos(angle) };
};
function arc(radius: number, start: number, end: number) {
  const a = polar(radius, start), b = polar(radius, end);
  return `M ${a.x} ${a.y} A ${radius} ${radius} 0 ${end - start > 180 ? 1 : 0} 1 ${b.x} ${b.y}`;
}
function territory(start: number, end: number) {
  const a = polar(39.5, start), b = polar(22, end), c = polar(22, start);
  return `${arc(39.5, start, end)} L ${b.x} ${b.y} A 22 22 0 0 0 ${c.x} ${c.y} L ${a.x} ${a.y} Z`;
}
const shortLabels = ["VIDEO", "DESIGN", "NO-CODE", "GROWTH", "FOCUS", "CODING", "AGENTI", "ALTRO"];

type AtlasProps = {
  clusterOrder: readonly string[];
  clusters: readonly RadarClusterSummary[];
  colors: ReadonlyMap<string, string>;
  tools: readonly RadarTool[];
  range: ProductHuntRange;
  focusedClusterId?: string | null;
};

export function RadarAtlasField({ clusterOrder, clusters, colors, tools, range, focusedClusterId }: AtlasProps) {
  const local = Boolean(focusedClusterId);
  const count = local ? tools.filter(t => t.topicCluster.id === focusedClusterId).length : tools.length;
  const activeAreas = clusters.filter(c => c.count > 0).length;
  const focusLabel = clusters.find(c => c.id === focusedClusterId)?.label ?? "";
  const rings = radarRingLabels(range);
  return (
    <>
      <g className="tv-atlas__territories" data-instrument-layer="atlas-territories" aria-hidden="true" key={focusedClusterId ?? "market"}>
        {clusterOrder.map((id, i) => {
          if (local && id !== focusedClusterId) return null;
          const start = local ? 92 : i * 45 + 3, end = local ? 256 : i * 45 + 41;
          const clusterCount = clusters.find(c => c.id === id)?.count ?? 0;
          const p = polar(46.5, i * 45 + 24);
          const color = colors.get(id);
          return <g key={id} style={{ "--tv-atlas-territory": color } as CSSProperties}>
            <path d={territory(start, end)} className="tv-atlas__territory" />
            {clusterCount > 0 && <path d={arc(42.6, start, end)} className="tv-atlas__identity" data-dense={clusterCount >= 7 ? "true" : undefined} />}
            {!local && clusterCount > 0 && <text x={p.x} y={p.y} textAnchor="middle" className="tv-atlas__micro tv-atlas__perimeter">{shortLabels[i]} {clusterCount}</text>}
          </g>;
        })}
      </g>
      <g className="tv-atlas__time" data-instrument-layer="atlas-time" aria-hidden="true">
        {rings.map((ring, i) => {
          const radius = 42 * ring.ratio;
          const x = 50 - radius;
          const width = Math.max(8.2, ring.label.length * 2.1);
          return <g key={ring.label}>
            <path d={arc(radius, 252, 302)} className="tv-atlas__time-arc" data-ring-radius={radius} data-ring-label={ring.label} data-outer={i === rings.length - 1 ? "true" : undefined} />
            <line x1={x} y1={49.3} x2={x} y2={50.7} className="tv-atlas__tick" />
            <rect x={x - width / 2} y={50.1} width={width} height={4.1} className="tv-atlas__label-plate" />
            <text x={x} y={53.1} textAnchor="middle" className="tv-rx-map__ring-label tv-atlas__time-label">{ring.label}</text>
          </g>;
        })}
      </g>
      <g className="tv-atlas__metadata" data-instrument-layer="atlas-coordinates" aria-hidden="true">
        <text x="5" y="12" className="tv-atlas__display tv-atlas__count">{String(count).padStart(2, "0")}</text>
        <text x="6" y="17" className="tv-atlas__micro">SEGNALI</text>
        <text x="94" y="12" textAnchor="end" className="tv-atlas__display tv-atlas__range">{range === "day" ? "24H" : range === "week" ? "7G" : "30G"}</text>
        <path d="M 5 20 H 20" className="tv-atlas__accent-rule" />
        <text x="93" y="81" textAnchor="end" className="tv-atlas__display tv-atlas__density">{local ? count : activeAreas}</text>
        <text x="93" y="85" textAnchor="end" className="tv-atlas__micro tv-atlas__density-caption">{local ? "NEL CLUSTER" : "AREE ATTIVE"}</text>
        <path d="M 5 91 H 95" className="tv-atlas__construction" />
        <text x="5" y="97" className="tv-atlas__micro tv-atlas__caption">{local ? focusLabel.toUpperCase() : "IL MERCATO, ORA"}</text>
        <text x="95" y="97" textAnchor="end" className="tv-atlas__micro tv-atlas__desktop">{local ? "TERRITORIO / 01" : "ATLANTE / 08"}</text>
        <path d={local ? "M 76 34 H 80 V 72 H 76" : "M 29 72 V 76 H 63 V 72"} className="tv-atlas__grouping" />
      </g>
      <g data-instrument-layer="atlas-origin" aria-hidden="true">
        <text x="50" y="48.5" textAnchor="middle" className="tv-atlas__micro tv-atlas__origin-label">{RADAR_RING_CENTER_LABEL}</text>
        <circle cx="50" cy="50" r="0.4" className="tv-atlas__origin" />
      </g>
    </>
  );
}

export function RadarAtlasGlyph({ radius: r, color, selected, highlighted, linked }: { radius: number; color: string; selected: boolean; highlighted: boolean; linked: boolean }) {
  const body = `M ${-r} ${-r * .54} H ${r * .6} L ${r} ${-r * .14} V ${r * .54} H ${-r * .6} L ${-r} ${r * .14} Z`;
  const d = r + .85, h = r * .54 + .85;
  return <g className="tv-atlas__glyph" data-instrument-layer="atlas-glyph" data-drawn-radius={r} aria-hidden="true" style={{ "--tv-atlas-signal": color } as CSSProperties}>
    {(selected || highlighted) && <path d={`M ${-d + 1} ${-h} H ${-d} V ${-h + 1} M ${d - 1} ${-h} H ${d} V ${-h + 1} M ${-d} ${h - 1} V ${h} H ${-d + 1} M ${d} ${h - 1} V ${h} H ${d - 1}`} className="tv-atlas__selection-notches" />}
    <path d={body} className="tv-atlas__glyph-body" />
    <path d={`M ${-r * .6} ${r * .54} H ${r}`} className="tv-atlas__glyph-base" />
    <rect x={-r * .77} y={-r * .26} width={r * .52} height={r * .52} className="tv-atlas__glyph-nucleus" />
    <path d={`M ${r * .03} ${-r * .06} H ${r * .58}`} className="tv-atlas__glyph-datum" />
    {linked && <path d={`M ${r * .67} ${r * .15} l .5 -.5 l .5 .5 l -.5 .5 Z`} className="tv-atlas__linked tv-rx-blip__entity" />}
  </g>;
}

export function RadarAtlasInspection({ tool, point, visiblePoints }: { tool: RadarTool; point: RadarPoint2; visiblePoints: readonly RadarPoint2[] }) {
  // Place annotation in the least occupied margin. This affects only text and
  // leaders, never the signal, camera, collision planner or hit geometry.
  const slots = [{ x: 94, y: 23, right: true }, { x: 94, y: 66, right: true }, { x: 6, y: 23, right: false }, { x: 6, y: 66, right: false }];
  const occupied = (s: typeof slots[number]) => visiblePoints.filter(p => p.x > (s.right ? 61 : 4) && p.x < (s.right ? 96 : 39) && p.y > s.y - 5 && p.y < s.y + 20).length;
  const slot = slots.reduce((best, s) => occupied(s) < occupied(best) ? s : best, slots[0]);
  const elbow = slot.right ? slot.x - 24 : slot.x + 24;
  const name = tool.name.length > 19 ? `${tool.name.slice(0, 18)}…` : tool.name;
  const age = tool.ageHours === null ? "ETÀ NON DISPONIBILE" : `${tool.ageHours.toLocaleString("it-IT", { maximumFractionDigits: 1 })}H DAL LANCIO`;
  return <g className="tv-atlas__inspection" data-instrument-layer="atlas-inspection" aria-hidden="true">
    <line x1="50" y1="50" x2={point.x} y2={point.y} className="tv-rx-map__selection-guide tv-atlas__radial-guide" />
    <path d={`M ${point.x} ${point.y} L ${elbow} ${slot.y + 5} H ${slot.x}`} className="tv-atlas__leader" />
    <text x={slot.x} y={slot.y} textAnchor={slot.right ? "end" : "start"} className="tv-atlas__selected-name">{name}</text>
    <text x={slot.x} y={slot.y + 11} textAnchor={slot.right ? "end" : "start"} className="tv-atlas__display tv-atlas__attention">{tool.attention}</text>
    <text x={slot.x} y={slot.y + 15} textAnchor={slot.right ? "end" : "start"} className="tv-atlas__micro tv-atlas__attention-caption">ATTENZIONE</text>
    <text x={slot.x} y={slot.y + 19} textAnchor={slot.right ? "end" : "start"} className="tv-atlas__micro tv-atlas__age">{age}</text>
  </g>;
}
