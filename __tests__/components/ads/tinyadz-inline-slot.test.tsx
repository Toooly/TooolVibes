// @vitest-environment jsdom

import { act, cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let pathnameMock: string = "/";
let consentMock: "unknown" | "granted" | "denied" = "unknown";

vi.mock("next/navigation", () => ({
  usePathname: () => pathnameMock,
}));

vi.mock("@/components/ads/advertising-consent-provider", () => ({
  useAdvertisingConsent: () => ({ state: consentMock }),
}));

import { TinyAdzInlineSlot } from "@/components/ads/tinyadz-inline-slot";
import {
  TINYADZ_ENABLED_ENV,
  TINYADZ_SITE_ID_ENV,
} from "@/lib/ads/tinyadz-config";

const SITE_ID = "6a744c56118838f2f4456e99";
const CONTAINER_SELECTOR = "div[ta-ad-container]";

function stubEnv(overrides: Record<string, string | undefined> = {}) {
  vi.stubEnv(TINYADZ_ENABLED_ENV, overrides.enabled ?? "true");
  vi.stubEnv(TINYADZ_SITE_ID_ENV, overrides.siteId ?? SITE_ID);
}

function mockIframeRect(iframe: HTMLIFrameElement, height: number) {
  iframe.getBoundingClientRect = () =>
    ({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 300,
      bottom: height,
      width: 300,
      height,
      toJSON() {
        return {};
      },
    }) as DOMRect;
}

function insertInlinedAd(container: HTMLElement, height: number, src?: string) {
  const host = container.querySelector(CONTAINER_SELECTOR);
  expect(host).toBeTruthy();
  const iframe = document.createElement("iframe");
  iframe.className = "inlined-ta-ad";
  if (src) iframe.setAttribute("src", src);
  mockIframeRect(iframe, height);
  host?.appendChild(iframe);
  return iframe;
}

describe("TinyAdzInlineSlot gating", () => {
  beforeEach(() => {
    pathnameMock = "/";
    consentMock = "granted";
    stubEnv();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    cleanup();
  });

  it("returns null for unknown consent (no slot, no blank gap)", () => {
    consentMock = "unknown";
    const { container } = render(<TinyAdzInlineSlot placement="home-editorial" />);
    expect(container.querySelector(CONTAINER_SELECTOR)).toBeNull();
    expect(container.querySelector("aside")).toBeNull();
  });

  it("returns null for denied consent", () => {
    consentMock = "denied";
    const { container } = render(<TinyAdzInlineSlot placement="home-editorial" />);
    expect(container.querySelector(CONTAINER_SELECTOR)).toBeNull();
  });

  it("renders a waiting host when consent is granted", () => {
    const { container } = render(<TinyAdzInlineSlot placement="home-editorial" />);
    expect(container.querySelectorAll(CONTAINER_SELECTOR).length).toBe(1);
    expect(container.querySelector("[data-tinyadz-state='waiting']")).toBeTruthy();
    expect(container.querySelector(".tinyadz-inline-slot__label")).toBeNull();
    expect(container.textContent ?? "").not.toContain("Pubblicità");
  });

  it("returns null when TinyAdz is disabled", () => {
    stubEnv({ enabled: "false" });
    const { container } = render(<TinyAdzInlineSlot placement="home-editorial" />);
    expect(container.querySelector(CONTAINER_SELECTOR)).toBeNull();
  });

  it("returns null when the site id is missing", () => {
    stubEnv({ siteId: "" });
    const { container } = render(<TinyAdzInlineSlot placement="home-editorial" />);
    expect(container.querySelector(CONTAINER_SELECTOR)).toBeNull();
  });

  it("renders one container on an eligible route", () => {
    pathnameMock = "/archivio";
    const { container } = render(<TinyAdzInlineSlot placement="archive-feed" />);
    expect(container.querySelectorAll(CONTAINER_SELECTOR).length).toBe(1);
  });

  it("returns null on excluded routes", () => {
    pathnameMock = "/compare";
    const { container } = render(<TinyAdzInlineSlot placement="tool-detail" />);
    expect(container.querySelector(CONTAINER_SELECTOR)).toBeNull();
  });
});

describe("TinyAdzInlineSlot contract", () => {
  beforeEach(() => {
    pathnameMock = "/";
    consentMock = "granted";
    stubEnv();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    cleanup();
  });

  it("exposes the official TinyAdz ta-ad-container host", () => {
    const { container } = render(<TinyAdzInlineSlot placement="home-editorial" />);
    const slot = container.querySelector(CONTAINER_SELECTOR);
    expect(slot).toBeTruthy();
    expect(slot?.hasAttribute("ta-ad-container")).toBe(true);
  });

  it("does not show the advertising label for a 0-height iframe.inlined-ta-ad", async () => {
    const { container } = render(<TinyAdzInlineSlot placement="home-editorial" />);
    insertInlinedAd(container, 0);
    await act(async () => {
      await Promise.resolve();
    });
    expect(container.querySelector("aside[aria-label='Pubblicità']")).toBeNull();
    expect(container.querySelector(".tinyadz-inline-slot__label")).toBeNull();
    expect(container.textContent ?? "").not.toContain("Pubblicità");
    expect(container.querySelector("[data-tinyadz-state='waiting']")).toBeTruthy();
  });

  it("does not show the advertising label for a tall iframe without a creative src", async () => {
    const { container } = render(<TinyAdzInlineSlot placement="home-editorial" />);
    insertInlinedAd(container, 180);
    await act(async () => {
      await Promise.resolve();
    });
    expect(container.querySelector(".tinyadz-inline-slot__label")).toBeNull();
    expect(container.querySelector("[data-tv-ad-section='filled']")).toBeNull();
  });

  it("shows the advertising label when a creative iframe paints at least 64px", async () => {
    const { container } = render(<TinyAdzInlineSlot placement="home-editorial" />);
    expect(container.querySelector("aside[aria-label='Pubblicità']")).toBeNull();
    insertInlinedAd(container, 64, "https://cdn.apitiny.net/creative.html");
    await waitFor(() => {
      expect(container.querySelector("aside[aria-label='Pubblicità']")).toBeTruthy();
      expect(container.querySelector(".tinyadz-inline-slot__label")?.textContent).toBe(
        "Pubblicità",
      );
    });
  });

  it("keeps the empty host mounted after timeout", () => {
    vi.useFakeTimers();
    const { container } = render(<TinyAdzInlineSlot placement="home-editorial" />);
    expect(container.querySelector(CONTAINER_SELECTOR)).toBeTruthy();
    act(() => {
      vi.advanceTimersByTime(8000);
    });
    expect(container.querySelector("[data-tinyadz-state='empty']")).toBeTruthy();
    expect(container.querySelector(CONTAINER_SELECTOR)).toBeTruthy();
    expect(container.querySelector("aside")).toBeTruthy();
    expect(container.querySelector(".tinyadz-inline-slot__label")).toBeNull();
    expect(container.textContent ?? "").not.toContain("Pubblicità");
  });

  it("exposes a stable placement data attribute", () => {
    const { container } = render(<TinyAdzInlineSlot placement="article-body" />);
    const aside = container.querySelector("aside");
    expect(aside?.getAttribute("data-tinyadz-placement")).toBe("article-body");
  });

  it("renders no script element at all", () => {
    const { container } = render(<TinyAdzInlineSlot placement="home-editorial" />);
    expect(container.querySelector("script")).toBeNull();
  });
});

describe("TinyAdzInlineSlot asGridItem", () => {
  beforeEach(() => {
    pathnameMock = "/archivio";
    consentMock = "granted";
    stubEnv();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    cleanup();
  });

  it("waiting is a probe, not a grid list item", () => {
    const { container } = render(
      <TinyAdzInlineSlot placement="archive-feed" asGridItem />,
    );
    expect(container.querySelector("li.ar4-grid__item--ad")).toBeNull();
    expect(container.querySelector(".tinyadz-inline-slot--probe")).toBeTruthy();
    expect(container.querySelector("[data-tinyadz-state='waiting']")).toBeTruthy();
  });

  it("filled is a grid list item", async () => {
    const { container } = render(
      <TinyAdzInlineSlot placement="archive-feed" asGridItem />,
    );
    insertInlinedAd(container, 80, "https://cdn.apitiny.net/creative.html");
    await waitFor(() => {
      expect(container.querySelector("li.ar4-grid__item--ad")).toBeTruthy();
      expect(container.querySelector(".tinyadz-inline-slot--probe")).toBeNull();
    });
  });
});

describe("TinyAdzInlineSlot curated placements", () => {
  const placements = [
    "home-editorial",
    "archive-feed",
    "tool-detail",
    "collection-feed",
    "article-body",
  ];

  beforeEach(() => {
    pathnameMock = "/";
    consentMock = "granted";
    stubEnv();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    cleanup();
  });

  it.each(placements.map((p) => [p]))(
    "mounts exactly one container per placement %s",
    (placement) => {
      const { container } = render(<TinyAdzInlineSlot placement={placement} />);
      expect(container.querySelectorAll(CONTAINER_SELECTOR).length).toBe(1);
      expect(container.querySelector("aside")?.getAttribute("data-tinyadz-placement")).toBe(
        placement,
      );
    },
  );
});
