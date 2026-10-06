/**
 * RadarTopicCluster taxonomy tests (spec §4, §7).
 *
 * The mapping is explicit and inspectable; these tests pin every rule so a
 * classification can never silently drift or start hallucinating. The three
 * ambiguous cases named in the brief (Doco, NoteWorthy, Chunk) are asserted
 * explicitly.
 */

import { describe, expect, it } from "vitest";

import {
  deriveRadarTopicCluster,
  getRadarTopicCluster,
  radarTopicClusterOrder,
  radarTopicClusterSectorIndex,
  RADAR_COMPASS_SECTORS,
  RADAR_TOPIC_CLUSTERS,
  RADAR_TOPIC_CLUSTER_PRIORITY,
  RADAR_TOPIC_WEIGHT_MAX,
  RADAR_TOPIC_WEIGHT_MIN,
} from "@/lib/radar/radar-topic-clusters";

const topicList = (id: string): string[] =>
  Object.keys(
    (RADAR_TOPIC_CLUSTERS.find((cluster) => cluster.id === id) ?? { topics: {} })
      .topics,
  );

describe("RADAR-CLUSTER taxonomy table", () => {
  it("RADAR-CLUSTER-01 every declared cluster is inspectable and well-formed", () => {
    expect(RADAR_TOPIC_CLUSTERS).toHaveLength(8);
    const ids = RADAR_TOPIC_CLUSTERS.map((cluster) => cluster.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const cluster of RADAR_TOPIC_CLUSTERS) {
      expect(cluster.label.length).toBeGreaterThan(0);
      expect(Number.isInteger(cluster.colorIndex)).toBe(true);
      if (cluster.id === "other") {
        expect(Object.keys(cluster.topics)).toHaveLength(0);
      } else {
        expect(Object.keys(cluster.topics).length).toBeGreaterThan(0);
      }
    }
  });

  it("RADAR-CLUSTER-02 every weight is a declared auditable strength", () => {
    for (const cluster of RADAR_TOPIC_CLUSTERS) {
      for (const [topic, weight] of Object.entries(cluster.topics)) {
        expect(topic.trim().length).toBeGreaterThan(0);
        expect(weight).toBeGreaterThanOrEqual(RADAR_TOPIC_WEIGHT_MIN);
        expect(weight).toBeLessThanOrEqual(RADAR_TOPIC_WEIGHT_MAX);
      }
    }
  });

  it("RADAR-CLUSTER-03 no topic is claimed by two clusters", () => {
    const seen = new Map<string, string>();
    for (const cluster of RADAR_TOPIC_CLUSTERS) {
      for (const topic of Object.keys(cluster.topics)) {
        const key = topic.trim().toLocaleLowerCase();
        expect(seen.has(key)).toBe(false);
        seen.set(key, cluster.id);
      }
    }
  });

  it("RADAR-CLUSTER-04 generic umbrella topics carry the minimum weight", () => {
    // These appear on most live items; at weight 1 they cannot dominate.
    for (const topic of ["Artificial Intelligence", "OpenAI Day", "Machine Learning", "AI", "SaaS", "Business"]) {
      const result = deriveRadarTopicCluster([topic]);
      const evidence = result.clusterEvidence.find(
        (entry) => entry.clusterId === result.id,
      );
      expect(evidence?.topics[0]?.weight).toBe(RADAR_TOPIC_WEIGHT_MIN);
    }
  });

  it("RADAR-CLUSTER-05 generic topics do not dominate concrete ones", () => {
    // 70% of live items carry "Artificial Intelligence"; a concrete topic must
    // still win the classification.
    expect(deriveRadarTopicCluster(["Developer Tools", "Artificial Intelligence"]).id).toBe(
      "developer-coding",
    );
    expect(deriveRadarTopicCluster(["Video", "Artificial Intelligence"]).id).toBe(
      "video-image",
    );
    expect(deriveRadarTopicCluster(["Marketing", "Artificial Intelligence"]).id).toBe(
      "marketing-growth",
    );
    // …even when several umbrella topics pile up against one concrete topic.
    expect(
      deriveRadarTopicCluster([
        "Design Tools",
        "Artificial Intelligence",
        "Machine Learning",
        "SaaS",
        "Business",
        "AI",
      ]).id,
    ).toBe("design-creative");
  });

  it("RADAR-CLUSTER-06 a lone umbrella topic classifies as ai-agents", () => {
    expect(deriveRadarTopicCluster(["Artificial Intelligence"]).id).toBe("ai-agents");
    expect(deriveRadarTopicCluster(["OpenAI Day"]).id).toBe("ai-agents");
    const result = deriveRadarTopicCluster(["Artificial Intelligence"]);
    // Unopposed, but explicitly WEAK evidence — exposed for the UI to explain.
    expect(result.clusterConfidence).toBe(1);
    expect(result.clusterStrength).toBe(RADAR_TOPIC_WEIGHT_MIN / RADAR_TOPIC_WEIGHT_MAX);
  });

  it("RADAR-CLUSTER-07 unmapped topics fall through to Other — never invented", () => {
    const result = deriveRadarTopicCluster(["Underwater Basket Weaving"]);
    expect(result.id).toBe("other");
    expect(result.label).toBe("Altro");
    expect(result.matchedTopics).toHaveLength(0);
    expect(result.unmatchedTopics).toEqual(["Underwater Basket Weaving"]);
    expect(result.clusterEvidence).toHaveLength(0);
    expect(result.clusterConfidence).toBe(0);
    expect(result.clusterStrength).toBe(0);
  });

  it("RADAR-CLUSTER-08 an empty topic list is Other", () => {
    expect(deriveRadarTopicCluster([]).id).toBe("other");
    expect(deriveRadarTopicCluster([] as unknown as string[]).id).toBe("other");
  });

  it("RADAR-CLUSTER-09 classification is deterministic and case/whitespace tolerant", () => {
    const a = deriveRadarTopicCluster(["  developer tools ", "ARTIFICIAL INTELLIGENCE"]);
    const b = deriveRadarTopicCluster(["Developer Tools", "Artificial Intelligence"]);
    expect(a.id).toBe(b.id);
    expect(a.id).toBe("developer-coding");
    expect(a.matchedTopics).toEqual(["developer tools"]);
    expect(b.matchedTopics).toEqual(["Developer Tools"]);
  });

  it("RADAR-CLUSTER-10 evidence is auditable and sorted best-first", () => {
    const result = deriveRadarTopicCluster([
      "Productivity",
      "Open Source",
      "Artificial Intelligence",
      "GitHub",
    ]);
    expect(result.id).toBe("productivity");
    expect(result.clusterEvidence[0].clusterId).toBe("productivity");
    expect(result.clusterEvidence[0].score).toBe(4);
    const dev = result.clusterEvidence.find((entry) => entry.clusterId === "developer-coding");
    expect(dev?.score).toBe(2);
    expect(dev?.total).toBe(4);
    // Sorted by score desc, then total desc.
    for (let i = 1; i < result.clusterEvidence.length; i += 1) {
      const previous = result.clusterEvidence[i - 1];
      const current = result.clusterEvidence[i];
      expect(previous.score).toBeGreaterThanOrEqual(current.score);
    }
  });
});

