// @vitest-environment jsdom

import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const pathnameState = vi.hoisted(() => ({ current: "/archivio" }));

vi.mock("next/navigation", () => ({
  usePathname: () => pathnameState.current,
}));

import { SiteFooterV2 } from "@/components/layout/site-footer-v2";
import { AdvertisingConsentProvider } from "@/components/ads/advertising-consent-provider";
import { NavigationReleaseProvider } from "@/lib/navigation/navigation-release-context";
import { resolveNavigationRelease } from "@/lib/navigation/release";

/* Brand logo mock: l'identità visiva non è sotto test. */
vi.mock("@/components/layout/brand-logo", () => ({
  BrandLogo: () => null,
}));

afterEach(() => {
  pathnameState.current = "/archivio";
  cleanup();
});

function getGroup(heading: string) {
  const title = screen.getByRole("heading", { name: heading });
  const group = title.closest(".tv-utility__group");
  if (!(group instanceof HTMLElement)) {
    throw new Error(`gruppo ${heading} non trovato`);
  }
  return group;
}

function getGroupLinks(heading: string) {
  return within(getGroup(heading)).getAllByRole("link");
}

describe("V3 utility footer — registry canonico (non-Home)", () => {
  it("renders product, company and legal links from the canonical registry", () => {
    render(
      <AdvertisingConsentProvider>
        <SiteFooterV2 />
      </AdvertisingConsentProvider>,
    );

    const product = getGroupLinks("Esplora");
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

    const company = getGroupLinks("TooolVibes");
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

    const companyHrefs = getGroupLinks("TooolVibes").map((link) =>
      link.getAttribute("href"),
    );
    expect(companyHrefs.at(-1)).toBe("/sponsorizza");

    expect(
      getGroupLinks("Esplora").some(
        (link) => link.getAttribute("href") === "/sponsorizza",
      ),
    ).toBe(false);
  });

  it("contatto mailto dal registry: azione compatta Scrivici", () => {
    render(
      <AdvertisingConsentProvider>
        <SiteFooterV2 />
      </AdvertisingConsentProvider>,
    );

    const cta = screen.getByRole("link", { name: /Scrivici/ });
    expect(cta.getAttribute("href")).toBe("mailto:hello@tooolvibes.com");
  });

  it("feature flag: Privacy con flag OFF non renderizzata nella riga legal", () => {
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

describe("V3 utility footer — architettura compatta", () => {
  it("niente accordion CMS: i gruppi nav sono visibili senza aprire details", () => {
    const { container } = render(
      <AdvertisingConsentProvider>
        <SiteFooterV2 />
      </AdvertisingConsentProvider>,
    );

    const expectedCounts: Record<string, number> = {
      Esplora: 8,
      TooolVibes: 5,
    };
    for (const [heading, count] of Object.entries(expectedCounts)) {
      const group = getGroup(heading);
      expect(group.closest("details")).toBeNull();
      expect(group.querySelectorAll("a")).toHaveLength(count);
    }

    // L'unico details è la disclosure progressiva affiliazioni.
    const details = container.querySelectorAll("details");
    expect(details).toHaveLength(1);
    expect(details[0].className).toContain("tv-utility__disclosure");
  });

  it("legal e consenso restano azioni visibili e raggiungibili", () => {
    render(
      <AdvertisingConsentProvider>
        <SiteFooterV2 />
      </AdvertisingConsentProvider>,
    );

    expect(screen.getByRole("link", { name: "Privacy" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Termini" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Cookie" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Gestisci preferenze" })).toBeTruthy();
    expect(screen.getByText("Trasparenza e affiliazioni")).toBeTruthy();
  });
});

describe("SiteFooterV2 — Home uses the utility footer", () => {
  it("renders Esplora/TooolVibes and not the launchpad title", () => {
    pathnameState.current = "/";
    render(
      <AdvertisingConsentProvider>
        <SiteFooterV2 />
      </AdvertisingConsentProvider>,
    );

    expect(screen.queryByRole("heading", { name: "Continua da qui." })).toBeNull();
    expect(screen.getByRole("heading", { name: "Esplora" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "TooolVibes" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Parliamone" })).toBeTruthy();
    expect(screen.getByRole("link", { name: /Scrivici/ }).getAttribute("href")).toBe(
      "mailto:hello@tooolvibes.com",
    );
    expect(screen.getByText("Trasparenza e affiliazioni")).toBeTruthy();
    expect(screen.getByText(/TOOOLVIBES ·/)).toBeTruthy();
    expect(screen.getByRole("link", { name: "Privacy" })).toBeTruthy();
  });
});

describe("SiteFooterV2 — exclusive variants", () => {
  it("home and non-home both render the utility footer", () => {
    pathnameState.current = "/";
    const home = render(
      <AdvertisingConsentProvider>
        <SiteFooterV2 />
      </AdvertisingConsentProvider>,
    );
    expect(home.container.querySelector("footer")?.className).toContain("tv-utility");
    expect(screen.queryByRole("heading", { name: "Continua da qui." })).toBeNull();
    expect(screen.getByRole("heading", { name: "Esplora" })).toBeTruthy();
    home.unmount();

    pathnameState.current = "/archivio";
    const inner = render(
      <AdvertisingConsentProvider>
        <SiteFooterV2 />
      </AdvertisingConsentProvider>,
    );
    expect(inner.container.querySelector("footer")?.className).toContain("tv-utility");
    expect(screen.queryByRole("heading", { name: "Continua da qui." })).toBeNull();
    expect(screen.getByRole("heading", { name: "Esplora" })).toBeTruthy();
  });
});
