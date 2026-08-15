import { describe, expect, it } from "vitest";

import { getMediaAsset, getMediaCatalog, MEDIA_CATALOG } from "@/lib/admin/media-catalog";

describe("media catalog", () => {
  it("contains first-party partner plates only", () => {
    expect(MEDIA_CATALOG.length).toBeGreaterThanOrEqual(3);
    expect(MEDIA_CATALOG.every((asset) => asset.src.startsWith("/"))).toBe(true);
  });

  it("resolves a known asset", () => {
    expect(getMediaAsset("taylora-plate")?.alt).toBe("Taylora");
    expect(getMediaAsset("missing")).toBeNull();
  });
});

  it("merges first-party catalog for pickers", () => {
    expect(getMediaCatalog().length).toBeGreaterThanOrEqual(MEDIA_CATALOG.length);
  });
