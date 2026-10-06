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
 *  - A Radar signal is first-class and may be CATALOG-LINKED or EXTERNAL.
 *    We never infer a Catalog entity from a fuzzy name.
 *  - Map taxonomy is `RadarTopicCluster`, derived ONLY from real Product Hunt
 *    topics (`lib/radar/radar-topic-clusters.ts`). Catalog taxonomy is never
 *    overwritten and is kept separately on `categories` for Catalog context.
 */

import {
  matchRadarItemToCatalog,
  type RadarCatalogTool,
} from "@/lib/radar/radar-catalog-match";
import type {
  ProductHuntPayload,
  ProductHuntRange,
} from "@/lib/radar/product-hunt-contract";
import {
  deriveRadarTopicCluster,
  getRadarTopicCluster,
  radarTopicClusterOrder,
  radarTopicClusterSectorIndex,
  type RadarTopicClusterId,
  type RadarTopicClusterResult,
} from "@/lib/radar/radar-topic-clusters";
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
    meaning:
      "Area Radar (RadarTopicCluster) derivata dai topic reali di Product Hunt. I tool della stessa area condividono lo stesso settore.",
    field: "topicCluster.id",
  },
  radius: {
    key: "radius",
    label: "Distanza dal centro",
    meaning:
      "Quando è emerso: al centro = più recente, verso il bordo = più vicino al limite del periodo selezionato. Se la data non è disponibile, il segnale sta sulla fascia «data sconosciuta».",
    field: "launchedAt | ageHours",
  },
  size: {
    key: "size",
    label: "Dimensione",
    meaning:
      "Attenzione relativa: voti + commenti reali, scalati in modo percettivo (radice quadrata) sul dataset corrente.",
    field: "attention",
  },
  color: {
    key: "color",
    label: "Colore",
    meaning: "Area Radar (RadarTopicCluster). Stessa area = stesso colore.",
    field: "topicCluster.id",
  },
  halo: {
    key: "halo",
    label: "Alone / movimento",
    meaning:
      "Non disponibile: servono snapshot storici. Nessun alone finché non esistono dati storici reali.",
    field: null,
  },
} as const;

/**
 * A Radar signal is either proven against the canonical Catalog or it is not.
 * This is the single source of truth for every CTA on the surface.
 */
export type RadarCatalogStatus = "linked" | "external";

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

/** Aggregated Radar taxonomy entry — drives angle, colour and filters. */
export type RadarClusterSummary = {
  id: RadarTopicClusterId;
  label: string;
  count: number;
  colorIndex: number;
  /** Declared sector index, stable across datasets of the same shape. */
  sectorIndex: number;
};

export type RadarTool = {
  /** Stable Radar identity (Product Hunt post id). */
  id: string;
  name: string;
  tagline: string;
  /**
   * The source permalink. For Product Hunt this is the post URL.
   * External signals navigate here — never through Catalog.
   */
  sourceUrl: string;
  /** @deprecated alias of `sourceUrl`, kept for existing consumers. */
  productHuntUrl: string;
  /**
   * Verified official product website, only when the source actually
   * provides one. `null` means unavailable — the source CTA becomes primary.
   */
  websiteUrl: string | null;
  thumbnailUrl: string | null;
  votesCount: number;
  commentsCount: number;
  /** votes + comments — documented attention signal used for blip size. */
  attention: number;
  /** ISO launch timestamp when the source provides it. */
  launchedAt: string | null;
  /** Hours between launch and snapshot, when `launchedAt` is known. */
  ageHours: number | null;
  /** Real source topics (Product Hunt topic names). Never used as Catalog category. */
  topics: readonly string[];
  /**
   * First-class signal type. `linked` = proven canonical Catalog Tool match;
   * `external` = real source item with no canonical Catalog Tool.
   */
  catalogStatus: RadarCatalogStatus;
  /** Canonical catalog category, when the item matches a catalog tool. */
  category: RadarCategory | null;
  /** Canonical catalog category label (free text), when matched. */
  categoryLabel: string | null;
  /** Canonical catalog slug when matched (`/toools/[slug]`). */
  catalogSlug: string | null;
  /** Radar taxonomy derived from real source topics. Drives angle and colour. */
  topicCluster: RadarTopicClusterResult;
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
  /**
   * Active RadarTopicClusters in the current dataset. Drives the map's angular
   * sectors, blip colour, the filter chips and the "Aree attive" metric.
   */
  clusters: readonly RadarClusterSummary[];
  /**
   * Canonical Catalog categories for CATALOG-LINKED tools only. Kept for
   * Catalog context (Per Te, catalog-linked rows) — never used for geometry.
   */
  categories: readonly RadarCategory[];
  /** Counts of linked vs external signals in the current snapshot. */
  catalogLinkedCount: number;
  externalCount: number;
  snapshot: RadarSnapshotMeta;
};

export const RADAR_CATEGORY_PALETTE = [
  "#22D3EE",
  "#6a3cff",
  "#ec4899",
  "#22c55e",
  "#3b82f6",
  "#f59e0b",
  "#a78bfa",
  "#14b8a6",
] as const;

export const UNCATEGORIZED_CATEGORY_ID = "altri-segnali";
export const UNCATEGORIZED_CATEGORY_LABEL = "Altri segnali";

export function radarCategoryClusterLabel(categoryLabel: string): string {
  const [first] = categoryLabel.split("/");
  return (first ?? categoryLabel).trim();
}

