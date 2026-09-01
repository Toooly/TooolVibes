/** @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  applyTinyAdzSiteConfig,
  bindTinyAdzInlineSlots,
  requestTinyAdzAd,
} from "@/components/ads/tinyadz-runtime";

function mountSlot(widgetId = "6a744d88df8a33f3855e3997") {
  document.body.innerHTML = `
    <aside data-tinyadz-placement="home-editorial" class="tinyadz-inline-slot">
      <div data-tv-ad-frame=""></div>
    </aside>
    <script id="tinyadz-v2" site-id="6a744c56118838f2f4456e99" test-mode="false" data-inline-widget-id="${widgetId}"></script>
  `;
}

afterEach(() => {
  document.body.innerHTML = "";
  applyTinyAdzSiteConfig(null);
  delete (window as Window & { $ta2_ads?: unknown }).$ta2_ads;
  delete (window as Window & { $tam?: unknown }).$tam;
});

describe("TinyAdz inline bind", () => {
  it("paints a non-popup iframe without waiting for $ta2_ads", () => {
    mountSlot();
    expect(bindTinyAdzInlineSlots()).toBe(true);
    const iframe = document.querySelector("iframe.tinyadz-iframe") as HTMLIFrameElement | null;
    expect(iframe).not.toBeNull();
    expect(iframe?.src).toContain("showInPopup=false");
    expect(iframe?.src).toContain("renderMode=INLINED");
    expect(iframe?.src).toContain("/was/6a744d88df8a33f3855e3997");
  });

  it("does not paint when widget id and site id are missing", () => {
    document.body.innerHTML = `<aside data-tinyadz-placement="home-editorial"><div data-tv-ad-frame=""></div></aside>`;
    expect(bindTinyAdzInlineSlots()).toBe(false);
    expect(document.querySelector("iframe.tinyadz-iframe")).toBeNull();
  });

  it("does not duplicate an already painted iframe", () => {
    mountSlot();
    expect(bindTinyAdzInlineSlots()).toBe(true);
    expect(bindTinyAdzInlineSlots()).toBe(true);
    expect(document.querySelectorAll("iframe.tinyadz-iframe")).toHaveLength(1);
  });

  it("asks $tam for the next ad and then binds slots", () => {
    mountSlot();
    const requestNextAd = vi.fn();
    (window as Window & { $tam?: { requestNextAd: typeof requestNextAd } }).$tam = {
      requestNextAd,
    };
    requestTinyAdzAd();
    expect(requestNextAd).toHaveBeenCalledTimes(1);
  });
});
