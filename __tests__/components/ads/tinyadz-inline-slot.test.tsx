// @vitest-environment jsdom

import { cleanup, render } from "@testing-library/react";
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

describe("TinyAdzInlineSlot gating", () => {
  beforeEach(() => {
    pathnameMock = "/";
    consentMock = "granted";
    stubEnv();
  });

  afterEach(() => {
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

  it("renders one container when consent is granted", () => {
    const { container } = render(<TinyAdzInlineSlot placement="home-editorial" />);
    expect(container.querySelectorAll(CONTAINER_SELECTOR).length).toBe(1);
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
    vi.unstubAllEnvs();
    cleanup();
  });

  it("exposes the official TinyAdz ta-ad-container host", () => {
    const { container } = render(<TinyAdzInlineSlot placement="home-editorial" />);
    const slot = container.querySelector(CONTAINER_SELECTOR);
    expect(slot).toBeTruthy();
    expect(slot?.hasAttribute("ta-ad-container")).toBe(true);
  });

  it("renders an accessible advertising label", () => {
    const { container } = render(<TinyAdzInlineSlot placement="home-editorial" />);
    const aside = container.querySelector("aside[aria-label='Pubblicità']");
    expect(aside).toBeTruthy();
    expect(container.querySelector(".tinyadz-inline-slot__label")?.textContent).toBe(
      "Pubblicità",
    );
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
