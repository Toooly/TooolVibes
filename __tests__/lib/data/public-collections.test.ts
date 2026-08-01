import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { getCuratedCollections } from "@/lib/data/public-collections";

describe("public collections", () => {
  it("resolves content collections against the canonical public catalog", async () => {
    const collections = await getCuratedCollections();

    expect(collections.map((collection) => collection.slug)).toEqual([
      "ai-stack-solo-founders",
      "design-sprint-essentials",
      "creator-video-stack",
    ]);
    expect(collections.every((collection) => collection.access === "open")).toBe(true);
    expect(collections.every((collection) => collection.tool_count > 0)).toBe(true);
    expect(collections[0]?.featured_tool_slot?.tool.slug).toBe("vibecode");
  });
});
