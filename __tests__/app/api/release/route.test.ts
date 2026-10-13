import { afterEach, describe, expect, it, vi } from "vitest";

async function importRoute() {
  vi.resetModules();
  return import("@/app/api/release/route");
}

describe("GET /api/release", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("exposes the exact build metadata without exposing runtime secrets", async () => {
    vi.stubEnv("TOOOLVIBES_RELEASE_SHA", "abc123release");
    vi.stubEnv("TOOOLVIBES_RELEASE_NAME", "TooolVibes V1.0 MVP GM Release");
    vi.stubEnv("TOOOLVIBES_BUILD_TIMESTAMP", "2026-08-01T12:00:00.000Z");

    const { GET } = await importRoute();
    const response = GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({
      sha: "abc123release",
      name: "TooolVibes V1.0 MVP GM Release",
      builtAt: "2026-08-01T12:00:00.000Z",
    });
  });
});
