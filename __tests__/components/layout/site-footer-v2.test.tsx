// @vitest-environment jsdom

import { createElement } from "react";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SiteFooterV2 } from "@/components/layout/site-footer-v2";
import { NavigationReleaseProvider } from "@/lib/navigation/navigation-release-context";
import { resolveNavigationRelease } from "@/lib/navigation/release";

/* Brand logo mock: l'identità visiva non è sotto test. */
vi.mock("@/components/layout/brand-logo", () => ({
  BrandLogo: () => createElement("span", { "data-testid": "brand-logo" }),
}));

afterEach(() => {
  cleanup();
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
