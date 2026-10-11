import { useId, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { planAtlasBeaconLabels, type AtlasBeaconTier, type AtlasEditorialLabel, type AtlasLabelSignal } from "@/lib/radar/radar-atlas-beacons";

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
function territory(start: number, end: number, inner = 22, outer = 39.5) {
  const a = polar(outer, start), b = polar(inner, end), c = polar(inner, start);
  return `${arc(outer, start, end)} L ${b.x} ${b.y} A ${inner} ${inner} 0 0 0 ${c.x} ${c.y} L ${a.x} ${a.y} Z`;
}
const shortLabels = ["VIDEO", "DESIGN", "NO-CODE", "GROWTH", "PROD.", "CODING", "AGENTI", "ALTRO"];
const categoryLines = [["VIDEO &", "IMMAGINI"], ["DESIGN &", "CREATIVITÀ"], ["NO-CODE &", "AUTOMAZIONE"], ["MARKETING &", "GROWTH"], ["PRODUTTIVITÀ"], ["SVILUPPO &", "CODING"], ["AI &", "AGENTI"], ["ALTRO"]];

type AtlasProps = {
  clusterOrder: readonly string[];
  clusters: readonly RadarClusterSummary[];
  colors: ReadonlyMap<string, string>;
  tools: readonly RadarTool[];
  range: ProductHuntRange;
  focusedClusterId?: string | null;
  onSelectSector?: (clusterId: string) => void;
  visiblePoints?: readonly (RadarPoint2 & { size?: number })[];
};

export function RadarAtlasField({ clusterOrder, clusters, colors, tools, range, focusedClusterId, onSelectSector, visiblePoints = [] }: AtlasProps) {
  const local = Boolean(focusedClusterId);
  const count = local ? tools.filter(t => t.topicCluster.id === focusedClusterId).length : tools.length;
  const activeAreas = clusters.filter(c => c.count > 0).length;
  const focusLabel = clusters.find(c => c.id === focusedClusterId)?.label ?? "";
  const rings = radarRingLabels(range);
  return (
    <>
      <g className="tv-atlas__territories" key={focusedClusterId ?? "market"}>
        {clusterOrder.map((id, i) => {
          if (local && id !== focusedClusterId) return null;
          const start = local ? 92 : i * 45 + 2, end = local ? 256 : i * 45 + 43;
          const cluster = clusters.find(c => c.id === id);
          const clusterCount = cluster?.count ?? 0;
          const active = !local && clusterCount > 0 && Boolean(onSelectSector);
          // Labels may move within their own territory; signal centres never do.
          const labelSlots = [36, 40, 33, 43, 30, 28, 26, 24].flatMap(r => [22.5, 35, 12, 40, 5, 30, 17.5, 27.5, 7.5, 37.5].map(a => polar(r, i * 45 + a)));
          const labelScore = (p: RadarPoint2) => {
            const half = [5.5, 6.5, 7.5, 7, 8, 6.5, 6, 6][i];
            const mobileHalf = shortLabels[i].length * 3.7 * .65 / 2;
            const boxes = [{ left: p.x - mobileHalf, right: p.x + mobileHalf, top: p.y - 7, bottom: p.y - 1 }, { left: p.x - half, right: p.x + half, top: p.y - 8.5, bottom: p.y - (categoryLines[i].length > 1 ? 2 : 4.5) }, { left: p.x - 4, right: p.x + 4, top: p.y - 2, bottom: p.y + 6.5 }, { left: p.x + 4, right: p.x + 8.7, top: p.y - .4, bottom: p.y + 3.5 }];
            const tip = { x: p.x + 8, y: p.y + 1.3 };
            const bearing = ((Math.atan2(tip.y - 50, tip.x - 50) * 180 / Math.PI + 90) % 360 + 360) % 360;
            const countRadius = Math.hypot(p.x - .5 - 50, p.y + 1.3 - 50);
            const clipped = countRadius <= 30 || Math.hypot(tip.x - 50, tip.y - 50) <= 30 || boxes.some(b => b.left < 1 || b.right > 99 || b.top < 1 || b.bottom > 90) || Math.floor(bearing / 45) !== i;
            // The material body is asymmetric; its painted envelope is smaller
            // than the canonical circular hit/clearance envelope.
            const collisions = visiblePoints.reduce((sum, q) => {
              const r = q.size ?? 2;
              const glyph = { left: q.x - .83 * r - .6, right: q.x + .91 * r + .6, top: q.y - .65 * r - .6, bottom: q.y + .73 * r + .6 };
              return sum + boxes.reduce((depth, b) => depth + Math.max(0, -Math.max(b.left - glyph.right, glyph.left - b.right, b.top - glyph.bottom, glyph.top - b.bottom)), 0);
            }, 0);
            const metadata = [{ left: 3, right: 22, top: 2, bottom: 19 }, { left: 80, right: 97, top: 3, bottom: 13.5 }, { left: 80, right: 97, top: 74, bottom: 87 }];
            const crowded = boxes.some(b => metadata.some(m => b.left < m.right && b.right > m.left && b.top < m.bottom && b.bottom > m.top));
            return (clipped ? 100 : 0) + collisions * 10 + (crowded ? 5 : 0);
          };
          const p = labelSlots.reduce((best, candidate) => labelScore(candidate) < labelScore(best) ? candidate : best, labelSlots[0]);
          return <g key={id} className="tv-atlas__area" data-atlas-territory={id} data-active={active ? "true" : undefined}
            role={active ? "button" : undefined} tabIndex={active ? 0 : undefined}
            aria-label={active ? `Apri ${cluster?.label ?? id}, ${clusterCount} segnali` : undefined}
            onKeyDown={active ? event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSelectSector?.(id); } } : undefined}
            style={{ "--tv-atlas-territory": colors.get(id) } as CSSProperties}>
            {active && <path d={territory(i * 45, (i + 1) * 45, 30.0001, 47)} className="tv-atlas__territory-hit" data-territory-hit={id} aria-hidden="true" />}
            <g className="tv-atlas__area-art" data-instrument-layer="atlas-area-art" aria-hidden="true">
              <path d={local ? territory(start, end) : territory(start, end, 30, 42)} className="tv-atlas__territory" />
              {clusterCount > 0 && <path d={arc(42.6, start, end)} className="tv-atlas__identity" />}
              {!local && clusterCount > 0 && <>
                <text x={p.x} y={p.y - 2.5} textAnchor="middle" className="tv-atlas__area-short">{shortLabels[i]}</text>
                <text x={p.x} y={p.y - 5.2} textAnchor="middle" className="tv-atlas__area-full">{categoryLines[i].map((line, n) => <tspan key={line} x={p.x} dy={n ? 2.4 : 0}>{line}</tspan>)}</text>
                <text x={p.x - .5} y={p.y + 4.4} textAnchor="middle" className="tv-atlas__area-count">{clusterCount}</text>
                <path d={`M ${p.x + 4} ${p.y + 1.3} H ${p.x + 8} m -1.7 -1.7 l 1.7 1.7 l -1.7 1.7`} className="tv-atlas__area-arrow" />
              </>}
            </g>
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

export function RadarAtlasGlyph({ radius: r, color, selected, highlighted, linked, name, tier = "global", thumbnailUrl }: { radius: number; color: string; selected: boolean; highlighted: boolean; linked: boolean; name: string; tier?: AtlasBeaconTier; thumbnailUrl?: string | null }) {
  const clipId = useId().replace(/:/g, "");
  const [imageState, setImageState] = useState<{ source: string; loaded: boolean } | null>(null);
  const local = tier !== "global";
  const scale = tier === "ambient" ? .73 : 1;
  const body = tier === "primary"
    ? `M ${-r * .91} 0 L ${-r * .24} ${-r * .84} L ${r * .66} ${-r * .62} L ${r * .9} ${r * .16} L ${r * .15} ${r * .89} Z`
    : tier === "secondary"
      ? `M ${-r * .84} 0 L ${-r * .2} ${-r * .76} L ${r * .62} ${-r * .55} L ${r * .88} ${r * .08} L ${r * .12} ${r * .81} Z`
      : `M ${-r * .83 * scale} 0 L ${-r * .18 * scale} ${-r * .65 * scale} L ${r * .6 * scale} ${-r * .48 * scale} L ${r * .91 * scale} ${r * .05 * scale} L ${r * .13 * scale} ${r * .73 * scale} Z`;
  const identitySize = r * (tier === "primary" ? 1.04 : tier === "secondary" ? .9 : tier === "ambient" ? .68 : .7);
  const image = local && thumbnailUrl && /^https?:\/\//.test(thumbnailUrl) && !(imageState?.source === thumbnailUrl && !imageState.loaded) ? thumbnailUrl : null;
  const loaded = imageState?.source === image && imageState.loaded;
  return <g className="tv-atlas__glyph" data-beacon-direction="b" data-beacon-tier={tier} data-instrument-layer="atlas-glyph" data-drawn-radius={r} aria-hidden="true" style={{ "--tv-atlas-signal": color } as CSSProperties}>
    <path d={body} className="tv-atlas__glyph-body" />
    <path d={local ? `M ${-r * .2 * scale} ${-r * .72 * scale} L 0 0 L ${r * .85 * scale} ${r * .06 * scale} L ${r * .58 * scale} ${-r * .5 * scale} Z` : `M ${-r * .18} ${-r * .65} L ${r * .02} ${r * .02} L ${r * .91} ${r * .05} L ${r * .6} ${-r * .48} Z`} className="tv-atlas__beacon-facet" />
    <path d={local ? `M ${-identitySize * .54} 0 l ${identitySize * .45} ${-identitySize * .55} l ${identitySize * .64} ${identitySize * .35} l ${-identitySize * .46} ${identitySize * .66} Z` : `M ${-r * .37} ${r * .05} l ${r * .24} ${-r * .3} l ${r * .3} ${r * .2} l ${-r * .25} ${r * .3} Z`} className="tv-atlas__glyph-nucleus" />
    <text x={r * .03} y={identitySize * .3} textAnchor="middle" className="tv-atlas__beacon-mark" style={{ fontSize: identitySize }}>{(Array.from(name.trim())[0] ?? "·").toLocaleUpperCase("it-IT")}</text>
    {image && <>
      <defs><clipPath id={clipId}><rect x={-identitySize / 2} y={-identitySize / 2} width={identitySize} height={identitySize} rx={identitySize * .18} /></clipPath></defs>
      <image href={image} x={-identitySize / 2} y={-identitySize / 2} width={identitySize} height={identitySize} preserveAspectRatio="xMidYMid meet" clipPath={`url(#${clipId})`} opacity={loaded ? 1 : 0} onLoad={() => setImageState({ source: image, loaded: true })} onError={() => setImageState({ source: image, loaded: false })} className="tv-atlas__beacon-image" />
    </>}
    <path d={`M ${r * .2 * scale} ${r * (local ? .6 : .53) * scale} H ${r * (!local ? .78 : tier === "primary" ? .65 : .6) * scale}`} className="tv-atlas__glyph-datum" />
    {linked ? <path d={`M ${r * .42 * scale} ${r * .29 * scale} v ${r * .22 * scale} m ${r * .19 * scale} ${-r * .22 * scale} v ${r * .22 * scale}`} className="tv-atlas__linked tv-rx-blip__entity" /> : <path d={`M ${r * .7 * scale} ${r * .38 * scale} l ${r * .12 * scale} ${r * .1 * scale}`} className="tv-atlas__external" />}
    {(selected || highlighted) && <path d={`M ${-r * .85} ${-r * .3} V ${-r * .45} H ${-r * .55} M ${r * .55} ${r * .45} H ${r * .85} V ${r * .3}`} className="tv-atlas__selection-notches" />}
  </g>;
}

export function RadarAtlasEditorialLabels({ signals, selectedId }: { signals: readonly AtlasLabelSignal[]; selectedId?: string | null }) {
  const ref = useRef<SVGGElement | null>(null);
  const [labels, setLabels] = useState<AtlasEditorialLabel[]>([]);
  const strongest = [...signals].sort((a, b) => b.attention - a.attention || a.id.localeCompare(b.id));
  const measured = [strongest.find(s => s.tier === "primary"), strongest.find(s => s.tier === "secondary")].filter((s): s is AtlasLabelSignal => Boolean(s));
  const signature = JSON.stringify([signals, selectedId]);
  useLayoutEffect(() => {
    const group = ref.current, svg = group?.ownerSVGElement;
    if (!group || !svg || typeof group.getBBox !== "function") return;
    let disposed = false;
    const compute = () => {
      if (disposed) return;
      const measurements = new Map([...group.querySelectorAll<SVGTextElement>('[data-label-measure]')].map(text => { const b = text.getBBox(); return [text.dataset.labelMeasure!, { width: b.width, height: b.height, baseline: b.y }]; }));
      const reserved = [...svg.querySelectorAll<SVGTextElement>('.tv-atlas__time text,.tv-atlas__metadata text,.tv-atlas__inspection text')].map(text => { const b = text.getBBox(); return { left: b.x, right: b.x + b.width, top: b.y, bottom: b.y + b.height }; });
      const leader = svg.querySelector<SVGPathElement>('.tv-atlas__leader');
      const callout = leader ? Array.from({ length: Math.ceil(leader.getTotalLength() * 2) + 1 }, (_, i) => leader.getPointAtLength(i / 2)) : [];
      const next = planAtlasBeaconLabels(signals, measurements, reserved, selectedId, callout);
      setLabels(current => JSON.stringify(current) === JSON.stringify(next) ? current : next);
    };
    compute();
    document.fonts?.ready.then(compute);
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(compute);
    observer?.observe(svg);
    return () => { disposed = true; observer?.disconnect(); };
    // The serialized input includes the immutable positions and selected state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);
  return <g ref={ref} className="tv-atlas__editorial-labels" data-instrument-layer="atlas-editorial-labels" aria-hidden="true">
    <g visibility="hidden">{measured.map(s => <text key={s.id} data-label-measure={s.id} className={`tv-atlas__tool-label tv-atlas__tool-label--${s.tier}`}>{s.name}</text>)}</g>
    {labels.map(label => <g key={label.id} data-editorial-label={label.id} data-label-tier={label.tier}>
      <line x1={label.from.x} y1={label.from.y} x2={label.to.x} y2={label.to.y} className="tv-atlas__tool-leader" />
      <text x={label.x} y={label.y} textAnchor="middle" className={`tv-atlas__tool-label tv-atlas__tool-label--${label.tier}`}>{label.name}</text>
    </g>)}
  </g>;
}

export function RadarAtlasInspection({ tool, point, visiblePoints }: { tool: RadarTool; point: RadarPoint2; visiblePoints: readonly (RadarPoint2 & { size?: number })[] }) {
  // Place annotation in the least occupied margin. This affects only text and
  // leaders, never the signal, camera, collision planner or hit geometry.
  const slots = [{ x: 94, y: 23, right: true }, { x: 94, y: 54, right: true }, { x: 6, y: 23, right: false }, { x: 6, y: 58, right: false }];
  const otherPoints = visiblePoints.filter(p => Math.hypot(p.x - point.x, p.y - point.y) > .01);
  const distanceToSegment = (p: RadarPoint2, a: RadarPoint2, b: RadarPoint2) => {
    const dx = b.x - a.x, dy = b.y - a.y;
    const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy || 1)));
    return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy);
  };
  const routes = slots.flatMap(slot => [false, true].map(margin => {
    const elbow = slot.right ? slot.x - 24 : slot.x + 24;
    const trunk = slot.right ? 84 : 16;
    const points = margin ? [point, { x: trunk, y: point.y }, { x: trunk, y: slot.y + 5 }, { x: slot.x, y: slot.y + 5 }] : [point, { x: elbow, y: slot.y + 5 }, { x: slot.x, y: slot.y + 5 }];
    const crossings = otherPoints.filter(p => points.slice(1).some((b, i) => distanceToSegment(p, points[i], b) < (p.size ?? 2) + 1)).length;
    const occupied = otherPoints.filter(p => p.x > (slot.right ? 61 : 4) && p.x < (slot.right ? 96 : 39) && p.y > slot.y - 5 && p.y < slot.y + 20).length;
    const length = points.slice(1).reduce((sum, b, i) => sum + Math.hypot(b.x - points[i].x, b.y - points[i].y), 0);
    return { slot, points, score: crossings * 10 + occupied * 5 + length / 1000 };
  }));
  const route = routes.reduce((best, r) => r.score < best.score ? r : best, routes[0]);
  const slot = route.slot;
  const leader = route.points.map((p, i) => `${i ? "L" : "M"} ${p.x} ${p.y}`).join(" ");
  const name = tool.name.length > 19 ? `${tool.name.slice(0, 18)}…` : tool.name;
  const age = tool.ageHours === null ? "ETÀ NON DISPONIBILE" : `${tool.ageHours.toLocaleString("it-IT", { maximumFractionDigits: 1 })}H DAL LANCIO`;
  return <g className="tv-atlas__inspection" data-instrument-layer="atlas-inspection" aria-hidden="true">
    <line x1="50" y1="50" x2={point.x} y2={point.y} className="tv-rx-map__selection-guide tv-atlas__radial-guide" />
    <path d={leader} className="tv-atlas__leader" />
    <text x={slot.x} y={slot.y} textAnchor={slot.right ? "end" : "start"} className="tv-atlas__selected-name">{name}</text>
    <text x={slot.x} y={slot.y + 11} textAnchor={slot.right ? "end" : "start"} className="tv-atlas__display tv-atlas__attention">{tool.attention}</text>
    <text x={slot.x} y={slot.y + 15} textAnchor={slot.right ? "end" : "start"} className="tv-atlas__micro tv-atlas__attention-caption">ATTENZIONE</text>
    <text x={slot.x} y={slot.y + 19} textAnchor={slot.right ? "end" : "start"} className="tv-atlas__micro tv-atlas__age">{age}</text>
  </g>;
}
