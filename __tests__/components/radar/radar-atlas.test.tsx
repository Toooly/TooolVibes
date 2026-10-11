/** @vitest-environment jsdom */
import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { RadarMap } from "@/components/radar/radar-map";
import type { RadarTool } from "@/lib/radar/radar-domain";
import { radarRingLabels } from "@/lib/radar/radar-geometry";
import { deriveRadarTopicCluster } from "@/lib/radar/radar-topic-clusters";

afterEach(cleanup);
const topicCluster = deriveRadarTopicCluster(["Developer Tools"]);
const tools: RadarTool[] = [2, 8, 16].map((ageHours, i) => ({
  id: `signal-${i}`, name: `Signal ${i}`, tagline: "Signal description",
  sourceUrl: "https://example.test", productHuntUrl: "https://example.test",
  websiteUrl: null, thumbnailUrl: null, votesCount: (i + 1) * 30,
  commentsCount: 2, attention: (i + 1) * 30 + 2,
  launchedAt: `2026-10-10T${String(20 - ageHours).padStart(2, "0")}:00:00Z`, ageHours,
  topics: ["Developer Tools"], catalogStatus: i ? "external" : "linked",
  category: null, categoryLabel: null, catalogSlug: i ? null : "signal",
  topicCluster, rank: i + 1,
}));
const props = { layoutTools: tools, clusters: [{ id: topicCluster.id, label: topicCluster.label, count: 3, colorIndex: 5, sectorIndex: 5 }], selectedId: null, onSelect: vi.fn() };
function centres(container: HTMLElement) {
  return [...container.querySelectorAll<SVGGElement>(".tv-rx-blip")].map(el => ({
    position: el.style.transform, cluster: el.dataset.cluster,
    label: el.querySelector(".tv-rx-blip__hit")?.getAttribute("aria-label"),
    hit: el.querySelector(".tv-rx-blip__hit")?.getAttribute("r"),
  }));
}
for (const range of ["day", "week", "month"] as const) {
  it(`preserves every V2 centre, accessible signal and hit target for ${range} in all modes`, () => {
    for (const local of [false, true]) for (const selectedId of [null, tools[0].id]) {
      const state = { ...props, range, selectedId, visualMode: local ? "local" as const : "global" as const, focusedClusterId: local ? topicCluster.id : null, displayOverrides: local ? new Map([[tools[0].id, { x: 37.125, y: 64.875 }]]) : null };
      const before = render(<RadarMap {...state} instrumentRenderer="v2" />);
      const reference = centres(before.container); before.unmount();
      const after = render(<RadarMap {...state} />);
      expect(centres(after.container)).toEqual(reference);
      expect(after.container.querySelectorAll(".tv-rx-blip__dot")).toHaveLength(0);
      expect(after.container.querySelectorAll(".tv-atlas__glyph-body")).toHaveLength(tools.length);
      const radii = [...after.container.querySelectorAll("[data-ring-radius]")].map(el => Number(el.getAttribute("data-ring-radius")));
      expect(radii).toEqual(radarRingLabels(range).map(r => 42 * r.ratio));
      if (selectedId) {
        const guide = after.container.querySelector(".tv-rx-map__selection-guide");
        if (local) expect([guide?.getAttribute("x2"), guide?.getAttribute("y2")]).toEqual(["37.125", "64.875"]);
        expect(after.container.querySelector(".tv-atlas__attention")?.textContent).toBe("32");
      }
      after.unmount();
    }
  });
}
it("uses canonical keyboard controls and keeps Atlas linked identity separate from selection", () => {
  const onSelect = vi.fn();
  const { container } = render(<RadarMap {...props} range="day" onSelect={onSelect} />);
  fireEvent.keyDown(container.querySelector(".tv-rx-blip__hit")!, { key: "Enter" });
  expect(onSelect).toHaveBeenCalledWith(tools[0].id);
  expect(container.querySelectorAll(".tv-atlas__linked")).toHaveLength(1);
  expect(container.querySelectorAll(".tv-atlas__selection-notches")).toHaveLength(0);
  expect([...container.querySelectorAll("[data-instrument-layer]")].every(el => el.getAttribute("aria-hidden") === "true")).toBe(true);
});
it("keeps visible mass ordered by attention and shows truthful unknown age", () => {
  const { container } = render(<RadarMap {...props} layoutTools={tools.map((t, i) => i ? t : { ...t, ageHours: null, launchedAt: null })} range="day" selectedId={tools[0].id} />);
  const radii = [...container.querySelectorAll("[data-drawn-radius]")].map(el => Number(el.getAttribute("data-drawn-radius")));
  expect(radii[0]).toBeLessThan(radii[1]); expect(radii[1]).toBeLessThan(radii[2]);
  expect(container.querySelector(".tv-atlas__age")?.textContent).toBe("ETÀ NON DISPONIBILE");
});
