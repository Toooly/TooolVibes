// @vitest-environment jsdom

import { createElement } from "react";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const pathnameState = vi.hoisted(() => ({ current: "/archivio" }));

vi.mock("@/lib/motion/use-once-in-view", () => ({
  useOnceInView: () => ({ ref: { current: null }, hasBeenVisible: true, preferReducedMotion: true }),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => pathnameState.current,
}));

import { SiteFooterV2 } from "@/components/layout/site-footer-v2";
import { AdvertisingConsentProvider } from "@/components/ads/advertising-consent-provider";
import { NavigationReleaseProvider } from "@/lib/navigation/navigation-release-context";
import { resolveNavigationRelease } from "@/lib/navigation/release";

/* Brand logo mock: l'identità visiva non è sotto test. */
vi.mock("@/components/layout/brand-logo", () => ({
  BrandLogo: () => createElement("span", { "data-testid": "brand-logo" }),
}));

afterEach(() => {
  pathnameState.current = "/archivio";
  cleanup();
});

function stubMatchMedia(matchesDesktop: boolean) {
  window.matchMedia = ((query: string) => {
    const matches = query.includes("min-width: 48rem") ? matchesDesktop : false;
    return {
      matches,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    };
  }) as typeof window.matchMedia;
}

function getNavGroup(heading: string) {
  const title = screen.getByRole("heading", { name: heading });
  const group = title.closest("details");
  if (!(group instanceof HTMLDetailsElement)) {
    throw new Error(`gruppo ${heading} non trovato`);
  }
  return group;
}

function getColumnLinks(heading: string) {
  const group = getNavGroup(heading);
  group.open = true;
  return within(group).getAllByRole("link");
}

describe("B29 SiteFooterV2 — registry canonico", () => {
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
      .getAllByRole("link", { hidden: true })
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

describe("SiteFooterV2 — mobile disclosure", () => {
  it("collapses Prodotto and TooolVibes on small screens without hiding legal or contact", () => {
    stubMatchMedia(false);

    render(
      <AdvertisingConsentProvider>
        <SiteFooterV2 />
      </AdvertisingConsentProvider>,
    );

    expect(getNavGroup("Prodotto").open).toBe(false);
    expect(getNavGroup("TooolVibes").open).toBe(false);

    expect(screen.getByRole("link", { name: "TOOOLVIBES" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Parliamone" })).toBeTruthy();
    expect(screen.getByRole("link", { name: /Scrivici/ })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Privacy" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Termini" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Cookie" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Gestisci preferenze" })).toBeTruthy();
    expect(screen.getByText(/link affiliati/i)).toBeTruthy();
  });

  it("keeps Prodotto and TooolVibes open at the desktop breakpoint", () => {
    stubMatchMedia(true);

    render(
      <AdvertisingConsentProvider>
        <SiteFooterV2 />
      </AdvertisingConsentProvider>,
    );

    expect(getNavGroup("Prodotto").open).toBe(true);
    expect(getNavGroup("TooolVibes").open).toBe(true);
    expect(getColumnLinks("Prodotto")).toHaveLength(8);
    expect(getColumnLinks("TooolVibes")).toHaveLength(5);
  });
});


describe("SiteFooterV2 — Home launchpad", () => {
  it("renders destination tiles and progressive affiliate disclosure", () => {
    pathnameState.current = "/";
    render(
      <AdvertisingConsentProvider>
        <SiteFooterV2 />
      </AdvertisingConsentProvider>,
    );

    expect(screen.getByRole("heading", { name: "Dove vuoi andare adesso?" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Catalogo" }).getAttribute("href")).toBe("/archivio");
    expect(screen.getByRole("link", { name: "Radar" }).getAttribute("href")).toBe("/radar");
    expect(screen.getByRole("link", { name: "Raccolte" }).getAttribute("href")).toBe("/collections");
    expect(screen.getByRole("link", { name: "Guide" }).getAttribute("href")).toBe("/posts");
    expect(screen.getByRole("link", { name: "Confronto" }).getAttribute("href")).toBe("/compare");
    expect(screen.getByRole("link", { name: "Salvati" }).getAttribute("href")).toBe("/shortlist");
    expect(screen.getByRole("heading", { name: "Parliamone" })).toBeTruthy();
    expect(screen.getByRole("link", { name: /Scrivici/ }).getAttribute("href")).toBe(
      "mailto:hello@tooolvibes.com",
    );
    expect(screen.getByText("Trasparenza e affiliazioni")).toBeTruthy();
    expect(screen.getByText(/TOOOLVIBES ·/)).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "TooolVibes" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Chi siamo" })).toBeNull();
  });
});
