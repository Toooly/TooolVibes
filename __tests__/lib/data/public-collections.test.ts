import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { getCuratedCollections } from "@/lib/data/public-collections";
import { contentCollections } from "@/lib/data/content-collections";
import { getCollectionCoreSlots } from "@/lib/collections/helpers";

describe("public collections", () => {
  it("resolves content collections against the canonical public catalog", async () => {
    const collections = await getCuratedCollections();

    expect(collections.map((collection) => collection.slug)).toEqual([
      "ai-stack-solo-founders",
      "design-sprint-essentials",
      "creator-video-stack",
      "ai-content-marketing-stack",
      "from-mvp-to-sellable-saas",
      "ai-customer-support-stack",
      "ai-agents-automation-stack",
      "personal-brand-linkedin-stack",
    ]);
    expect(collections.every((collection) => collection.access === "open")).toBe(true);
    expect(collections.every((collection) => collection.tool_count > 0)).toBe(true);
    expect(collections[0]?.featured_tool_slot?.tool.slug).toBe("jenni-ai");
  });

  it("has exactly 8 intended public records with unique slugs", () => {
    expect(contentCollections).toHaveLength(8);
    const slugs = contentCollections.map((collection) => collection.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("every public Collection resolves at least one CORE tool slot", async () => {
    const collections = await getCuratedCollections();
    for (const collection of collections) {
      const cores = getCollectionCoreSlots(collection);
      expect(cores.length, `${collection.slug} has no CORE slot`).toBeGreaterThan(0);
    }
  });
});

