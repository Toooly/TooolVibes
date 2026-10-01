/**
 * Exact history scroll restoration for TooolVibes.
 *
 * Persists the live scroll position into `history.state` (merged with
 * existing Next.js state) so Back/Forward restores the exact prior Y
 * within <=2px tolerance. Works with both `window` and `.marketing-shell`
 * custom scrollport via `readLiveScrollTop`.
 */

import {
  getShellScroller,
  readLiveScrollTop,
} from "./scroll-port";

const STATE_KEY = "__tvScrollY";

type ScrollState = { [STATE_KEY]?: number };

function readStateScrollY(): number | null {
  if (typeof window === "undefined") return null;
  const state = window.history.state as ScrollState | null;
  const y = state?.[STATE_KEY];
  return typeof y === "number" && Number.isFinite(y) ? y : null;
}

function writeStateScrollY(y: number): void {
  if (typeof window === "undefined") return;
  const prev = window.history.state ?? {};
  window.history.replaceState({ ...prev, [STATE_KEY]: y }, "");
}

let rafId: number | null = null;
let pendingSave = false;

function flushSave(): void {
  if (!pendingSave) return;
  pendingSave = false;
  rafId = null;
  writeStateScrollY(Math.round(readLiveScrollTop()));
}

function scheduleSave(): void {
  if (pendingSave) return;
  pendingSave = true;
  rafId = requestAnimationFrame(flushSave);
}

function flushOnHide(): void {
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  if (pendingSave) {
    pendingSave = false;
    writeStateScrollY(Math.round(readLiveScrollTop()));
  }
}

let restoreToken = 0;
let resizeObs: ResizeObserver | null = null;

function attemptRestore(targetY: number, token: number): void {
  if (token !== restoreToken) return;
  const scroller = getShellScroller();
  const max = scroller instanceof Window
    ? Math.max(document.documentElement.scrollHeight - window.innerHeight, 0)
    : Math.max(scroller.scrollHeight - scroller.clientHeight, 0);
  if (max >= targetY - 2) {
    if (scroller instanceof Window) {
      window.scrollTo(0, targetY);
    } else {
      scroller.scrollTop = targetY;
    }
    if (resizeObs) {
      resizeObs.disconnect();
      resizeObs = null;
    }
    return;
  }
  // ScrollHeight not yet sufficient — retry on next frame + observe resize.
  requestAnimationFrame(() => attemptRestore(targetY, token));
}

function startRestore(targetY: number): void {
  const token = ++restoreToken;
  if (resizeObs) {
    resizeObs.disconnect();
    resizeObs = null;
  }
  if (typeof ResizeObserver !== "undefined") {
    resizeObs = new ResizeObserver(() => attemptRestore(targetY, token));
    resizeObs.observe(document.documentElement);
  }
  attemptRestore(targetY, token);
}

function onPopState(): void {
  const y = readStateScrollY();
  if (y !== null) {
    startRestore(y);
  }
}

function onPageHide(): void {
  flushOnHide();
}

function onVisibilityChange(): void {
  if (document.visibilityState === "hidden") {
    flushOnHide();
  }
}

/** Call once per client session to activate history scroll restoration. */
export function initScrollRestoration(): void {
  if (typeof window === "undefined") return;
  // Save current scroll for the initial history entry.
  writeStateScrollY(Math.round(readLiveScrollTop()));

  window.addEventListener("popstate", onPopState);
  window.addEventListener("pagehide", onPageHide);
  document.addEventListener("visibilitychange", onVisibilityChange);

  const scroller = getShellScroller();
  const onScroll = () => scheduleSave();
  scroller.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("scroll", onScroll, { passive: true, capture: true });
}
