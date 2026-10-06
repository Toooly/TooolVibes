/**
 * RADAR SIGNAL MODEL V2 — semantic evidence (spec §24, §25, §27).
 *
 * Builds a realistic Product Hunt fixture and proves the map no longer
 * collapses into one fallback category. Also writes
 * `artifacts/radar-qa/RADAR-SIGNAL-V2-SEMANTICS.json` — the machine-readable
 * evidence required by §25, computed from the REAL domain + geometry code.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { buildRadarView } from "@/lib/radar/radar-domain";
import {
  layoutRadarPoints,
  RADAR_RANGE_HOURS,
  type RadarLayoutItem,
} from "@/lib/radar/radar-geometry";
import type { RadarCatalogTool } from "@/lib/radar/radar-catalog-match";
import type { ProductHuntPayload } from "@/lib/radar/product-hunt-contract";

const CATALOG: RadarCatalogTool[] = [
  { slug: "blink", name: "Blink" },
  { slug: "blogify", name: "Blogify" },
  { slug: "agentx", name: "AgentX" },
];

type FixtureSpec = [
  slug: string,
  name: string,
  votes: number,
  comments: number,
  launchedAt: string | null,
  topics: string[],
];

// 20 external signals + 3 catalog-linked + 1 deliberately unmapped.
// Vote/comment counts span 0 → 1842 and ages span hours → weeks.
const SPEC: FixtureSpec[] = [
  ["blink", "Blink", 1842, 212, "2026-10-06T07:00:00.000Z", ["Developer Tools", "Artificial Intelligence"]],
  ["blogify", "Blogify", 964, 141, "2026-10-05T07:00:00.000Z", ["Writing", "Artificial Intelligence"]],
  ["agentx", "AgentX", 488, 63, "2026-10-03T07:00:00.000Z", ["Artificial Intelligence"]],
  ["incredible", "Incredible", 1200, 190, "2026-10-06T06:00:00.000Z", ["Productivity", "Artificial Intelligence", "Menu Bar Apps"]],
  ["rill-browser", "Rill Browser", 320, 23, "2026-10-06T07:01:00.000Z", ["Developer Tools", "Artificial Intelligence"]],
  ["audr", "AUDR by Chargebee", 210, 4, "2026-10-06T07:01:00.000Z", ["Open Source", "Developer Tools", "GitHub"]],
  ["fuse-ai", "Fuse AI", 180, 9, "2026-10-06T07:01:00.000Z", ["Sales", "API", "Artificial Intelligence"]],
  ["openbot", "OpenBot", 260, 12, "2026-10-06T07:01:00.000Z", ["Productivity", "Open Source", "Artificial Intelligence", "GitHub"]],
  ["extrovert", "Extrovert", 95, 4, "2026-10-05T07:01:00.000Z", ["Sales", "Marketing", "LinkedIn"]],
  ["pheebs", "Pheebs", 61, 1, "2026-10-05T07:01:00.000Z", ["Open Source", "Artificial Intelligence", "GitHub", "Data & Analytics"]],
  ["noteworthy", "NoteWorthy", 142, 2, "2026-10-04T07:01:00.000Z", ["iOS", "Productivity", "Notes"]],
  ["chunk", "Chunk", 130, 2, "2026-10-04T07:01:00.000Z", ["Mac", "Productivity", "Calendar"]],
  ["coddy", "Coddy", 410, 9, "2026-10-02T07:01:00.000Z", ["Android", "Education", "Developer Tools", "Artificial Intelligence"]],
  ["doco", "Doco", 77, 6, "2026-10-02T07:01:00.000Z", ["Productivity", "Music", "Lifestyle"]],
  ["scumble", "Scumble", 520, 10, "2026-10-01T07:01:00.000Z", ["Design Tools", "Open Source", "Artificial Intelligence", "GitHub"]],
  ["willow", "Willow Knowledge", 233, 3, "2026-10-01T07:01:00.000Z", ["Productivity", "Writing", "Artificial Intelligence"]],
  ["ghostifier", "Ghostifier", 48, 2, "2026-09-30T07:01:00.000Z", ["Email", "Privacy", "Security"]],
  ["clueso", "Clueso MCP", 597, 160, "2026-09-22T07:01:00.000Z", ["Artificial Intelligence", "Animation", "Video"]],
  ["pexo", "Pexo", 458, 76, "2026-09-30T07:01:00.000Z", ["Marketing", "Artificial Intelligence", "Video"]],
  ["monospace", "Monospace from Directus", 474, 110, "2026-10-01T07:01:00.000Z", ["API", "Developer Tools", "Data"]],
  ["miso", "miso.com", 270, 13, "2026-10-03T07:01:00.000Z", ["Messaging", "Artificial Intelligence", "iMessage Apps"]],
  ["famulor", "Famulor", 239, 47, "2026-10-02T07:01:00.000Z", ["Android", "Email", "Messaging"]],
  ["dailyhelm", "DailyHelm", 220, 66, "2026-10-05T07:01:00.000Z", ["Analytics", "Artificial Intelligence", "Business Intelligence"]],
  ["unmapped-one", "Signal Without Any Known Topic", 33, 2, "2026-09-20T07:01:00.000Z", ["Underwater Basket Weaving"]],
];

const NOW = new Date("2026-10-06T12:00:00.000Z").getTime();

function buildPayload(): ProductHuntPayload {
  return {
    status: "ok",
    source: "product-hunt-live",
    stale: false,
    range: "month",
    updatedAt: "2026-10-06T12:00:00.000Z",
    items: SPEC.map(([slug, name, votes, comments, launchedAt, topics]) => ({
      id: slug,
      name,
      tagline: `${name} — segnale reale di mercato`,
      votesCount: votes,
      commentsCount: comments,
      productHuntUrl: `https://www.producthunt.com/posts/${slug}`,
      thumbnailUrl: undefined,
      launchedAt: launchedAt ?? undefined,
      topics,
      slug,
    })),
  };
}

describe("RADAR-SIGNAL-V2 semantic evidence", () => {
  const view = buildRadarView(buildPayload(), CATALOG, { now: NOW });
  const layout = layoutRadarPoints(view.tools as unknown as RadarLayoutItem[], {
    rangeHours: RADAR_RANGE_HOURS.month,
  });

  it("RADAR-SIGNAL-V2-01 the fixture satisfies the §24 real-data shape", () => {
    expect(view.tools.length).toBeGreaterThanOrEqual(20);
    expect(view.catalogLinkedCount).toBeGreaterThanOrEqual(3);
    expect(view.externalCount).toBeGreaterThanOrEqual(20);
    const votes = view.tools.map((tool) => tool.votesCount);
    expect(Math.max(...votes) - Math.min(...votes)).toBeGreaterThan(1000);
    const ages = view.tools.map((tool) => tool.ageHours).filter((age) => age !== null);
    expect(Math.max(...ages) - Math.min(...ages)).toBeGreaterThan(100);
    const others = view.tools.filter((tool) => tool.topicCluster.id === "other");
    expect(others.length).toBeGreaterThanOrEqual(1);
  });

  it("RADAR-SIGNAL-V2-02 the map no longer collapses to one cluster", () => {
    // This is the defect the physical review found: "1 Categoria attiva".
    expect(view.clusters.length).toBeGreaterThanOrEqual(4);
    const total = view.clusters.reduce((sum, cluster) => sum + cluster.count, 0);
    expect(total).toBe(view.tools.length);
    // No single cluster owns more than 60% of the map.
    const largest = Math.max(...view.clusters.map((cluster) => cluster.count));
    expect(largest / view.tools.length).toBeLessThan(0.6);
  });

  it("RADAR-SIGNAL-V2-03 external signals never gain a fake Catalog entity", () => {
    for (const tool of view.tools) {
      if (tool.catalogStatus === "external") {
        expect(tool.catalogSlug).toBeNull();
        expect(tool.category).toBeNull();
      } else {
        expect(tool.catalogSlug).toBeTruthy();
      }
    }
  });

  it("RADAR-SIGNAL-V2-04 geometry is deterministic and semantically ordered", () => {
    const again = layoutRadarPoints(view.tools as unknown as RadarLayoutItem[], {
      rangeHours: RADAR_RANGE_HOURS.month,
    });
    expect(JSON.stringify(again.points)).toBe(JSON.stringify(layout.points));
    expect(layout.radiusBasis).toBe("age");
    expect(layout.sectorCount).toBe(view.clusters.length);
  });

  it("RADAR-SIGNAL-V2-05 writes the §25 semantic evidence artifact", () => {
    const pointById = new Map(layout.points.map((point) => [point.id, point]));
    const rows = view.tools.map((tool) => {
      const point = pointById.get(tool.id)!;
      return {
        name: tool.name,
        catalogStatus: tool.catalogStatus,
        catalogSlug: tool.catalogSlug,
        radarTopicCluster: tool.topicCluster.id,
        radarTopicClusterLabel: tool.topicCluster.label,
        sourceTopics: tool.topics,
        createdAt: tool.launchedAt,
        ageHours: tool.ageHours,
        semanticAngle: Number(point.semanticAngleDeg.toFixed(3)),
        semanticRadius: Number(point.radiusRatio.toFixed(4)),
        collisionOffset: Number(point.collisionOffsetDeg.toFixed(3)),
        visualRadius: Number(point.size.toFixed(3)),
        votes: tool.votesCount,
        comments: tool.commentsCount,
      };
    });

    const clusters = view.clusters.map((cluster) => ({
      id: cluster.id,
      label: cluster.label,
      count: cluster.count,
      sectorIndex: cluster.sectorIndex,
      colorIndex: cluster.colorIndex,
    }));

    mkdirSync("artifacts/radar-qa", { recursive: true });
    writeFileSync(
      "artifacts/radar-qa/RADAR-SIGNAL-V2-SEMANTICS.json",
      JSON.stringify(
        {
          generatedFrom: "real domain + geometry code (buildRadarView, layoutRadarPoints)",
          fixtureItems: rows.length,
          catalogLinked: view.catalogLinkedCount,
          external: view.externalCount,
          clusterCount: clusters.length,
          sectorCount: layout.sectorCount,
          radiusBasis: layout.radiusBasis,
          attentionScaling: "visualRadius = 1.5 + (sqrt(attention)/sqrt(maxAttention)) * 3.7",
          collision: {
            strategy: "tangential only (radius preserved exactly)",
            maxTangentialDeg: 14,
          },
          clusters,
          points: rows,
        },
        null,
        2,
      ),
    );
    expect(rows.length).toBe(view.tools.length);
  });
});
