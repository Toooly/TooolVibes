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
let restoreRafId: number | null = null;

const MAX_RESTORE_RETRIES = 180; /* ~3s at 60fps — bounded, never infinite */

function cleanupRestore(): void {
  if (restoreRafId !== null) {
    cancelAnimationFrame(restoreRafId);
    restoreRafId = null;
  }
  if (resizeObs) {
    resizeObs.disconnect();
    resizeObs = null;
  }
}

function attemptRestore(targetY: number, token: number, retry = 0): void {
  if (token !== restoreToken) return;
  if (retry > MAX_RESTORE_RETRIES) {
    cleanupRestore();
    return;
  }
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
    cleanupRestore();
    return;
  }
  restoreRafId = requestAnimationFrame(() => attemptRestore(targetY, token, retry + 1));
}

function startRestore(targetY: number): void {
  const token = ++restoreToken;
  cleanupRestore();
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

function onPageShow(event: PageTransitionEvent): void {
  // BFCache restore: the page resumes from a frozen state. Re-sync scroll
  // position so the visible content matches the history entry. Without this,
  // Safari restores a stale scroll offset that can reference detached nodes.
  if (event.persisted) {
    const y = readStateScrollY();
    if (y !== null) {
      startRestore(y);
    }
  }
}

function onVisibilityChange(): void {
  if (document.visibilityState === "hidden") {
    flushOnHide();
  }
}

let initialised = false;
let teardownFns: Array<() => void> = [];

/** Call once per client session to activate history scroll restoration. */
export function initScrollRestoration(): void {
  if (typeof window === "undefined" || initialised) return;
  initialised = true;
  // Save current scroll for the initial history entry.
  writeStateScrollY(Math.round(readLiveScrollTop()));

  window.addEventListener("popstate", onPopState);
  window.addEventListener("pagehide", onPageHide);
  window.addEventListener("pageshow", onPageShow);
  document.addEventListener("visibilitychange", onVisibilityChange);

  const scroller = getShellScroller();
  const onScroll = () => scheduleSave();
  scroller.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("scroll", onScroll, { passive: true, capture: true });

  teardownFns = [
    () => window.removeEventListener("popstate", onPopState),
    () => window.removeEventListener("pagehide", onPageHide),
    () => window.removeEventListener("pageshow", onPageShow),
    () => document.removeEventListener("visibilitychange", onVisibilityChange),
    () => scroller.removeEventListener("scroll", onScroll),
    () => window.removeEventListener("scroll", onScroll, { capture: true }),
    cleanupRestore,
    () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = null;
      pendingSave = false;
    },
  ];
}

/** Tear down all scroll-restoration listeners (useful for HMR / tests). */
export function destroyScrollRestoration(): void {
  teardownFns.forEach((fn) => fn());
  teardownFns = [];
  initialised = false;
}
