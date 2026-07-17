// @vitest-environment jsdom

import { createElement } from "react";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteFooterV2 } from "@/components/layout/site-footer-v2";
import { NavigationReleaseProvider } from "@/lib/navigation/navigation-release-context";
import { resolveNavigationRelease } from "@/lib/navigation/release";
import { siteConfig } from "@/lib/config/site";

/* Brand logo mock: l'identità visiva non è sotto test. */
vi.mock("@/components/layout/brand-logo", () => ({
  BrandLogo: () => createElement("span", { "data-testid": "brand-logo" }),
}));

afterEach(() => {
  cleanup();
});

describe("B29 SiteFooter (legacy) — registry canonico", () => {
  it("footerNav dal registry: 9 destinazioni ordinate con override (Categorie, Shop digitale)", () => {
    const { container } = render(<SiteFooter />);

    const accordions = container.querySelectorAll("details");
    expect(accordions.length).toBeGreaterThanOrEqual(2);

    const navLinks = within(
      accordions[0] as HTMLElement,
    ).getAllByRole("link");
    expect(navLinks.map((link) => link.textContent)).toEqual([
      "Home",
      "Catalogo",
      "Categorie",
      "Suggerisci",
      "Diventa affiliato",
      "Radar",
      "Community",
      "Shop digitale",
      "Login amministratore",
    ]);
    expect(navLinks.map((link) => link.getAttribute("href"))).toEqual([
      "/",
      "/archivio",
      "/tags",
      "/shortlist#wishlist",
      "/affiliati",
      "/radar",
      "/community",
      "/shop",
      "/admin/login",
    ]);
  });

  it("categoryNav dal registry: 6 facet /archivio?group=* ordinate", () => {
    const { container } = render(<SiteFooter />);

    const accordions = container.querySelectorAll("details");
    const categoryLinks = within(
      accordions[1] as HTMLElement,
    ).getAllByRole("link");
    expect(categoryLinks.map((link) => link.textContent)).toEqual([
      "Vibe coding",
      "Builder app AI",
      "No-code",
      "Automazioni",
      "Agenti AI",
      "Video AI",
    ]);
    expect(categoryLinks.map((link) => link.getAttribute("href"))).toEqual([
      "/archivio?group=vibe-coding",
      "/archivio?group=ai-app-builder",
      "/archivio?group=no-code",
      "/archivio?group=automation",
      "/archivio?group=ai-agents",
      "/archivio?group=ai-video",
    ]);
  });

  it("meta bar dal registry: override Product Hunt→/radar e Archivio→/archivio, Shop esterno", () => {
    render(<SiteFooter />);

    const productHunt = screen.getByRole("link", { name: "Product Hunt" });
    expect(productHunt.getAttribute("href")).toBe("/radar");

    const archivio = screen.getByRole("link", { name: "Archivio" });
    expect(archivio.getAttribute("href")).toBe("/archivio");

    const externalShop = screen.getByRole("link", { name: "Shop" });
    expect(externalShop.getAttribute("href")).toBe(siteConfig.shopUrl);
    expect(externalShop.getAttribute("target")).toBe("_blank");
    expect(externalShop.getAttribute("rel")).toContain("noopener");
  });

  it("CTA hero usano href canonici del registry", () => {
    render(<SiteFooter />);

    expect(
      screen
        .getByRole("link", { name: "Suggerisci un tool" })
        .getAttribute("href"),
    ).toBe("/shortlist#wishlist");

    const affiliatesLinks = screen.getAllByRole("link", {
      name: "Diventa affiliato",
    });
    expect(affiliatesLinks.length).toBeGreaterThan(0);
    for (const link of affiliatesLinks) {
      expect(link.getAttribute("href")).toBe("/affiliati");
    }

    expect(
      screen
        .getByRole("link", { name: "Apri lo shop digitale" })
        .getAttribute("href"),
    ).toBe(siteConfig.shopUrl);
  });
});

describe("B29 SiteFooterV2 — registry canonico", () => {
  function getColumnLinks(heading: string) {
    const title = screen.getByRole("heading", { name: heading });
    const column = title.parentElement;
    if (!column) {
      throw new Error(`colonna ${heading} non trovata`);
    }
    return within(column).getAllByRole("link");
  }

  it("explore/community/legal dal registry con label e href canonici", () => {
    render(<SiteFooterV2 />);

    const explore = getColumnLinks("Esplora");
    expect(explore.map((link) => link.textContent)).toEqual([
      "Catalogo",
      "Radar",
      "Confronto",
      "Salvati",
    ]);
    expect(explore.map((link) => link.getAttribute("href"))).toEqual([
      "/archivio",
      "/radar",
      "/compare",
      "/shortlist",
    ]);

    const community = getColumnLinks("Community");
    expect(community.map((link) => link.textContent)).toEqual([
      "Chi siamo",
      "Shop",
      "Community",
      "Blog",
      "Affiliati",
    ]);
    expect(community.map((link) => link.getAttribute("href"))).toEqual([
      "/chi-siamo",
      "/shop",
      "/community",
      "/posts",
      "/affiliati",
    ]);

    const legalLinks = screen
      .getAllByRole("link")
      .filter((link) =>
        ["/privacy", "/termini", "/cookie"].includes(
          link.getAttribute("href") ?? "",
        ),
      );
    expect(legalLinks.map((link) => link.textContent)).toEqual([
      "Privacy",
      "Termini",
      "Cookie",
    ]);
  });

  it("contatto mailto dal registry: icona social e CTA newsletter", () => {
    render(<SiteFooterV2 />);

    const social = screen.getByRole("link", { name: "Email" });
    expect(social.getAttribute("href")).toBe("mailto:hello@tooolvibes.com");

    const cta = screen.getByRole("link", { name: /Scrivici/ });
    expect(cta.getAttribute("href")).toBe("mailto:hello@tooolvibes.com");
  });

  it("feature flag: Privacy con flag OFF non renderizzata nella colonna legal", () => {
    const release = resolveNavigationRelease({
      TOOOLVIBES_NAV_PRIVACY_ENABLED: "0",
    });

    render(
      <NavigationReleaseProvider value={release}>
        <SiteFooterV2 />
      </NavigationReleaseProvider>,
    );

    const legalHrefs = screen
      .getAllByRole("link")
      .map((link) => link.getAttribute("href"));
    expect(legalHrefs).toContain("/termini");
    expect(legalHrefs).toContain("/cookie");
    expect(legalHrefs).not.toContain("/privacy");
  });
});
