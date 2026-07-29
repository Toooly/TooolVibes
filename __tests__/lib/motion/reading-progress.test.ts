import { describe, expect, it } from "vitest";

import {
  calculateReadingProgress,
  readingProgressReached,
} from "@/lib/motion/reading-progress";

describe("reading progress", () => {
  it("stays at 0 before the content top", () => {
    expect(
      calculateReadingProgress({
        scrollY: 0,
        viewportHeight: 800,
        contentOffsetTop: 400,
        contentHeight: 2000,
      }),
    ).toBe(0);
  });

  it("reaches 1 at the end of the readable range", () => {
    expect(
      calculateReadingProgress({
        scrollY: 1600,
        viewportHeight: 800,
        contentOffsetTop: 400,
        contentHeight: 2000,
      }),
    ).toBe(1);
  });

  it("interpolates mid progress", () => {
    const mid = calculateReadingProgress({
      scrollY: 1000,
      viewportHeight: 800,
      contentOffsetTop: 400,
      contentHeight: 2000,
    });
    expect(mid).toBeGreaterThan(0.4);
    expect(mid).toBeLessThan(0.6);
  });

  it("marks completion near the end", () => {
    expect(readingProgressReached(0.94)).toBe(false);
    expect(readingProgressReached(0.95)).toBe(true);
  });
});