describe("RADAR-CLUSTER ambiguous cases named in the brief", () => {
  it("RADAR-CLUSTER-QA-01 Doco [Productivity, Music, Lifestyle] → Produttività", () => {
    // Previously collapsed into "Video & Immagini" via Music. Music is a
    // domain tag (weight 3); Productivity names the product's own category (4).
    const result = deriveRadarTopicCluster(["Productivity", "Music", "Lifestyle"]);
    expect(result.id).toBe("productivity");
    expect(result.label).toBe("Produttività");
    expect(result.clusterEvidence[0].score).toBe(4);
    expect(result.clusterConfidence).toBeCloseTo(0.25, 5);
  });

  it("RADAR-CLUSTER-QA-02 NoteWorthy [iOS, Productivity, Notes] → Produttività", () => {
    // iOS is a platform (2), Notes a category (3), Productivity the primary (4).
    const result = deriveRadarTopicCluster(["iOS", "Productivity", "Notes"]);
    expect(result.id).toBe("productivity");
    expect(result.clusterEvidence[0].score).toBe(4);
  });

  it("RADAR-CLUSTER-QA-03 Chunk [Mac, Productivity, Calendar] → Produttività", () => {
    const result = deriveRadarTopicCluster(["Mac", "Productivity", "Calendar"]);
    expect(result.id).toBe("productivity");
    expect(result.clusterEvidence[0].score).toBe(4);
  });

  it("RADAR-CLUSTER-QA-04 a tie resolves by the source's own topic order", () => {
    // Marketing (4) and Video (4) tie on score and total; the item's earlier
    // source topic decides. No randomness, no hidden priority bias.
    expect(deriveRadarTopicCluster(["Marketing", "Artificial Intelligence", "Video"]).id).toBe(
      "marketing-growth",
    );
    expect(deriveRadarTopicCluster(["Video", "Artificial Intelligence", "Marketing"]).id).toBe(
      "video-image",
    );
    // Willowy: Productivity (4) vs Writing (4) — first listed wins.
    expect(
      deriveRadarTopicCluster(["Productivity", "Writing", "Artificial Intelligence"]).id,
    ).toBe("productivity");
    expect(
      deriveRadarTopicCluster(["Writing", "Productivity", "Artificial Intelligence"]).id,
    ).toBe("design-creative");
  });

  it("RADAR-CLUSTER-QA-05 Scumble keeps its design identity despite dev topics", () => {
    const result = deriveRadarTopicCluster([
      "Design Tools",
      "Open Source",
      "Artificial Intelligence",
      "GitHub",
    ]);
    expect(result.id).toBe("design-creative");
    expect(result.clusterStrength).toBe(1);
  });
});

