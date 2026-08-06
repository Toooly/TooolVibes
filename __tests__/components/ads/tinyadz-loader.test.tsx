// @vitest-environment jsdom

import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const pathnameMock = vi.fn<() => string | undefined>(() => "/");
let consentMock: "unknown" | "granted" | "denied" = "unknown";

vi.mock("next/navigation", () => ({
  usePathname: () => pathnameMock(),
}));

vi.mock("@/components/ads/advertising-consent-provider", () => ({
  useAdvertisingConsent: () => ({ state: consentMock }),
}));

import { TinyAdzLoader } from "@/components/ads/tinyadz-loader";
import {
  TINYADZ_ENABLED_ENV,
  TINYADZ_SITE_ID_ENV,
  TINYADZ_TEST_MODE_ENV,
} from "@/lib/ads/tinyadz-config";

const DEFAULT_SITE_ID = "691ee1e02c1cd96006ac7374";

function stubTinyAdzEnv(overrides: Record<string, string | undefined> = {}) {
  vi.stubEnv(TINYADZ_ENABLED_ENV, overrides.enabled ?? "1");
  vi.stubEnv(TINYADZ_SITE_ID_ENV, overrides.siteId ?? DEFAULT_SITE_ID);
  vi.stubEnv(TINYADZ_TEST_MODE_ENV, overrides.testMode ?? "true");
}

function queryTinyAdzScript() {
  return document.getElementById("tinyadz-v2");
}

describe("TinyAdzLoader consent gating", () => {
  beforeEach(() => {
    pathnameMock.mockReturnValue("/");
    consentMock = "unknown";
    stubTinyAdzEnv();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    cleanup();
    document
      .querySelectorAll('script[id="tinyadz-v2"]')
      .forEach((node) => node.remove());
  });

  it("renders nothing when consent is unknown", () => {
    consentMock = "unknown";
    render(<TinyAdzLoader />);
    expect(queryTinyAdzScript()).toBeNull();
  });

  it("renders nothing when consent is denied", () => {
    consentMock = "denied";
    render(<TinyAdzLoader />);
    expect(queryTinyAdzScript()).toBeNull();
  });

  it("renders exactly one script when consent is granted", () => {
    consentMock = "granted";
    render(<TinyAdzLoader />);
    const nodes = document.querySelectorAll('script[id="tinyadz-v2"]');
    expect(nodes.length).toBe(1);
  });

  it("renders nothing when the feature flag is disabled", () => {
    consentMock = "granted";
    stubTinyAdzEnv({ enabled: "0" });
    render(<TinyAdzLoader />);
    expect(queryTinyAdzScript()).toBeNull();
  });

  it("renders nothing when the site id is missing", () => {
    consentMock = "granted";
    stubTinyAdzEnv({ siteId: "" });
    render(<TinyAdzLoader />);
    expect(queryTinyAdzScript()).toBeNull();
  });

  it("renders nothing on compare routes even with consent", () => {
    consentMock = "granted";
    pathnameMock.mockReturnValue("/compare");
    render(<TinyAdzLoader />);
    expect(queryTinyAdzScript()).toBeNull();
  });

  it("renders nothing on account routes even with consent", () => {
    consentMock = "granted";
    pathnameMock.mockReturnValue("/account");
    render(<TinyAdzLoader />);
    expect(queryTinyAdzScript()).toBeNull();
  });

  it("renders nothing on legal pages even with consent", () => {
    consentMock = "granted";
    pathnameMock.mockReturnValue("/privacy");
    render(<TinyAdzLoader />);
    expect(queryTinyAdzScript()).toBeNull();
  });
});
