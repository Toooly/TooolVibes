/**
 * Best-effort TinyAdz runtime teardown and controlled-reload fallback.
 *
 * Investigation of TinyAdz v2 (loaded from cdn.apitiny.net) shows the runtime
 * DOES NOT expose an official full `destroy()`/`unmount()`/`cleanup()` API.
 * The manager instance is exposed as `window.$ta2_ads` and offers:
 *   - `hidePopup()`            -> animates the popup out and hides it;
 *   - `resetContent()`         -> clears the popup container innerHTML;
 *   - `hideWidget(iframe)`     -> hides a given corner iframe.
 * There is no method that removes the injected `<style>` or the manager script
 * node, and `main.js` re-arms `requestNextAd()` on history/popstate.
 *
 * Per the integration policy, when a supported destroy API is unavailable we:
 *   1. perform a best-effort visual removal via the documented `resetContent`
 *      / `hidePopup` methods; and
 *   2. perform ONE controlled full-page reload (session-guarded) so the page
 *      re-renders without the loader when consent/route is not eligible.
 *
 * No MutationObserver or recurring DOM-deletion loop is used.
 */

export const TINYADZ_RELOAD_GUARD_KEY = "tooolvibes.ta.reload-guard";
export const TINYADZ_RELOAD_WINDOW_MS = 2000;

type TinyAdzManager = {
  hidePopup?: () => void;
  resetContent?: () => void;
  hideWidget?: (iframe?: HTMLElement | null) => void;
};

type TinyAdzWindow = Window & { $ta2_ads?: TinyAdzManager };

export function tinyadzRuntimeActive(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  const w = window as TinyAdzWindow;
  return Boolean(w.$ta2_ads) || Boolean(document.getElementById("tinyadz-v2"));
}

/**
 * Remove visible TinyAdz popup/container content using only the exposed
 * manager methods. Safe to call when the runtime is absent.
 */
export function bestEffortHideTinyAdz(): void {
  if (typeof window === "undefined") {
    return;
  }
  const w = window as TinyAdzWindow;
  const manager = w.$ta2_ads;
  try {
    manager?.hidePopup?.();
  } catch {
    // ignore
  }
  try {
    manager?.resetContent?.();
  } catch {
    // ignore
  }
  try {
    const container = document.querySelector(".tinyadz");
    if (container) {
      container.innerHTML = "";
    }
  } catch {
    // ignore
  }
}

/**
 * Perform a single controlled reload. Returns `false` when a reload already
 * happened within the guard window (prevents reload loops).
 */
export function reloadOnce(reason: string): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  const now = Date.now();
  try {
    const raw = sessionStorage.getItem(TINYADZ_RELOAD_GUARD_KEY);
    const last = raw ? (JSON.parse(raw) as { at?: number }) : { at: 0 };
    if (now - (last.at || 0) < TINYADZ_RELOAD_WINDOW_MS) {
      return false;
    }
    sessionStorage.setItem(
      TINYADZ_RELOAD_GUARD_KEY,
      JSON.stringify({ at: now, reason }),
    );
    window.location.reload();
    return true;
  } catch {
    window.location.reload();
    return true;
  }
}
