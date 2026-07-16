import { describe, expect, it, vi } from "vitest";

import {
  completeToolPublicFixture,
  directoryToolFixture,
  partialToolPublicFixture,
} from "@/__tests__/fixtures/tool-public";
import {
  adaptDirectoryToolToPublic,
} from "@/lib/data/tool-public-adapters";
import {
  getPublicToolsRuntimePolicy,
  PublicToolsSourceError,
  resolvePublicToolsSnapshot,
  type PublicToolsSourceLoaders,
} from "@/lib/data/tool-public-repository";
import {
  createToolPublicView,
} from "@/lib/data/tool-public-view";
import { directoryTools } from "@/lib/data/tooolvibes-directory";

const publishedView = createToolPublicView(completeToolPublicFixture);
const draftView = createToolPublicView(partialToolPublicFixture);

function loaders(
  overrides: Partial<PublicToolsSourceLoaders> = {},
): PublicToolsSourceLoaders {
  return {
    directory: async () => ({ tools: [publishedView] }),
    supabase: async () => ({ tools: [publishedView] }),
    mock: async () => ({ tools: [publishedView] }),
    ...overrides,
  };
}

describe("public tool source policy", () => {
  it("fails closed when production source is missing or invalid", async () => {
    const directoryLoader = vi.fn(async () => ({ tools: [publishedView] }));

    for (const source of [undefined, "invalid-source"]) {
      const policy = getPublicToolsRuntimePolicy({
        NODE_ENV: "production",
        TOOOLVIBES_TOOLS_SOURCE: source,
      });
      const snapshot = await resolvePublicToolsSnapshot({
        policy,
        loaders: loaders({ directory: directoryLoader }),
      });

      expect(snapshot.status).toBe("unavailable");
      expect(snapshot.failureReason).toBe("source-not-configured");
      expect(snapshot.tools).toEqual([]);
    }

    expect(directoryLoader).not.toHaveBeenCalled();
  });

  it("loads the 30-record directory only when explicitly selected in production", async () => {
    const policy = getPublicToolsRuntimePolicy({
      NODE_ENV: "production",
      TOOOLVIBES_TOOLS_SOURCE: "directory",
    });
    const directoryViews = directoryTools.map((directoryTool) => {
      const tool = adaptDirectoryToolToPublic(directoryTool, {
        status: "published",
      });
      return createToolPublicView(tool, directoryTool);
    });
    const snapshot = await resolvePublicToolsSnapshot({
      policy,
      loaders: loaders({
        directory: async () => ({ tools: directoryViews }),
      }),
    });

    expect(snapshot.status).toBe("ready");
    expect(snapshot.source).toBe("directory");
    expect(snapshot.tools).toHaveLength(30);
    expect(snapshot.tools.map((tool) => tool.slug)).toEqual(
      snapshot.views.map((tool) => tool.slug),
    );
  });

  it("allows mock records only behind both explicit controls", async () => {
    const disabled = await resolvePublicToolsSnapshot({
      policy: getPublicToolsRuntimePolicy({
        NODE_ENV: "development",
        TOOOLVIBES_TOOLS_SOURCE: "mock",
      }),
      loaders: loaders(),
    });
    const enabled = await resolvePublicToolsSnapshot({
      policy: getPublicToolsRuntimePolicy({
        NODE_ENV: "development",
        TOOOLVIBES_TOOLS_SOURCE: "mock",
        TOOOLVIBES_ALLOW_MOCK_DATA: "1",
      }),
      loaders: loaders(),
    });

    expect(disabled.status).toBe("unavailable");
    expect(disabled.failureReason).toBe("mock-disabled");
    expect(enabled.status).toBe("ready");
    expect(enabled.source).toBe("mock");
  });

  it("uses an explicit development fallback only for unavailable primary sources", async () => {
    const fallback = vi.fn(async () => ({ tools: [publishedView] }));
    const policy = getPublicToolsRuntimePolicy({
      NODE_ENV: "development",
      TOOOLVIBES_TOOLS_SOURCE: "supabase",
      TOOOLVIBES_TOOLS_FALLBACK: "directory",
    });
    const unavailable = await resolvePublicToolsSnapshot({
      policy,
      loaders: loaders({
        supabase: async () => {
          throw new PublicToolsSourceError("source-read-failed");
        },
        directory: fallback,
      }),
    });
    const empty = await resolvePublicToolsSnapshot({
      policy,
      loaders: loaders({
        supabase: async () => ({ tools: [] }),
        directory: fallback,
      }),
    });

    expect(unavailable.source).toBe("directory");
    expect(unavailable.fallbackSource).toBe("directory");
    expect(empty.status).toBe("empty");
    expect(empty.source).toBe("supabase");
    expect(fallback).toHaveBeenCalledTimes(1);
  });

  it("disables every fallback in production", async () => {
    const fallback = vi.fn(async () => ({ tools: [publishedView] }));
    const policy = getPublicToolsRuntimePolicy({
      NODE_ENV: "production",
      TOOOLVIBES_TOOLS_SOURCE: "supabase",
      TOOOLVIBES_TOOLS_FALLBACK: "directory",
    });
    const snapshot = await resolvePublicToolsSnapshot({
      policy,
      loaders: loaders({
        supabase: async () => {
          throw new PublicToolsSourceError("source-read-failed");
        },
        directory: fallback,
      }),
    });

    expect(snapshot.status).toBe("unavailable");
    expect(snapshot.fallbackSource).toBeNull();
    expect(fallback).not.toHaveBeenCalled();
  });
});

