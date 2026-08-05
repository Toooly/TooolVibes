import { vi } from "vitest";
vi.mock("server-only", () => ({}));

import { describe, it, expect } from "vitest";

import { getPublicToolCatalogSnapshot } from "@/lib/data/public-tool-catalog";
import { directoryTools } from "@/lib/data/tooolvibes-directory";
import { getPublicToolsSnapshot } from "@/lib/data/public-tools";

const EXPECTED_COUNT = 30;

describe("getPublicToolCatalogSnapshot", () => {
  it("contains exactly 30 tools", () => {
    const catalog = getPublicToolCatalogSnapshot();
    expect(catalog).toHaveLength(EXPECTED_COUNT);
  });

  it("slug order matches directoryTools", () => {
    const catalog = getPublicToolCatalogSnapshot();
    const directorySlugs = directoryTools.map((t) => t.slug);
    const catalogSlugs = catalog.map((t) => t.slug);
    expect(catalogSlugs).toEqual(directorySlugs);
  });

  it("each element contains only the 8 expected fields", () => {
    const catalog = getPublicToolCatalogSnapshot();
    const allowedKeys = new Set([
      "slug",
      "name",
      "categoryLabel",
      "shortDescription",
      "featured",
      "toolOfWeek",
      "tags",
      "levelLabel",
    ]);

    for (const item of catalog) {
      const keys = Object.keys(item);
      for (const key of keys) {
        expect(allowedKeys.has(key)).toBe(true);
      }
      for (const allowed of allowedKeys) {
        expect(keys).toContain(allowed);
      }
    }
  });

  it("featured and toolOfWeek are always booleans", () => {
    const catalog = getPublicToolCatalogSnapshot();
    for (const item of catalog) {
      expect(typeof item.featured).toBe("boolean");
      expect(typeof item.toolOfWeek).toBe("boolean");
    }
  });

  it("fields match the canonical full-snapshot projection", async () => {
    const catalog = getPublicToolCatalogSnapshot();
    const fullSnapshot = await getPublicToolsSnapshot();

    expect(fullSnapshot.status).toBe("ready");

    const canonical = fullSnapshot.views.map((tool) => ({
      slug: tool.slug,
      name: tool.name,
      categoryLabel: tool.categoryLabel,
      shortDescription: tool.shortDescription,
      featured: tool.featured,
      toolOfWeek: tool.toolOfWeek,
      tags: tool.tags,
      levelLabel: tool.levelLabel,
    }));

    expect(canonical).toHaveLength(EXPECTED_COUNT);
    for (let i = 0; i < EXPECTED_COUNT; i++) {
      expect(catalog[i]).toEqual(canonical[i]);
    }
  });

  it("returns the same reference on repeated calls", () => {
    const a = getPublicToolCatalogSnapshot();
    const b = getPublicToolCatalogSnapshot();
    expect(a).toBe(b);
  });

  it("never includes evidence or extended content", () => {
    const catalog = getPublicToolCatalogSnapshot();
    for (const item of catalog) {
      const record = item as Record<string, unknown>;
      expect(record.extendedContent).toBeUndefined();
      expect(record.evidence).toBeUndefined();
      expect(record.assessment).toBeUndefined();
      expect(record.editorial).toBeUndefined();
      expect(record.score).toBeUndefined();
      expect(record.cautions).toBeUndefined();
      expect(record.highlights).toBeUndefined();
    }
  });
});
