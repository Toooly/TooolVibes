/**
 * Radar Watchlist domain tests (spec §19-21) + URL state (spec §36).
 */

import { describe, expect, it } from "vitest";

import {
  RADAR_WATCH_MOVEMENT_REASON,
  evaluateRadarWatchSignals,
  isRadarWatchEmpty,
} from "@/lib/radar/radar-watch";
import {
  DEFAULT_RADAR_URL_STATE,
  parseRadarUrlState,
  radarUrlStateEquals,
  serializeRadarUrlState,
} from "@/lib/radar/radar-url-state";
import {
  createEmptyRadarWatchState,
} from "@/lib/discovery/workspace-contract";
import { reduceWorkspaceState } from "@/lib/discovery/workspace-contract";
import type { RadarTool } from "@/lib/radar/radar-domain";

function tool(overrides: Partial<RadarTool> & { id: string; rank: number }): RadarTool {
  return {
    name: overrides.id,
    tagline: "",
    productHuntUrl: "https://www.producthunt.com/posts/x",
    thumbnailUrl: null,
    votesCount: 10,
    commentsCount: 1,
    attention: 11,
    launchedAt: null,
    ageHours: null,
    topics: [],
    category: null,
    categoryLabel: null,
    catalogSlug: null,
    ...overrides,
  };
}

const TOOLS: RadarTool[] = [
  tool({
    id: "alpha",
    rank: 1,
    catalogSlug: "alpha-tool",
    category: { id: "video-ai", label: "Video AI", count: 1, colorIndex: 0 },
  }),
  tool({ id: "beta", rank: 2 }),
];

const AT = "2026-07-28T12:00:00.000Z";

describe("radar watch", () => {
  it("WATCH-01 watch vuoto e riconosciuto", () => {
    expect(isRadarWatchEmpty(createEmptyRadarWatchState())).toBe(true);
    expect(isRadarWatchEmpty({ slugs: ["a"], categories: [], updatedAt: null })).toBe(false);
  });

  it("WATCH-02 senza storico non dichiara movimenti", () => {
    const digest = evaluateRadarWatchSignals(
      { slugs: ["alpha-tool"], categories: [], updatedAt: null },
      TOOLS,
      null,
    );
    expect(digest.movementAlertsAvailable).toBe(false);
    expect(digest.signals.every((signal) => signal.grounded)).toBe(true);
    expect(digest.signals.some((signal) => signal.kind === "new-in-category")).toBe(false);
    expect(digest.signals.some((signal) => signal.kind === "watched-tool-moved")).toBe(false);
  });

  it("WATCH-03 con storico dichiara entrate e movimenti reali", () => {
    const previous = [tool({ id: "beta", rank: 2 })];
    const digest = evaluateRadarWatchSignals(
      { slugs: ["alpha-tool"], categories: [], updatedAt: null },
      TOOLS,
      previous,
    );
    expect(digest.movementAlertsAvailable).toBe(true);
    expect(digest.signals.some((signal) => signal.kind === "new-in-category")).toBe(true);
  });

  it("WATCH-04 la ragione del movimento e esplicita", () => {
    expect(RADAR_WATCH_MOVEMENT_REASON).toMatch(/dati storici/i);
  });

  it("WATCH-05 le azioni workspace producono radarWatch persistente", () => {
    const empty = {
      ...{ schemaVersion: 1 as const },
      ...({
        schemaVersion: 1,
        clearedAt: null,
        saved: { slugs: [], updatedAt: null },
        compare: { slugs: [], updatedAt: null },
        stack: { slugs: [], updatedAt: null },
        personalStacks: [],
        toolStates: {},
        events: [],
        radarWatch: createEmptyRadarWatchState(),
      }),
    };
    const next = reduceWorkspaceState(empty, {
      type: "radar-watch/toggle-slug",
      slug: "alpha-tool",
      at: AT,
    });
    expect(next.radarWatch.slugs).toEqual(["alpha-tool"]);

    const withCategory = reduceWorkspaceState(next, {
      type: "radar-watch/toggle-category",
      category: "video-ai",
      at: AT,
    });
    expect(withCategory.radarWatch.categories).toEqual(["video-ai"]);

    const cleared = reduceWorkspaceState(withCategory, { type: "radar-watch/clear", at: AT });
    expect(isRadarWatchEmpty(cleared.radarWatch)).toBe(true);
  });
});

describe("radar url state", () => {
  it("URL-01 decodifica tab, range, categoria e tool", () => {
    const parsed = parseRadarUrlState(
      new URLSearchParams("v=trend&r=week&c=video-ai&t=alpha&q=cursor"),
    );
    expect(parsed).toEqual({
      tab: "trend",
      range: "week",
      category: "video-ai",
      tool: "alpha",
      query: "cursor",
    });
  });

  it("URL-02 ignora valori non validi e ricade sui default", () => {
    const parsed = parseRadarUrlState(new URLSearchParams("v=nope&r=decade"));
    expect(parsed).toEqual(DEFAULT_RADAR_URL_STATE);
  });

  it("URL-03 serializza solo lo stato non di default", () => {
    expect(serializeRadarUrlState(DEFAULT_RADAR_URL_STATE)).toEqual({});
    expect(
      serializeRadarUrlState({
        tab: "watchlist",
        range: "month",
        category: "video-ai",
        tool: "alpha",
        query: null,
      }),
    ).toEqual({ v: "watchlist", r: "month", c: "video-ai", t: "alpha" });
  });

  it("URL-04 round-trip stabile", () => {
    const state = {
      tab: "per-te" as const,
      range: "week" as const,
      category: "no-code",
      tool: "beta",
      query: "ai",
    };
    const params = new URLSearchParams(serializeRadarUrlState(state));
    expect(parseRadarUrlState(params)).toEqual(state);
    expect(radarUrlStateEquals(parseRadarUrlState(params), state)).toBe(true);
  });
});
