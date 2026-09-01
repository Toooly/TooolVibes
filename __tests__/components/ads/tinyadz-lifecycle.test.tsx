// @vitest-environment jsdom

import { cleanup, render, type RenderResult } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let pathnameMock: string = "/";
let consentMock: "unknown" | "granted" | "denied" = "granted";
const { reloadOnce, bestEffortHide, runtimeActive } = vi.hoisted(() => ({
  reloadOnce: vi.fn(() => false),
  bestEffortHide: vi.fn(),
  runtimeActive: vi.fn(() => true),
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

  it("reloads once when navigating from an active eligible route to an excluded route", () => {
    pathnameMock = "/compare";
    view.rerender(<TinyAdzLifecycle />);
    expect(reloadOnce).toHaveBeenCalledTimes(1);
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
