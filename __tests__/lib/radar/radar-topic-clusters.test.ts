/**
 * RadarTopicCluster taxonomy tests (spec §7).
 *
 * The mapping is explicit and inspectable; these tests pin every rule so a
 * classification can never silently drift or start hallucinating.
 */

import { describe, expect, it } from "vitest";

import {
  deriveRadarTopicCluster,
  getRadarTopicCluster,
  radarTopicClusterOrder,
  radarTopicClusterSectorIndex,
  RADAR_TOPIC_CLUSTERS,
  RADAR_TOPIC_CLUSTER_PRIORITY,
} from "@/lib/radar/radar-topic-clusters";

describe("RADAR-CLUSTER taxonomy", () => {
  it("RADAR-CLUSTER-01 every declared cluster is inspectable and well-formed", () => {
    expect(RADAR_TOPIC_CLUSTERS).toHaveLength(8);
    const ids = RADAR_TOPIC_CLUSTERS.map((cluster) => cluster.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const cluster of RADAR_TOPIC_CLUSTERS) {
      expect(cluster.label.length).toBeGreaterThan(0);
      expect(cluster.colorIndex).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(cluster.colorIndex)).toBe(true);
      // `other` is the terminal fallback and owns no topics.
      if (cluster.id === "other") {
        expect(cluster.topics).toHaveLength(0);
      } else {
        expect(cluster.topics.length).toBeGreaterThan(0);
      }
    }
  });

  it("RADAR-CLUSTER-02 no topic is claimed by two clusters", () => {
    const seen = new Map<string, string>();
    for (const cluster of RADAR_TOPIC_CLUSTERS) {
      for (const topic of cluster.topics) {
        const key = topic.trim().toLocaleLowerCase();
        expect(seen.has(key)).toBe(false);
        seen.set(key, cluster.id);
      }
    }
  });

  it("RADAR-CLUSTER-03 narrow topics outrank the AI umbrella", () => {
    // `Artificial Intelligence` alone would swallow ~70% of live items, so a
    // concrete topic must win when both are present.
    expect(deriveRadarTopicCluster(["Developer Tools", "Artificial Intelligence"]).id).toBe(
      "developer-coding",
    );
    expect(deriveRadarTopicCluster(["Video", "Artificial Intelligence"]).id).toBe(
      "video-image",
    );
    expect(deriveRadarTopicCluster(["Productivity", "Artificial Intelligence"]).id).toBe(
      "productivity",
    );
  });

  it("RADAR-CLUSTER-04 a lone umbrella topic classifies as ai-agents", () => {
    expect(deriveRadarTopicCluster(["Artificial Intelligence"]).id).toBe("ai-agents");
    expect(deriveRadarTopicCluster(["OpenAI Day"]).id).toBe("ai-agents");
  });

  it("RADAR-CLUSTER-05 unmapped topics fall through to Other — never invented", () => {
    const result = deriveRadarTopicCluster(["Underwater Basket Weaving"]);
    expect(result.id).toBe("other");
    expect(result.label).toBe("Altro");
    expect(result.matchedTopics).toHaveLength(0);
    expect(result.unmatchedTopics).toEqual(["Underwater Basket Weaving"]);
  });

  it("RADAR-CLUSTER-06 an empty topic list is Other", () => {
    expect(deriveRadarTopicCluster([]).id).toBe("other");
    expect(deriveRadarTopicCluster([] as unknown as string[]).id).toBe("other");
  });

  it("RADAR-CLUSTER-07 classification is deterministic and case/whitespace tolerant", () => {
    const a = deriveRadarTopicCluster(["  developer tools ", "ARTIFICIAL INTELLIGENCE"]);
    const b = deriveRadarTopicCluster(["Developer Tools", "Artificial Intelligence"]);
    expect(a.id).toBe(b.id);
    expect(a.id).toBe("developer-coding");
    // Evidence lists only the topics of the WINNING cluster; the AI umbrella
    // belongs to a different cluster and is not part of this decision.
    expect(a.matchedTopics).toEqual(["developer tools"]);
    expect(b.matchedTopics).toEqual(["Developer Tools"]);
  });

  it("RADAR-CLUSTER-08 match evidence is exposed for explainability", () => {
    const result = deriveRadarTopicCluster(["Marketing", "SEO", "Something Else"]);
    expect(result.id).toBe("marketing-growth");
    expect(result.matchedTopics).toEqual(["Marketing", "SEO"]);
    expect(result.unmatchedTopics).toEqual(["Something Else"]);
  });

  it("RADAR-CLUSTER-09 priority order covers every non-fallback cluster exactly once", () => {
    const nonFallback = RADAR_TOPIC_CLUSTERS.map((cluster) => cluster.id).filter(
      (id) => id !== "other",
    );
    expect([...RADAR_TOPIC_CLUSTER_PRIORITY].sort()).toEqual([...nonFallback].sort());
    expect(radarTopicClusterOrder()).toEqual([...RADAR_TOPIC_CLUSTER_PRIORITY, "other"]);
  });

  it("RADAR-CLUSTER-10 sector index is stable and unique per cluster", () => {
    const order = radarTopicClusterOrder();
    const indexes = order.map((id) => radarTopicClusterSectorIndex(id));
    expect(new Set(indexes).size).toBe(order.length);
    expect(radarTopicClusterSectorIndex("video-image")).toBe(0);
    expect(radarTopicClusterSectorIndex("other")).toBe(order.length - 1);
  });

  it("RADAR-CLUSTER-11 real live Product Hunt topics all classify", () => {
    // Vocabulary audited from the live feed on 2026-10-06 (54 topics / 60 items).
    const realTopics = [
      "Artificial Intelligence",
      "Developer Tools",
      "Productivity",
      "Marketing",
      "GitHub",
      "Open Source",
      "API",
      "Sales",
      "Education",
      "Video",
      "iOS",
      "Android",
      "Customer Communication",
      "Online Learning",
      "OpenAI Day",
      "Mac",
      "Security",
      "Design Tools",
      "No-Code",
      "Software Engineering",
      "Email",
      "Data",
      "Customer Success",
      "SaaS",
      "Messaging",
      "Analytics",
      "Payments",
      "Development",
      "Menu Bar Apps",
      "LinkedIn",
      "Data & Analytics",
      "Notes",
      "Apple",
      "Calendar",
      "Music",
      "Lifestyle",
      "Writing",
      "Amazon",
      "Spreadsheets",
      "Privacy",
      "Social Media",
      "E-Commerce",
      "Business",
      "Task Management",
      "Legal",
      "Finance",
      "iMessage Apps",
      "Business Intelligence",
      "SEO",
      "Fintech",
      "Animation",
      "Audio",
      "Marketing automation",
      "Career",
    ];
    expect(realTopics).toHaveLength(54);
    const unmapped = realTopics.filter(
      (topic) => deriveRadarTopicCluster([topic]).id === "other",
    );
    // Every real topic is classified — nothing silently collapses to Other.
    expect(unmapped).toEqual([]);
  });

  it("RADAR-CLUSTER-12 a realistic item set populates multiple sectors", () => {
    // Live-shaped combinations from the audited feed.
    const sets = [
      ["Developer Tools", "Artificial Intelligence"], // developer-coding
      ["Productivity", "Open Source", "Artificial Intelligence", "GitHub"], // productivity
      ["Sales", "Marketing", "LinkedIn"], // marketing-growth
      ["Design Tools", "Open Source", "Artificial Intelligence", "GitHub"], // design-creative
      ["Productivity", "Music", "Lifestyle"], // productivity (Productivity first in priority? no)
      ["Artificial Intelligence", "Animation", "Video"], // video-image
      ["Underwater Basket Weaving"], // other
    ];
    const clusters = new Set(sets.map((topics) => deriveRadarTopicCluster(topics).id));
    // The map must NOT collapse to a single sector.
    expect(clusters.size).toBeGreaterThanOrEqual(4);
  });

  it("RADAR-CLUSTER-13 getRadarTopicCluster never returns undefined", () => {
    expect(getRadarTopicCluster("other").id).toBe("other");
    expect(getRadarTopicCluster("video-image").label).toBe("Video & Immagini");
    // Unknown id degrades to the fallback rather than throwing.
    expect(
      getRadarTopicCluster("nope" as never).id,
    ).toBe("other");
  });
});
