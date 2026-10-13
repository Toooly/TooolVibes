import { describe, expect, it, vi } from "vitest";
import type { IncrementalCache } from "@opennextjs/aws/types/overrides.js";
import { releaseStaticCache } from "@/lib/cloudflare/release-static-cache";

function fixture(value: object | null) {
  const base: IncrementalCache = {
    name: "static-fixture",
    get: vi.fn().mockResolvedValue(value ? { value, lastModified: 123 } : null),
    set: vi.fn(),
    delete: vi.fn(),
  };
  return { base, cache: releaseStaticCache(base) };
}

describe("immutable release page cache", () => {
  it.each(["app", "page"])("serves published %s content without browser caching or background rendering", async type => {
    const { base, cache } = fixture({ type, html: "Published catalog", revalidate: 1, meta: { status: 200, headers: { "x-content-type-options": "nosniff" } } });
    const entry = await cache.get("/archivio", "cache");
    expect(base.get).toHaveBeenCalledWith("/archivio", "cache");
    expect(entry).toMatchObject({ lastModified: 123, shouldBypassTagCache: true, value: { html: "Published catalog", revalidate: false, meta: { status: 200, headers: { "cache-control": "no-store", "x-content-type-options": "nosniff" } } } });
  });
  it("does not cache private API responses or change fetch-cache policy", async () => {
    for (const value of [{ type: "route", body: "private", revalidate: 0 }, { kind: "FETCH", data: { body: "data" }, revalidate: 60 }]) {
      const { cache } = fixture(value);
      expect((await cache.get("key"))?.value).toEqual(value);
    }
  });
  it("preserves a cache miss rather than substituting an unrelated page", async () => {
    expect(await fixture(null).cache.get("/missing")).toBeNull();
  });
});
