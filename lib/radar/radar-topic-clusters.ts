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
 *   2. The table below is explicit and inspectable — one entry per topic, with
 *      a declared WEIGHT. No heuristics, no fuzzy inference, no ML.
 *   3. Unmapped topics fall through to `other` ("Altro"). We never invent a
 *      classification.
 *   4. This taxonomy NEVER overwrites Catalog category. Catalog taxonomy stays
 *      owned by `lib/data/tooolvibes-directory.ts`.
 *
 * SCORING (spec §4 — weighted, not first-match-wins):
 *   Each topic carries a weight that expresses how strongly it names the
 *   product's OWN category:
 *     4 = the product's primary category ("Productivity", "Developer Tools")
 *     3 = a clear category ("Analytics", "Email", "Security")
 *     2 = a platform / channel ("iOS", "GitHub", "Amazon")
 *     1 = an umbrella technology wave ("Artificial Intelligence", "SaaS")
 *   Generic umbrella topics carry weight 1 precisely so they cannot dominate:
 *   "Artificial Intelligence" alone appears on ~70% of live items and would
 *   otherwise swallow the entire map.
 *
 *   Cluster ranking key (all deterministic):
 *     1. highest single topic weight in the cluster   (strongest evidence)
 *     2. highest sum of topic weights                 (broadest evidence)
 *     3. earliest source-topic index                  (the source's own order)
 *     4. declared `RADAR_TOPIC_CLUSTER_PRIORITY` index (final determinism)
 *
 * Source of the vocabulary and of the QA cases: the live Product Hunt feed
 * behind `https://tooolvibes.eu/api/product-hunt` on 2026-10-06 (54 distinct
 * topics across 60 items in the day/week/month windows).
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

/** Declared evidence strength of one source topic. */
export type RadarTopicWeight = 1 | 2 | 3 | 4;

export const RADAR_TOPIC_WEIGHT_MIN = 1;
export const RADAR_TOPIC_WEIGHT_MAX = 4;

export type RadarTopicCluster = {
  id: RadarTopicClusterId;
  /** Italian UI label (the product surface is Italian). */
  label: string;
  /** Palette slot index into `RADAR_CATEGORY_PALETTE` (deterministic). */
  colorIndex: number;
  /** Exact Product Hunt topic name → declared weight. */
  topics: Readonly<Record<string, RadarTopicWeight>>;
};

/**
 * Declared evaluation order. Index 0 has the highest precedence ONLY as the
 * final determinism tiebreak — weights decide first.
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
    topics: {
      Video: 4,
      Animation: 4,
      Photos: 4,
      Audio: 3,
      Music: 3,
    },
  },
  {
    id: "design-creative",
    label: "Design & Creatività",
    colorIndex: 1,
    topics: {
      "Design Tools": 4,
      Design: 4,
      Writing: 4,
      Lifestyle: 1,
    },
  },
  {
    id: "no-code-automation",
    label: "No-code & Automazione",
    colorIndex: 2,
    topics: {
      "No-Code": 4,
      "Low-Code": 4,
      Spreadsheets: 3,
      "Task Management": 3,
      Notes: 3,
      Calendar: 3,
      Automation: 3,
    },
  },
  {
    id: "marketing-growth",
    label: "Marketing & Growth",
    colorIndex: 3,
    topics: {
      Marketing: 4,
      Sales: 4,
      Email: 4,
      SEO: 4,
      "Marketing automation": 3,
      "Customer Communication": 3,
      "Customer Success": 3,
      "E-Commerce": 3,
      "Social Media": 2,
      LinkedIn: 2,
      Messaging: 2,
      Amazon: 2,
    },
  },
  {
    id: "productivity",
    label: "Produttività",
    colorIndex: 4,
    topics: {
      Productivity: 4,
      Career: 3,
    },
  },
  {
    id: "developer-coding",
    label: "Sviluppo & Coding",
    colorIndex: 5,
    topics: {
      "Developer Tools": 4,
      "Software Engineering": 4,
      Development: 3,
      Security: 3,
      Privacy: 3,
      Analytics: 3,
      "Business Intelligence": 3,
      Payments: 3,
      Fintech: 3,
      Finance: 3,
      Legal: 3,
      Education: 3,
      "Online Learning": 3,
      GitHub: 2,
      "Open Source": 2,
      API: 2,
      Data: 2,
      "Data & Analytics": 2,
      iOS: 2,
      Android: 2,
      Mac: 2,
      Apple: 2,
      "iMessage Apps": 2,
      "Menu Bar Apps": 2,
      SaaS: 1,
      Business: 1,
    },
  },
  {
    id: "ai-agents",
    label: "Agenti & AI",
    colorIndex: 6,
    topics: {
      "Artificial Intelligence": 1,
      "OpenAI Day": 1,
      "Machine Learning": 1,
      AI: 1,
    },
  },
  {
    id: "other",
    label: "Altro",
    colorIndex: 7,
    topics: {},
  },
] as const;

const CLUSTER_BY_ID = new Map<RadarTopicClusterId, RadarTopicCluster>(
  RADAR_TOPIC_CLUSTERS.map((cluster) => [cluster.id, cluster]),
);

type TopicEntry = {
  cluster: RadarTopicCluster;
  weight: RadarTopicWeight;
};

/** Exact, case-folded lookup. A topic maps to at most one cluster. */
const TOPIC_ENTRIES = new Map<string, TopicEntry>();
for (const cluster of RADAR_TOPIC_CLUSTERS) {
  for (const [topic, weight] of Object.entries(cluster.topics)) {
    const key = topic.trim().toLocaleLowerCase();
    if (!TOPIC_ENTRIES.has(key)) {
      TOPIC_ENTRIES.set(key, { cluster, weight });
    }
  }
}

export type RadarClusterScore = {
  clusterId: RadarTopicClusterId;
  label: string;
  /** Strongest single matched topic weight — the primary ranking key. */
  score: number;
  /** Sum of matched topic weights — the secondary ranking key. */
  total: number;
  /** Earliest index of a matched topic in the item's own source list. */
  firstSourceIndex: number;
  topics: readonly { topic: string; weight: RadarTopicWeight }[];
};

export type RadarTopicClusterResult = {
  id: RadarTopicClusterId;
  label: string;
  colorIndex: number;
  /** Source topics of the WINNING cluster (explainability). */
  matchedTopics: readonly string[];
  /** Source topics that map to no cluster at all. */
  unmatchedTopics: readonly string[];
  /**
   * 0..1 margin of the winner over the runner-up
   * (`(winnerScore - runnerUpScore) / winnerScore`). 1 = unopposed.
   */
  clusterConfidence: number;
  /**
   * 0..1 absolute strength of the winning evidence (`winnerScore / 4`).
   * Separates "won decisively" from "won narrowly on a weak umbrella topic".
   */
  clusterStrength: number;
  /** Auditable per-cluster breakdown, best first. */
  clusterEvidence: readonly RadarClusterScore[];
};

export function getRadarTopicCluster(
  id: RadarTopicClusterId,
): RadarTopicCluster {
  return (
    CLUSTER_BY_ID.get(id) ?? (CLUSTER_BY_ID.get("other") as RadarTopicCluster)
  );
}

/**
 * Deterministic weighted classification of a real Product Hunt topic list.
 * Same input → same output, on every platform, forever.
 */
export function deriveRadarTopicCluster(
  sourceTopics: readonly string[],
): RadarTopicClusterResult {
  const normalized = sourceTopics
    .map((topic) => (typeof topic === "string" ? topic.trim() : ""))
    .filter(Boolean);

  const unmatched: string[] = [];
  const byCluster = new Map<RadarTopicClusterId, { topic: string; weight: RadarTopicWeight; index: number }[]>();

  normalized.forEach((topic, index) => {
    const entry = TOPIC_ENTRIES.get(topic.toLocaleLowerCase());
    if (!entry) {
      unmatched.push(topic);
      return;
    }
    const bucket = byCluster.get(entry.cluster.id);
    const record = { topic, weight: entry.weight, index };
    if (bucket) {
      bucket.push(record);
    } else {
      byCluster.set(entry.cluster.id, [record]);
    }
  });

  const evidence: RadarClusterScore[] = [...byCluster.entries()].map(
    ([clusterId, records]) => {
      const cluster = getRadarTopicCluster(clusterId);
      return {
        clusterId,
        label: cluster.label,
        score: records.reduce((max, record) => Math.max(max, record.weight), 0),
        total: records.reduce((sum, record) => sum + record.weight, 0),
        firstSourceIndex: records.reduce(
          (min, record) => Math.min(min, record.index),
          Number.POSITIVE_INFINITY,
        ),
        topics: records.map((record) => ({
          topic: record.topic,
          weight: record.weight,
        })),
      };
    },
  );

  const priorityIndex = (id: RadarTopicClusterId): number => {
    const index = RADAR_TOPIC_CLUSTER_PRIORITY.indexOf(id);
    return index === -1 ? RADAR_TOPIC_CLUSTER_PRIORITY.length : index;
  };

  evidence.sort((a, b) => {
    if (a.score !== b.score) return b.score - a.score;
    if (a.total !== b.total) return b.total - a.total;
    if (a.firstSourceIndex !== b.firstSourceIndex) {
      return a.firstSourceIndex - b.firstSourceIndex;
    }
    return priorityIndex(a.clusterId) - priorityIndex(b.clusterId);
  });

  const other = getRadarTopicCluster("other");
  const winner = evidence[0];

  if (!winner) {
    return {
      id: other.id,
      label: other.label,
      colorIndex: other.colorIndex,
      matchedTopics: [],
      unmatchedTopics: unmatched,
      clusterConfidence: 0,
      clusterStrength: 0,
      clusterEvidence: [],
    };
  }

  const runnerUpScore = evidence[1]?.score ?? 0;
  const clusterConfidence =
    winner.score > 0
      ? Math.min(1, Math.max(0, (winner.score - runnerUpScore) / winner.score))
      : 0;
  const clusterStrength = Math.min(
    1,
    Math.max(0, winner.score / RADAR_TOPIC_WEIGHT_MAX),
  );

  return {
    id: winner.clusterId,
    label: winner.label,
    colorIndex: getRadarTopicCluster(winner.clusterId).colorIndex,
    matchedTopics: winner.topics.map((entry) => entry.topic),
    unmatchedTopics: unmatched,
    clusterConfidence,
    clusterStrength,
    clusterEvidence: evidence,
  };
}

/**
 * The ONE FIXED global compass: every cluster owns a permanent angular sector,
 * independent of the current dataset, filter or time range. This is what keeps
 * a point's x/y stable when the user filters (spec §2).
 */
export function radarTopicClusterOrder(): readonly RadarTopicClusterId[] {
  return [...RADAR_TOPIC_CLUSTER_PRIORITY, "other"];
}

export function radarTopicClusterSectorIndex(
  id: RadarTopicClusterId,
): number {
  return Math.max(0, radarTopicClusterOrder().indexOf(id));
}

/** Total number of permanent compass sectors. */
export const RADAR_COMPASS_SECTORS = radarTopicClusterOrder().length;
