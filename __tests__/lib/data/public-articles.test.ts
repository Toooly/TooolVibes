import { describe, expect, it, vi } from "vitest";

import { completeToolPublicFixture } from "@/__tests__/fixtures/tool-public";
import type { BlogArticleRecord } from "@/lib/types/article";

const dependencies = vi.hoisted(() => ({
  getPublishedTools: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/data/public-tools", () => ({
  getPublishedTools: dependencies.getPublishedTools,
}));

import {
  isPublicAuthoredArticle,
  loadCatalogEditorialPosts,
} from "@/lib/data/public-articles";

describe("public editorial posts", () => {
  it("rejects the deterministic restore fixture from public consumers", () => {
    const fixtureArticle: BlogArticleRecord = {
      id: "60000000-0000-4000-8000-000000000001",
      slug: "fixture-article",
      title: "Fixture Article",
      dek: "Articolo sintetico per il restore.",
      summary: "Contenuto fittizio.",
      kind: "editorial",
      status: "published",
      content_markdown: "# Fixture Article",
      cover_image_url: "https://images.example.invalid/fixture-article.png",
      cover_image_alt: "Immagine sintetica",
      author_name: "TooolVibes Fixture",
      tags: ["fixture", "restore"],
      published_at: "2026-01-15",
      featured: false,
      created_at: "2026-01-15T12:00:00Z",
      updated_at: "2026-01-15T12:00:00Z",
    };

    expect(isPublicAuthoredArticle(fixtureArticle)).toBe(false);
    expect(
      isPublicAuthoredArticle({
        ...fixtureArticle,
        id: "60000000-0000-4000-8000-000000000002",
        slug: "articolo-reale",
      }),
    ).toBe(true);
  });

  it("builds tool writeups from the canonical ToolPublic source only", async () => {
    const canonicalTool = {
      ...completeToolPublicFixture,
      slug: "canonical-tool",
      name: "Canonical Tool",
      flags: { featured: true },
      publication: { status: "published" as const, publishedAt: "2026-07-31" },
      urls: {
        ...completeToolPublicFixture.urls,
        editorial: "https://tooolvibes.eu/toools/canonical-tool",
      },
      content: {
        ...completeToolPublicFixture.content,
        summary: "Sintesi canonica",
        description: "Descrizione canonica verificabile.",
        bestFor: "Un caso d'uso esplicito.",
        useCases: ["Primo caso d'uso"],
      },
      editorial: {
        evidence: [
          {
            kind: "highlight" as const,
            text: "Punto verificato.",
            sourceField: "evidence",
          },
          {
            kind: "caution" as const,
            text: "Limite esplicito.",
            sourceField: "evidence",
          },
        ],
      },
      lifecycle: { discoveredAt: null, createdAt: null, updatedAt: "2026-08-01" },
    };
    const undatedTool = {
      ...canonicalTool,
      slug: "undated-tool",
      publication: { status: "published" as const, publishedAt: null },
      lifecycle: { discoveredAt: null, createdAt: null, updatedAt: null },
    };
    dependencies.getPublishedTools.mockResolvedValue([canonicalTool, undatedTool]);

    const posts = await loadCatalogEditorialPosts();
    const writeup = posts.find((post) => post.slug === canonicalTool.slug);

    expect(dependencies.getPublishedTools).toHaveBeenCalledTimes(1);
    expect(writeup).toMatchObject({
      title: "Canonical Tool",
      dek: "Sintesi canonica",
      summary: "Descrizione canonica verificabile.",
      source_url: "https://tooolvibes.eu/toools/canonical-tool",
      published_at: "2026-07-31",
      updated_at: "2026-08-01",
      featured: true,
      highlights: ["Un caso d'uso esplicito.", "Punto verificato."],
      details: ["Primo caso d'uso"],
      cautions: ["Limite esplicito."],
    });
    expect(posts.find((post) => post.slug === undatedTool.slug)).toBeUndefined();
  });
});
