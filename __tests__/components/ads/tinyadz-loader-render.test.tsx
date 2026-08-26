// @vitest-environment jsdom

import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const pathnameMock = vi.fn<() => string | undefined>(() => "/");
let consentMock: "unknown" | "granted" | "denied" = "granted";

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

const SITE_ID = "691ee1e02c1cd96006ac7374";

describe("TinyAdzLoader render contract", () => {
  beforeEach(() => {
    pathnameMock.mockReturnValue("/");
    consentMock = "granted";
    vi.stubEnv(TINYADZ_ENABLED_ENV, "1");
    vi.stubEnv(TINYADZ_SITE_ID_ENV, SITE_ID);
    vi.stubEnv(TINYADZ_TEST_MODE_ENV, "true");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    cleanup();
    document
      .querySelectorAll('script[id="tinyadz-v2"]')
      .forEach((node) => node.remove());
  });

  it("renders the exact TinyAdz script on an eligible route with granted consent", () => {
    render(<TinyAdzLoader />);

    const script = document.getElementById("tinyadz-v2");
    expect(script).toBeTruthy();
    expect(script?.getAttribute("src")).toBe(
      "https://cdn.apitiny.net/scripts/v2.0/main.js",
    );
    expect(script?.getAttribute("data-site-id")).toBe(SITE_ID);
    expect(script?.getAttribute("site-id")).toBe(SITE_ID);
    expect(script?.getAttribute("data-test-mode")).toBe("true");
    expect(script?.getAttribute("test-mode")).toBe("true");
  });
});