describe("RADAR-CLUSTER compass", () => {
  it("RADAR-CLUSTER-11 the compass is fixed and independent of the dataset", () => {
    expect(RADAR_COMPASS_SECTORS).toBe(8);
    expect(radarTopicClusterOrder()).toHaveLength(8);
    expect(radarTopicClusterOrder()).toEqual([...RADAR_TOPIC_CLUSTER_PRIORITY, "other"]);
  });

  it("RADAR-CLUSTER-12 sector index is stable and unique per cluster", () => {
    const order = radarTopicClusterOrder();
    const indexes = order.map((id) => radarTopicClusterSectorIndex(id));
    expect(new Set(indexes).size).toBe(order.length);
    expect(radarTopicClusterSectorIndex("video-image")).toBe(0);
    expect(radarTopicClusterSectorIndex("other")).toBe(order.length - 1);
  });

  it("RADAR-CLUSTER-13 getRadarTopicCluster never returns undefined", () => {
    expect(getRadarTopicCluster("other").id).toBe("other");
    expect(getRadarTopicCluster("video-image").label).toBe("Video & Immagini");
    expect(getRadarTopicCluster("nope" as never).id).toBe("other");
  });

  it("RADAR-CLUSTER-14 real live Product Hunt topics all classify", () => {
    // Vocabulary audited from the live feed on 2026-10-06 (54 topics / 60 items).
    const realTopics = [
      "Artificial Intelligence", "Developer Tools", "Productivity", "Marketing",
      "GitHub", "Open Source", "API", "Sales", "Education", "Video", "iOS",
      "Android", "Customer Communication", "Online Learning", "OpenAI Day",
      "Mac", "Security", "Design Tools", "No-Code", "Software Engineering",
      "Email", "Data", "Customer Success", "SaaS", "Messaging", "Analytics",
      "Payments", "Development", "Menu Bar Apps", "LinkedIn", "Data & Analytics",
      "Notes", "Apple", "Calendar", "Music", "Lifestyle", "Writing", "Amazon",
      "Spreadsheets", "Privacy", "Social Media", "E-Commerce", "Business",
      "Task Management", "Legal", "Finance", "iMessage Apps", "Business Intelligence",
      "SEO", "Fintech", "Animation", "Audio", "Marketing automation", "Career",
    ];
    expect(realTopics).toHaveLength(54);
    const unmapped = realTopics.filter(
      (topic) => deriveRadarTopicCluster([topic]).id === "other",
    );
    expect(unmapped).toEqual([]);
  });

  it("RADAR-CLUSTER-15 a realistic item set populates multiple compass sectors", () => {
    const sets = [
      ["Developer Tools", "Artificial Intelligence"],
      ["Productivity", "Open Source", "Artificial Intelligence", "GitHub"],
      ["Sales", "Marketing", "LinkedIn"],
      ["Design Tools", "Open Source", "Artificial Intelligence", "GitHub"],
      ["Productivity", "Music", "Lifestyle"],
      ["Artificial Intelligence", "Animation", "Video"],
      ["Underwater Basket Weaving"],
    ];
    const clusters = new Set(sets.map((topics) => deriveRadarTopicCluster(topics).id));
    expect(clusters.size).toBeGreaterThanOrEqual(4);
  });

  it("RADAR-CLUSTER-16 every cluster in the table exposes its topics for audit", () => {
    for (const cluster of RADAR_TOPIC_CLUSTERS) {
      if (cluster.id === "other") continue;
      expect(topicList(cluster.id).length).toBeGreaterThan(0);
    }
  });
});
