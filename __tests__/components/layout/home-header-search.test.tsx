// @vitest-environment jsdom

import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MobileTopBar } from "@/components/layout/mobile-top-bar";
import { useMobileUIStore } from "@/lib/stores/mobile-ui-store";

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

describe("Home header search suppression", () => {
  afterEach(() => {
    pathnameState.current = "/";
    useMobileUIStore.setState({ heroSearchVisible: false, isOverlayOpen: false });
    cleanup();
  });

  it("hides the HOME route strip on Home", () => {
    useMobileUIStore.setState({ heroSearchVisible: true });
    const { container } = render(<MobileTopBar />);
    expect(container.querySelector(".mobile-top-bar__route")).toBeNull();
  });

  it("shows refresh button at top of Home (not search)", () => {
    useMobileUIStore.setState({ heroSearchVisible: false });
    const { container } = render(<MobileTopBar />);
    const refresh = container.querySelector(".mobile-top-bar__refresh");
    expect(refresh).not.toBeNull();
  });

  it("keeps the route strip on non-home routes", () => {
    pathnameState.current = "/archivio";
    const { container } = render(<MobileTopBar />);
    expect(container.querySelector(".mobile-top-bar__route")).not.toBeNull();
  });
});
