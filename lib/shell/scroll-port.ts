export type ShellScroller = HTMLElement | Window;

/** Mobile/tablet marketing chrome scrolls `.marketing-shell`, not window. */
export function getShellScroller(): ShellScroller {
  if (typeof document === "undefined") return window;
  const shell = document.querySelector(".marketing-shell");
  if (shell instanceof HTMLElement) {
    const overflowY = getComputedStyle(shell).overflowY;
    if (overflowY === "auto" || overflowY === "scroll") return shell;
  }
  return window;
}

export function readScrollTop(scroller: ShellScroller): number {
  const y = scroller instanceof Window ? scroller.scrollY : scroller.scrollTop;
  return Number.isFinite(y) ? y : 0;
}

/**
 * Scroll position that survives iOS sending the gesture to a different
 * scroller than `.marketing-shell`. Uses the largest non-negative reading
 * plus how far `main` has actually moved under the painted header.
 */
export function readLiveScrollTop(): number {
  if (typeof document === "undefined") return 0;
  const shell = document.querySelector(".marketing-shell");
  const shellY = shell instanceof HTMLElement ? shell.scrollTop : 0;
  const winY = window.scrollY || 0;
  const docY = document.documentElement.scrollTop || 0;
  const bodyY = document.body?.scrollTop || 0;
  let visual = 0;
  const anchor = document.querySelector("main");
  const header = document.querySelector(
    ".mobile-top-bar, .td-final-mobileheader, .command-bar",
  );
  if (shell instanceof HTMLElement && anchor instanceof HTMLElement) {
    const headerH =
      header instanceof HTMLElement ? header.getBoundingClientRect().height : 0;
    const fromShellTop =
      shell.getBoundingClientRect().top - anchor.getBoundingClientRect().top;
    visual = Math.max(0, fromShellTop - headerH);
  }
  return Math.max(shellY, winY, docY, bodyY, visual);
}

export function readMaxScroll(scroller: ShellScroller): number {
  if (scroller instanceof Window) {
    return Math.max(document.documentElement.scrollHeight - window.innerHeight, 0);
  }
  return Math.max(scroller.scrollHeight - scroller.clientHeight, 0);
}

export function bindShellScroll(
  handler: () => void,
  options?: AddEventListenerOptions,
): () => void {
  const scroller = getShellScroller();
  scroller.addEventListener("scroll", handler, options);
  return () => scroller.removeEventListener("scroll", handler);
}

const STICKY_SUBNAV = ".cx-section-nav, .td-final-decision-nav, .tv-lib-toolbar, .ar4-mobile-bar, .ar4-filters";

/** Viewport Y where a section heading has cleared header + sticky local nav. */
export function readingLine(): number {
  if (typeof document === "undefined") return 80;
  const header = document.querySelector(".mobile-top-bar, .td-final-mobileheader, .command-bar");
  const headerH =
    header instanceof HTMLElement && header.getBoundingClientRect().height > 8
      ? header.getBoundingClientRect().height
      : 0;
  const sub = document.querySelector(STICKY_SUBNAV);
  const subH =
    sub instanceof HTMLElement && getComputedStyle(sub).position === "sticky"
      ? sub.getBoundingClientRect().height
      : 0;
  return headerH + subH + 8;
}
