/**
 * Best-effort TinyAdz runtime teardown, SPA refresh, and inline slot paint.
 *
 * TinyAdz v2 exposes `window.$tam.requestNextAd` and `window.$ta2_ads.renderInlined`.
 * `requestNextAd()` without a container cannot paint INLINED widgets. Auto-placement
 * selectors on the homepage sit above the vendor's "too close to the top" cutoff.
 * We therefore paint our consent-gated `[ta-ad-container]` hosts directly.
 */

export const TINYADZ_RELOAD_GUARD_KEY = "tooolvibes.ta.reload-guard";
export const TINYADZ_RELOAD_WINDOW_MS = 2000;

type TinyAdzManager = {
  hidePopup?: () => void;
  resetContent?: () => void;
  hideWidget?: (iframe?: HTMLElement | null) => void;
  requestNextAd?: () => void;
  renderInlined?: (
    widgetId: string,
    options: {
      theme?: string;
      renderMode?: string;
      container?: Element | null;
      testMode?: boolean;
      siteId?: string;
    },
  ) => void;
};

type TinyAdzWindow = Window & {
  $ta2_ads?: TinyAdzManager;
  $tam?: { requestNextAd?: () => void };
  tam?: { requestNextAd?: () => void };
};

export type TinyAdzSiteWidget = Readonly<{
  id: string;
  renderMode?: string;
}>;

export type TinyAdzSiteConfig = Readonly<{
  enabled?: boolean;
  widgets?: readonly TinyAdzSiteWidget[];
}>;

let siteConfig: TinyAdzSiteConfig | null = null;
let fetchPatched = false;
let bindAttempts = 0;
let bindTimer: number | null = null;

const MAX_BIND_ATTEMPTS = 20;

function tinyAdzWindow(): TinyAdzWindow | null {
  if (typeof window === "undefined") {
    return null;
  }
  return window as TinyAdzWindow;
}

export function applyTinyAdzSiteConfig(config: TinyAdzSiteConfig | null): void {
  siteConfig = config;
  bindAttempts = 0;
}

export function getTinyAdzSiteConfig(): TinyAdzSiteConfig | null {
  return siteConfig;
}

export function installTinyAdzConfigCapture(): void {
  const w = tinyAdzWindow();
  if (!w || fetchPatched) {
    return;
  }
  fetchPatched = true;
  const originalFetch = w.fetch.bind(w);
  w.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const response = await originalFetch(input, init);
    try {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.href
            : input.url;
      if (url.includes("/api/gsc")) {
        const payload = (await response.clone().json()) as {
          config?: TinyAdzSiteConfig;
        };
        applyTinyAdzSiteConfig(payload.config ?? null);
        scheduleTinyAdzInlineBind();
      }
    } catch {
      // Vendor payload is best-effort; never break first-party fetch.
    }
    return response;
  };
}

export function tinyadzRuntimeActive(): boolean {
  const w = tinyAdzWindow();
  if (!w) {
    return false;
  }
  return (
    Boolean(w.$tam) ||
    Boolean(w.$ta2_ads) ||
    Boolean(document.getElementById("tinyadz-v2"))
  );
}

export function bestEffortHideTinyAdz(): void {
  const w = tinyAdzWindow();
  if (!w) {
    return;
  }
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

function inlineWidgetId(): string | null {
  if (!siteConfig?.enabled || !Array.isArray(siteConfig.widgets)) {
    return null;
  }
  const widget = siteConfig.widgets.find(
    (entry) => !entry.renderMode || entry.renderMode === "INLINED",
  );
  return widget?.id ?? null;
}

function alreadyPainted(container: Element): boolean {
  return Boolean(
    container.querySelector("iframe.tinyadz-iframe, iframe.inlined-ta-ad"),
  );
}

export function bindTinyAdzInlineSlots(): boolean {
  const w = tinyAdzWindow();
  if (!w) {
    return false;
  }
  const widgetId = inlineWidgetId();
  const ads = w.$ta2_ads;
  if (!widgetId || typeof ads?.renderInlined !== "function") {
    return false;
  }
  const script = document.getElementById("tinyadz-v2");
  const siteId = script?.getAttribute("site-id") || script?.getAttribute("data-site-id") || "";
  const testMode =
    (script?.getAttribute("test-mode") || script?.getAttribute("data-test-mode")) ===
    "true";
  const containers = document.querySelectorAll(
    "[data-tinyadz-placement] [ta-ad-container], [ta-ad-container]",
  );
  let painted = false;
  containers.forEach((container) => {
    if (alreadyPainted(container)) {
      painted = true;
      return;
    }
    try {
      ads.renderInlined?.(widgetId, {
        theme: "light",
        renderMode: "INLINED",
        container,
        testMode,
        siteId,
      });
      painted = alreadyPainted(container) || painted;
    } catch {
      // Vendor render is best-effort.
    }
  });
  return painted;
}

export function scheduleTinyAdzInlineBind(): void {
  if (typeof window === "undefined") {
    return;
  }
  if (bindTimer != null) {
    window.clearTimeout(bindTimer);
  }
  bindAttempts += 1;
  if (bindAttempts > MAX_BIND_ATTEMPTS) {
    return;
  }
  bindTimer = window.setTimeout(() => {
    bindTimer = null;
    if (!bindTinyAdzInlineSlots()) {
      scheduleTinyAdzInlineBind();
    }
  }, 250);
}

export function requestTinyAdzAd(): void {
  const w = tinyAdzWindow();
  if (!w) {
    return;
  }
  try {
    w.$tam?.requestNextAd?.();
  } catch {
    // ignore
  }
  try {
    w.tam?.requestNextAd?.();
  } catch {
    // ignore
  }
  try {
    w.$ta2_ads?.requestNextAd?.();
  } catch {
    // ignore
  }
  scheduleTinyAdzInlineBind();
}
