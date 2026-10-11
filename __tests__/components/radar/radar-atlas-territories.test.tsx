/** @vitest-environment jsdom */
import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { RadarAtlasField, RadarAtlasGlyph } from "@/components/radar/radar-atlas";
import type { RadarClusterSummary } from "@/lib/radar/radar-domain";
import { radarTopicClusterOrder } from "@/lib/radar/radar-topic-clusters";

afterEach(cleanup);
const clusters: RadarClusterSummary[] = [
  { id: "developer-coding", label: "Sviluppo & Coding", count: 8, sectorIndex: 5, colorIndex: 5 },
  { id: "productivity", label: "Produttività", count: 7, sectorIndex: 4, colorIndex: 4 },
  { id: "ai-agents", label: "AI & Agenti", count: 0, sectorIndex: 6, colorIndex: 6 },
];
const props = { clusterOrder: radarTopicClusterOrder(), clusters, colors: new Map([["developer-coding", "orange"], ["productivity", "blue"]]), tools: [], range: "day" as const };

it("makes each active territory semantic, labelled with its real count and keyboard reachable", () => {
  const onSelectSector = vi.fn();
  const { getByRole, queryByRole, container } = render(<svg><RadarAtlasField {...props} onSelectSector={onSelectSector} /></svg>);
  const area = getByRole("button", { name: "Apri Sviluppo & Coding, 8 segnali" });
  expect(area.getAttribute("tabindex")).toBe("0");
  fireEvent.keyDown(area, { key: "Enter" });
  fireEvent.keyDown(getByRole("button", { name: "Apri Produttività, 7 segnali" }), { key: " " });
  expect(onSelectSector.mock.calls).toEqual([["developer-coding"], ["productivity"]]);
  expect(queryByRole("button", { name: /AI & Agenti/ })).toBeNull();
  expect(container.querySelectorAll("[data-territory-hit]")).toHaveLength(2);
  expect(container.querySelectorAll(".tv-atlas__area-arrow")).toHaveLength(2);
});

it("keeps Local territory contextual while the real signals own interaction", () => {
  const { queryAllByRole, container } = render(<svg><RadarAtlasField {...props} focusedClusterId="developer-coding" onSelectSector={vi.fn()} /></svg>);
  expect(queryAllByRole("button")).toHaveLength(0);
  expect(container.querySelectorAll("[data-atlas-territory]")).toHaveLength(1);
  expect(container.querySelectorAll("[data-instrument-layer]").length).toBeGreaterThan(0);
  expect([...container.querySelectorAll("[data-instrument-layer]")].every(el => el.getAttribute("aria-hidden") === "true")).toBe(true);
});

it("uses a real initial without external images and distinguishes linked identity from selected focus", () => {
  const { container, rerender } = render(<svg><RadarAtlasGlyph radius={4} color="cyan" selected={false} highlighted={false} linked={false} name="Blink" /></svg>);
  expect(container.querySelector(".tv-atlas__beacon-mark")?.textContent).toBe("B");
  expect(container.querySelectorAll("image,img")).toHaveLength(0);
  expect(container.querySelectorAll(".tv-atlas__external")).toHaveLength(1);
  expect(container.querySelectorAll(".tv-atlas__selection-notches")).toHaveLength(0);
  rerender(<svg><RadarAtlasGlyph radius={4} color="cyan" selected={false} highlighted={false} linked name="Blink" /></svg>);
  expect(container.querySelectorAll(".tv-atlas__linked")).toHaveLength(1);
  expect(container.querySelectorAll(".tv-atlas__selection-notches")).toHaveLength(0);
  rerender(<svg><RadarAtlasGlyph radius={4} color="cyan" selected highlighted={false} linked name="Blink" /></svg>);
  expect(container.querySelectorAll(".tv-atlas__selection-notches")).toHaveLength(1);
  expect(container.querySelectorAll(".tv-rx-blip__halo,.tv-rx-blip__ring")).toHaveLength(0);
});
