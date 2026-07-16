import { beforeEach, describe, expect, it, vi } from "vitest";

import { completeToolPublicFixture } from "@/__tests__/fixtures/tool-public";

const dependencies = vi.hoisted(() => ({
  getPublicToolsSnapshot: vi.fn(),
}));

vi.mock("@/lib/data/public-tools", () => ({
  getPublicToolsSnapshot: dependencies.getPublicToolsSnapshot,
}));

import { GET } from "@/app/api/tools/route";

describe("GET /api/tools", () => {
  beforeEach(() => {
    dependencies.getPublicToolsSnapshot.mockReset();
  });

  it("returns 503 instead of a misleading empty 200 when source is unavailable", async () => {
    dependencies.getPublicToolsSnapshot.mockResolvedValue({
      tools: [],
      views: [],
      source: null,
      requestedSource: "supabase",
      fallbackSource: null,
      status: "unavailable",
      failureReason: "source-read-failed",
      warnings: ["tools-supabase-source-read-failed"],
      comparison: null,
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(response.headers.get("Retry-After")).toBe("60");
    expect(body.error).toBe("tools-source-unavailable");
  });

  it("returns canonical ToolPublic records and explicit source metadata", async () => {
    dependencies.getPublicToolsSnapshot.mockResolvedValue({
      tools: [completeToolPublicFixture],
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
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toEqual([completeToolPublicFixture]);
    expect(body.meta).toMatchObject({
      source: "directory",
      requested_source: "directory",
      status: "ready",
      schema_version: 1,
      count: 1,
    });
  });
});
