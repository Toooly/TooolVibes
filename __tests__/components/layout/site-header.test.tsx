// @vitest-environment jsdom

import { createElement } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SiteHeader } from "@/components/layout/site-header";
import { NavigationReleaseProvider } from "@/lib/navigation/navigation-release-context";
import { resolveNavigationRelease } from "@/lib/navigation/release";

/* Router mock minimo: l'header legacy legge solo usePathname. */
const { pathnameState } = vi.hoisted(() => ({
  pathnameState: { current: "/radar" as string },
}));

vi.mock("next/navigation", () => ({
  usePathname: () => pathnameState.current,
}));

/* Child component mock: identità visiva e search non sono sotto test. */
vi.mock("@/components/layout/brand-logo", () => ({
  BrandLogo: () => createElement("span", { "data-testid": "brand-logo" }),
}));
vi.mock("@/components/app/sound-toggle-button", () => ({
  SoundToggleButton: () => null,
}));
vi.mock("@/components/directory/directory-header-search", () => ({
  DirectoryHeaderSearch: () => null,
}));

function getPrimaryNavLinks(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll<HTMLAnchorElement>("nav a"),
  );
}

describe("B29 SiteHeader (legacy) — registry canonico", () => {
  beforeEach(() => {
    pathnameState.current = "/radar";
  });

  afterEach(() => {
    cleanup();
  });

  it("primaryNav dal registry con override label (Radar live) e href invariati", () => {
    const { container } = render(<SiteHeader />);

    const links = getPrimaryNavLinks(container);
    expect(links.map((link) => link.textContent)).toEqual([
      "Home",
      "Catalogo",
      "Radar live",
      "Suggerisci",
      "Diventa affiliato",
      "Shop",
      "Community",
    ]);
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "/",
      "/archivio",
      "/radar",
      "/shortlist#wishlist",
      "/affiliati",
      "/shop",
      "/community",
    ]);
  });

  it("active route: aria-current=page sulla voce attiva (Radar live)", () => {
    const { container } = render(<SiteHeader />);

    const links = getPrimaryNavLinks(container);
    expect(
      links.map((link) => link.getAttribute("aria-current") ?? "none"),
    ).toEqual(["none", "none", "page", "none", "none", "none", "none"]);
  });

  it("href con hash: Suggerisci attivo su /shortlist (matcher canonico)", () => {
    pathnameState.current = "/shortlist";
    const { container } = render(<SiteHeader />);

    const links = getPrimaryNavLinks(container);
    expect(
      links.map((link) => link.getAttribute("aria-current") ?? "none"),
    ).toEqual(["none", "none", "none", "page", "none", "none", "none"]);
  });

  it("CTA admin dal registry: label override Admin e href /admin/login", () => {
    render(<SiteHeader />);

    const adminLink = screen.getByRole("link", { name: "Admin" });
    expect(adminLink.getAttribute("href")).toBe("/admin/login");
  });

  it("feature flag: Shop con flag OFF non renderizzata nella primaryNav", () => {
    const release = resolveNavigationRelease({
      TOOOLVIBES_NAV_SHOP_ENABLED: "0",
    });

    const { container } = render(
      <NavigationReleaseProvider value={release}>
        <SiteHeader />
      </NavigationReleaseProvider>,
    );

    const links = getPrimaryNavLinks(container);
    expect(links.map((link) => link.textContent)).toEqual([
      "Home",
      "Catalogo",
      "Radar live",
      "Suggerisci",
      "Diventa affiliato",
      "Community",
    ]);
  });

  it("feature flag: admin-login con flag OFF rimuove la CTA Admin", () => {
    const release = resolveNavigationRelease({
      TOOOLVIBES_NAV_ADMIN_LOGIN_ENABLED: "0",
    });

    render(
      <NavigationReleaseProvider value={release}>
        <SiteHeader />
      </NavigationReleaseProvider>,
    );

    expect(screen.queryByRole("link", { name: "Admin" })).toBeNull();
  });

  it("CTA Suggerisci usa href canonico del registry", () => {
    render(<SiteHeader />);

    const suggestLinks = screen
      .getAllByRole("link", { name: /Suggerisci/ })
      .map((link) => link.getAttribute("href"));
    expect(suggestLinks.length).toBeGreaterThan(0);
    for (const href of suggestLinks) {
      expect(href).toBe("/shortlist#wishlist");
    }
  });
});
