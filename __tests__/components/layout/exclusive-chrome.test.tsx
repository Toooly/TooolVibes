// @vitest-environment jsdom

import { act, cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import {
  CHROME_DESKTOP_MEDIA_QUERY,
  ChromeViewportProvider,
} from "@/components/layout/chrome-viewport";
import { CommandBar } from "@/components/layout/command-bar";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { MobileTopBar } from "@/components/layout/mobile-top-bar";
import { useMobileUIStore } from "@/lib/stores/mobile-ui-store";

const pathnameState = vi.hoisted(() => ({ current: "/" }));

let desktopViewport = false;
const viewportChangeListeners = new Set<() => void>();

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

vi.mock("@/components/app/sound-toggle-button", () => ({
  SoundToggleButton: () => null,
}));

vi.mock("@/components/app/music-toggle-button", () => ({
  MusicToggleButton: () => null,
}));

vi.mock("@/components/layout/use-authenticated-nav-items", () => ({
  useAuthenticatedNavItems: () => [
    { id: "home", href: "/", label: "Home" },
    { id: "archive", href: "/archivio", label: "Catalogo" },
    { id: "collections", href: "/collections", label: "Raccolte" },
    { id: "shortlist", href: "/shortlist", label: "Salvati" },
  ],
  useLocationSearch: () => "",
}));

function setDesktopViewport(matches: boolean) {
  desktopViewport = matches;
  act(() => {
    viewportChangeListeners.forEach((listener) => listener());
  });
}

function renderExclusive() {
  return render(
    <ChromeViewportProvider>
      <CommandBar />
      <MobileTopBar />
      <MobileBottomNav />
    </ChromeViewportProvider>,
  );
}

describe("D1 exclusive chrome at 1280", () => {
  beforeAll(() => {
    vi.stubGlobal(
      "matchMedia",
      (query: string) => ({
        get matches() {
          return query === CHROME_DESKTOP_MEDIA_QUERY ? desktopViewport : false;
        },
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: (_type: string, listener: () => void) => {
          if (query === CHROME_DESKTOP_MEDIA_QUERY) {
            viewportChangeListeners.add(listener);
          }
        },
        removeEventListener: (_type: string, listener: () => void) => {
          if (query === CHROME_DESKTOP_MEDIA_QUERY) {
            viewportChangeListeners.delete(listener);
          }
        },
        dispatchEvent: vi.fn(),
      }),
    );
  });

  beforeEach(() => {
    desktopViewport = false;
    pathnameState.current = "/";
    viewportChangeListeners.clear();
    useMobileUIStore.setState({ heroSearchVisible: false, isOverlayOpen: false });
    document.documentElement.style.removeProperty("--tv-bottom-nav-total");
    delete document.documentElement.dataset.tvBottomNav;
  });

  afterEach(() => {
    cleanup();
  });

  it("keeps dual chrome when no exclusive provider is mounted", () => {
    render(
      <>
        <CommandBar />
        <MobileTopBar />
      </>,
    );
    expect(document.querySelector(".command-bar")).not.toBeNull();
    expect(document.querySelector(".mobile-top-bar")).not.toBeNull();
  });

  it("mounts only mobile chrome below 1280", async () => {
    desktopViewport = false;
    renderExclusive();
    await waitFor(() => {
      expect(document.querySelector(".command-bar")).toBeNull();
      expect(document.querySelector(".mobile-top-bar")).not.toBeNull();
      expect(document.querySelector(".mobile-bottom-shell")).not.toBeNull();
    });
    expect(document.querySelectorAll('[role="banner"]')).toHaveLength(1);
    expect(document.documentElement.style.getPropertyValue("--tv-bottom-nav-total")).toBe(
      "58px",
    );
  });

  it("mounts only CommandBar at 1280 and does not portal bottom nav", async () => {
    desktopViewport = true;
    renderExclusive();
    await waitFor(() => {
      expect(document.querySelector(".command-bar")).not.toBeNull();
      expect(document.querySelector(".mobile-top-bar")).toBeNull();
      expect(document.querySelector(".mobile-bottom-shell")).toBeNull();
    });
    expect(document.querySelectorAll('[role="banner"]')).toHaveLength(1);
    expect(document.documentElement.style.getPropertyValue("--tv-bottom-nav-total")).toBe(
      "0px",
    );
  });

  it("swaps chrome across 1279 and 1280 without duplicating banners", async () => {
    desktopViewport = false;
    renderExclusive();
    await waitFor(() => {
      expect(document.querySelector(".mobile-top-bar")).not.toBeNull();
    });

    setDesktopViewport(true);
    await waitFor(() => {
      expect(document.querySelector(".command-bar")).not.toBeNull();
      expect(document.querySelector(".mobile-top-bar")).toBeNull();
      expect(document.querySelector(".mobile-bottom-shell")).toBeNull();
    });
    expect(document.querySelectorAll('[role="banner"]')).toHaveLength(1);

    setDesktopViewport(false);
    await waitFor(() => {
      expect(document.querySelector(".command-bar")).toBeNull();
      expect(document.querySelector(".mobile-top-bar")).not.toBeNull();
      expect(document.querySelector(".mobile-bottom-shell")).not.toBeNull();
    });
    expect(document.querySelectorAll('[role="banner"]')).toHaveLength(1);
  });

  it("preserves the product route strip on mobile exclusive chrome", async () => {
    pathnameState.current = "/archivio";
    desktopViewport = false;
    renderExclusive();
    await waitFor(() => {
      expect(document.querySelector(".mobile-top-bar__route")).not.toBeNull();
    });
  });

  it("suppresses CommandBar search while the home hero search is visible", () => {
    useMobileUIStore.setState({ heroSearchVisible: true });
    render(<CommandBar />);
    expect(
      document.querySelector(".command-bar__search")?.classList.contains("is-hero-suppressed"),
    ).toBe(true);
  });

  it("does not mount empty scanline or bottom-border decorative nodes", () => {
    render(
      <>
        <CommandBar />
        <MobileTopBar />
      </>,
    );
    expect(document.querySelector(".command-bar__scanline")).toBeNull();
    expect(document.querySelector(".command-bar__bottom-border")).toBeNull();
    expect(document.querySelector(".mobile-top-bar__scanline")).toBeNull();
  });
});
