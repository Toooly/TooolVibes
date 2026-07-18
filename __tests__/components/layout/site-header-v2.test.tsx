// @vitest-environment jsdom

import { createElement, Fragment, type ReactNode } from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SiteHeaderV2 } from "@/components/layout/site-header-v2";
import { NavigationReleaseProvider } from "@/lib/navigation/navigation-release-context";
import { resolveNavigationRelease } from "@/lib/navigation/release";
import { useMobileUIStore } from "@/lib/stores/mobile-ui-store";

/* Router mock minimo: l'header legge solo usePathname. */
const { pathnameState, accountState, headerFlagState } = vi.hoisted(() => ({
  pathnameState: { current: "/archivio" as string },
  accountState: {
    current: {
      authEnabled: true,
      status: "guest" as string,
      isAttaching: false,
      workspaceAttachPending: false,
    },
  },
  headerFlagState: { current: true as boolean },
}));

vi.mock("next/navigation", () => ({
  usePathname: () => pathnameState.current,
}));

/* Account mock: lo stato sessione canonico arriva da AccountProvider (B18/B19). */
vi.mock("@/components/account/account-provider", () => ({
  useAccount: () => accountState.current,
}));

/* Release flag mock (pattern B04/B29, modulo chrome B30): account-aware di
   default, OFF = adapter legacy. */
vi.mock("@/components/layout/header-chrome-release", () => ({
  headerChromeRelease: {
    get headerAccountAware() {
      return headerFlagState.current;
    },
  },
}));

/* Motion mock: strip animazioni per assert deterministiche (pattern B24). */
const MOTION_ONLY_PROPS = new Set([
  "initial",
  "animate",
  "exit",
  "transition",
  "whileTap",
  "whileHover",
  "whileInView",
  "viewport",
  "layout",
  "layoutId",
  "variants",
]);

type MotionProps = Record<string, unknown> & { children?: ReactNode };

function stripMotionProps(props: MotionProps): MotionProps {
  const clean: MotionProps = {};
  for (const [key, value] of Object.entries(props)) {
    if (!MOTION_ONLY_PROPS.has(key)) clean[key] = value;
  }
  return clean;
}

vi.mock("motion/react", () => {
  const cache = new Map<string, (props: MotionProps) => ReactNode>();
  const motionProxy = new Proxy(
    {},
    {
      get: (_target, tag: string) => {
        if (!cache.has(tag)) {
          cache.set(tag, (props: MotionProps) =>
            createElement(tag, stripMotionProps(props)),
          );
        }
        return cache.get(tag);
      },
    },
  );
  return {
    motion: motionProxy,
    AnimatePresence: ({ children }: { children: ReactNode }) =>
      createElement(Fragment, null, children),
  };
});

/* Child component mock: l'identità visiva non è sotto test. */
vi.mock("@/components/layout/brand-logo", () => ({
  BrandLogo: () => createElement("span", { "data-testid": "brand-logo" }),
}));
vi.mock("@/components/app/music-toggle-button", () => ({
  MusicToggleButton: () => null,
}));
vi.mock("@/components/app/sound-toggle-button", () => ({
  SoundToggleButton: () => null,
}));
vi.mock("@/components/directory/directory-header-search", () => ({
  DirectoryHeaderSearch: () => null,
}));
vi.mock("@/components/gamification/game-profile-bar", () => ({
  GameProfileBar: () => null,
}));
vi.mock("@/components/gamification/vibe-tap-mini-game", () => ({
  VibeTapMiniGame: () => null,
}));
vi.mock("@/components/layout/navbar-circuit-markers", () => ({
  CircuitPill: () => null,
  PILL_CONFIGS: { nav: {}, actions: {} },
}));
vi.mock("@/lib/gamification/release-context", () => ({
  useGamificationReleaseSummary: () => ({ hasRewardedSurface: false }),
  useGamificationSurface: () => ({ persistentRewardsEnabled: false }),
}));

function getDesktopNav() {
  return screen.getByRole("navigation", {
    name: "Navigazione principale",
  });
}

function getHeaderElement() {
  const header = document.querySelector("header");
  if (!header) {
    throw new Error("header non renderizzato");
  }
  return header;
}

function openMobileMenu() {
  fireEvent.click(screen.getByRole("button", { name: "Apri menu" }));
  const panel = document.getElementById("mobile-site-menu");
  if (!panel) {
    throw new Error("menu mobile non aperto");
  }
  return panel;
}

function getMobileNavLinks(panel: HTMLElement) {
  return Array.from(
    panel.querySelectorAll<HTMLAnchorElement>('[data-sonic-action="nav"]'),
  );
}

