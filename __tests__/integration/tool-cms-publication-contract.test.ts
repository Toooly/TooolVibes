import { beforeEach, describe, expect, it, vi } from "vitest";

import { publishedToolRecordFixture } from "@/__tests__/fixtures/tool-public";
import { adaptToolRecordToPublic } from "@/lib/data/tool-public-adapters";
import {
  getPublicToolsRuntimePolicy,
  resolvePublicToolsSnapshot,
  type PublicToolsSnapshot,
  type PublicToolsSourceLoaders,
} from "@/lib/data/tool-public-repository";
import {
  createToolPublicView,
  getRelatedToolViews,
} from "@/lib/data/tool-public-view";
import type { ToolRecord } from "@/lib/types/tool";
import type { ToolPublic } from "@/lib/types/tool-public";

const publicRuntime = vi.hoisted(() => ({
  snapshot: null as PublicToolsSnapshot | null,
  notFound: vi.fn((): never => {
    throw new Error("tool-route-not-found");
  }),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/data/public-tools", () => ({
  getPublicToolsSnapshot: async () => publicRuntime.snapshot,
  getPublicToolViews: async () => publicRuntime.snapshot?.views ?? [],
  getToolViewBySlug: async (slug: string) =>
    publicRuntime.snapshot?.views.find((tool) => tool.slug === slug) ?? null,
  getRelatedToolViewsBySlug: async () => [],
}));
vi.mock("@/lib/data/public-collections", () => ({
  getCuratedCollections: async () => [],
}));
vi.mock("@/lib/data/public-articles", () => ({
  getPublishedEditorialPosts: async () => [],
}));
vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  return { ...actual, notFound: publicRuntime.notFound };
});

import { GET as getToolsApi } from "@/app/api/tools/route";
import { GET as getSitemap } from "@/app/sitemap.xml/route";
import ToolDetailPage from "@/app/(marketing)/toools/[slug]/page";
import {
  generateStaticParams,
} from "@/components/tool-detail-final/tool-detail-final-page";

function makeRecord({
  id,
  slug,
  name,
  isPublished,
  tags,
}: {
  id: string;
  slug: string;
  name: string;
  isPublished: boolean;
  tags: string[];
}): ToolRecord {
  return {
    ...publishedToolRecordFixture,
    id,
    slug,
    name,
    tags,
    category: "Assistente AI",
    website_url: "https://" + slug + ".example.com",
    affiliate_url: null,
    tooolvibes_post_url: "https://tooolvibes.eu/toools/" + slug,
    cover_image_url: "https://images.example.com/" + slug + ".webp",
    source: "B15 in-memory CMS fixture",
    is_featured: false,
    is_published: isPublished,
  };
}

class InMemoryToolCms {
  private rows = new Map<string, ToolRecord>();
  private cachedSnapshot: Promise<PublicToolsSnapshot> | null = null;
  private updateSequence = 0;

  constructor(records: ToolRecord[]) {
    for (const record of records) {
      this.create(record);
    }
  }

  create(record: ToolRecord) {
    if ([...this.rows.values()].some((row) => row.slug === record.slug)) {
      throw new Error("duplicate key value violates unique constraint tools_slug_key");
    }
    this.rows.set(record.id, structuredClone(record));
  }

  update(id: string, patch: Partial<ToolRecord>) {
    const existing = this.rows.get(id);
    if (!existing) {
      throw new Error("tool not found");
    }

    const nextSlug = patch.slug ?? existing.slug;
    if (
      [...this.rows.values()].some(
        (row) => row.id !== id && row.slug === nextSlug,
      )
    ) {
      throw new Error("duplicate key value violates unique constraint tools_slug_key");
    }

    this.updateSequence += 1;
    const updated = {
      ...existing,
      ...patch,
      updated_at: "2026-07-16T12:00:" + String(this.updateSequence).padStart(2, "0") + ".000Z",
    };
    this.rows.set(id, updated);
    return structuredClone(updated);
  }

