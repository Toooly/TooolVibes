/**
 * Normalized Radar domain model.
 *
 * UI NEVER consumes Product Hunt response shapes directly. The adapter
 * (`app/api/product-hunt/route.ts`) emits `ProductHuntPayload`; this module
 * projects it into the canonical Radar view model.
 *
 * TRUTH RULES
 *  - Every visual dimension must map to a real measurable field (see
 *    `RADAR_VISUAL_SEMANTICS` below).
 *  - Momentum/halo is NEVER synthesized from a single snapshot.
 *  - Category comes from the canonical catalog taxonomy only. Items with no
 *    catalog match stay uncategorized — no invented mapping from Product Hunt
 *    topic names to TooolVibes categories.
 */

import {
  matchRadarItemToCatalog,
  type RadarCatalogTool,
} from "@/lib/radar/radar-catalog-match";
import type {
  ProductHuntPayload,
  ProductHuntRange,
} from "@/lib/radar/product-hunt-contract";
import { toToolFilterKey } from "@/lib/data/tool-public-view";

export type RadarSourceId = "product-hunt";

export const RADAR_SOURCE_LABEL: Record<RadarSourceId, string> = {
  "product-hunt": "Product Hunt",
};

/**
 * Documented visual semantics. Referenced by the legend and by data-truth
 * tests — if a visual property is not listed here it must not be encoded.
 */
export const RADAR_VISUAL_SEMANTICS = {
  angle: {
    key: "angle",
    label: "Settore",
    meaning: "Categoria canonica del catalogo (o «Altri segnali» se il tool non è in catalogo).",
    field: "category.id",
  },
  radius: {
    key: "radius",
    label: "Raggio",
    meaning:
      "Recenza: più vicino al centro = lancio più recente. Se la data di lancio non è disponibile, usa la posizione in classifica (più vicino = più votato).",
    field: "ageHours | rank",
  },
  size: {
    key: "size",
    label: "Dimensione",
    meaning: "Attenzione misurata: voti + commenti sul periodo.",
    field: "attention",
  },
  color: {
    key: "color",
    label: "Colore",
    meaning: "Categoria canonica del tool.",
    field: "category.id",
  },
  halo: {
    key: "halo",
    label: "Alone / momentum",
    meaning:
      "Non disponibile: servono snapshot storici. Nessun alone finché non esistono dati storici reali.",
    field: null,
  },
} as const;

export type RadarCategory = {
  /** Stable filter key (kebab-case of the canonical category label). */
  id: string;
  /** Canonical catalog category label. */
  label: string;
  /** Number of Radar tools currently in this category. */
  count: number;
  /** Palette slot index (deterministic, by sorted category id). */
  colorIndex: number;
};

export type RadarTool = {
  /** Stable Radar identity (Product Hunt post id). */
  id: string;
  name: string;
  tagline: string;
  productHuntUrl: string;
  thumbnailUrl: string | null;
  votesCount: number;
  commentsCount: number;
  /** votes + comments — documented attention signal used for blip size. */
  attention: number;
  /** ISO launch timestamp when the source provides it. */
  launchedAt: string | null;
  /** Hours between launch and snapshot, when `launchedAt` is known. */
  ageHours: number | null;
  /** Product Hunt topic names (source transparency only — never used as category). */
  topics: readonly string[];
  /** Canonical catalog category, when the item matches a catalog tool. */
  category: RadarCategory | null;
  /** Canonical catalog category label (free text), when matched. */
  categoryLabel: string | null;
  /** Canonical catalog slug when matched (`/toools/[slug]`). */
  catalogSlug: string | null;
  /** 1-based position in the current snapshot ordering. */
  rank: number;
};

export type RadarSnapshotMeta = {
  source: RadarSourceId;
  sourceLabel: string;
  /** `"product-hunt-live" | "product-hunt-stale" | "qa-fixture" | "none"` */
  origin: ProductHuntPayload["source"];
  range: ProductHuntRange;
  /** ISO timestamp produced at the origin. Never rewritten. */
  updatedAt: string;
  itemCount: number;
  /**
   * Always false today: the platform stores no Product Hunt feed history.
   * Consumers must render the honest "Dati storici in raccolta" state.
   */
  historyAvailable: false;
};

export type RadarView = {
  tools: readonly RadarTool[];
  categories: readonly RadarCategory[];
  snapshot: RadarSnapshotMeta;
};

/** Limited intentional palette — category colors only. Gold is never used here. */
export const RADAR_CATEGORY_PALETTE = [
  "#22D3EE", // cyan (Radar primary)
  "#6a3cff", // brand violet
  "#ec4899", // magenta
  "#34d399", // green
  "#60a5fa", // blue
  "#f59e0b", // amber
  "#a78bfa", // violet light
  "#2dd4bf", // teal
] as const;

export const UNCATEGORIZED_CATEGORY_ID = "altri-segnali";
export const UNCATEGORIZED_CATEGORY_LABEL = "Altri segnali";

