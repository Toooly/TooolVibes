import { describe, expect, it } from "vitest";

import { resolvePodiumTiers } from "@/lib/data/podium-tiers";

/**
 * Contract: metallic podium tiers follow CANONICAL RANKING POSITION,
 * never tool identity. Admin/backend can reorder tools without code changes.
 */
describe("resolvePodiumTiers", () => {
  it("PT-01: assigns gold/silver/bronze by canonical position 01/02/03", () => {
    const tools = [
      { slug: "alpha" },
      { slug: "beta" },
      { slug: "gamma" },
    ];
    expect(resolvePodiumTiers(tools)).toEqual({
      alpha: "primary",
      beta: "secondary",
      gamma: "tertiary",
    });
  });

  it("PT-02: alternate fixture — v0 / make / cosmicjs occupy 01/02/03", () => {
    const tools = [
      { slug: "v0" },
      { slug: "make" },
      { slug: "cosmicjs" },
    ];
    expect(resolvePodiumTiers(tools)).toEqual({
      v0: "primary",
      make: "secondary",
      cosmicjs: "tertiary",
    });
  });

  it("PT-03: former podium tools receive NO tier when not in position 01–03", () => {
    const tools = [
      { slug: "v0" },
      { slug: "make" },
      { slug: "cosmicjs" },
      { slug: "blink" },
      { slug: "vibecode" },
      { slug: "weweb" },
    ];
    const tiers = resolvePodiumTiers(tools);
    expect(tiers.blink).toBeUndefined();
    expect(tiers.vibecode).toBeUndefined();
    expect(tiers.weweb).toBeUndefined();
    expect(tiers.v0).toBe("primary");
    expect(tiers.make).toBe("secondary");
    expect(tiers.cosmicjs).toBe("tertiary");
  });

  it("PT-04: blink/vibecode/weweb get correct tiers when THEY occupy 01/02/03", () => {
    const tools = [
      { slug: "blink" },
      { slug: "vibecode" },
      { slug: "weweb" },
    ];
    expect(resolvePodiumTiers(tools)).toEqual({
      blink: "primary",
      vibecode: "secondary",
      weweb: "tertiary",
    });
  });

  it("PT-05: zero podium items — empty map, no exceptions", () => {
    expect(resolvePodiumTiers([])).toEqual({});
  });

  it("PT-06: one podium item — only gold assigned", () => {
    expect(resolvePodiumTiers([{ slug: "solo" }])).toEqual({ solo: "primary" });
  });

  it("PT-07: two podium items — gold + silver only", () => {
    expect(resolvePodiumTiers([{ slug: "a" }, { slug: "b" }])).toEqual({
      a: "primary",
      b: "secondary",
    });
  });

  it("PT-08: three podium items — gold + silver + bronze", () => {
    const result = resolvePodiumTiers([
      { slug: "a" },
      { slug: "b" },
      { slug: "c" },
    ]);
    expect(result).toEqual({ a: "primary", b: "secondary", c: "tertiary" });
  });

  it("PT-09: more than three — only first three get tiers", () => {
    const tools = [
      { slug: "a" },
      { slug: "b" },
      { slug: "c" },
      { slug: "d" },
      { slug: "e" },
    ];
    const tiers = resolvePodiumTiers(tools);
    expect(Object.keys(tiers)).toHaveLength(3);
    expect(tiers.d).toBeUndefined();
    expect(tiers.e).toBeUndefined();
  });

  it("PT-10: duplicate slugs — one tool gets only one tier, first occurrence wins", () => {
    const tools = [
      { slug: "dup" },
      { slug: "dup" },
      { slug: "other" },
    ];
    const tiers = resolvePodiumTiers(tools);
    // "dup" is at position 0 → gold. Position 1 is duplicate → skipped.
    // "other" is at position 2 → bronze (not silver, because position 1 was consumed).
    expect(tiers.dup).toBe("primary");
    expect(tiers.other).toBe("tertiary");
    // No tool has multiple tiers
    expect(Object.keys(tiers)).toHaveLength(2);
  });

  it("PT-11: all duplicates — only one tier assigned", () => {
    const tools = [
      { slug: "same" },
      { slug: "same" },
      { slug: "same" },
    ];
    const tiers = resolvePodiumTiers(tools);
    expect(tiers).toEqual({ same: "primary" });
    expect(Object.keys(tiers)).toHaveLength(1);
  });

  it("PT-12: tier resolution is position-based, not identity-based", () => {
    // Same tools, different order → different tiers
    const orderA = resolvePodiumTiers([
      { slug: "x" },
      { slug: "y" },
      { slug: "z" },
    ]);
    const orderB = resolvePodiumTiers([
      { slug: "z" },
      { slug: "y" },
      { slug: "x" },
    ]);
    expect(orderA.x).toBe("primary");
    expect(orderB.x).toBe("tertiary");
    expect(orderA.z).toBe("tertiary");
    expect(orderB.z).toBe("primary");
    // y is always secondary (middle position)
    expect(orderA.y).toBe("secondary");
    expect(orderB.y).toBe("secondary");
  });
});
