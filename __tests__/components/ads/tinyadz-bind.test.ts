/** @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  applyTinyAdzSiteConfig,
  bindTinyAdzInlineSlots,
  requestTinyAdzAd,
} from "@/components/ads/tinyadz-runtime";

function mountSlot() {
  document.body.innerHTML = `
    <aside data-tinyadz-placement="home-editorial" class="tinyadz-inline-slot">
      <div ta-ad-container=""></div>
    </aside>
    <script id="tinyadz-v2" site-id="6a744c56118838f2f4456e99" test-mode="false"></script>
  `;
}

afterEach(() => {
  document.body.innerHTML = "";
  applyTinyAdzSiteConfig(null);
  delete (window as Window & { $ta2_ads?: unknown }).$ta2_ads;
  delete (window as Window & { $tam?: unknown }).$tam;
});

describe("TinyAdz inline bind", () => {
  it("paints INLINED widgets into consent-gated slots", () => {
    mountSlot();
    const renderInlined = vi.fn((widgetId: string, options: { container?: Element }) => {
      const iframe = document.createElement("iframe");
      iframe.className = "tinyadz-iframe inlined-ta-ad";
      iframe.src = `https://cdn.apitiny.net/was/${widgetId}`;
      options.container?.appendChild(iframe);
    });
    (window as Window & { $ta2_ads?: { renderInlined: typeof renderInlined } }).$ta2_ads = {
      renderInlined,
    };
    applyTinyAdzSiteConfig({
      enabled: true,
      widgets: [{ id: "widget-inline", renderMode: "INLINED" }],
    });

    expect(bindTinyAdzInlineSlots()).toBe(true);
    expect(renderInlined).toHaveBeenCalledTimes(1);
    expect(document.querySelector("iframe.tinyadz-iframe")).not.toBeNull();
  });

  it("does not paint when vendor config is disabled", () => {
    mountSlot();
    const renderInlined = vi.fn();
    (window as Window & { $ta2_ads?: { renderInlined: typeof renderInlined } }).$ta2_ads = {
      renderInlined,
    };
    applyTinyAdzSiteConfig({
      enabled: false,
      widgets: [{ id: "widget-inline", renderMode: "INLINED" }],
    });
    expect(bindTinyAdzInlineSlots()).toBe(false);
    expect(renderInlined).not.toHaveBeenCalled();
  });

  it("asks $tam for the next ad and then binds slots", () => {
    mountSlot();
    const requestNextAd = vi.fn();
    const renderInlined = vi.fn();
    (window as Window & { $tam?: { requestNextAd: typeof requestNextAd } }).$tam = {
      requestNextAd,
    };
    (window as Window & { $ta2_ads?: { renderInlined: typeof renderInlined } }).$ta2_ads = {
      renderInlined,
    };
    applyTinyAdzSiteConfig({
      enabled: true,
      widgets: [{ id: "widget-inline", renderMode: "INLINED" }],
    });
    requestTinyAdzAd();
    expect(requestNextAd).toHaveBeenCalledTimes(1);
  });
});
