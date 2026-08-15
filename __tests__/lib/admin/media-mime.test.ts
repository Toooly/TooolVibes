import { describe, expect, it } from "vitest";

import { safeMediaFileName } from "@/lib/admin/media-mime";
import { isValidMediaRef } from "@/lib/admin/media-url";

describe("media helpers", () => {
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
