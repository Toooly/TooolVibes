import { describe, expect, it } from "vitest";

import {
  COMPARE_COLLAPSE_DELTA,
  COMPARE_TOP_ZONE,
  comparePrefersCompact,
  initialCompareChrome,
  reduceCompareScroll,
  type CompareGesture,
} from "@/lib/shell/compare-chrome";

describe("compare chrome state machine", () => {
  it("starts compact on every floating comparison entry", () => {
    expect(initialCompareChrome("/archivio").chrome).toBe("compact");
    expect(initialCompareChrome("/toools/atlas-ai").chrome).toBe("compact");
    expect(initialCompareChrome("/").chrome).toBe("compact");
    expect(initialCompareChrome("/account").chrome).toBe("compact");
    expect(initialCompareChrome("/account/settings").chrome).toBe("compact");
    expect(initialCompareChrome("/sponsorizza").chrome).toBe("compact");
    expect(initialCompareChrome("/posts/guida").chrome).toBe("compact");
    expect(comparePrefersCompact("/account")).toBe(true);
    expect(comparePrefersCompact("/collections/stack")).toBe(true);
  });

  it("collapses only after a real downward delta, not noise", () => {
    let state: CompareGesture = { chrome: "expanded", down: 0, up: 0 };
    state = reduceCompareScroll(state, { y: 20, prevY: 16, prefersCompact: false });
    expect(state.chrome).toBe("expanded");
    state = reduceCompareScroll(state, {
      y: 20 + COMPARE_COLLAPSE_DELTA,
      prevY: 20,
      prefersCompact: false,
    });
    expect(state.chrome).toBe("compact");
  });

  it("ignores Safari bounce; top zone never auto-expands a collapsed tray", () => {
    let state: CompareGesture = { chrome: "compact", down: 0, up: 40 };
    state = reduceCompareScroll(state, { y: -12, prevY: 4, prefersCompact: false });
    expect(state.chrome).toBe("compact");
    state = reduceCompareScroll(state, {
      y: COMPARE_TOP_ZONE,
      prevY: 80,
      prefersCompact: false,
    });
    expect(state.chrome).toBe("compact");
  });

  it("never auto-expands from scroll: 400px up stays compact (final contract)", () => {
    const compact: CompareGesture = { chrome: "compact", down: 0, up: 0 };
    const afterUp = reduceCompareScroll(compact, {
      y: 40,
      prevY: 440,
      prefersCompact: false,
    });
    expect(afterUp.chrome).toBe("compact");
    const afterUpCompactFirst = reduceCompareScroll(compact, {
      y: 40,
      prevY: 440,
      prefersCompact: true,
    });
    expect(afterUpCompactFirst.chrome).toBe("compact");
  });

  it("stays compact at top zone once collapsed; only toggle re-opens", () => {
    const compact: CompareGesture = { chrome: "compact", down: 0, up: 300 };
    const atTop = reduceCompareScroll(compact, {
      y: COMPARE_TOP_ZONE,
      prevY: 400,
      prefersCompact: false,
    });
    // Reached top from a collapsed tray: remains compact until explicit toggle.
    // (initialCompareChrome starts compact on fresh route entry;
    // the reducer itself never flips compact->expanded.)
    expect(atTop.chrome).toBe("compact");
  });
});
