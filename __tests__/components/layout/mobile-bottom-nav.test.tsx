// @vitest-environment jsdom

import fs from "node:fs";
import path from "node:path";

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
      "Raccolte",
      "Salvati",
    ]);
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "/",
      "/archivio",
      "/radar",
      "/collections",
      "/shortlist",
    ]);
  });

  it("active route: solo la destinazione corrente ha aria-current=page", () => {
    pathnameState.current = "/collections";
    renderBottomNav();

    const links = within(getBottomNav()).getAllByRole("link");
    expect(
      links.map((link) => link.getAttribute("aria-current") ?? "none"),
    ).toEqual(["none", "none", "none", "page", "none"]);
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
    expect(getBottomNav().closest(".mobile-bottom-shell")).not.toBeNull();

    const css = fs.readFileSync(
      path.join(process.cwd(), "styles/mobile-bottom-nav.css"),
      "utf8",
    );
    const shellRule = css.match(/\.mobile-bottom-shell\s*\{([^}]+)\}/)?.[1];
    expect(shellRule).toContain("position: fixed");
    expect(shellRule).toContain("z-index: var(--tv-z-nav)");
  });

  it("badge compare: Confronto non è più una tab; Salvati resta badgato", () => {
    compareCountState.current = 2;
    savedCountState.current = 1;
    renderBottomNav();

    expect(
      within(getBottomNav()).queryByRole("link", { name: /Confronto/ }),
    ).toBeNull();
    const shortlistLink = within(getBottomNav()).getByRole("link", {
      name: /Salvati/,
    });
    expect(shortlistLink.querySelector(".mobile-bottom-item__badge")?.textContent).toBe("1");
  });

  it("feature flag: destinazione con flag OFF non renderizzata", () => {
    const release = resolveNavigationRelease({
      TOOOLVIBES_NAV_SHORTLIST_ENABLED: "0",
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
      "Raccolte",
    ]);
    expect(
      within(getBottomNav()).queryByRole("link", { name: /Salvati/ }),
    ).toBeNull();
  });

  it("route admin: la bottom nav non viene renderizzata (comportamento invariato)", () => {
    pathnameState.current = "/admin";
    const { container } = renderBottomNav();
    expect(container.firstChild).toBeNull();
    expect(screen.queryByRole("navigation")).toBeNull();
  });

  it("SHELL-07 account keeps the same 5-destination mobile nav", () => {
    pathnameState.current = "/account";
    renderBottomNav();
    const links = within(getBottomNav()).getAllByRole("link");
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "/",
      "/archivio",
      "/radar",
      "/collections",
      "/shortlist",
    ]);
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
    const badge = shortlistLink.querySelector(".mobile-bottom-item__badge");
    expect(badge).not.toBeNull();
    expect(badge?.textContent).toBe("3");
    expect(badge?.getAttribute("aria-label")).toBe("3 tool salvati");
  });

  it("badge shortlist coerente su ogni route", () => {
    savedCountState.current = 2;
    compareCountState.current = 1;

    for (const pathname of ["/", "/archivio", "/collections", "/shortlist"]) {
      pathnameState.current = pathname;
      const { unmount } = renderBottomNav();

      const shortlistLink = within(getBottomNav()).getByRole("link", {
        name: /Salvati/,
      });
      expect(
        shortlistLink.querySelector(".mobile-bottom-item__badge")
          ?.textContent,
      ).toBe("2");
      expect(
        within(getBottomNav()).queryByRole("link", { name: /Confronto/ }),
      ).toBeNull();
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
        .querySelector(".mobile-bottom-item__badge")?.textContent,
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
        .querySelector(".mobile-bottom-item__badge")?.textContent,
    ).toBe("4");
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
      shortlistLink.querySelector(".mobile-bottom-item__badge"),
    ).toBeNull();

    expect(
      within(getBottomNav()).queryByRole("link", { name: /Confronto/ }),
    ).toBeNull();
  });
});

describe("B37 MobileBottomNav — geometria shell unica (MOB-701)", () => {
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

  it("geometria: la nav espone le classi del contract shell token-driven", () => {
    renderBottomNav();

    const nav = getBottomNav();
    expect(nav.className).toContain("mobile-bottom-motion");
    expect(nav.className).toContain("mobile-bottom-shell__inner");
    expect(nav.className).not.toContain("site-mobile-footer-nav");

    const css = fs.readFileSync(
      path.join(process.cwd(), "styles/mobile-bottom-nav.css"),
      "utf8",
    );
    const gridRule = css.match(
      /\.mobile-bottom-shell__grid\s*\{([^}]+)\}/,
    )?.[1];
    expect(gridRule).toContain(
      "grid-template-columns: repeat(5, minmax(0, 1fr))",
    );
  });

  it("quinto item leggibile: griglia a 5 colonne con label completa Salvati", () => {
    savedCountState.current = 2;
    renderBottomNav();

    const grid = getBottomNav().querySelector(".mobile-bottom-shell__grid");
    expect(grid).toBeTruthy();
    expect(grid?.children).toHaveLength(5);

    const links = within(getBottomNav()).getAllByRole("link");
    expect(links).toHaveLength(5);
    const last = links[4];
    expect(last.textContent).toContain("Salvati");
    expect(
      last.querySelector(".mobile-bottom-item__label")?.textContent,
    ).toBe("Salvati");
    expect(
      last.querySelector(".mobile-bottom-item__badge")?.textContent,
    ).toBe("2");
  });

  it.each([320, 360, 390, 412, 430])(
    "viewport %ipx: 5 destinazioni e badge Salvati nel DOM",
    (width) => {
      window.innerWidth = width;
      window.innerHeight = 844;
      window.dispatchEvent(new Event("resize"));
      compareCountState.current = 1;
      savedCountState.current = 1;

      const { unmount } = renderBottomNav();
      const links = within(getBottomNav()).getAllByRole("link");
      expect(links).toHaveLength(5);
      expect(
        within(getBottomNav())
          .getByRole("link", { name: /Salvati/ })
          .querySelector(".mobile-bottom-item__badge")?.textContent,
      ).toBe("1");
      unmount();
    },
  );

  it.each([
    [390, 844],
    [844, 390],
  ])(
    "orientation %ix%i: struttura nav invariata",
    (width, height) => {
      window.innerWidth = width;
      window.innerHeight = height;
      window.dispatchEvent(new Event("resize"));

      const { unmount } = renderBottomNav();
      expect(within(getBottomNav()).getAllByRole("link")).toHaveLength(5);
      unmount();
    },
  );

  it("overlay mobile aperto: la nav esce dal flusso touch (opacity-0 + pointer-events-none)", () => {
    const { rerender } = render(<MobileBottomNav />);
    expect(getBottomNav().className).not.toContain("opacity-0");

    useMobileUIStore.setState({ isOverlayOpen: true });
    rerender(<MobileBottomNav />);
    expect(getBottomNav().className).toContain("opacity-0");
    expect(getBottomNav().className).toContain("pointer-events-none");

    useMobileUIStore.setState({ isOverlayOpen: false });
    rerender(<MobileBottomNav />);
    expect(getBottomNav().className).not.toContain("opacity-0");
  });
});
