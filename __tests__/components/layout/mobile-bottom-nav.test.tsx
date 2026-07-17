// @vitest-environment jsdom

import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { NavigationReleaseProvider } from "@/lib/navigation/navigation-release-context";
import { resolveNavigationRelease } from "@/lib/navigation/release";
import { useMobileUIStore } from "@/lib/stores/mobile-ui-store";

/* Router mock minimo: la bottom nav legge solo usePathname. */
const { pathnameState, compareCountState } = vi.hoisted(() => ({
  pathnameState: { current: "/" as string },
  compareCountState: { current: 0 as number },
}));

vi.mock("next/navigation", () => ({
  usePathname: () => pathnameState.current,
}));

/* Workspace store mock minimo: serve solo il conteggio compare per il badge. */
vi.mock("@/lib/stores/tool-workspace-store", () => ({
  useToolWorkspaceStore: (
    selector: (state: { compareSlugs: string[] }) => unknown,
  ) =>
    selector({
      compareSlugs: Array.from(
        { length: compareCountState.current },
        (_, index) => `tool-${index}`,
      ),
    }),
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
