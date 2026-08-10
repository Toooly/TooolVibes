import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const dependencies = vi.hoisted(() => ({
  canUseMockDataFallback: vi.fn(() => true),
  getCollectionsFromSupabase: vi.fn(),
  isSupabasePublicEnabled: vi.fn(() => false),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/data/mock-fallback", () => ({
  canUseMockDataFallback: dependencies.canUseMockDataFallback,
}));
vi.mock("@/lib/supabase/public-client", () => ({
  isSupabasePublicEnabled: dependencies.isSupabasePublicEnabled,
}));
vi.mock("@/lib/supabase/collection-repository", () => ({
  getCollectionsFromSupabase: dependencies.getCollectionsFromSupabase,
}));

async function loadSnapshot() {
  const { getCollectionRepositorySnapshot } = await import(
    "@/lib/data/collection-repository"
  );

  return getCollectionRepositorySnapshot();
}

describe("collection repository V1 source contract", () => {
  beforeEach(() => {
    vi.resetModules();
    dependencies.canUseMockDataFallback.mockReset();
    dependencies.canUseMockDataFallback.mockReturnValue(true);
    dependencies.getCollectionsFromSupabase.mockReset();
    dependencies.isSupabasePublicEnabled.mockReset();
    dependencies.isSupabasePublicEnabled.mockReturnValue(false);
  });

  afterEach(() => {
    vi.doUnmock("@/lib/data/content-collections");
    vi.unstubAllEnvs();
  });

  it("serves deterministic, fully open editorial content in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("TOOOLVIBES_COLLECTIONS_SOURCE", "content");
    vi.stubEnv("TOOOLVIBES_ALLOW_MOCK_DATA", "0");

    const snapshot = await loadSnapshot();

    expect(snapshot.meta).toMatchObject({
      requested_source: "content",
      active_source: "content",
      fallback_source: null,
      composed_sources: ["content"],
      source_precedence: ["content"],
    });
    expect(snapshot.collections.map((collection) => collection.slug)).toEqual([
      "ai-stack-solo-founders",
      "design-sprint-essentials",
      "creator-video-stack",
      "ai-content-marketing-stack",
      "from-mvp-to-sellable-saas",
      "ai-customer-support-stack",
      "ai-agents-automation-stack",
      "personal-brand-linkedin-stack",
      "ai-video-training-stack",
      "agency-operating-stack",
      "free-budget-ai-stack",
      "lead-generation-stack",
    ]);
    expect(snapshot.collections.every((collection) => collection.access === "open")).toBe(true);
    expect(snapshot.collections.every((collection) => collection.source_kind === "content")).toBe(
      true,
    );
    expect(dependencies.canUseMockDataFallback).not.toHaveBeenCalled();
  });

  it("does not replace empty content with mock records", async () => {
    vi.doMock("@/lib/data/content-collections", () => ({ contentCollections: [] }));
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("TOOOLVIBES_COLLECTIONS_SOURCE", "content");
    vi.stubEnv("TOOOLVIBES_ALLOW_MOCK_DATA", "1");

    const snapshot = await loadSnapshot();

    expect(snapshot.collections).toEqual([]);
    expect(snapshot.meta).toMatchObject({
      requested_source: "content",
      active_source: "content",
      fallback_source: null,
      composed_sources: [],
      source_precedence: ["content"],
    });
    expect(snapshot.meta.warnings).toContain("La sorgente content non ha restituito raccolte.");
    expect(dependencies.canUseMockDataFallback).not.toHaveBeenCalled();
  });

  it("rejects an explicit mock source in production even when its flag is set", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("TOOOLVIBES_COLLECTIONS_SOURCE", "mock");
    vi.stubEnv("TOOOLVIBES_ALLOW_MOCK_DATA", "1");

    const snapshot = await loadSnapshot();

    expect(snapshot.collections).toEqual([]);
    expect(snapshot.meta.warnings).toContain("mock-source-disabled-for-public-v1");
  });
});
