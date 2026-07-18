// @vitest-environment jsdom

import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { NavigationReleaseProvider } from "@/lib/navigation/navigation-release-context";
import { resolveNavigationRelease } from "@/lib/navigation/release";
import { useMobileUIStore } from "@/lib/stores/mobile-ui-store";

/* Router mock minimo: la bottom nav legge solo usePathname. */
const { pathnameState, compareCountState, savedCountState, headerFlagState } =
  vi.hoisted(() => ({
    pathnameState: { current: "/" as string },
    compareCountState: { current: 0 as number },
    savedCountState: { current: 0 as number },
    headerFlagState: { current: true as boolean },
  }));

vi.mock("next/navigation", () => ({
  usePathname: () => pathnameState.current,
}));

/* Workspace store mock minimo: conteggi shortlist/compare per i badge. */
vi.mock("@/lib/stores/tool-workspace-store", () => ({
  useToolWorkspaceStore: (
    selector: (state: {
      savedSlugs: string[];
      compareSlugs: string[];
    }) => unknown,
  ) =>
    selector({
      savedSlugs: Array.from(
        { length: savedCountState.current },
        (_, index) => `saved-${index}`,
      ),
      compareSlugs: Array.from(
        { length: compareCountState.current },
        (_, index) => `compare-${index}`,
      ),
    }),
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

function renderBottomNav() {
  return render(<MobileBottomNav />);
}

function getBottomNav() {
  return screen.getByRole("navigation", {
    name: "Navigazione mobile principale",
  });
}

describe("B29 MobileBottomNav — registry canonico", () => {
  beforeEach(() => {
    pathnameState.current = "/";
    compareCountState.current = 0;
    savedCountState.current = 0;
    headerFlagState.current = true;
    useMobileUIStore.setState({ isOverlayOpen: false });
  });

  afterEach(() => {
    cleanup();
  });

  it("renderizza le 5 destinazioni del registry con ordine, label e href canonici", () => {
    renderBottomNav();

    const links = within(getBottomNav()).getAllByRole("link");
    expect(links).toHaveLength(5);
    expect(links.map((link) => link.textContent)).toEqual([
      "Home",
      "Catalogo",
      "Radar",
      "Salvati",
      "Confronto",
    ]);
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "/",
      "/archivio",
      "/radar",
      "/shortlist",
      "/compare",
    ]);
  });

  it("active route: solo la destinazione corrente ha aria-current=page", () => {
    pathnameState.current = "/radar";
    renderBottomNav();

    const links = within(getBottomNav()).getAllByRole("link");
    expect(
      links.map((link) => link.getAttribute("aria-current") ?? "none"),
    ).toEqual(["none", "none", "page", "none", "none"]);
  });

  it("active route sulla home non attiva le altre destinazioni", () => {
    renderBottomNav();

    const links = within(getBottomNav()).getAllByRole("link");
    expect(
      links.map((link) => link.getAttribute("aria-current") ?? "none"),
    ).toEqual(["page", "none", "none", "none", "none"]);
  });

  it("contract B22 preservato: z-token var(--tv-z-nav) sulla nav", () => {
    renderBottomNav();
    expect(getBottomNav().className).toContain("z-[var(--tv-z-nav)]");
  });

  it("badge compare: conteggio dal workspace store sul link Confronto", () => {
    compareCountState.current = 2;
    renderBottomNav();

    const compareLink = within(getBottomNav()).getByRole("link", {
      name: /Confronto/,
    });
    const badge = compareLink.querySelector(".mobile-bottom-link__badge");
    expect(badge).not.toBeNull();
    expect(badge?.textContent).toBe("2");
    expect(badge?.getAttribute("aria-label")).toBe("2 tool in confronto");
  });

  it("feature flag: destinazione con flag OFF non renderizzata", () => {
    const release = resolveNavigationRelease({
      TOOOLVIBES_NAV_COMPARE_ENABLED: "0",
    });

    render(
      <NavigationReleaseProvider value={release}>
        <MobileBottomNav />
      </NavigationReleaseProvider>,
    );

    const links = within(getBottomNav()).getAllByRole("link");
    expect(links).toHaveLength(4);
    expect(links.map((link) => link.textContent)).toEqual([
      "Home",
      "Catalogo",
      "Radar",
      "Salvati",
    ]);
    expect(
      within(getBottomNav()).queryByRole("link", { name: /Confronto/ }),
    ).toBeNull();
  });

  it("route admin: la bottom nav non viene renderizzata (comportamento invariato)", () => {
    pathnameState.current = "/admin";
    const { container } = renderBottomNav();
    expect(container.firstChild).toBeNull();
    expect(screen.queryByRole("navigation")).toBeNull();
  });
});

describe("B30 MobileBottomNav — conteggi workspace canonici (IA-502)", () => {
  beforeEach(() => {
    pathnameState.current = "/";
    compareCountState.current = 0;
    savedCountState.current = 0;
    headerFlagState.current = true;
    useMobileUIStore.setState({ isOverlayOpen: false });
  });

  afterEach(() => {
    cleanup();
  });

  it("badge Salvati: conteggio shortlist dal workspace store canonico", () => {
    savedCountState.current = 3;
    renderBottomNav();

    const shortlistLink = within(getBottomNav()).getByRole("link", {
      name: /Salvati/,
    });
    const badge = shortlistLink.querySelector(".mobile-bottom-link__badge");
    expect(badge).not.toBeNull();
    expect(badge?.textContent).toBe("3");
    expect(badge?.getAttribute("aria-label")).toBe("3 tool salvati");
  });

  it("badge shortlist/compare coerenti su ogni route", () => {
    savedCountState.current = 2;
    compareCountState.current = 1;

    for (const pathname of ["/", "/archivio", "/compare", "/shortlist"]) {
      pathnameState.current = pathname;
      const { unmount } = renderBottomNav();

      const shortlistLink = within(getBottomNav()).getByRole("link", {
        name: /Salvati/,
      });
      const compareLink = within(getBottomNav()).getByRole("link", {
        name: /Confronto/,
      });
      expect(
        shortlistLink.querySelector(".mobile-bottom-link__badge")
          ?.textContent,
      ).toBe("2");
      expect(
        compareLink.querySelector(".mobile-bottom-link__badge")?.textContent,
      ).toBe("1");
      unmount();
    }
  });

  it("tab sync: i badge si aggiornano quando lo store workspace cambia", () => {
    savedCountState.current = 1;
    compareCountState.current = 1;
    const { rerender } = render(
      <MobileBottomNav />,
    );

    expect(
      within(getBottomNav())
        .getByRole("link", { name: /Salvati/ })
        .querySelector(".mobile-bottom-link__badge")?.textContent,
    ).toBe("1");

    // Il persistence provider riallinea lo store su DISCOVERY_SYNC_EVENT
    // (cross-tab): qui simuliamo lo stato già riallineato e verifichiamo che
    // i selector dei badge reagiscano senza ricaricare la route.
    savedCountState.current = 4;
    compareCountState.current = 2;
    rerender(<MobileBottomNav />);

    expect(
      within(getBottomNav())
        .getByRole("link", { name: /Salvati/ })
        .querySelector(".mobile-bottom-link__badge")?.textContent,
    ).toBe("4");
    expect(
      within(getBottomNav())
        .getByRole("link", { name: /Confronto/ })
        .querySelector(".mobile-bottom-link__badge")?.textContent,
    ).toBe("2");
  });

  it("release flag OFF: adapter legacy, badge compare senza badge salvati", () => {
    headerFlagState.current = false;
    savedCountState.current = 3;
    compareCountState.current = 2;
    renderBottomNav();

    const shortlistLink = within(getBottomNav()).getByRole("link", {
      name: /Salvati/,
    });
    expect(
      shortlistLink.querySelector(".mobile-bottom-link__badge"),
    ).toBeNull();

    const compareLink = within(getBottomNav()).getByRole("link", {
      name: /Confronto/,
    });
    expect(
      compareLink.querySelector(".mobile-bottom-link__badge")?.textContent,
    ).toBe("2");
  });
});
