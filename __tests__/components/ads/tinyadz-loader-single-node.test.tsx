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

const SCRIPT_SELECTOR = 'script[id="tinyadz-v2"]';

describe("TinyAdzLoader single node", () => {
  beforeEach(() => {
    pathnameMock.mockReturnValue("/");
    consentMock = "granted";
    vi.stubEnv(TINYADZ_ENABLED_ENV, "1");
    vi.stubEnv(TINYADZ_SITE_ID_ENV, "691ee1e02c1cd96006ac7374");
    vi.stubEnv(TINYADZ_TEST_MODE_ENV, "true");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    cleanup();
    document
      .querySelectorAll(SCRIPT_SELECTOR)
      .forEach((node) => node.remove());
  });

  it("keeps exactly one script node across repeated mounts and remounts", () => {
    const first = render(<TinyAdzLoader />);
    render(<TinyAdzLoader />);
    expect(document.querySelectorAll(SCRIPT_SELECTOR).length).toBe(1);

    first.unmount();
    render(<TinyAdzLoader />);
    expect(document.querySelectorAll(SCRIPT_SELECTOR).length).toBe(1);
  });
});
