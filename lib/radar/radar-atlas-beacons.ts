import type { RadarPoint2 } from "@/lib/radar/radar-projection";

export type AtlasBeaconTier = "primary" | "secondary" | "ambient" | "global";
export function rankAtlasBeacons(signals: readonly { id: string; attention: number }[]): Map<string, AtlasBeaconTier> {
  return new Map([...signals].sort((a, b) => b.attention - a.attention || a.id.localeCompare(b.id)).map((signal, i) => [signal.id, i === 0 ? "primary" : i <= 3 ? "secondary" : "ambient"]));
}

export type AtlasLabelBox = { left: number; right: number; top: number; bottom: number };
export type AtlasLabelSignal = RadarPoint2 & { id: string; name: string; attention: number; radius: number; tier: AtlasBeaconTier };
export type AtlasEditorialLabel = { id: string; name: string; tier: AtlasBeaconTier; x: number; y: number; box: AtlasLabelBox; from: RadarPoint2; to: RadarPoint2 };
const intersects = (a: AtlasLabelBox, b: AtlasLabelBox) => a.left < b.right + .7 && a.right > b.left - .7 && a.top < b.bottom + .7 && a.bottom > b.top - .7;
const segmentDistance = (p: RadarPoint2, a: RadarPoint2, b: RadarPoint2) => {
  const dx = b.x - a.x, dy = b.y - a.y;
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy);
};
function lineTouchesBox(a: RadarPoint2, b: RadarPoint2, box: AtlasLabelBox) {
  const steps = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) * 2);
  for (let i = 0; i <= steps; i++) {
    const t = steps ? i / steps : 0, x = a.x + (b.x - a.x) * t, y = a.y + (b.y - a.y) * t;
    if (x >= box.left - .4 && x <= box.right + .4 && y >= box.top - .4 && y <= box.bottom + .4) return true;
  }
  return false;
}

/** Labels only: never changes a signal's centre, size, radius, or display angle. */
export function planAtlasBeaconLabels(signals: readonly AtlasLabelSignal[], measurements: ReadonlyMap<string, { width: number; height: number; baseline: number }>, reserved: readonly AtlasLabelBox[], selectedId?: string | null, calloutLines: readonly RadarPoint2[] = []): AtlasEditorialLabel[] {
  const ranked = [...signals].sort((a, b) => b.attention - a.attention || a.id.localeCompare(b.id));
  const candidates = [ranked.find(s => s.tier === "primary"), ranked.find(s => s.tier === "secondary")].filter((s): s is AtlasLabelSignal => Boolean(s && s.id !== selectedId));
  const labels: AtlasEditorialLabel[] = [];
  for (const signal of candidates) {
    const measure = measurements.get(signal.id);
    if (!measure) continue;
    const slots = [3, 7, 12].flatMap(offset => [
      { x: signal.x + signal.radius + offset + measure.width / 2, y: signal.y },
      { x: signal.x - signal.radius - offset - measure.width / 2, y: signal.y },
      { x: signal.x, y: signal.y - signal.radius - offset - measure.height / 2 },
      { x: signal.x, y: signal.y + signal.radius + offset + measure.height / 2 },
    ]);
    if (signal.tier === "primary") for (let y = 20; y <= 80; y += 5) for (let x = 20; x <= 80; x += 5) slots.push({ x, y });
    const options = slots.map(p => {
      const box = { left: p.x - measure.width / 2, right: p.x + measure.width / 2, top: p.y - measure.height / 2, bottom: p.y + measure.height / 2 };
      const to = { x: Math.max(box.left, Math.min(box.right, signal.x)), y: Math.max(box.top, Math.min(box.bottom, signal.y)) };
      const length = Math.hypot(to.x - signal.x, to.y - signal.y);
      const from = { x: signal.x + (to.x - signal.x) * signal.radius / length, y: signal.y + (to.y - signal.y) * signal.radius / length };
      return { id: signal.id, name: signal.name, tier: signal.tier, x: p.x, y: p.y - measure.height / 2 - measure.baseline, box, from, to, length };
    }).filter(label => {
      if (!Number.isFinite(label.from.x) || label.length > 28) return false;
      if ([label.box.left, label.box.right].some(x => [label.box.top, label.box.bottom].some(y => Math.hypot(x - 50, y - 50) > 38))) return false;
      if ([...reserved, ...labels.map(l => l.box)].some(b => intersects(label.box, b) || lineTouchesBox(label.from, label.to, b))) return false;
      if (signals.some(s => Math.hypot(Math.max(label.box.left - s.x, 0, s.x - label.box.right), Math.max(label.box.top - s.y, 0, s.y - label.box.bottom)) < s.radius + .8)) return false;
      if (signals.some(s => s.id !== signal.id && segmentDistance(s, label.from, label.to) < s.radius + .6)) return false;
      if (calloutLines.some(p => p.x >= label.box.left - .7 && p.x <= label.box.right + .7 && p.y >= label.box.top - .7 && p.y <= label.box.bottom + .7)) return false;
      return !labels.some(l => lineTouchesBox(label.from, label.to, l.box) || lineTouchesBox(l.from, l.to, label.box));
    }).sort((a, b) => a.length - b.length || a.x - b.x || a.y - b.y);
    if (options[0]) labels.push(options[0]);
  }
  return labels;
}
