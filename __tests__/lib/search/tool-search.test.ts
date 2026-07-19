import { describe, expect, it } from "vitest";

import {
  editDistanceWithin,
  normalizeSearchText,
  scoreToolForQuery,
  searchTools,
} from "@/lib/search/tool-search";
import {
  createLegacyToolSearchIndex,
  resolveToolSearchEngine,
  searchToolsWithEngine,
} from "@/lib/search/tool-search-adapter";
import { makeCatalogTool } from "../../components/directory/catalog-test-fixtures";

/* ── B31 relevance fixture ──────────────────────────────────────
   Mirrors the production catalog shape around "Blink": the real
   WeWeb entry carries an originalSourceUrl containing "blink"
   (https://www.tooolvibes.com/p/blink-61f26b689a7da189); URLs are
   NOT searchable, so that mention must never become a match. */
function makeSearchFixtures() {
  return [
    makeCatalogTool({
      slug: "vibecode",
      name: "VibeCode",
      categoryLabel: "Vibe coding / builder app AI",
      tags: ["vibe coding", "builder app AI", "app mobile", "iterazione"],
      shortDescription:
        "Builder AI per iterare una app mobile o web da prompt.",
    }),
    makeCatalogTool({
      slug: "blink",
      name: "Blink",
      categoryLabel: "Vibe coding / builder app AI",
      tags: ["vibe coding", "ai app builder", "prompt-to-app", "web app", "prototype"],
      shortDescription:
        "AI app builder che trasforma un'idea in un'app funzionante in pochi minuti.",
      originalSourceUrl: "https://www.tooolvibes.com/p/blink-new",
    }),
    makeCatalogTool({
      slug: "weweb",
      name: "WeWeb",
      categoryLabel: "No-code / builder web app",
      tags: ["no-code", "builder web app", "frontend", "backend", "produzione"],
      shortDescription:
        "Piattaforma visuale no-code/AI per creare web app production-grade.",
      // false-positive trap: the tracked source URL mentions "blink".
      originalSourceUrl: "https://www.tooolvibes.com/p/blink-61f26b689a7da189",
    }),
    makeCatalogTool({
      slug: "cosmicjs",
      name: "CosmicJS",
      categoryLabel: "CMS headless / flussi AI",
      tags: ["cms headless", "api", "flussi contenuti", "cataloghi"],
      shortDescription:
        "CMS headless con AI, API, flussi e strumenti per accelerare progetti guidati dai contenuti.",
    }),
    makeCatalogTool({
      slug: "caffe-ai",
      name: "Caffè AI",
      categoryLabel: "Produttività",
      tags: ["produttività", "scrittura"],
      shortDescription: "Assistente di scrittura per team veloci.",
    }),
  ];
}

describe("tool-search — normalizeSearchText", () => {
  it("folds case, diacritics and whitespace", () => {
    expect(normalizeSearchText("  BLINK ")).toBe("blink");
    expect(normalizeSearchText("Caffè")).toBe("caffe");
    expect(normalizeSearchText("produttività")).toBe("produttivita");
    expect(normalizeSearchText("vibe   coding")).toBe("vibe coding");
  });
});

describe("tool-search — editDistanceWithin", () => {
  it("counts substitution, deletion and transposition as one edit", () => {
    expect(editDistanceWithin("blonk", "blink", 1)).toBe(1);
    expect(editDistanceWithin("blnk", "blink", 1)).toBe(1);
    expect(editDistanceWithin("blnik", "blink", 1)).toBe(1);
    expect(editDistanceWithin("blink", "blink", 1)).toBe(0);
    expect(editDistanceWithin("block", "blink", 1)).toBeGreaterThan(1);
  });
});

describe("tool-search — Blink relevance fixture (IA-504)", () => {
  const tools = makeSearchFixtures();

  it("ranks Blink first for the query 'Blink' without unjustified false positives", () => {
    const results = searchTools(tools, "Blink");
    expect(results[0]?.slug).toBe("blink");
    expect(results.map((tool) => tool.slug)).not.toContain("weweb");
  });

  it("matches case-insensitively ('blink', 'BLINK')", () => {
    for (const query of ["blink", "BLINK", " bLiNk "]) {
      expect(searchTools(tools, query)[0]?.slug).toBe("blink");
    }
  });

  it("produces identical results for identical queries", () => {
    const first = searchTools(tools, "blink").map((tool) => tool.slug);
    const second = searchTools(tools, "blink").map((tool) => tool.slug);
    expect(first).toEqual(second);
  });

  it("is order-independent: shuffled input yields the same ranking", () => {
    const shuffled = [tools[2], tools[4], tools[1], tools[0], tools[3]];
    const baseline = searchTools(tools, "builder").map((tool) => tool.slug);
    const fromShuffled = searchTools(shuffled, "builder").map((tool) => tool.slug);
    expect(fromShuffled).toEqual(baseline);
    expect(baseline.length).toBeGreaterThan(1);
  });
});

