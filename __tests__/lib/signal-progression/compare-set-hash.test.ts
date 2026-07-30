import { describe, expect, it } from "vitest";
import {
  buildCompareSetHash,
  normalizeCompareSlugs,
} from "@/lib/signal-progression/compare-set-hash";

describe("compare set hash", () => {
  it("normalizes order and case", () => {
    expect(normalizeCompareSlugs(["Beta", "alpha", "alpha"])).toEqual([
      "alpha",
      "beta",
    ]);
  });

  it("requires at least two tools", async () => {
    expect(await buildCompareSetHash(["only-one"])).toBeNull();
  });

  it("is stable for same set", async () => {
    const a = await buildCompareSetHash(["tool-b", "tool-a"]);
    const b = await buildCompareSetHash(["tool-a", "tool-b"]);
    expect(a).toBeTruthy();
    expect(a).toBe(b);
    expect(a).toMatch(/^[a-f0-9]{32}$/i);
  });

  it("differs for different sets", async () => {
    const a = await buildCompareSetHash(["a", "b"]);
    const b = await buildCompareSetHash(["a", "c"]);
    expect(a).not.toBe(b);
  });
});