  invalidate() {
    this.cachedSnapshot = null;
  }

  snapshot() {
    if (!this.cachedSnapshot) {
      const loaders: PublicToolsSourceLoaders = {
        directory: async () => ({ tools: [] }),
        mock: async () => ({ tools: [] }),
        supabase: async () => ({
          tools: [...this.rows.values()].map((record) =>
            createToolPublicView(adaptToolRecordToPublic(record)),
          ),
        }),
      };
      this.cachedSnapshot = resolvePublicToolsSnapshot({
        policy: getPublicToolsRuntimePolicy({
          NODE_ENV: "test",
          TOOOLVIBES_TOOLS_SOURCE: "supabase",
        }),
        loaders,
      });
    }

    return this.cachedSnapshot;
  }
}

type ObservedSurfaces = {
  catalog: string[];
  detail: string[];
  staticParams: string[];
  api: string[];
  sitemap: string[];
  apiTools: ToolPublic[];
};

function sorted(values: string[]) {
  return [...values].sort((left, right) => left.localeCompare(right));
}

async function observeSurfaces(snapshot: PublicToolsSnapshot): Promise<ObservedSurfaces> {
  publicRuntime.snapshot = snapshot;

  const apiResponse = await getToolsApi();
  const apiBody = (await apiResponse.json()) as { data: ToolPublic[] };
  const sitemapResponse = await getSitemap();
  const sitemapBody = await sitemapResponse.text();
  const staticParams = await generateStaticParams();
  const detail: string[] = [];

  for (const tool of snapshot.views) {
    await ToolDetailPage({ params: Promise.resolve({ slug: tool.slug }) });
    detail.push(tool.slug);
  }

  return {
    catalog: sorted(snapshot.views.map((tool) => tool.slug)),
    detail: sorted(detail),
    staticParams: sorted(staticParams.map((param) => param.slug)),
    api: sorted(apiBody.data.map((tool) => tool.slug)),
    sitemap: sorted(
      [...sitemapBody.matchAll(/<loc>[^<]*\/toools\/([^<]+)<\/loc>/g)].map(
        (match) => match[1],
      ),
    ),
    apiTools: apiBody.data,
  };
}

function expectSurfaceParity(observed: ObservedSurfaces, expected: string[]) {
  const published = sorted(expected);
  expect(observed.catalog).toEqual(published);
  expect(observed.detail).toEqual(published);
  expect(observed.staticParams).toEqual(published);
  expect(observed.api).toEqual(published);
  expect(observed.sitemap).toEqual(published);
}

function relatedSlugs(snapshot: PublicToolsSnapshot, slug: string) {
  const current = snapshot.views.find((tool) => tool.slug === slug);
  if (!current) return [];
  return getRelatedToolViews(current, snapshot.views, 3).map((tool) => tool.slug);
}

