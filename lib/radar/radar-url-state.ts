/**
 * Radar URL state codec (spec §36).
 *
 * Encodes the shareable/restorable Radar state into search params:
 *   ?v=panoramica|trend|per-te|watchlist   tab
 *   &r=day|week|month                      time range
 *   &c=<category-id>                       category filter (omit = Tutti)
 *   &t=<radar-tool-id>                     selected tool (quick preview)
 *   &q=<text>                              search query
 *
 * Ephemeral animation state is never encoded.
 */

import type { ProductHuntRange } from "@/lib/radar/product-hunt-contract";

export type RadarTab = "panoramica" | "trend" | "per-te" | "watchlist";

export const RADAR_TABS: readonly RadarTab[] = [
  "panoramica",
  "trend",
  "per-te",
  "watchlist",
];

export const RADAR_TAB_LABEL: Record<RadarTab, string> = {
  panoramica: "Panoramica",
  trend: "Trend",
  "per-te": "Per te",
  watchlist: "Watchlist",
};

export type RadarUrlState = {
  tab: RadarTab;
  range: ProductHuntRange;
  category: string | null;
  tool: string | null;
  query: string | null;
};

export const DEFAULT_RADAR_URL_STATE: RadarUrlState = {
  tab: "panoramica",
  range: "week",
  category: null,
  tool: null,
  query: null,
};

const RANGES: readonly ProductHuntRange[] = ["day", "week", "month"];

function isTab(value: string | null): value is RadarTab {
  return value !== null && (RADAR_TABS as readonly string[]).includes(value);
}

function isRange(value: string | null): value is ProductHuntRange {
  return value !== null && (RANGES as readonly string[]).includes(value);
}

function cleanParam(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed.slice(0, 120) : null;
}

export function parseRadarUrlState(
  params: URLSearchParams | Readonly<Record<string, string | string[] | undefined>>,
): RadarUrlState {
  const read = (key: string): string | null => {
    if (params instanceof URLSearchParams) return params.get(key);
    const raw = params[key];
    if (Array.isArray(raw)) return raw[0] ?? null;
    return raw ?? null;
  };

  return {
    tab: isTab(read("v")) ? (read("v") as RadarTab) : DEFAULT_RADAR_URL_STATE.tab,
    range: isRange(read("r"))
      ? (read("r") as ProductHuntRange)
      : DEFAULT_RADAR_URL_STATE.range,
    category: cleanParam(read("c")),
    tool: cleanParam(read("t")),
    query: cleanParam(read("q")),
  };
}

/**
 * Serializes only the non-default fields so URLs stay short and shareable.
 */
export function serializeRadarUrlState(
  state: RadarUrlState,
): Record<string, string> {
  const params: Record<string, string> = {};
  if (state.tab !== DEFAULT_RADAR_URL_STATE.tab) params.v = state.tab;
  if (state.range !== DEFAULT_RADAR_URL_STATE.range) params.r = state.range;
  if (state.category) params.c = state.category;
  if (state.tool) params.t = state.tool;
  if (state.query) params.q = state.query;
  return params;
}

export function radarUrlStateEquals(left: RadarUrlState, right: RadarUrlState): boolean {
  return (
    left.tab === right.tab &&
    left.range === right.range &&
    left.category === right.category &&
    left.tool === right.tool &&
    left.query === right.query
  );
}
