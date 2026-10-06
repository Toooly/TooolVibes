/**
 * RadarTopicCluster — Radar's own discovery taxonomy.
 *
 * WHY THIS EXISTS (spec §7): the Radar must classify market signals even when
 * the signal has NO canonical Catalog Tool. Before this module every external
 * Product Hunt item fell into the single `Altri segnali` fallback, so the whole
 * map collapsed into one category and read as "equal dots scattered randomly".
 *
 * TRUTH RULES:
 *   1. A cluster is derived ONLY from REAL Product Hunt topic names.
 *   2. The mapping table below is explicit and inspectable — one array per
 *      cluster, no heuristics, no fuzzy inference, no machine learning.
 *   3. Unmapped topics fall through to `other` ("Altro"). We never invent a
 *      classification.
 *   4. This taxonomy NEVER overwrites Catalog category. Catalog taxonomy stays
 *      owned by `lib/data/tooolvibes-directory.ts`.
 *
 * SELECTION RULE (deterministic):
 *   Clusters are evaluated in the declared `RADAR_TOPIC_CLUSTER_PRIORITY` order
 *   and the FIRST cluster with at least one matching topic wins. The order
 *   encodes specificity: narrow, concrete topics outrank broad umbrella topics
 *   (notably `Artificial Intelligence`, which appears on 70% of live items and
 *   therefore sits LAST so it cannot swallow the map).
 *
 * Source of the vocabulary: the live Product Hunt feed behind
 * `https://tooolvibes.eu/api/product-hunt` on 2026-10-06 (54 distinct topics
 * across 60 items in the day/week/month windows).
 */

export type RadarTopicClusterId =
  | "video-image"
  | "design-creative"
  | "no-code-automation"
  | "marketing-growth"
  | "productivity"
  | "developer-coding"
  | "ai-agents"
  | "other";

export type RadarTopicCluster = {
  id: RadarTopicClusterId;
  /** Italian UI label (the product surface is Italian). */
  label: string;
  /** Palette slot index into `RADAR_CATEGORY_PALETTE` (deterministic). */
  colorIndex: number;
  /** Exact Product Hunt topic names that map to this cluster. */
  topics: readonly string[];
};

/**
 * Declared evaluation order = declared specificity. Index 0 is evaluated first.
 * `other` is never consulted here; it is the terminal fallback.
 */
export const RADAR_TOPIC_CLUSTER_PRIORITY: readonly RadarTopicClusterId[] = [
  "video-image",
  "design-creative",
  "no-code-automation",
  "marketing-growth",
  "productivity",
  "developer-coding",
  "ai-agents",
];

export const RADAR_TOPIC_CLUSTERS: readonly RadarTopicCluster[] = [
  {
    id: "video-image",
    label: "Video & Immagini",
    colorIndex: 0,
    topics: ["Video", "Animation", "Audio", "Music", "Photos"],
  },
  {
    id: "design-creative",
    label: "Design & Creatività",
    colorIndex: 1,
    topics: ["Design Tools", "Writing", "Lifestyle", "Design"],
  },
  {
    id: "no-code-automation",
    label: "No-code & Automazione",
    colorIndex: 2,
    topics: [
      "No-Code",
      "Low-Code",
      "Spreadsheets",
      "Task Management",
      "Notes",
      "Calendar",
      "Automation",
    ],
  },
  {
    id: "marketing-growth",
    label: "Marketing & Growth",
    colorIndex: 3,
    topics: [
      "Marketing",
      "Marketing automation",
      "SEO",
      "Social Media",
      "LinkedIn",
      "Sales",
      "Email",
      "Customer Communication",
      "Customer Success",
      "Messaging",
      "E-Commerce",
      "Amazon",
    ],
  },
  {
    id: "productivity",
    label: "Produttività",
    colorIndex: 4,
    topics: ["Productivity", "Career"],
  },
  {
    id: "developer-coding",
    label: "Sviluppo & Coding",
    colorIndex: 5,
    topics: [
      "Developer Tools",
      "Software Engineering",
      "Development",
      "GitHub",
      "Open Source",
      "API",
      "Security",
      "Privacy",
      "Data",
      "Data & Analytics",
      "Analytics",
      "Business Intelligence",
      "SaaS",
      "Payments",
      "Fintech",
      "Finance",
      "Legal",
      "Business",
      "iOS",
      "Android",
      "Mac",
      "Apple",
      "iMessage Apps",
      "Menu Bar Apps",
      "Education",
      "Online Learning",
    ],
  },
  {
    id: "ai-agents",
    label: "Agenti & AI",
    colorIndex: 6,
    topics: ["Artificial Intelligence", "OpenAI Day", "Machine Learning", "AI"],
  },
  {
    id: "other",
    label: "Altro",
    colorIndex: 7,
    topics: [],
  },
] as const;

