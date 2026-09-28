import { describe, expect, it } from "vitest";

import { mediaFileRejection, safeMediaFileName } from "@/lib/admin/media-mime";
import { isValidMediaRef } from "@/lib/admin/media-url";

describe("media helpers", () => {
  it("rejects oversized or unsupported files before upload", () => {
    expect(mediaFileRejection({ type: "image/png", size: 0 })).toBe("File vuoto.");
    expect(mediaFileRejection({ type: "image/png", size: 9 * 1024 * 1024 })).toMatch(/8 MB/);
    expect(mediaFileRejection({ type: "application/pdf", size: 1200 })).toMatch(/JPEG/);
    expect(mediaFileRejection({ type: "image/webp", size: 1200 })).toBeNull();
  });

  it("sanitizes filenames", () => {
    expect(safeMediaFileName("../../evil.png")).toBe("evil.png");
    expect(safeMediaFileName("Brand Plate 01.WEBP")).toBe("brand-plate-01.webp");
  });

  it("accepts local media paths and https", () => {
    expect(isValidMediaRef("/media/library/a.webp")).toBe(true);
    expect(isValidMediaRef("https://cdn.example/a.webp")).toBe(true);
    expect(isValidMediaRef("javascript:alert(1)")).toBe(false);
  });
});
