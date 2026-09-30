export type CompareChrome = "expanded" | "compact";

/** Downward travel before the tray collapses. Ignores sub-threshold jitter. */
export const COMPARE_COLLAPSE_DELTA = 72;
/** Near the top of the scrollport the comparison tray stays expanded. */
export const COMPARE_TOP_ZONE = 12;
/** Ignore the opposite gesture briefly so Safari bounce cannot flicker. */
export const COMPARE_LOCK_MS = 360;
const SCROLL_NOISE = 8;

const EXPANDED_PREFIXES = [
  "/archivio",
  "/toools",
  "/collections",
  "/shortlist",
  "/radar",
  "/tags",
];

export function comparePrefersExpanded(pathname: string | null): boolean {
  if (!pathname) return false;
  if (pathname === "/") return true;
  return EXPANDED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function comparePrefersCompact(pathname: string | null): boolean {
  return !comparePrefersExpanded(pathname);
}

export type CompareGesture = {
  chrome: CompareChrome;
  down: number;
  up: number;
};

export function initialCompareChrome(pathname: string | null): CompareGesture {
  return {
    chrome: comparePrefersCompact(pathname) ? "compact" : "expanded",
    down: 0,
    up: 0,
  };
}

export function reduceCompareScroll(
  state: CompareGesture,
  input: { y: number; prevY: number; prefersCompact: boolean },
): CompareGesture {
  if (input.y < 0) return { ...state, down: 0, up: 0 };
  // FINAL CONTRACT: even returning to the top zone never auto-expands.
  // Fresh route entry starts expanded via initialCompareChrome; the reducer
  // itself only flips expanded->compact on downward intent.
  const delta = input.y - input.prevY;
  if (Math.abs(delta) < SCROLL_NOISE) return state;
  if (delta > 0) {
    const down = state.down + delta;
    if (down >= COMPARE_COLLAPSE_DELTA && state.chrome === "expanded") {
      return { chrome: "compact", down: 0, up: 0 };
    }
    return { ...state, down, up: 0 };
  }
  // FINAL CONTRACT: once compact, upward scroll NEVER auto-expands.
  // Only an explicit user toggle re-opens the tray. Track upward travel
  // for diagnostics without acting on it.
  return { ...state, up: state.up + Math.abs(delta), down: 0 };
}