describe("DATA-203 CMS publication contract", () => {
  beforeEach(() => {
    publicRuntime.snapshot = null;
    publicRuntime.notFound.mockClear();
  });

  it("keeps publish, update and unpublish in parity across catalog, detail, static params, API, sitemap and related", async () => {
    const cms = new InMemoryToolCms([
      makeRecord({
        id: "record-atlas",
        slug: "atlas-ai",
        name: "Atlas AI",
        isPublished: false,
        tags: ["research", "assistant"],
      }),
      makeRecord({
        id: "record-orbit",
        slug: "orbit-ai",
        name: "Orbit AI",
        isPublished: true,
        tags: ["research", "assistant"],
      }),
      makeRecord({
        id: "record-canvas",
        slug: "canvas-ai",
        name: "Canvas AI",
        isPublished: true,
        tags: ["assistant"],
      }),
    ]);

    const initial = await cms.snapshot();
    const initialSurfaces = await observeSurfaces(initial);
    expectSurfaceParity(initialSurfaces, ["orbit-ai", "canvas-ai"]);
    expect(initial.views.some((tool) => tool.slug === "atlas-ai")).toBe(false);
    expect(relatedSlugs(initial, "orbit-ai")).toEqual(["canvas-ai"]);

    await expect(
      ToolDetailPage({ params: Promise.resolve({ slug: "atlas-ai" }) }),
    ).rejects.toThrow("tool-route-not-found");

    cms.update("record-atlas", { is_published: true });
    expect((await cms.snapshot()).tools.some((tool) => tool.slug === "atlas-ai")).toBe(false);

    cms.invalidate();
    const published = await cms.snapshot();
    const publishedSurfaces = await observeSurfaces(published);
    expectSurfaceParity(publishedSurfaces, ["atlas-ai", "orbit-ai", "canvas-ai"]);
    expect(relatedSlugs(published, "orbit-ai")[0]).toBe("atlas-ai");

    cms.update("record-atlas", {
      name: "Atlas Workflow",
      category: "Marketing",
      tags: ["automation"],
    });
    expect((await cms.snapshot()).tools.find((tool) => tool.slug === "atlas-ai")?.name).toBe("Atlas AI");

    cms.invalidate();
    const updated = await cms.snapshot();
    const updatedSurfaces = await observeSurfaces(updated);
    expectSurfaceParity(updatedSurfaces, ["atlas-ai", "orbit-ai", "canvas-ai"]);
    expect(updatedSurfaces.apiTools.find((tool) => tool.slug === "atlas-ai")?.name).toBe("Atlas Workflow");
    expect(updated.views.find((tool) => tool.slug === "atlas-ai")?.name).toBe("Atlas Workflow");
    expect(relatedSlugs(updated, "orbit-ai")[0]).toBe("canvas-ai");

    cms.update("record-atlas", { is_published: false });
    expect((await cms.snapshot()).tools.some((tool) => tool.slug === "atlas-ai")).toBe(true);

    cms.invalidate();
    const unpublished = await cms.snapshot();
    const unpublishedSurfaces = await observeSurfaces(unpublished);
    expectSurfaceParity(unpublishedSurfaces, ["orbit-ai", "canvas-ai"]);
    expect(relatedSlugs(unpublished, "orbit-ai")).toEqual(["canvas-ai"]);

    await expect(
      ToolDetailPage({ params: Promise.resolve({ slug: "atlas-ai" }) }),
    ).rejects.toThrow("tool-route-not-found");
  });

  it("rejects CMS slug collisions and fails every public source closed if duplicate rows escape storage", async () => {
    const orbit = makeRecord({
      id: "record-orbit",
      slug: "orbit-ai",
      name: "Orbit AI",
      isPublished: true,
      tags: ["assistant"],
    });
    const cms = new InMemoryToolCms([orbit]);

    expect(() =>
      cms.create(
        makeRecord({
          id: "record-duplicate",
          slug: "orbit-ai",
          name: "Duplicate Orbit",
          isPublished: true,
          tags: ["assistant"],
        }),
      ),
    ).toThrow(/tools_slug_key/);

    const duplicateView = createToolPublicView(
      adaptToolRecordToPublic({ ...orbit, id: "unsafe-duplicate" }),
    );
    const snapshot = await resolvePublicToolsSnapshot({
      policy: getPublicToolsRuntimePolicy({
        NODE_ENV: "test",
        TOOOLVIBES_TOOLS_SOURCE: "supabase",
      }),
      loaders: {
        directory: async () => ({ tools: [] }),
        mock: async () => ({ tools: [] }),
        supabase: async () => ({ tools: [duplicateView, duplicateView] }),
      },
    });

    expect(snapshot).toMatchObject({
      status: "unavailable",
      failureReason: "duplicate-slug",
      tools: [],
      views: [],
    });
    publicRuntime.snapshot = snapshot;
    expect((await getToolsApi()).status).toBe(503);
    expect((await getSitemap()).status).toBe(503);
  });
});