const CLUSTER_BY_ID = new Map<RadarTopicClusterId, RadarTopicCluster>(
  RADAR_TOPIC_CLUSTERS.map((cluster) => [cluster.id, cluster]),
);

/**
 * Exact, case-folded lookup. A topic maps to at most one cluster.
 * Built once; the table is small and static.
 */
const CLUSTER_BY_TOPIC = new Map<string, RadarTopicCluster>();
for (const cluster of RADAR_TOPIC_CLUSTERS) {
  for (const topic of cluster.topics) {
    const key = topic.trim().toLocaleLowerCase();
    if (!CLUSTER_BY_TOPIC.has(key)) {
      CLUSTER_BY_TOPIC.set(key, cluster);
    }
  }
}

export type RadarTopicClusterResult = {
  id: RadarTopicClusterId;
  label: string;
  colorIndex: number;
  /** The real source topics that produced the classification (for explainability). */
  matchedTopics: readonly string[];
  /** Every source topic we did not classify (shown as source transparency). */
  unmatchedTopics: readonly string[];
};

export function getRadarTopicCluster(
  id: RadarTopicClusterId,
): RadarTopicCluster {
  return CLUSTER_BY_ID.get(id) ?? (CLUSTER_BY_ID.get("other") as RadarTopicCluster);
}

/**
 * Deterministic classification of a real Product Hunt topic list.
 * Same input → same output, on every platform, forever.
 */
export function deriveRadarTopicCluster(
  sourceTopics: readonly string[],
): RadarTopicClusterResult {
  const normalized = sourceTopics
    .map((topic) => (typeof topic === "string" ? topic.trim() : ""))
    .filter(Boolean);

  const unmatched: string[] = [];
  const matchesByCluster = new Map<RadarTopicClusterId, string[]>();

  for (const topic of normalized) {
    const cluster = CLUSTER_BY_TOPIC.get(topic.toLocaleLowerCase());
    if (!cluster) {
      unmatched.push(topic);
      continue;
    }
    const bucket = matchesByCluster.get(cluster.id);
    if (bucket) {
      bucket.push(topic);
    } else {
      matchesByCluster.set(cluster.id, [topic]);
    }
  }

  for (const clusterId of RADAR_TOPIC_CLUSTER_PRIORITY) {
    const matched = matchesByCluster.get(clusterId);
    if (matched && matched.length > 0) {
      const cluster = getRadarTopicCluster(clusterId);
      return {
        id: cluster.id,
        label: cluster.label,
        colorIndex: cluster.colorIndex,
        matchedTopics: matched,
        unmatchedTopics: unmatched,
      };
    }
  }

  const other = getRadarTopicCluster("other");
  return {
    id: other.id,
    label: other.label,
    colorIndex: other.colorIndex,
    matchedTopics: [],
    unmatchedTopics: unmatched,
  };
}

/**
 * Stable angular sector for a cluster: clusters are ordered by
 * `RADAR_TOPIC_CLUSTER_PRIORITY` (with `other` last) and share the circle
 * equally. One cluster → one sector. Never decorative.
 */
export function radarTopicClusterOrder(): readonly RadarTopicClusterId[] {
  return [...RADAR_TOPIC_CLUSTER_PRIORITY, "other"];
}

export function radarTopicClusterSectorIndex(
  id: RadarTopicClusterId,
): number {
  return Math.max(0, radarTopicClusterOrder().indexOf(id));
}
