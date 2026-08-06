// @vitest-environment jsdom

import { createElement } from "react";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SiteFooterV2 } from "@/components/layout/site-footer-v2";
import { AdvertisingConsentProvider } from "@/components/ads/advertising-consent-provider";
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

  it("renders product, company and legal links from the canonical registry", () => {
    render(
      <AdvertisingConsentProvider>
        <SiteFooterV2 />
      </AdvertisingConsentProvider>,
    );

    const product = getColumnLinks("Prodotto");
    expect(product.map((link) => link.textContent)).toEqual([
      "Catalogo",
      "Radar",
      "Confronto",
      "Salvati",
      "Raccolte",
      "Guide",
      "Metodo",
      "Contributi",
    ]);
    expect(product.map((link) => link.getAttribute("href"))).toEqual([
      "/archivio",
      "/radar",
      "/compare",
      "/shortlist",
      "/collections",
      "/posts",
      "/metodo",
      "/contributi",
    ]);

    const company = getColumnLinks("TooolVibes");
    expect(company.map((link) => link.textContent)).toEqual([
      "Chi siamo",
      "Studio by TooolVibes",
      "Shop",
      "Affiliati",
      "Sponsorizza",
    ]);
    expect(company.map((link) => link.getAttribute("href"))).toEqual([
      "/chi-siamo",
      "/studio",
      "/shop",
      "/affiliati",
      "/sponsorizza",
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

  it("renders the single /sponsorizza link through the registry only", () => {
    render(
      <AdvertisingConsentProvider>
        <SiteFooterV2 />
      </AdvertisingConsentProvider>,
    );

    const sponsorLinks = screen
      .getAllByRole("link")
      .filter((link) => link.getAttribute("href") === "/sponsorizza");
    expect(sponsorLinks).toHaveLength(1);

    const company = getColumnLinks("TooolVibes");
    const companyHrefs = company.map((link) => link.getAttribute("href"));
    expect(companyHrefs.at(-1)).toBe("/sponsorizza");

    const product = getColumnLinks("Prodotto");
    expect(
      product.some((link) => link.getAttribute("href") === "/sponsorizza"),
    ).toBe(false);
  });

  it("contatto mailto dal registry: icona social e CTA newsletter", () => {
    render(
      <AdvertisingConsentProvider>
        <SiteFooterV2 />
      </AdvertisingConsentProvider>,
    );

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
        <AdvertisingConsentProvider>
          <SiteFooterV2 />
        </AdvertisingConsentProvider>
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
