// @vitest-environment jsdom

import { createElement, type ReactNode } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { pathnameState } = vi.hoisted(() => ({
  pathnameState: { current: "/" as string },
}));

vi.mock("next/navigation", () => ({
  usePathname: () => pathnameState.current,
}));

vi.mock("@/components/layout/command-bar", () => ({
  CommandBar: () => createElement("div", { "data-testid": "command-bar" }),
}));

vi.mock("@/components/layout/mobile-top-bar", () => ({
  MobileTopBar: () => createElement("div", { "data-testid": "mobile-top-bar" }),
}));

vi.mock("@/components/layout/site-footer-v2", () => ({
  SiteFooterV2: () => createElement("footer", { "data-testid": "site-footer-v2" }),
}));

vi.mock("@/components/layout/mobile-bottom-nav", () => ({
  MobileBottomNav: () => createElement("nav", { "data-testid": "mobile-bottom-nav" }),
}));

vi.mock("@/components/ads/tinyadz-loader", () => ({
  TinyAdzLoader: () => createElement("div", { "data-testid": "tinyadz-loader" }),
}));

vi.mock("@/components/app/page-transition", () => ({
  PageTransition: ({ children }: { children: ReactNode }) =>
    createElement("div", { "data-testid": "page-transition" }, children),
}));

vi.mock("@/components/layout/loop-shell", () => ({
  LoopShell: ({ children }: { children: ReactNode }) =>
    createElement("div", { "data-testid": "loop-shell" }, children),
  LoopShellFallback: ({ children }: { children: ReactNode }) =>
    createElement("div", { "data-testid": "loop-shell-fallback" }, children),
}));

import { MarketingChrome } from "@/components/layout/marketing-chrome";

function renderChrome() {
  return render(
    createElement(MarketingChrome, null, createElement("div", null, "page-body")),
  );
}

describe("MarketingChrome — public vs account app", () => {
  beforeEach(() => {
    pathnameState.current = "/";
  });

  afterEach(() => {
    cleanup();
  });

  it.each(["/", "/posts", "/collections", "/chi-siamo"])(
    "magazine pathname %s keeps marketing chrome",
    (pathname) => {
      pathnameState.current = pathname;
      renderChrome();

      expect(screen.getByTestId("command-bar")).toBeTruthy();
      expect(screen.getByTestId("mobile-top-bar")).toBeTruthy();
      expect(screen.getByTestId("site-footer-v2")).toBeTruthy();
      expect(screen.getByTestId("mobile-bottom-nav")).toBeTruthy();
      expect(screen.getByTestId("tinyadz-loader")).toBeTruthy();
      expect(screen.getByTestId("page-transition")).toBeTruthy();
      expect(screen.getByText("page-body")).toBeTruthy();
      expect(screen.queryByTestId("loop-shell")).toBeNull();
      expect(document.getElementById("main-content")?.className).toContain("pb-mobile-nav");
    },
  );

  it.each([
    "/archivio",
    "/radar",
    "/compare",
    "/shortlist",
    "/toools/linear",
    "/account",
    "/account/settings",
  ])("loop pathname %s uses LoopShell instead of marketing chrome", (pathname) => {
    pathnameState.current = pathname;
    renderChrome();

    expect(screen.getByTestId("loop-shell")).toBeTruthy();
    expect(screen.getByText("page-body")).toBeTruthy();
    expect(screen.queryByTestId("command-bar")).toBeNull();
    expect(screen.queryByTestId("mobile-top-bar")).toBeNull();
    expect(screen.queryByTestId("mobile-bottom-nav")).toBeNull();
  });
});
