/** @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  applyTinyAdzSiteConfig,
  bindTinyAdzInlineSlots,
  installTinyAdzWidgetMessages,
  requestTinyAdzAd,
} from "@/components/ads/tinyadz-runtime";

function mountSlot() {
  document.body.innerHTML = `
    <aside data-tinyadz-placement="home-editorial" class="tinyadz-inline-slot">
      <div ta-ad-container=""></div>
    </aside>
    <script id="tinyadz-v2" src="https://cdn.apitiny.net/scripts/v2.0/main.js" data-site-id="6a744c56118838f2f4456e99" data-test-mode="false"></script>
  `;
}

afterEach(() => {
  document.body.innerHTML = "";
  applyTinyAdzSiteConfig(null);
  delete (window as Window & { $ta2_ads?: unknown }).$ta2_ads;
  delete (window as Window & { $tam?: unknown }).$tam;
});

describe("TinyAdz official inline bind", () => {
  it("asks $tam to fill official ta-ad-container hosts", () => {
    mountSlot();
    const requestNextAd = vi.fn();
    (window as Window & { $tam?: { requestNextAd: typeof requestNextAd } }).$tam = {
      requestNextAd,
    };
    expect(bindTinyAdzInlineSlots()).toBe(true);
    expect(requestNextAd).toHaveBeenCalledTimes(1);
    expect(document.querySelector("[ta-ad-container]")).not.toBeNull();
    expect(document.querySelector("iframe.tv-ad-frame__iframe")).toBeNull();
  });

  it("keeps retrying until the TinyAdz manager exists", () => {
    mountSlot();
    expect(bindTinyAdzInlineSlots()).toBe(false);
  });

  it("keeps the Pubblicità slot visible when TinyAdz reports NO_AD", () => {
    mountSlot();
    installTinyAdzWidgetMessages();
    window.dispatchEvent(
      new MessageEvent("message", {
        data: { sender: "tinyadz", action: "NO_AD" },
      }),
    );
    const slot = document.querySelector("[data-tinyadz-placement]") as HTMLElement | null;
    expect(slot?.hidden).toBe(false);
    expect(slot?.getAttribute("data-tv-ad-empty")).toBe("true");
  });

  it("asks $tam for the next ad on requestTinyAdzAd", () => {
    mountSlot();
    const requestNextAd = vi.fn();
    (window as Window & { $tam?: { requestNextAd: typeof requestNextAd } }).$tam = {
      requestNextAd,
    };
    requestTinyAdzAd();
    expect(requestNextAd).toHaveBeenCalled();
  });
});
