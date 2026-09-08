// @vitest-environment jsdom

import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MobileTopBar } from "@/components/layout/mobile-top-bar";
import { useMobileUIStore } from "@/lib/stores/mobile-ui-store";

const pathnameState = vi.hoisted(() => ({ current: "/" }));

vi.mock("next/navigation", () => ({
  usePathname: () => pathnameState.current,
}));

vi.mock("@/components/layout/brand-logo", () => ({
  BrandLogo: () => null,
}));

vi.mock("@/components/layout/header-account-control", () => ({
  HeaderAccountControl: () => null,
}));

describe("Home header search suppression", () => {
  afterEach(() => {
    pathnameState.current = "/";
    useMobileUIStore.setState({ heroSearchVisible: false, isOverlayOpen: false });
    cleanup();
  });

  it("hides the HOME route strip and suppresses search when hero search is visible", () => {
    useMobileUIStore.setState({ heroSearchVisible: true });
    const { container } = render(<MobileTopBar />);
    expect(container.querySelector(".mobile-top-bar__route")).toBeNull();
    const search = container.querySelector(".mobile-top-bar__search");
    expect(search?.classList.contains("is-hero-suppressed")).toBe(true);
  });

  it("shows header search on Home once the hero search leaves view", () => {
    useMobileUIStore.setState({ heroSearchVisible: false });
    const { container } = render(<MobileTopBar />);
    const search = container.querySelector(".mobile-top-bar__search");
    expect(search?.classList.contains("is-hero-suppressed")).toBe(false);
  });

  it("keeps the route strip on non-home routes", () => {
    pathnameState.current = "/archivio";
    const { container } = render(<MobileTopBar />);
    expect(container.querySelector(".mobile-top-bar__route")).not.toBeNull();
  });
});
