/** @vitest-environment jsdom */
import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { RadarAtlasGlyph } from "@/components/radar/radar-atlas";
import { planAtlasBeaconLabels, rankAtlasBeacons, type AtlasLabelSignal } from "@/lib/radar/radar-atlas-beacons";

afterEach(cleanup);
it("ranks only canonical attention, with stable identity ties and no input mutation", () => {
  const input = [{ id: "b", attention: 50 }, { id: "a", attention: 50 }, { id: "p", attention: 100 }, { id: "c", attention: 40 }, { id: "d", attention: 20 }];
  expect([...rankAtlasBeacons(input)]).toEqual([["p", "primary"], ["a", "secondary"], ["b", "secondary"], ["c", "secondary"], ["d", "ambient"]]);
  expect([...rankAtlasBeacons([...input].reverse())]).toEqual([...rankAtlasBeacons(input)]);
  expect(input[0].id).toBe("b");
});

it("preserves the body and initial when a real image fails, with selection independent of Primary", () => {
  const props = { radius: 5, name: "Onepin", color: "orange", selected: false, highlighted: false, linked: false, tier: "primary" as const, thumbnailUrl: "https://example.test/real.png" };
  const { container, rerender } = render(<svg><RadarAtlasGlyph {...props} /></svg>);
  const body = container.querySelector(".tv-atlas__glyph-body")!.getAttribute("d");
  expect(container.querySelector(".tv-atlas__selection-notches")).toBeNull();
  expect(container.querySelector("image")!.getAttribute("opacity")).toBe("0");
  fireEvent.error(container.querySelector("image")!);
  expect(container.querySelector("image")).toBeNull();
  expect(container.querySelector(".tv-atlas__beacon-mark")!.textContent).toBe("O");
  expect(container.querySelector(".tv-atlas__glyph-body")!.getAttribute("d")).toBe(body);
  rerender(<svg><RadarAtlasGlyph {...props} selected /></svg>);
  expect(container.querySelector(".tv-atlas__selection-notches")).not.toBeNull();
  expect(container.querySelector(".tv-atlas__glyph")!.getAttribute("data-drawn-radius")).toBe("5");
});

it("loads real identity without changing the body or canonical envelope", () => {
  const { container } = render(<svg><RadarAtlasGlyph radius={5} name="Blink" color="orange" tier="secondary" selected={false} highlighted={false} linked thumbnailUrl="https://example.test/blink.png" /></svg>);
  const path = container.querySelector(".tv-atlas__glyph-body")!.getAttribute("d");
  fireEvent.load(container.querySelector("image")!);
  expect(container.querySelector("image")!.getAttribute("opacity")).toBe("1");
  expect(container.querySelector(".tv-atlas__glyph-body")!.getAttribute("d")).toBe(path);
  expect(container.querySelector(".tv-atlas__linked")).not.toBeNull();
});

const signals: AtlasLabelSignal[] = [
  { id: "p", name: "Onepin", attention: 100, tier: "primary", x: 62, y: 64, radius: 5 },
  { id: "s", name: "Blink", attention: 80, tier: "secondary", x: 36, y: 36, radius: 4 },
  { id: "a", name: "Ambient", attention: 10, tier: "ambient", x: 62, y: 36, radius: 3 },
];
const measures = new Map([["p", { width: 12, height: 4, baseline: -3 }], ["s", { width: 10, height: 4, baseline: -3 }]]);
it("keeps labels deterministic, bounded, limited to two and clear of every canonical signal", () => {
  const before = JSON.stringify(signals);
  const labels = planAtlasBeaconLabels(signals, measures, []);
  expect(labels.length).toBe(2);
  expect(labels).toEqual(planAtlasBeaconLabels([...signals].reverse(), measures, []));
  expect(JSON.stringify(signals)).toBe(before);
  expect(labels[0].tier).toBe("primary");
  for (const label of labels) for (const s of signals) expect(Math.hypot(Math.max(label.box.left - s.x, 0, s.x - label.box.right), Math.max(label.box.top - s.y, 0, s.y - label.box.bottom))).toBeGreaterThanOrEqual(s.radius + .8);
});

it("uses the existing Selected name instead of duplicating it and hides labels without safe space", () => {
  expect(planAtlasBeaconLabels(signals, measures, [], "p").every(l => l.id !== "p")).toBe(true);
  expect(planAtlasBeaconLabels(signals, measures, [{ left: 0, right: 100, top: 0, bottom: 100 }])).toEqual([]);
});
