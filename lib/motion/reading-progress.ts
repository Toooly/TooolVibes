/**
 * Pure reading-progress math (no DOM). Used by Posts progress bar + tests.
 */

export type ReadingProgressInput = {
  scrollY: number;
  viewportHeight: number;
  /** Absolute top of the article content relative to document. */
  contentOffsetTop: number;
  contentHeight: number;
};

/**
 * Returns 0–1 progress through the article body.
 * Progress starts when the top of the content reaches the viewport top
 * and completes when the bottom of the content reaches the viewport bottom.
 */
export function calculateReadingProgress(input: ReadingProgressInput): number {
  const { scrollY, viewportHeight, contentOffsetTop, contentHeight } = input;
  if (
    !Number.isFinite(scrollY) ||
    !Number.isFinite(viewportHeight) ||
    !Number.isFinite(contentOffsetTop) ||
    !Number.isFinite(contentHeight) ||
    viewportHeight <= 0 ||
    contentHeight <= 0
  ) {
    return 0;
  }

  const start = contentOffsetTop;
  const end = contentOffsetTop + contentHeight - viewportHeight;
  if (end <= start) {
    // Short content: complete once scrolled past start
    return scrollY >= start ? 1 : 0;
  }

  const raw = (scrollY - start) / (end - start);
  if (raw <= 0) return 0;
  if (raw >= 1) return 1;
  return raw;
}

export function readingProgressReached(
  progress: number,
  threshold = 0.95,
): boolean {
  return progress >= threshold;
}
