/**
 * Radar data-truth tests (spec §46).
 *
 * No fake momentum, no fake history, trend deltas require historical
 * snapshots, freshness timestamps are real, category counts match the dataset,
 * source labels are accurate.
 */

import { describe, expect, it } from "vitest";

import {
  RADAR_VISUAL_SEMANTICS,
  UNCATEGORIZED_CATEGORY_ID,
  buildRadarView,
  radarCategoryFromLabel,
} from "@/lib/radar/radar-domain";
import {
  RADAR_HISTORY_UNAVAILABLE_REASON,
  buildRadarSparkline,
  buildRadarTrendSections,
} from "@/lib/radar/radar-trend";
import { buildRadarInsights } from "@/lib/radar/radar-insights";
import type { ProductHuntPayload } from "@/lib/radar/product-hunt-contract";

const NOW = Date.parse("2026-07-28T12:00:00.000Z");

const PAYLOAD: ProductHuntPayload = {
  status: "ok",
  source: "product-hunt-live",
  stale: false,
  range: "day",
  updatedAt: "2026-07-28T08:05:00.000Z",
  items: [
    {
      id: "alpha",
      name: "Alpha Tool",
      tagline: "Uno",
      votesCount: 300,
      commentsCount: 40,
      productHuntUrl: "https://www.producthunt.com/posts/alpha-tool",
      launchedAt: "2026-07-28T07:00:00.000Z",
    },
    {
      id: "beta",
      name: "Beta Tool",
      tagline: "Due",
      votesCount: 120,
      commentsCount: 30,
      productHuntUrl: "https://www.producthunt.com/posts/beta-tool",
      launchedAt: "2026-07-26T07:00:00.000Z",
    },
    {
      id: "gamma",
      name: "Gamma Tool",
      tagline: "Tre",
      votesCount: 10,
      commentsCount: 1,
      productHuntUrl: "https://www.producthunt.com/posts/gamma-tool",
    },
  ],
};

const CATALOG = [
  {
    slug: "alpha-tool",
    name: "Alpha Tool",
    categoryLabel: "Video AI / annunci video AI",
  },
  {
    slug: "beta-tool",
    name: "Beta Tool",
    categoryLabel: "Video AI / annunci video AI",
  },
];

describe("radar data truth", () => {
  const view = buildRadarView(PAYLOAD, CATALOG, { now: NOW });

  it("RADAR-DATA-01 nessun momentum inventato da un singolo snapshot", () => {
    expect(view.snapshot.historyAvailable).toBe(false);
    expect(RADAR_VISUAL_SEMANTICS.halo.field).toBeNull();
  });

  it("RADAR-DATA-02 i timestamp di freshness sono reali e mai riscritti", () => {
    expect(view.snapshot.updatedAt).toBe("2026-07-28T08:05:00.000Z");
    expect(view.snapshot.sourceLabel).toBe("Product Hunt");
  });

  it("RADAR-DATA-03 i conteggi categoria corrispondono al dataset", () => {
    const videoAi = view.categories.find((category) => category.id === "video-ai");
    expect(videoAi?.count).toBe(2);
    const uncategorized = view.categories.find(
      (category) => category.id === UNCATEGORIZED_CATEGORY_ID,
    );
    expect(uncategorized?.count).toBe(1);
    const total = view.categories.reduce((sum, category) => sum + category.count, 0);
    expect(total).toBe(view.tools.length);
  });

  it("RADAR-DATA-04 il tool selezionato corrisponde a un tool reale del Radar", () => {
    for (const entry of view.tools) {
      expect(PAYLOAD.items.some((item) => item.id === entry.id)).toBe(true);
      expect(entry.rank).toBeGreaterThan(0);
    }
  });

  it("RADAR-DATA-05 l'attenzione e la somma misurata voti + commenti", () => {
    const alpha = view.tools.find((entry) => entry.id === "alpha")!;
    expect(alpha.attention).toBe(alpha.votesCount + alpha.commentsCount);
    expect(alpha.attention).toBe(340);
  });

  it("RADAR-DATA-06 nessuna categoria inventata per i tool fuori catalogo", () => {
    const gamma = view.tools.find((entry) => entry.id === "gamma")!;
    expect(gamma.catalogSlug).toBeNull();
    expect(gamma.categoryLabel).toBeNull();
    expect(gamma.category?.id).toBe(UNCATEGORIZED_CATEGORY_ID);
  });

  it("RADAR-DATA-07 le etichette fonte sono accurate", () => {
    expect(view.snapshot.origin).toBe("product-hunt-live");
    expect(view.snapshot.source).toBe("product-hunt");
    expect(view.snapshot.sourceLabel).toBe("Product Hunt");
  });

  it("RADAR-DATA-08 la categoria deriva solo dal catalogo canonico", () => {
    expect(radarCategoryFromLabel("Video AI / annunci video AI")).toEqual({
      id: "video-ai",
      label: "Video AI",
    });
    expect(radarCategoryFromLabel(null)).toBeNull();
    expect(radarCategoryFromLabel("")).toBeNull();
  });

  it("RADAR-TREND-01 le sezioni che richiedono storico restano non disponibili", () => {
    const sections = buildRadarTrendSections(view.tools, {
      historyAvailable: false,
      rangeLabel: "di oggi",
    });
    const acceleration = sections.find((section) => section.key === "acceleration")!;
    const cooling = sections.find((section) => section.key === "cooling")!;
    expect(acceleration.available).toBe(false);
    expect(acceleration.entries).toEqual([]);
    expect(acceleration.unavailableReason).toBe(RADAR_HISTORY_UNAVAILABLE_REASON);
    expect(cooling.available).toBe(false);
  });

  it("RADAR-TREND-02 nessun punto grafico fabbricato senza storico", () => {
    const alpha = view.tools[0];
    expect(buildRadarSparkline(alpha, false)).toEqual([]);
  });

  it("RADAR-TREND-03 'nuovi ingressi' richiede una data di lancio reale", () => {
    const sections = buildRadarTrendSections(view.tools, {
      historyAvailable: false,
      rangeLabel: "di oggi",
    });
    const newEntries = sections.find((section) => section.key === "new-entries")!;
    expect(newEntries.available).toBe(true);
    // gamma has no launchedAt and must not appear as a new entry.
    expect(newEntries.entries.some((entry) => entry.tool.id === "gamma")).toBe(false);
    expect(newEntries.entries.some((entry) => entry.tool.id === "alpha")).toBe(true);
  });

  it("RADAR-TREND-04 ogni voce espone i segnali che la giustificano", () => {
    const sections = buildRadarTrendSections(view.tools, {
      historyAvailable: false,
      rangeLabel: "di oggi",
    });
    const discussion = sections.find((section) => section.key === "discussion")!;
    expect(discussion.entries.length).toBeGreaterThan(0);
    for (const entry of discussion.entries) {
      expect(entry.signals.map((signal) => signal.key)).toContain("comments");
      expect(entry.explanation.length).toBeGreaterThan(0);
    }
  });

  it("RADAR-INSIGHT-01 gli insight sono calcolabili dal dataset reale", () => {
    const insights = buildRadarInsights(view);
    for (const insight of insights) {
      expect(insight.title.length).toBeGreaterThan(0);
      expect(insight.body.length).toBeGreaterThan(0);
      expect(insight.id.length).toBeGreaterThan(0);
    }
  });

  it("RADAR-INSIGHT-02 nessun insight senza dati", () => {
    const empty = buildRadarView(
      { ...PAYLOAD, items: [] },
      CATALOG,
      { now: NOW },
    );
    expect(buildRadarInsights(empty)).toEqual([]);
  });
});