describe("B29 SiteHeaderV2 — registry canonico", () => {
  beforeEach(() => {
    pathnameState.current = "/archivio";
    useMobileUIStore.setState({ isOverlayOpen: false });
    accountState.current = {
      authEnabled: true,
      status: "guest",
      isAttaching: false,
      workspaceAttachPending: false,
    };
    headerFlagState.current = true;
  });

  afterEach(() => {
    cleanup();
  });

  it("desktop nav: 5 destinazioni primarie dal registry, senza Shop/Community", () => {
    render(<SiteHeaderV2 />);

    const links = within(getDesktopNav()).getAllByRole("link");
    expect(links).toHaveLength(5);
    expect(links.map((link) => link.textContent)).toEqual([
      "Home",
      "Catalogo",
      "Radar",
      "Confronto",
      "Salvati",
    ]);
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "/",
      "/archivio",
      "/radar",
      "/compare",
      "/shortlist",
    ]);
  });

  it("active route desktop: aria-current=page solo su Catalogo", () => {
    render(<SiteHeaderV2 />);

    const links = within(getDesktopNav()).getAllByRole("link");
    expect(
      links.map((link) => link.getAttribute("aria-current") ?? "none"),
    ).toEqual(["none", "page", "none", "none", "none"]);
  });

  it("menu mobile: tutte le 7 destinazioni del registry incluse Shop e Community", () => {
    render(<SiteHeaderV2 />);

    const panel = openMobileMenu();
    const links = getMobileNavLinks(panel);
    expect(links.map((link) => link.textContent)).toEqual([
      "Home",
      "Catalogo",
      "Radar",
      "Confronto",
      "Salvati",
      "Shop",
      "Community",
    ]);
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "/",
      "/archivio",
      "/radar",
      "/compare",
      "/shortlist",
      "/shop",
      "/community",
    ]);
    expect(
      links.map((link) => link.getAttribute("aria-current") ?? "none"),
    ).toEqual(["none", "page", "none", "none", "none", "none", "none"]);
  });

  it("contract B22 preservato: data-overlay-open riflette l'apertura del menu", () => {
    render(<SiteHeaderV2 />);

    expect(getHeaderElement().getAttribute("data-overlay-open")).toBeNull();

    openMobileMenu();
    expect(getHeaderElement().getAttribute("data-overlay-open")).toBe("true");

    fireEvent.click(screen.getAllByRole("button", { name: "Chiudi menu" })[0]);
    expect(getHeaderElement().getAttribute("data-overlay-open")).toBeNull();
  });

  it("feature flag: Shop con flag OFF non renderizzata nel menu mobile", () => {
    const release = resolveNavigationRelease({
      TOOOLVIBES_NAV_SHOP_ENABLED: "0",
    });

    render(
      <NavigationReleaseProvider value={release}>
        <SiteHeaderV2 />
      </NavigationReleaseProvider>,
    );

    const panel = openMobileMenu();
    const links = getMobileNavLinks(panel);
    expect(links.map((link) => link.textContent)).toEqual([
      "Home",
      "Catalogo",
      "Radar",
      "Confronto",
      "Salvati",
      "Community",
    ]);
    expect(panel.textContent).not.toContain("Shop");
  });

  it("CTA account guest (B30): Accedi / Registrati verso /account#account-upgrade", () => {
    render(<SiteHeaderV2 />);

    const ctas = screen.getAllByRole("link", { name: /Accedi \/ Registrati/ });
    expect(ctas.length).toBeGreaterThan(0);
    for (const cta of ctas) {
      expect(cta.getAttribute("href")).toBe("/account#account-upgrade");
      expect(cta.getAttribute("data-account-state")).toBe("guest");
    }
  });
});