describe("tool-search — typo tolerance", () => {
  const tools = makeSearchFixtures();

  it("tolerates a transposition ('blnik' → Blink)", () => {
    expect(searchTools(tools, "blnik")[0]?.slug).toBe("blink");
  });

  it("tolerates a deletion ('blnk' → Blink)", () => {
    expect(searchTools(tools, "blnk")[0]?.slug).toBe("blink");
  });

  it("tolerates a substitution on tags ('produtivita' → Caffè AI via tag)", () => {
    expect(searchTools(tools, "produtivita")[0]?.slug).toBe("caffe-ai");
  });

  it("does not typo-match short tokens ('ai' stays exact/prefix only)", () => {
    const results = searchTools(tools, "ai");
    // "ai" matches tags/category tokens exactly; nothing via fuzzy drift.
    for (const tool of results) {
      const haystack = [
        tool.name,
        tool.slug,
        tool.categoryLabel,
        ...tool.tags,
        tool.shortDescription,
      ]
        .map(normalizeSearchText)
        .join(" ");
      expect(haystack).toContain("ai");
    }
  });
});

describe("tool-search — empty, no-results and multi-token queries", () => {
  const tools = makeSearchFixtures();

  it("returns an empty array for empty or blank queries", () => {
    expect(searchTools(tools, "")).toEqual([]);
    expect(searchTools(tools, "   ")).toEqual([]);
    expect(scoreToolForQuery(tools[1], "")).toBe(0);
  });

  it("returns an empty array when nothing matches", () => {
    expect(searchTools(tools, "zzzz-niente")).toEqual([]);
  });

  it("applies AND semantics across query tokens", () => {
    const results = searchTools(tools, "blink app");
    expect(results.map((tool) => tool.slug)).toEqual(["blink"]);
    // A tool matching only one of the two tokens is excluded.
    expect(results.map((tool) => tool.slug)).not.toContain("vibecode");
  });

  it("honors the limit option", () => {
    const results = searchTools(tools, "builder", { limit: 1 });
    expect(results).toHaveLength(1);
    expect(results[0]?.slug).toBe("blink");
  });

  it("matches accented content from unaccented queries and viceversa", () => {
    expect(searchTools(tools, "caffe")[0]?.slug).toBe("caffe-ai");
    expect(searchTools(tools, "caffè")[0]?.slug).toBe("caffe-ai");
    expect(searchTools(tools, "produttivita")[0]?.slug).toBe("caffe-ai");
  });
});

describe("tool-search-adapter — engine resolution and legacy parity", () => {
  const tools = makeSearchFixtures();

  it("resolves the engine from the unifiedSearch flag", () => {
    expect(resolveToolSearchEngine(true)).toBe("canonical");
    expect(resolveToolSearchEngine(false)).toBe("legacy-fuse");
  });

  it("legacy Fuse index keeps the pre-B31 keys and threshold", () => {
    const index = createLegacyToolSearchIndex(tools);
    const results = index.search("blink").map((entry) => entry.item.slug);
    expect(results).toContain("blink");
  });

  it("both engines find Blink first for 'Blink'", () => {
    for (const engine of ["canonical", "legacy-fuse"] as const) {
      const results = searchToolsWithEngine(tools, "Blink", engine);
      expect(results[0]?.slug).toBe("blink");
    }
  });

  it("returns an empty array for blank queries on both engines", () => {
    expect(searchToolsWithEngine(tools, "  ", "canonical")).toEqual([]);
    expect(searchToolsWithEngine(tools, "  ", "legacy-fuse")).toEqual([]);
  });

  it("honors the limit option on both engines", () => {
    expect(searchToolsWithEngine(tools, "builder", "canonical", { limit: 1 })).toHaveLength(1);
    expect(
      searchToolsWithEngine(tools, "builder", "legacy-fuse", { limit: 1 }),
    ).toHaveLength(1);
  });
});
