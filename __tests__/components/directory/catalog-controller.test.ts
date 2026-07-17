import { describe, expect, it } from "vitest";

import {
  buildCatalogGroupUrl,
  createCatalogSearchIndex,
  extractDomain,
  filterCatalogTools,
  resolveActiveGroupLabel,
  resolveFeaturedTools,
  resolveInitialActiveGroup,
  resolveInitialCatalogView,
  summarizeCatalogCategories,
} from "@/components/directory/catalog/catalog-controller";
import {
  CATALOG_FILTER_GROUPS,
  makeCatalogTool,
  makeCatalogTools,
} from "./catalog-test-fixtures";

describe("catalog-controller — URL state (parse/serialize)", () => {
  it("serializes the group param: 'all' collapses to the plain archive URL", () => {
    expect(buildCatalogGroupUrl("all")).toBe("/archivio");
    expect(buildCatalogGroupUrl("vibe-coding")).toBe("/archivio?group=vibe-coding");
    expect(buildCatalogGroupUrl("ai-agents")).toBe("/archivio?group=ai-agents");
  });

  it("parses initial props into the starting view", () => {
    expect(resolveInitialCatalogView("all", "")).toBe("categories");
    expect(resolveInitialCatalogView("vibe-coding", "")).toBe("tools");
    expect(resolveInitialCatalogView("all", "react")).toBe("tools");
    expect(resolveInitialCatalogView("vibe-coding", "react")).toBe("tools");
  });

  it("parses the initial group into active group state", () => {
    expect(resolveInitialActiveGroup("all")).toBeNull();
    expect(resolveInitialActiveGroup("vibe-coding")).toBe("vibe-coding");
  });
});

describe("catalog-controller — filter combinations", () => {
  const tools = makeCatalogTools();
  const searchIndex = createCatalogSearchIndex(tools);

  it("filters by group only", () => {
    const result = filterCatalogTools({
      tools,
      searchIndex,
      activeGroup: "vibe-coding",
      tag: "",
      searchQuery: "",
      activeLevel: "all",
    });
    expect(result.map((tool) => tool.slug)).toEqual(["alpha", "beta"]);
  });

  it("treats null and 'all' groups as unfiltered", () => {
    for (const activeGroup of [null, "all"]) {
      const result = filterCatalogTools({
        tools,
        searchIndex,
        activeGroup,
        tag: "",
        searchQuery: "",
        activeLevel: "all",
      });
      expect(result).toHaveLength(4);
    }
  });

  it("filters by tag only", () => {
    const result = filterCatalogTools({
      tools,
      searchIndex,
      activeGroup: null,
      tag: "automation",
      searchQuery: "",
      activeLevel: "all",
    });
    expect(result.map((tool) => tool.slug)).toEqual(["gamma"]);
  });

  it("filters by level only", () => {
    const result = filterCatalogTools({
      tools,
      searchIndex,
      activeGroup: null,
      tag: "",
      searchQuery: "",
      activeLevel: "beginner",
    });
    expect(result.map((tool) => tool.slug)).toEqual(["alpha", "gamma"]);
  });

  it("combines group + level", () => {
    const result = filterCatalogTools({
      tools,
      searchIndex,
      activeGroup: "vibe-coding",
      tag: "",
      searchQuery: "",
      activeLevel: "beginner",
    });
    expect(result.map((tool) => tool.slug)).toEqual(["alpha"]);
  });

  it("intersects fuzzy search with the active group and tag", () => {
    const result = filterCatalogTools({
      tools,
      searchIndex,
      activeGroup: "vibe-coding",
      tag: "react",
      searchQuery: "prototipi",
      activeLevel: "all",
    });
    // "prototipi" matches alpha's descriptions; beta is excluded even if in group.
    expect(result.map((tool) => tool.slug)).toEqual(["alpha"]);
  });

  it("does not leak search hits outside the active group", () => {
    const result = filterCatalogTools({
      tools,
      searchIndex,
      activeGroup: "marketing",
      tag: "",
      searchQuery: "prototipi",
      activeLevel: "all",
    });
    expect(result).toEqual([]);
  });

  it("returns zero results when the combination matches nothing", () => {
    const result = filterCatalogTools({
      tools,
      searchIndex,
      activeGroup: "vibe-coding",
      tag: "",
      searchQuery: "zzzz-niente",
      activeLevel: "expert",
    });
    expect(result).toEqual([]);
  });
});

describe("catalog-controller — derived collections", () => {
  const tools = makeCatalogTools();

  it("summarizes categories with counts and meta", () => {
    const categories = summarizeCatalogCategories(CATALOG_FILTER_GROUPS, tools);
    expect(categories.map((cat) => [cat.key, cat.count])).toEqual([
      ["all", 4],
      ["vibe-coding", 2],
      ["no-code", 1],
      ["marketing", 1],
    ]);
    expect(categories[1]).toMatchObject({ color: "#39d2f6", iconName: "Code" });
  });

  it("falls back to default meta for unknown groups", () => {
    const categories = summarizeCatalogCategories(
      [{ key: "unknown-group", label: "Sconosciuto" }],
      tools,
    );
    expect(categories[0]).toMatchObject({ color: "#6a3cff", iconName: "Sparkles", count: 0 });
  });

  it("resolves featured tools with the six-item cap and fallback", () => {
    const withFeatured = makeCatalogTools();
    expect(resolveFeaturedTools(withFeatured).map((tool) => tool.slug)).toEqual(["delta"]);

    const withoutFeatured = [
      makeCatalogTool({ slug: "a" }),
      makeCatalogTool({ slug: "b" }),
      makeCatalogTool({ slug: "c" }),
      makeCatalogTool({ slug: "d" }),
      makeCatalogTool({ slug: "e" }),
      makeCatalogTool({ slug: "f" }),
      makeCatalogTool({ slug: "g" }),
    ];
    expect(resolveFeaturedTools(withoutFeatured)).toHaveLength(6);
  });

  it("resolves the active group label with fallback", () => {
    expect(resolveActiveGroupLabel(CATALOG_FILTER_GROUPS, "vibe-coding")).toBe("Vibe coding");
    expect(resolveActiveGroupLabel(CATALOG_FILTER_GROUPS, null)).toBe("Tutti i tool");
    expect(resolveActiveGroupLabel(CATALOG_FILTER_GROUPS, "missing")).toBe("Tutti i tool");
  });

  it("extracts domains defensively", () => {
    expect(extractDomain("https://www.example.com/path")).toBe("example.com");
    expect(extractDomain("not-a-url")).toBeUndefined();
  });
});