describe("B30 SiteHeaderV2 — header account-aware (IA-502)", () => {
  const guestAccount = {
    authEnabled: true,
    status: "guest",
    isAttaching: false,
    workspaceAttachPending: false,
  };

  function setAccount(overrides: Partial<typeof guestAccount>) {
    accountState.current = { ...guestAccount, ...overrides };
  }

  function getDesktopCta() {
    return document.querySelector<HTMLAnchorElement>(
      ".site-header-v2__primary-action",
    );
  }

  function getMobileCta(panel: HTMLElement) {
    return panel.querySelector<HTMLAnchorElement>(
      ".site-header-v2__mobile-primary",
    );
  }

  beforeEach(() => {
    pathnameState.current = "/archivio";
    useMobileUIStore.setState({ isOverlayOpen: false });
    headerFlagState.current = true;
    setAccount({});
  });

  afterEach(() => {
    cleanup();
  });

  it("guest: CTA Accedi / Registrati su desktop e menu mobile, stato guest", () => {
    render(<SiteHeaderV2 />);

    const desktopCta = getDesktopCta();
    expect(desktopCta).not.toBeNull();
    expect(desktopCta?.getAttribute("href")).toBe("/account#account-upgrade");
    expect(desktopCta?.getAttribute("data-account-state")).toBe("guest");
    expect(desktopCta?.textContent).toContain("Accedi / Registrati");

    const panel = openMobileMenu();
    const mobileCta = getMobileCta(panel);
    expect(mobileCta?.getAttribute("href")).toBe("/account#account-upgrade");
    expect(mobileCta?.getAttribute("data-account-state")).toBe("guest");
    expect(mobileCta?.textContent).toContain("Accedi / Registrati");
  });

  it("authenticated: una sola CTA Il tuo account verso /account, niente copy guest", () => {
    setAccount({ status: "authenticated" });
    render(<SiteHeaderV2 />);

    const desktopCta = getDesktopCta();
    expect(desktopCta?.getAttribute("href")).toBe("/account");
    expect(desktopCta?.getAttribute("data-account-state")).toBe(
      "authenticated",
    );
    expect(desktopCta?.textContent).toContain("Il tuo account");
    expect(desktopCta?.textContent).not.toContain("Accedi");

    const panel = openMobileMenu();
    const mobileCta = getMobileCta(panel);
    expect(mobileCta?.getAttribute("href")).toBe("/account");
    expect(mobileCta?.getAttribute("data-account-state")).toBe(
      "authenticated",
    );
  });

  it("loading: copy neutra Account con aria-busy, NON lampeggia guest", () => {
    setAccount({ status: "loading" });
    render(<SiteHeaderV2 />);

    const desktopCta = getDesktopCta();
    expect(desktopCta).not.toBeNull();
    expect(desktopCta?.getAttribute("data-account-state")).toBe("loading");
    expect(desktopCta?.getAttribute("aria-busy")).toBe("true");
    expect(desktopCta?.textContent).not.toContain("Accedi");
    expect(desktopCta?.textContent).not.toContain("Registrati");
  });

  it("sync in corso: stato syncing con CTA unica invariata", () => {
    setAccount({ status: "authenticated", workspaceAttachPending: true });
    render(<SiteHeaderV2 />);

    const desktopCta = getDesktopCta();
    expect(desktopCta?.getAttribute("data-account-state")).toBe("syncing");
    expect(desktopCta?.getAttribute("aria-busy")).toBe("true");
    expect(desktopCta?.getAttribute("href")).toBe("/account");
    expect(desktopCta?.textContent).toContain("Il tuo account");
  });

  it("auth non disponibile: nessuna CTA account (niente copy promozionale falso)", () => {
    setAccount({ authEnabled: false, status: "unavailable" });
    render(<SiteHeaderV2 />);

    expect(getDesktopCta()).toBeNull();

    const panel = openMobileMenu();
    expect(getMobileCta(panel)).toBeNull();
    expect(panel.textContent).not.toContain("Accedi / Registrati");
  });

  it("copy guest/auth identica su ogni route (parità di surface)", () => {
    for (const pathname of ["/", "/archivio", "/compare", "/shortlist"]) {
      pathnameState.current = pathname;

      setAccount({ status: "guest" });
      const { unmount } = render(<SiteHeaderV2 />);
      expect(getDesktopCta()?.textContent).toContain("Accedi / Registrati");
      expect(getDesktopCta()?.getAttribute("href")).toBe(
        "/account#account-upgrade",
      );
      unmount();

      setAccount({ status: "authenticated" });
      const { unmount: unmountAuth } = render(<SiteHeaderV2 />);
      expect(getDesktopCta()?.textContent).toContain("Il tuo account");
      expect(getDesktopCta()?.getAttribute("href")).toBe("/account");
      unmountAuth();
    }
  });

  it("release flag OFF: adapter legacy statico anche con sessione attiva", () => {
    headerFlagState.current = false;
    setAccount({ status: "authenticated" });
    render(<SiteHeaderV2 />);

    const desktopCta = getDesktopCta();
    expect(desktopCta?.getAttribute("data-account-state")).toBe("legacy");
    expect(desktopCta?.getAttribute("href")).toBe("/account#account-upgrade");
    expect(desktopCta?.textContent).toContain("Accedi / Registrati");
  });
});
