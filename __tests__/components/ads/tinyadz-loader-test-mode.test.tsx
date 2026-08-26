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

describe("TinyAdzLoader test mode", () => {
  beforeEach(() => {
    pathnameMock.mockReturnValue("/archivio");
    consentMock = "granted";
    vi.stubEnv(TINYADZ_ENABLED_ENV, "1");
    vi.stubEnv(TINYADZ_SITE_ID_ENV, "691ee1e02c1cd96006ac7374");
    vi.stubEnv(TINYADZ_TEST_MODE_ENV, "false");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    cleanup();
    document
      .querySelectorAll('script[id="tinyadz-v2"]')
      .forEach((node) => node.remove());
  });

  it("serializes test mode false as the string 'false'", () => {
    render(<TinyAdzLoader />);

    const script = document.getElementById("tinyadz-v2");
    expect(script?.getAttribute("data-test-mode")).toBe("false");
    expect(script?.getAttribute("test-mode")).toBe("false");
  });
});
