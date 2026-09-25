// @vitest-environment jsdom

import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  MobileTopBar,
  hasRouteStrip,
} from "@/components/layout/mobile-top-bar";

const pathnameState = vi.hoisted(() => ({ current: "/" }));

vi.mock("next/navigation", () => ({
  usePathname: () => pathnameState.current,
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("@/components/layout/brand-logo", () => ({
  BrandLogo: () => null,
}));

vi.mock("@/components/layout/header-account-control", () => ({
  HeaderAccountControl: () => null,
}));

afterEach(() => {
  pathnameState.current = "/";
  cleanup();
});

describe("V3 route-context strip policy", () => {
  const PRODUCT_AREAS = [
    "/archivio",
    "/collections",
    "/radar",
    "/shortlist",
    "/compare",
    "/toools/blink",
  ];

  const EDITORIAL_UTILITY_ROUTES = [
    "/",
    "/posts",
    "/posts/meku",
    "/chi-siamo",
    "/shop",
    "/privacy",
    "/cookie",
    "/termini",
    "/metodo",
    "/studio",
    "/contributi",
    "/affiliati",
    "/sponsorizza",
    "/account",
    "/tags",
    "/wishlist",
    "/community",
  ];

  it("hasRouteStrip: true only inside task/product areas", () => {
    for (const path of PRODUCT_AREAS) {
      expect(hasRouteStrip(path), path).toBe(true);
    }
    for (const path of EDITORIAL_UTILITY_ROUTES) {
      expect(hasRouteStrip(path), path).toBe(false);
    }
  });

  it("hasRouteStrip: non abbina prefissi parziali", () => {
    expect(hasRouteStrip("/toolsshop")).toBe(false);
    expect(hasRouteStrip("/archivio-x")).toBe(false);
  });

  it("renderizza la strip nelle aree prodotto", () => {
    for (const path of PRODUCT_AREAS) {
      pathnameState.current = path;
      const { container, unmount } = render(<MobileTopBar />);
      expect(
        container.querySelector(".mobile-top-bar__route"),
        path,
      ).not.toBeNull();
      unmount();
    }
  });

  it("non renderizza la strip su editorial/utility/Home", () => {
    for (const path of EDITORIAL_UTILITY_ROUTES) {
      pathnameState.current = path;
      const { container, unmount } = render(<MobileTopBar />);
      expect(container.querySelector(".mobile-top-bar__route"), path).toBeNull();
      unmount();
    }
  });
});
