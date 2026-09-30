import { describe, expect, it } from "vitest";

import {
  COMPARE_COLLAPSE_DELTA,
  COMPARE_EXPAND_DELTA,
  COMPARE_TOP_ZONE,
  comparePrefersCompact,
  initialCompareChrome,
  reduceCompareScroll,
  type CompareGesture,
} from "@/lib/shell/compare-chrome";

describe("compare chrome state machine", () => {
  it("starts expanded on comparison routes and compact elsewhere", () => {
    expect(initialCompareChrome("/archivio").chrome).toBe("expanded");
    expect(initialCompareChrome("/toools/atlas-ai").chrome).toBe("expanded");
    expect(initialCompareChrome("/").chrome).toBe("expanded");
    expect(initialCompareChrome("/account").chrome).toBe("compact");
    expect(initialCompareChrome("/account/settings").chrome).toBe("compact");
    expect(initialCompareChrome("/sponsorizza").chrome).toBe("compact");
    expect(initialCompareChrome("/posts/guida").chrome).toBe("compact");
    expect(comparePrefersCompact("/account")).toBe(true);
    expect(comparePrefersCompact("/collections/stack")).toBe(false);
  });

  it("collapses only after a real downward delta, not noise", () => {
    let state = initialCompareChrome("/archivio");
    state = reduceCompareScroll(state, { y: 20, prevY: 16, prefersCompact: false });
    expect(state.chrome).toBe("expanded");
    state = reduceCompareScroll(state, {
      y: 20 + COMPARE_COLLAPSE_DELTA,
      prevY: 20,
      prefersCompact: false,
    });
    expect(state.chrome).toBe("compact");
  });

  it("ignores Safari bounce and re-expands near the top on comparison routes", () => {
    let state: CompareGesture = { chrome: "compact", down: 0, up: 40 };
    state = reduceCompareScroll(state, { y: -12, prevY: 4, prefersCompact: false });
    expect(state.chrome).toBe("compact");
    state = reduceCompareScroll(state, {
      y: COMPARE_TOP_ZONE,
      prevY: 80,
      prefersCompact: false,
    });
    expect(state.chrome).toBe("expanded");
  });

  it("re-expands after upward intent on comparison routes, stays compact elsewhere", () => {
    const compact: CompareGesture = { chrome: "compact", down: 0, up: 0 };
    const reExpanded = reduceCompareScroll(compact, {
      y: 40,
      prevY: 40 + COMPARE_EXPAND_DELTA,
      prefersCompact: false,
    });
    expect(reExpanded.chrome).toBe("expanded");
    const stayedCompact = reduceCompareScroll(compact, {
      y: 40,
      prevY: 40 + COMPARE_EXPAND_DELTA,
      prefersCompact: true,
    });
    expect(stayedCompact.chrome).toBe("compact");
  });

  it("needs a sufficient upward delta before re-expanding", () => {
    const compact: CompareGesture = { chrome: "compact", down: 0, up: 0 };
    const partial = reduceCompareScroll(compact, {
      y: 100,
      prevY: 100 + Math.floor(COMPARE_EXPAND_DELTA / 2),
      prefersCompact: false,
    });
    expect(partial.chrome).toBe("compact");
    const full = reduceCompareScroll(partial, {
      y: 100 - COMPARE_EXPAND_DELTA,
      prevY: 100,
      prefersCompact: false,
    });
    expect(full.chrome).toBe("expanded");
  });
});
