import { describe, expect, it } from "vitest";

import {
  hashCompareSet,
  normalizeCompareSlugs,
} from "@/lib/signal-progression/compare-hash";

describe("compare set hash", () => {
  it("normalizes order", () => {
    expect(normalizeCompareSlugs(["zed-tool", "alpha-tool", "alpha-tool"])).toEqual([
      "alpha-tool",
      "zed-tool",
    ]);
  });

  it("is stable for same set", () => {
    const a = hashCompareSet(["b-tool", "a-tool"]);
    const b = hashCompareSet(["a-tool", "b-tool"]);
    expect(a).toBe(b);
    expect(a).toMatch(/^[a-f0-9]{8,64}$/i);
  });
});