describe("public tool repository contract", () => {
  it("excludes drafts once and reports a missing slug deterministically", async () => {
    const snapshot = await resolvePublicToolsSnapshot({
      policy: getPublicToolsRuntimePolicy({
        NODE_ENV: "test",
        TOOOLVIBES_TOOLS_SOURCE: "directory",
      }),
      loaders: loaders({
        directory: async () => ({ tools: [publishedView, draftView] }),
      }),
    });

    expect(snapshot.tools.map((tool) => tool.slug)).toEqual(["atlas-ai"]);
    expect(snapshot.views.find((tool) => tool.slug === "missing")).toBeUndefined();
  });

  it("invalidates the complete source on duplicate slug", async () => {
    const snapshot = await resolvePublicToolsSnapshot({
      policy: getPublicToolsRuntimePolicy({
        NODE_ENV: "test",
        TOOOLVIBES_TOOLS_SOURCE: "directory",
      }),
      loaders: loaders({
        directory: async () => ({ tools: [publishedView, publishedView] }),
      }),
    });

    expect(snapshot.status).toBe("unavailable");
    expect(snapshot.failureReason).toBe("duplicate-slug");
    expect(snapshot.tools).toEqual([]);
  });

  it("keeps output order deterministic and emits aggregate-only shadow parity", async () => {
    const comparisonView = createToolPublicView({
      ...completeToolPublicFixture,
      name: "Atlas AI updated",
    });
    const telemetry = vi.fn();
    const policy = getPublicToolsRuntimePolicy({
      NODE_ENV: "test",
      TOOOLVIBES_TOOLS_SOURCE: "directory",
      TOOOLVIBES_TOOLS_COMPARE_SOURCE: "supabase",
    });
    const sourceLoaders = loaders({
      directory: async () => ({ tools: [publishedView] }),
      supabase: async () => ({ tools: [comparisonView] }),
    });

    const first = await resolvePublicToolsSnapshot({
      policy,
      loaders: sourceLoaders,
      telemetry,
    });
    const second = await resolvePublicToolsSnapshot({
      policy,
      loaders: sourceLoaders,
    });

    expect(first.tools).toEqual(second.tools);
    expect(first.comparison).toEqual({
      source: "supabase",
      status: "ready",
      activeCount: 1,
      comparisonCount: 1,
      overlapCount: 1,
      activeOnlyCount: 0,
      comparisonOnlyCount: 0,
      fieldMismatchCount: 1,
    });
    expect(JSON.stringify(telemetry.mock.calls)).not.toContain("atlas-ai");
  });

  it("keeps directory presentation source-owned and rejects a slug overlay", () => {
    const tool = adaptDirectoryToolToPublic(directoryToolFixture, {
      status: "published",
    });
    const view = createToolPublicView(tool, directoryToolFixture);

    expect(view.toolOfWeek).toBe(true);
    expect(view.readingTime).toBe("2 min");
    expect(view.ctaLabel).toBe("Prova Blink");
    expect(view.accentFrom).toBe(directoryToolFixture.accentFrom);
    expect(
      createToolPublicView(completeToolPublicFixture).readingTime,
    ).toBeNull();
    expect(() =>
      createToolPublicView(tool, {
        ...directoryToolFixture,
        slug: "different-slug",
      }),
    ).toThrow(/does not match/);
  });
});