/** First segment of a rich `categoryLabel` ("Vibe coding / builder app AI" → "Vibe coding"). */
export function radarCategoryClusterLabel(categoryLabel: string): string {
  const primary = categoryLabel.split("/")[0]?.trim();
  return primary && primary.length > 0 ? primary : categoryLabel.trim();
}

export function radarCategoryFromLabel(
  categoryLabel: string | null | undefined,
): { id: string; label: string } | null {
  if (!categoryLabel) return null;
  const label = radarCategoryClusterLabel(categoryLabel);
  if (!label) return null;
  return { id: toToolFilterKey(label), label };
}

/**
 * Projects a Product Hunt payload into the normalized Radar view.
 * Pure and deterministic: same payload + same `now` → same output.
 */
export function buildRadarView(
  payload: ProductHuntPayload,
  catalog: readonly RadarCatalogTool[],
  options: { now?: number } = {},
): RadarView {
  const now = options.now ?? Date.now();

  const matched = payload.items.map((item) => {
    const match = matchRadarItemToCatalog(
      { name: item.name, productHuntUrl: item.productHuntUrl },
      catalog,
    );
    return { item, match };
  });

  // Resolve category per item from the canonical catalog only.
  const categoryLabelByRadarId = new Map<string, string>();
  for (const entry of matched) {
    const entryMatch = entry.match;
    if (entryMatch.status !== "matched") continue;
    const hint = catalog.find((tool) => tool.slug === entryMatch.slug);
    const label = hint && "categoryLabel" in hint ? hint.categoryLabel : null;
    if (typeof label === "string" && label.length > 0) {
      categoryLabelByRadarId.set(entry.item.id, label);
    }
  }

  // Deterministic category set with stable palette assignment (sorted by id).
  const clusterByRadarId = new Map<string, { id: string; label: string }>();
  for (const entry of matched) {
    const label = categoryLabelByRadarId.get(entry.item.id) ?? null;
    const cluster = radarCategoryFromLabel(label);
    if (cluster) clusterByRadarId.set(entry.item.id, cluster);
  }

  const clusterIds = Array.from(
    new Set([...clusterByRadarId.values()].map((cluster) => cluster.id)),
  ).sort((a, b) => a.localeCompare(b));

  const colorIndexById = new Map<string, number>();
  clusterIds.forEach((id, index) => {
    colorIndexById.set(id, index % RADAR_CATEGORY_PALETTE.length);
  });

  const counts = new Map<string, number>();
  for (const cluster of clusterByRadarId.values()) {
    counts.set(cluster.id, (counts.get(cluster.id) ?? 0) + 1);
  }

  const uncategorizedCount = payload.items.length - clusterByRadarId.size;

  const categories: RadarCategory[] = clusterIds.map((id) => {
    const label =
      [...clusterByRadarId.values()].find((cluster) => cluster.id === id)?.label ?? id;
    return {
      id,
      label,
      count: counts.get(id) ?? 0,
      colorIndex: colorIndexById.get(id) ?? 0,
    };
  });

  if (uncategorizedCount > 0) {
    categories.push({
      id: UNCATEGORIZED_CATEGORY_ID,
      label: UNCATEGORIZED_CATEGORY_LABEL,
      count: uncategorizedCount,
      colorIndex: RADAR_CATEGORY_PALETTE.length - 1,
    });
  }

  const tools: RadarTool[] = payload.items.map((item, index) => {
    const itemMatch = matched[index].match;
    const cluster = clusterByRadarId.get(item.id) ?? null;
    const category = cluster
      ? (categories.find((entry) => entry.id === cluster.id) ?? null)
      : (categories.find((entry) => entry.id === UNCATEGORIZED_CATEGORY_ID) ?? null);
    const launchedAt = normalizeIsoOrNull(item.launchedAt);
    const ageHours =
      launchedAt === null
        ? null
        : Math.max(0, (now - new Date(launchedAt).getTime()) / 3_600_000);

    return {
      id: item.id,
      name: item.name,
      tagline: item.tagline,
      productHuntUrl: item.productHuntUrl,
      thumbnailUrl: item.thumbnailUrl ?? null,
      votesCount: item.votesCount,
      commentsCount: item.commentsCount,
      attention: item.votesCount + item.commentsCount,
      launchedAt,
      ageHours,
      topics: item.topics ?? [],
      category,
      categoryLabel: categoryLabelByRadarId.get(item.id) ?? null,
      catalogSlug: itemMatch.status === "matched" ? itemMatch.slug : null,
      rank: index + 1,
    };
  });

  return {
    tools,
    categories,
    snapshot: {
      source: "product-hunt",
      sourceLabel: RADAR_SOURCE_LABEL["product-hunt"],
      origin: payload.source,
      range: payload.range,
      updatedAt: payload.updatedAt,
      itemCount: tools.length,
      historyAvailable: false,
    },
  };
}

function normalizeIsoOrNull(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
