// @vitest-environment jsdom

import { cleanup, render, type RenderResult } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let pathnameMock: string = "/";
let consentMock: "unknown" | "granted" | "denied" = "granted";
const { reloadOnce, bestEffortHide, runtimeActive, requestAd } = vi.hoisted(() => ({
  reloadOnce: vi.fn(() => false),
  bestEffortHide: vi.fn(),
  runtimeActive: vi.fn(() => true),
  requestAd: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => pathnameMock,
}));

vi.mock("@/components/ads/advertising-consent-provider", () => ({
  useAdvertisingConsent: () => ({ state: consentMock }),
}));

vi.mock("@/components/ads/tinyadz-runtime", () => ({
  reloadOnce,
  bestEffortHideTinyAdz: bestEffortHide,
  tinyadzRuntimeActive: runtimeActive,
  requestTinyAdzAd: requestAd,
}));

import { TinyAdzLifecycle } from "@/components/ads/tinyadz-lifecycle";

type View = RenderResult;
let view: View;

describe("TinyAdzLifecycle SPA route handling", () => {
  beforeEach(() => {
    pathnameMock = "/";
    consentMock = "granted";
    reloadOnce.mockClear();
    bestEffortHide.mockClear();
    requestAd.mockClear();
    runtimeActive.mockClear();
    runtimeActive.mockReturnValue(true);
    view = render(<TinyAdzLifecycle />);
  });

  afterEach(() => {
    cleanup();
  });

  it("does not reload on the initial mount", () => {
    expect(reloadOnce).not.toHaveBeenCalled();
  });

  it("does not reload on eligible -> eligible navigation", () => {
    pathnameMock = "/toools/blink";
    view.rerender(<TinyAdzLifecycle />);
    expect(reloadOnce).not.toHaveBeenCalled();
  });

  it("requests the next ad when returning to an eligible route", () => {
    pathnameMock = "/compare";
    view.rerender(<TinyAdzLifecycle />);
    requestAd.mockClear();
    pathnameMock = "/archivio";
    view.rerender(<TinyAdzLifecycle />);
    expect(requestAd).toHaveBeenCalled();
  });

  it("hides TinyAdz without reloading when leaving an eligible route", () => {
    pathnameMock = "/compare";
    view.rerender(<TinyAdzLifecycle />);
    expect(bestEffortHide).toHaveBeenCalledTimes(1);
    expect(reloadOnce).not.toHaveBeenCalled();
  });

  it("does not reload when consent is not granted", () => {
    consentMock = "denied";
    pathnameMock = "/compare";
    view.rerender(<TinyAdzLifecycle />);
    expect(reloadOnce).not.toHaveBeenCalled();
  });

  it("does not reload to excluded when runtime is absent", () => {
    runtimeActive.mockReturnValue(false);
    pathnameMock = "/compare";
    view.rerender(<TinyAdzLifecycle />);
    expect(reloadOnce).not.toHaveBeenCalled();
  });
});
