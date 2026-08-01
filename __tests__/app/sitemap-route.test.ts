import { beforeEach, describe, expect, it, vi } from "vitest";

import { completeToolPublicFixture } from "@/__tests__/fixtures/tool-public";
import { siteConfig } from "@/lib/config/site";

const dependencies = vi.hoisted(() => ({
  getPublicToolsSnapshot: vi.fn(),
  getCuratedCollections: vi.fn(),
  getPublishedEditorialPosts: vi.fn(),
}));

vi.mock("@/lib/data/public-tools", () => ({
  getPublicToolsSnapshot: dependencies.getPublicToolsSnapshot,
}));
vi.mock("@/lib/data/public-collections", () => ({
  getCuratedCollections: dependencies.getCuratedCollections,
}));
vi.mock("@/lib/data/public-articles", () => ({
  getPublishedEditorialPosts: dependencies.getPublishedEditorialPosts,
}));

import { GET } from "@/app/sitemap.xml/route";

describe("GET /sitemap.xml", () => {
  beforeEach(() => {
    dependencies.getPublicToolsSnapshot.mockReset();
    dependencies.getCuratedCollections.mockReset();
    dependencies.getPublishedEditorialPosts.mockReset();
    dependencies.getCuratedCollections.mockResolvedValue([]);
    dependencies.getPublishedEditorialPosts.mockResolvedValue([]);
  });

  it("returns 503 and noindex when the canonical source is unavailable", async () => {
    dependencies.getPublicToolsSnapshot.mockResolvedValue({
      tools: [],
      views: [],
      source: null,
      requestedSource: "supabase",
      fallbackSource: null,
      status: "unavailable",
      failureReason: "source-read-failed",
      warnings: [],
      comparison: null,
    });

    const response = await GET();

    expect(response.status).toBe(503);
    expect(response.headers.get("X-Robots-Tag")).toBe("noindex");
    expect(dependencies.getCuratedCollections).not.toHaveBeenCalled();
  });

  it("uses canonical dates and omits invented lastmod values", async () => {
    const undatedTool = {
      ...completeToolPublicFixture,
      slug: "undated-tool",
      publication: { status: "published" as const, publishedAt: null },
      lifecycle: {
        discoveredAt: null,
        createdAt: null,
        updatedAt: null,
      },
    };
    dependencies.getPublicToolsSnapshot.mockResolvedValue({
      tools: [completeToolPublicFixture, undatedTool],
      views: [],
      source: "directory",
      requestedSource: "directory",
      fallbackSource: null,
      status: "ready",
      failureReason: null,
      warnings: [],
      comparison: null,
    });

    const response = await GET();
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(body).toContain("/toools/atlas-ai");
    expect(body).toContain("/toools/undated-tool");
    for (const path of [
      "/archivio",
      "/radar",
      "/chi-siamo",
      "/collections",
      "/posts",
      "/shortlist",
      "/compare",
      "/contributi",
      "/studio",
      "/affiliati",
      "/metodo",
      "/tags",
      "/shop",
      "/privacy",
      "/termini",
      "/cookie",
    ]) {
      expect(body).toContain(`<loc>${siteConfig.url}${path}</loc>`);
    }
    expect(body.match(/<lastmod>/g)).toHaveLength(1);
  });
});
