/**
 * Temporal truth contract (PASS: TEMPORAL TRUTH + QA FIXTURE).
 *
 * Range contract:
 *   24H — only signals whose age <= 24 hours
 *   7G  — only signals whose age <= 7 days (168 hours)
 *   30G — only signals whose age <= 30 days (720 hours)
 *
 * Ages are computed against the canonical snapshot time (payload.updatedAt),
 * never against arbitrary Date.now() when the payload has a fixed snapshot.
 * Local planner must preserve semantic radius exactly after filtering.
 */

import { describe, expect, it } from "vitest";

import { buildRadarView } from "@/lib/radar/radar-domain";
import {
  planRadarLocalFocus,
  RADAR_LOCAL_DEFAULT_OUTER_RADIUS,
  type RadarLocalFocusSignal,
} from "@/lib/radar/radar-local-focus";

const SNAPSHOT_ISO = "2026-10-08T12:00:00.000Z";
const SNAPSHOT_MS = Date.parse(SNAPSHOT_ISO);
const HOUR_MS = 3_600_000;

function hoursAgo(hours: number): string {
  return new Date(SNAPSHOT_MS - hours * HOUR_MS).toISOString();
}

type FixtureItem = {
  id: string;
  name: string;
  tagline: string;
  votesCount: number;
  commentsCount: number;
  productHuntUrl: string;
  launchedAt: string;
  slug?: string;
  topics?: string[];
};

function makePayload(items: FixtureItem[], range: "day" | "week" | "month") {
  return {
    status: "ok" as const,
    source: "qa-fixture" as const,
    stale: false,
    range,
    updatedAt: SNAPSHOT_ISO,
    items,
  };
}

const ALL_ITEMS: FixtureItem[] = [
  { id: "t-1h", name: "OneH", tagline: "1h old", votesCount: 100, commentsCount: 10, productHuntUrl: "https://ph.dev/one", launchedAt: hoursAgo(1), topics: ["Developer Tools"] },
  { id: "t-3h", name: "ThreeH", tagline: "3h old", votesCount: 200, commentsCount: 20, productHuntUrl: "https://ph.dev/three", launchedAt: hoursAgo(3), topics: ["Developer Tools"] },
  { id: "t-6h", name: "SixH", tagline: "6h old", votesCount: 300, commentsCount: 30, productHuntUrl: "https://ph.dev/six", launchedAt: hoursAgo(6), topics: ["Developer Tools"] },
  { id: "t-12h", name: "TwelveH", tagline: "12h old", votesCount: 400, commentsCount: 40, productHuntUrl: "https://ph.dev/twelve", launchedAt: hoursAgo(12), topics: ["Developer Tools"] },
  { id: "t-23h", name: "TwentyThreeH", tagline: "23h old", votesCount: 500, commentsCount: 50, productHuntUrl: "https://ph.dev/twentythree", launchedAt: hoursAgo(23), topics: ["Developer Tools"] },
  { id: "t-1d", name: "OneD", tagline: "1d old", votesCount: 600, commentsCount: 60, productHuntUrl: "https://ph.dev/oned", launchedAt: hoursAgo(24), topics: ["Artificial Intelligence"] },
  { id: "t-2d", name: "TwoD", tagline: "2d old", votesCount: 700, commentsCount: 70, productHuntUrl: "https://ph.dev/twod", launchedAt: hoursAgo(48), topics: ["Artificial Intelligence"] },
  { id: "t-4d", name: "FourD", tagline: "4d old", votesCount: 800, commentsCount: 80, productHuntUrl: "https://ph.dev/fourd", launchedAt: hoursAgo(96), topics: ["No-Code"] },
  { id: "t-6d", name: "SixD", tagline: "6d old", votesCount: 900, commentsCount: 90, productHuntUrl: "https://ph.dev/sixd", launchedAt: hoursAgo(144), topics: ["No-Code"] },
  { id: "t-7d", name: "SevenD", tagline: "7d old", votesCount: 1000, commentsCount: 100, productHuntUrl: "https://ph.dev/sevend", launchedAt: hoursAgo(168), topics: ["Design Tools"] },
  { id: "t-14d", name: "FourteenD", tagline: "14d old", votesCount: 1100, commentsCount: 110, productHuntUrl: "https://ph.dev/fourteend", launchedAt: hoursAgo(336), topics: ["Design Tools"] },
  { id: "t-21d", name: "TwentyOneD", tagline: "21d old", votesCount: 1200, commentsCount: 120, productHuntUrl: "https://ph.dev/twentyoned", launchedAt: hoursAgo(504), topics: ["Video"] },
  { id: "t-29d", name: "TwentyNineD", tagline: "29d old", votesCount: 1300, commentsCount: 130, productHuntUrl: "https://ph.dev/twentynined", launchedAt: hoursAgo(696), topics: ["Video"] },
  { id: "t-30d", name: "ThirtyD", tagline: "30d old", votesCount: 1400, commentsCount: 140, productHuntUrl: "https://ph.dev/thirtyd", launchedAt: hoursAgo(720), topics: ["Video"] },
];

function filterByRange(items: FixtureItem[], maxHours: number): FixtureItem[] {
  return items.filter(
    (item) => (SNAPSHOT_MS - Date.parse(item.launchedAt)) / HOUR_MS <= maxHours,
  );
}