export function radarCategoryFromLabel(
  label: string | null | undefined,
): { id: string; label: string } | null {
  if (typeof label !== "string" || label.trim().length === 0) return null;
  const clusterLabel = radarCategoryClusterLabel(label);
  return { id: toToolFilterKey(clusterLabel), label: clusterLabel };
}

/** Deterministic palette slot for a Radar topic cluster. */
export function radarClusterColorIndex(id: RadarTopicClusterId): number {
  return getRadarTopicCluster(id).colorIndex % RADAR_CATEGORY_PALETTE.length;
}

/** Active cluster sectors, in declared specificity order. */
export function radarActiveClusterOrder(
  clusters: readonly RadarClusterSummary[],
): readonly RadarTopicClusterId[] {
  const present = new Set(clusters.map((cluster) => cluster.id));
  return radarTopicClusterOrder().filter((id) => present.has(id));
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

  // Catalog category (context only) — canonical catalog taxonomy.
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

  const catalogClusterByRadarId = new Map<string, { id: string; label: string }>();
  for (const entry of matched) {
    const label = categoryLabelByRadarId.get(entry.item.id) ?? null;
    const cluster = radarCategoryFromLabel(label);
    if (cluster) catalogClusterByRadarId.set(entry.item.id, cluster);
  }

  const catalogClusterIds = Array.from(
    new Set([...catalogClusterByRadarId.values()].map((cluster) => cluster.id)),
  ).sort((a, b) => a.localeCompare(b));

  const catalogColorIndexById = new Map<string, number>();
  catalogClusterIds.forEach((id, index) => {
    catalogColorIndexById.set(id, index % RADAR_CATEGORY_PALETTE.length);
  });

  const catalogCounts = new Map<string, number>();
  for (const cluster of catalogClusterByRadarId.values()) {
    catalogCounts.set(cluster.id, (catalogCounts.get(cluster.id) ?? 0) + 1);
  }

  // A signal is CATALOG-LINKED when `matchRadarItemToCatalog` proved a real
  // canonical Tool — not merely when a category label happens to exist.
  const linkedCount = matched.filter(
    (entry) => entry.match.status === "matched",
  ).length;

  const categories: RadarCategory[] = catalogClusterIds.map((id) => {
    const label =
      [...catalogClusterByRadarId.values()].find((cluster) => cluster.id === id)?.label ?? id;
    return {
      id,
      label,
      count: catalogCounts.get(id) ?? 0,
      colorIndex: catalogColorIndexById.get(id) ?? 0,
    };
  });

  // Radar taxonomy — derived ONLY from real source topics, for every signal
  // (linked or external). This is what the map encodes.
  const topicClusterByRadarId = new Map<string, RadarTopicClusterResult>();
  const radarClusterCounts = new Map<RadarTopicClusterId, number>();
  for (const entry of matched) {
    const result = deriveRadarTopicCluster(entry.item.topics ?? []);
    topicClusterByRadarId.set(entry.item.id, result);
    radarClusterCounts.set(result.id, (radarClusterCounts.get(result.id) ?? 0) + 1);
  }

  const activeOrder = radarTopicClusterOrder().filter((id) =>
    radarClusterCounts.has(id),
  );
  const clusters: RadarClusterSummary[] = activeOrder.map((id, index) => ({
    id,
    label: getRadarTopicCluster(id).label,
    count: radarClusterCounts.get(id) ?? 0,
    colorIndex: radarClusterColorIndex(id),
    sectorIndex: index,
  }));

  const tools: RadarTool[] = payload.items.map((item, index) => {
    const itemMatch = matched[index].match;
    const catalogCluster = catalogClusterByRadarId.get(item.id) ?? null;
    const category = catalogCluster
      ? (categories.find((entry) => entry.id === catalogCluster.id) ?? null)
      : null;
    const launchedAt = normalizeIsoOrNull(item.launchedAt);
    const ageHours =
      launchedAt === null
        ? null
        : Math.max(0, (now - new Date(launchedAt).getTime()) / 3_600_000);
    const topicCluster =
      topicClusterByRadarId.get(item.id) ?? deriveRadarTopicCluster([]);
    const catalogSlug = itemMatch.status === "matched" ? itemMatch.slug : null;

    return {
      id: item.id,
      name: item.name,
      tagline: item.tagline,
      sourceUrl: item.productHuntUrl,
      productHuntUrl: item.productHuntUrl,
      websiteUrl: normalizeHttpUrlOrNull(item.websiteUrl),
      thumbnailUrl: item.thumbnailUrl ?? null,
      votesCount: item.votesCount,
      commentsCount: item.commentsCount,
      attention: item.votesCount + item.commentsCount,
      launchedAt,
      ageHours,
      topics: item.topics ?? [],
      catalogStatus: catalogSlug ? "linked" : "external",
      category,
      categoryLabel: categoryLabelByRadarId.get(item.id) ?? null,
      catalogSlug,
      topicCluster,
      rank: index + 1,
    };
  });

  return {
    tools,
    clusters,
    categories,
    catalogLinkedCount: linkedCount,
    externalCount: tools.length - linkedCount,
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

function normalizeHttpUrlOrNull(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  if (!/^https?:\/\//i.test(trimmed)) return null;
  return trimmed;
}

export { radarTopicClusterSectorIndex };
