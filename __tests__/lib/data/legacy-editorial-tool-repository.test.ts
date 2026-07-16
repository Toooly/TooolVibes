import { beforeEach, describe, expect, it, vi } from "vitest";

const dependencies = vi.hoisted(() => ({
  canUseMockDataFallback: vi.fn(() => true),
  getPublicPublishedToolsFromSupabase: vi.fn(),
  isSupabasePublicEnabled: vi.fn(() => false),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/data/mock-fallback", () => ({
  canUseMockDataFallback: dependencies.canUseMockDataFallback,
}));
vi.mock("@/lib/supabase/public-client", () => ({
  isSupabasePublicEnabled: dependencies.isSupabasePublicEnabled,
}));
vi.mock("@/lib/supabase/tool-repository", () => ({
  getPublicPublishedToolsFromSupabase:
    dependencies.getPublicPublishedToolsFromSupabase,
}));

import { isCollectionPublic } from "@/lib/collections/editorial";
import { resolveCuratedCollection } from "@/lib/collections/helpers";
import { mockCollections } from "@/lib/data/mock-collections";
import {
  getLegacyEditorialToolsSnapshot,
  LEGACY_EDITORIAL_TOOLS_WARNING,
} from "@/lib/data/legacy-editorial-tool-repository";

describe("legacy editorial tool repository transition", () => {
  beforeEach(() => {
    dependencies.canUseMockDataFallback.mockReturnValue(true);
    dependencies.isSupabasePublicEnabled.mockReturnValue(false);
  });

  it("keeps the pre-DATA-203 mock inventory and every public collection slot resolvable", async () => {
    const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const snapshot = await getLegacyEditorialToolsSnapshot();
    const publicCollectionRecords = mockCollections.filter(isCollectionPublic);
    const resolvedCollections = publicCollectionRecords.map((collection) =>
      resolveCuratedCollection(collection, snapshot.tools),
    );
    const expectedSlotCount = publicCollectionRecords.reduce(
      (count, collection) => count + collection.included_tools.length,
      0,
    );
    const resolvedSlotCount = resolvedCollections.reduce(
      (count, collection) => count + collection.tool_count,
      0,
    );

    expect({
      tools: snapshot.tools.length,
      publicCollections: resolvedCollections.length,
      expectedSlots: expectedSlotCount,
      resolvedSlots: resolvedSlotCount,
    }).toEqual({
      tools: 8,
      publicCollections: 5,
      expectedSlots: 21,
      resolvedSlots: 21,
    });
    expect(snapshot).toMatchObject({
      source: "mock",
      requestedSource: "mock",
      transitional: true,
      readOnly: true,
    });
    expect(snapshot.warnings).toContain(LEGACY_EDITORIAL_TOOLS_WARNING);
    expect(warning).toHaveBeenCalledWith(
      expect.stringContaining("Transitional read-only repository active"),
      { warning: LEGACY_EDITORIAL_TOOLS_WARNING },
    );

    warning.mockRestore();
  });
});