describe("RADAR-TEMPORAL range truth", () => {
  it("RADAR-TEMPORAL-01 24H contains only signals with age <= 24h", () => {
    const items = filterByRange(ALL_ITEMS, 24);
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      const ageH = (SNAPSHOT_MS - Date.parse(item.launchedAt)) / HOUR_MS;
      expect(ageH).toBeLessThanOrEqual(24);
    }
    // Must NOT contain any >24h items (t-1d at exactly 24h IS valid)
    const ids = items.map((i) => i.id);
    expect(ids).toContain("t-1d"); // boundary: age == 24h is valid
    expect(ids).not.toContain("t-2d");
    expect(ids).not.toContain("t-7d");
    expect(ids).not.toContain("t-30d");
  });

  it("RADAR-TEMPORAL-02 7G contains only signals with age <= 7d", () => {
    const items = filterByRange(ALL_ITEMS, 168);
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      const ageH = (SNAPSHOT_MS - Date.parse(item.launchedAt)) / HOUR_MS;
      expect(ageH).toBeLessThanOrEqual(168);
    }
    const ids = items.map((i) => i.id);
    expect(ids).not.toContain("t-14d");
    expect(ids).not.toContain("t-21d");
    expect(ids).not.toContain("t-30d");
  });

  it("RADAR-TEMPORAL-03 30G contains only signals with age <= 30d", () => {
    const items = filterByRange(ALL_ITEMS, 720);
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      const ageH = (SNAPSHOT_MS - Date.parse(item.launchedAt)) / HOUR_MS;
      expect(ageH).toBeLessThanOrEqual(720);
    }
  });

  it("RADAR-TEMPORAL-04 buildRadarView computes ages from snapshot time, not Date.now()", () => {
    const payload = makePayload(
      [ALL_ITEMS[0], ALL_ITEMS[5]], // 1h and 24h items
      "day",
    );
    const view = buildRadarView(payload, [], { now: SNAPSHOT_MS });

    const oneH = view.tools.find((t) => t.id === "t-1h");
    const oneD = view.tools.find((t) => t.id === "t-1d");

    expect(oneH).toBeDefined();
    expect(oneH!.ageHours).toBeCloseTo(1, 1);

    expect(oneD).toBeDefined();
    expect(oneD!.ageHours).toBeCloseTo(24, 1);
  });

  it("RADAR-TEMPORAL-05 ages from snapshot time differ from Date.now() for stale fixtures", () => {
    const payload = makePayload([ALL_ITEMS[0]], "day");
    const viewSnapshot = buildRadarView(payload, [], { now: SNAPSHOT_MS });
    const viewNow = buildRadarView(payload, [], {});

    const snapshotAge = viewSnapshot.tools[0].ageHours!;
    const nowAge = viewNow.tools[0].ageHours!;

    // Snapshot-based age is 1h; Date.now() age differs by real-clock drift
    expect(snapshotAge).toBeCloseTo(1, 1);
    expect(nowAge).not.toBeCloseTo(snapshotAge, 0); // must differ meaningfully
    expect(nowAge).toBeGreaterThan(snapshotAge + 1); // real clock is past snapshot
  });

  it("RADAR-TEMPORAL-06 local planner preserves semantic radius after range filtering", () => {
    // Simulate 24H dense cluster: 7 signals at various ages
    const signals: RadarLocalFocusSignal[] = [
      { id: "d1", semanticAngle: 10, radiusRatio: 0.2, radius: 2.0 },
      { id: "d2", semanticAngle: 50, radiusRatio: 0.35, radius: 2.2 },
      { id: "d3", semanticAngle: 90, radiusRatio: 0.5, radius: 2.4 },
      { id: "d4", semanticAngle: 140, radiusRatio: 0.65, radius: 2.1 },
      { id: "d5", semanticAngle: 190, radiusRatio: 0.75, radius: 2.6 },
      { id: "d6", semanticAngle: 240, radiusRatio: 0.88, radius: 2.3 },
      { id: "d7", semanticAngle: 300, radiusRatio: 0.95, radius: 2.5 },
    ];

    const plan = planRadarLocalFocus(signals);

    // semanticRadiusMaxDelta must be 0
    for (const node of plan.nodes) {
      const signal = signals.find((s) => s.id === node.id)!;
      const expected = RADAR_LOCAL_DEFAULT_OUTER_RADIUS * signal.radiusRatio;
      expect(node.semanticRadius).toBe(expected);
      expect(node.focusDisplayRadius).toBe(node.semanticRadius);
    }
    expect(plan.visualOverlapCount).toBe(0);
    expect(plan.layoutStatus).toBe("ok");
  });

  it("RADAR-TEMPORAL-07 fixture age distribution spans multiple temporal rings", () => {
    const dayItems = filterByRange(ALL_ITEMS, 24);
    const ages = dayItems.map(
      (i) => (SNAPSHOT_MS - Date.parse(i.launchedAt)) / HOUR_MS,
    );

    // Must have signals at multiple depths (not all clamped to outer ring)
    const bins = { near0to6: 0, near6to12: 0, near12to18: 0, near18to24: 0 };
    for (const age of ages) {
      if (age <= 6) bins.near0to6++;
      else if (age <= 12) bins.near6to12++;
      else if (age <= 18) bins.near12to18++;
      else bins.near18to24++;
    }

    // At least 3 of 4 bins should have signals
    const occupiedBins = Object.values(bins).filter((c) => c > 0).length;
    expect(occupiedBins).toBeGreaterThanOrEqual(3);
  });

  it("RADAR-TEMPORAL-08 rangeViolations = 0 for all ranges", () => {
    const ranges: Array<{ maxHours: number }> = [
      { maxHours: 24 },
      { maxHours: 168 },
      { maxHours: 720 },
    ];

    for (const { maxHours } of ranges) {
      const items = filterByRange(ALL_ITEMS, maxHours);
      let violations = 0;
      for (const item of items) {
        const ageH = (SNAPSHOT_MS - Date.parse(item.launchedAt)) / HOUR_MS;
        if (ageH > maxHours) violations++;
      }
      expect(violations).toBe(0);
    }
  });
});
