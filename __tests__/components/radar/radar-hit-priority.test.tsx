/** @vitest-environment jsdom */
import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

import { RadarMap } from "@/components/radar/radar-map";
import type { RadarTool } from "@/lib/radar/radar-domain";
import { deriveRadarTopicCluster } from "@/lib/radar/radar-topic-clusters";

// Captured Global 30G failure: the Coding representative is painted at
// 271.2876°, inside the adjacent AI territory, with a canonical hit radius of 7.
const centre = { x: 11.25643267325119, y: 49.12919291152955 };
const topicCluster = deriveRadarTopicCluster(["Developer Tools"]);
const tiun: RadarTool = {
  id: "1199144", name: "tiun.", tagline: "Captured Product Hunt signal",
  sourceUrl: "https://www.producthunt.com/products/tiun", productHuntUrl: "https://www.producthunt.com/products/tiun",
  websiteUrl: null, thumbnailUrl: null, votesCount: 633, commentsCount: 102,
  attention: 735, launchedAt: "2026-09-15T07:01:00.000Z", ageHours: 609.1615083333334,
  topics: ["Developer Tools"], catalogStatus: "external", category: null,
  categoryLabel: null, catalogSlug: null, topicCluster, rank: 2,
};
const clusters = [{ id: topicCluster.id, label: topicCluster.label, count: 1, colorIndex: 5, sectorIndex: 5 }];

beforeEach(() => {
  vi.stubGlobal("PointerEvent", MouseEvent);
  vi.spyOn(SVGElement.prototype, "getBoundingClientRect").mockReturnValue({
    x: 0, y: 0, left: 0, top: 0, right: 100, bottom: 100, width: 100, height: 100,
    toJSON: () => ({}),
  });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

function setup(extra: Partial<Parameters<typeof RadarMap>[0]> = {}) {
  const onSelect = vi.fn(), onSelectSector = vi.fn(), onAmbiguous = vi.fn();
  const rendered = render(<RadarMap layoutTools={[tiun]} clusters={clusters} range="month" selectedId={null}
    displayOverrides={new Map([[tiun.id, centre]])} onSelect={onSelect} onSelectSector={onSelectSector}
    onAmbiguous={onAmbiguous} {...extra} />);
  const svg = rendered.container.querySelector("svg")!;
  const tap = (x: number, y: number, target: Element = svg) => fireEvent.pointerDown(target, { clientX: x, clientY: y });
  return { ...rendered, tap, onSelect, onSelectSector, onAmbiguous };
}

it.each([[0, 0], [6.99, 0], [-6.99, 0], [0, 6.99], [0, -6.99]])(
  "prioritizes the real rendered 30G tiun. hit at offset (%s, %s)", (dx, dy) => {
    const { container, tap, onSelect, onSelectSector } = setup();
    expect(container.querySelector<SVGGElement>(".tv-rx-blip")!.style.transform).toBe(`translate(${centre.x}px, ${centre.y}px)`);
    tap(centre.x + dx, centre.y + dy);
    expect(onSelect).toHaveBeenCalledExactlyOnceWith(tiun.id);
    expect(onSelectSector).not.toHaveBeenCalled();
  },
);

it.each([[7.01, 0], [-7.01, 0], [0, -7.01]])("preserves empty adjacent territory just outside the target (%s, %s)", (dx, dy) => {
  const { tap, onSelect, onSelectSector } = setup();
  tap(centre.x + dx, centre.y + dy);
  expect(onSelect).not.toHaveBeenCalled();
  expect(onSelectSector).toHaveBeenCalledExactlyOnceWith("ai-agents");
});

it("routes indistinguishable visible hits to the existing ambiguity mechanism", () => {
  const neighbour = { ...tiun, id: "overlapping-signal", name: "Neighbour" };
  const { tap, onSelect, onSelectSector, onAmbiguous } = setup({
    layoutTools: [tiun, neighbour], displayOverrides: new Map([[tiun.id, centre], [neighbour.id, centre]]),
  });
  tap(centre.x, centre.y);
  expect(onAmbiguous).toHaveBeenCalledOnce();
  expect(onAmbiguous.mock.calls[0][0].map((c: { point: { id: string } }) => c.point.id)).toEqual([tiun.id, neighbour.id]);
  expect(onSelect).not.toHaveBeenCalled();
  expect(onSelectSector).not.toHaveBeenCalled();
});

it.each(["visibleIds", "interactiveIds"] as const)("excludes invalid %s candidates before background navigation", (key) => {
  const { tap, onSelect, onSelectSector } = setup({ [key]: new Set<string>() });
  tap(centre.x, centre.y);
  expect(onSelect).not.toHaveBeenCalled();
  expect(onSelectSector).toHaveBeenCalledExactlyOnceWith("ai-agents");
});

it("gives a signal priority even when the pointer event originates on a sector affordance", () => {
  const { container, tap, onSelect, onSelectSector } = setup();
  tap(centre.x, centre.y, container.querySelector(".tv-rx-map__compass-hit")!);
  expect(onSelect).toHaveBeenCalledExactlyOnceWith(tiun.id);
  expect(onSelectSector).not.toHaveBeenCalled();
});

it("preserves sector keyboard entry and Local signal selection", () => {
  const { container, tap, onSelect, onSelectSector, rerender } = setup();
  const sector = container.querySelector('[aria-label="Apri il settore Sviluppo & Coding"]')!;
  fireEvent.keyDown(sector, { key: "Enter" });
  expect(onSelectSector).toHaveBeenCalledExactlyOnceWith(topicCluster.id);
  onSelectSector.mockClear();
  rerender(<RadarMap layoutTools={[tiun]} clusters={clusters} range="month" selectedId={tiun.id}
    focusedClusterId={topicCluster.id} displayOverrides={new Map([[tiun.id, centre]])}
    onSelect={onSelect} onSelectSector={onSelectSector} />);
  tap(centre.x, centre.y);
  expect(onSelect).toHaveBeenCalledExactlyOnceWith(tiun.id);
  expect(onSelectSector).not.toHaveBeenCalled();
});
