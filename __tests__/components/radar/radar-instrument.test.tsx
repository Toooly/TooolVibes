/** @vitest-environment jsdom */
import { cleanup, render } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

import { RadarMap } from "@/components/radar/radar-map";
import type { RadarTool } from "@/lib/radar/radar-domain";
import { layoutRadarPoints } from "@/lib/radar/radar-geometry";
import { deriveRadarTopicCluster } from "@/lib/radar/radar-topic-clusters";

const topicCluster = deriveRadarTopicCluster(["Developer Tools"]);
const tool: RadarTool = {
  id: "signal", name: "Signal", tagline: "Signal description",
  sourceUrl: "https://example.test/signal", productHuntUrl: "https://example.test/signal",
  websiteUrl: null, thumbnailUrl: null, votesCount: 10, commentsCount: 2,
  attention: 12, launchedAt: "2026-10-10T07:00:00Z", ageHours: 6,
  topics: ["Developer Tools"], catalogStatus: "external", category: null,
  categoryLabel: null, catalogSlug: null, topicCluster, rank: 1,
};
const clusters = [{ id: topicCluster.id, label: topicCluster.label, count: 1, colorIndex: 5, sectorIndex: 5 }];
const props = { layoutTools: [tool], clusters, range: "day" as const, selectedId: null, onSelect: vi.fn() };

afterEach(cleanup);

it("ends inspection guidance at the display override used by the marker", () => {
  const display = { x: 63.75, y: 27.25 };
  const { container } = render(<RadarMap {...props} selectedId={tool.id} displayOverrides={new Map([[tool.id, display]])} />);
  const guide = container.querySelector(".tv-rx-map__selection-guide");
  expect(guide?.getAttribute("x2")).toBe(String(display.x));
  expect(guide?.getAttribute("y2")).toBe(String(display.y));
  expect(container.querySelector<SVGGElement>(".tv-rx-blip")?.style.transform).toBe(`translate(${display.x}px, ${display.y}px)`);
  expect(container.querySelectorAll(".tv-rx-blip__ring")).toHaveLength(1);
  expect(container.querySelectorAll(".tv-rx-blip__halo")).toHaveLength(1);
});

it("preserves canonical centres and hit radius when catalog identity and selection change", () => {
  const point = layoutRadarPoints([tool], { rangeHours: 24 }).points[0];
  const { container, rerender } = render(<RadarMap {...props} />);
  const radius = container.querySelector(".tv-rx-blip__hit")?.getAttribute("r");
  const centre = container.querySelector<SVGGElement>(".tv-rx-blip")?.style.transform;
  expect(centre).toBe(`translate(${point.x}px, ${point.y}px)`);
  rerender(<RadarMap {...props} layoutTools={[{ ...tool, catalogStatus: "linked", catalogSlug: "signal" }]} selectedId={tool.id} />);
  expect(container.querySelector<SVGGElement>(".tv-rx-blip")?.style.transform).toBe(centre);
  expect(container.querySelector(".tv-rx-blip__hit")?.getAttribute("r")).toBe(radius);
  expect(container.querySelector(".tv-rx-blip__entity")?.getAttribute("aria-hidden")).toBe("true");
});

it("does not invent guidance for a selected signal absent from the dataset", () => {
  const { container } = render(<RadarMap {...props} selectedId="absent" />);
  expect(container.querySelector(".tv-rx-map__selection-guide")).toBeNull();
});
