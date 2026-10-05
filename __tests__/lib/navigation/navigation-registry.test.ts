import { existsSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { navigationRegistry } from "@/lib/navigation/destinations";
import {
  NavigationReleaseConfigError,
  navReleaseFlagRegistry,
  resolveNavigationRelease,
} from "@/lib/navigation/release";
import {
  getNavDestination,
  getNavDestinationForPathname,
  getNavItemsForSurface,
  isNavRouteActive,
} from "@/lib/navigation/selectors";
import {
  NAV_AUDIENCES,
  NAV_SCOPES,
  NAV_SURFACES,
  type NavSurface,
} from "@/lib/navigation/types";

const EXPECTED_SURFACE_INVENTORY: Readonly<
  Record<NavSurface, ReadonlyArray<readonly [string, string]>>
> = {
  "header-v2-desktop": [
    ["Home", "/"],
    ["Catalogo", "/archivio"],
    ["Raccolte", "/collections"],
    ["Salvati", "/shortlist"],
  ],
  "bottom-nav": [
    ["Home", "/"],
    ["Catalogo", "/archivio"],
    ["Radar", "/radar"],
    ["Raccolte", "/collections"],
    ["Salvati", "/shortlist"],
  ],
  "footer-v2-product": [
    ["Catalogo", "/archivio"],
    ["Radar", "/radar"],
    ["Confronto", "/compare"],
    ["Salvati", "/shortlist"],
    ["Raccolte", "/collections"],
    ["Guide", "/posts"],
    ["Metodo", "/metodo"],
    ["Contributi", "/contributi"],
  ],
  "footer-v2-company": [
    ["Chi siamo", "/chi-siamo"],
    ["Studio by TooolVibes", "/studio"],
    ["Shop", "/shop"],
    ["Affiliati", "/affiliati"],
    ["Sponsorizza", "/sponsorizza"],
  ],
  "footer-v2-legal": [
    ["Privacy", "/privacy"],
    ["Termini", "/termini"],
    ["Cookie", "/cookie"],
  ],
  "footer-v2-social": [["Email", "mailto:hello@tooolvibes.com"]],
};

function routeFileExists(routePath: string): boolean {
  const segments = routePath.split("/").filter(Boolean);
  const candidates = ["app/(marketing)", "app/(admin)", "app"];
  return candidates.some((base) =>
    existsSync(path.join(process.cwd(), base, ...segments, "page.tsx")),
  );
}

describe("V1 public navigation registry", () => {
  it("owns every public destination with one release flag and an explicit decision", () => {
    const ids = new Set<string>();
    const flags = new Set<string>();

    for (const destination of navigationRegistry) {
      expect(destination.id.trim().length).toBeGreaterThan(0);
      expect(ids.has(destination.id)).toBe(false);
      ids.add(destination.id);

      expect(destination.owner.trim().length).toBeGreaterThan(0);
      expect(NAV_AUDIENCES).toContain(destination.audience);
      expect(destination.kpi.trim().length).toBeGreaterThan(0);
      expect(NAV_SCOPES).toContain(destination.scope);
      expect(destination.scopeDecision.trim().length).toBeGreaterThan(0);
      expect(destination.label.trim().length).toBeGreaterThan(0);
      expect(destination.placements.length).toBeGreaterThan(0);

      expect(flags.has(destination.releaseFlag)).toBe(false);
      flags.add(destination.releaseFlag);
      expect(Object.hasOwn(navReleaseFlagRegistry, destination.releaseFlag)).toBe(true);
    }
  });

  it("uses the V1 public vocabulary and has no Community or external shop destination", () => {
    const labels = navigationRegistry.map((destination) => destination.label);
    expect(labels).toEqual(expect.arrayContaining([
      "Catalogo",
      "Radar",
      "Confronto",
      "Salvati",
      "Raccolte",
      "Guide",
      "Contributi",
      "Studio by TooolVibes",
      "Sponsorizza",
    ]));
    expect(navigationRegistry.map((destination) => destination.id)).not.toContain("community");
    expect(navigationRegistry.map((destination) => destination.href)).not.toContain("/community");
    expect(navigationRegistry.find((destination) => destination.id === "shop")).toMatchObject({
      kind: "route",
      href: "/shop",
    });
  });

  it("keeps placement order consecutive on every public surface", () => {
    for (const surface of NAV_SURFACES) {
      const orders = navigationRegistry
        .flatMap((destination) => destination.placements)
        .filter((placement) => placement.surface === surface)
        .map((placement) => placement.order)
        .sort((left, right) => left - right);
      expect(orders).toEqual(orders.map((_, index) => index));
    }
  });

  it("resolves the exact V1 public shell inventory", () => {
    for (const surface of NAV_SURFACES) {
      const actual = getNavItemsForSurface(surface).map(
        (item) => [item.label, item.href] as const,
      );
      expect(actual, `surface ${surface}`).toEqual(
        EXPECTED_SURFACE_INVENTORY[surface],
      );
    }
  });

  it("only includes route targets that exist", () => {
    const routable = navigationRegistry.filter(
      (destination) => destination.kind !== "external",
    );

    for (const destination of routable) {
      const routePath = destination.href.split("#")[0]?.split("?")[0] || "/";
      expect(routeFileExists(routePath), `${destination.id} must resolve to a page`).toBe(true);
    }
  });

  it("keeps primary routes compact and present in desktop and mobile navigation", () => {
    const primaryIds = navigationRegistry
      .filter((destination) => destination.scope === "primary")
      .map((destination) => destination.id);
    expect(primaryIds).toEqual([
      "home",
      "catalog",
      "collections",
      "shortlist",
      "radar",
    ]);

    // Every primary destination must be reachable from the mobile Bottom Nav.
    const bottomIds = getNavItemsForSurface("bottom-nav").map((item) => item.id);
    expect(new Set(bottomIds).size).toBe(bottomIds.length);
    expect(bottomIds).toEqual(expect.arrayContaining(primaryIds));

    // The desktop header exposes the subset of primary destinations that
    // declare a `header-v2-desktop` placement (Radar is Bottom Nav + footer).
    const headerIds = getNavItemsForSurface("header-v2-desktop").map((item) => item.id);
    expect(new Set(headerIds).size).toBe(headerIds.length);
    const headerPrimaries = navigationRegistry
      .filter(
        (destination) =>
          destination.scope === "primary" &&
          destination.placements.some(
            (placement) => placement.surface === "header-v2-desktop",
          ),
      )
      .map((destination) => destination.id);
    expect(headerIds).toEqual(expect.arrayContaining(headerPrimaries));
  });
});

describe("V1 public navigation release flags", () => {
  it("defaults every destination to enabled", () => {
    const release = resolveNavigationRelease({});
    for (const destination of navigationRegistry) {
      expect(release[destination.releaseFlag]).toBe(true);
    }
  });

  it("removes a secondary product destination without changing the rest of the footer", () => {
    const release = resolveNavigationRelease({
      TOOOLVIBES_NAV_CONTRIBUTIONS_ENABLED: "0",
    });
    const productItems = getNavItemsForSurface("footer-v2-product", release);

    expect(productItems.map((item) => item.id)).not.toContain("contributions");
    expect(productItems.map((item) => item.id)).toEqual([
      "catalog",
      "radar",
      "compare",
      "shortlist",
      "collections",
      "guides",
      "method",
    ]);
  });

  it("rejects non-boolean release flags", () => {
    expect(() =>
      resolveNavigationRelease({ TOOOLVIBES_NAV_STUDIO_ENABLED: "maybe" }),
    ).toThrow(NavigationReleaseConfigError);
  });
});

describe("V1 active navigation matcher", () => {
  it.each([
    ["/", "/", true],
    ["/archivio", "/archivio", true],
    ["/archivio/vibe", "/archivio", true],
    ["/toools/blink", "/archivio", true],
    ["/archiv", "/archivio", false],
    ["/shortlist", "/shortlist", true],
    ["/contributi", "/contributi", true],
    ["/studio", "/studio", true],
    ["/shop", "/shop", true],
    ["/sponsorizza", "/sponsorizza", true],
    ["/studio", "https://example.com", false],
  ])("pathname %s vs href %s -> %s", (pathname, href, expected) => {
    expect(isNavRouteActive(pathname, href)).toBe(expected);
  });

  it("looks up canonical destination labels", () => {
    expect(getNavDestination("guides").label).toBe("Guide");
    expect(getNavDestination("contributions").label).toBe("Contributi");
    expect(getNavDestination("studio").label).toBe("Studio by TooolVibes");
    expect(getNavDestination("sponsorizza").label).toBe("Sponsorizza");
  });

  it("resolves canonical labels for secondary paths", () => {
    expect(getNavDestinationForPathname("/collections/solo-founders")?.label).toBe("Raccolte");
    expect(getNavDestinationForPathname("/posts/guida")?.label).toBe("Guide");
    expect(getNavDestinationForPathname("/contributi")?.label).toBe("Contributi");
    expect(getNavDestinationForPathname("/sponsorizza")?.label).toBe("Sponsorizza");
    expect(getNavDestinationForPathname("/toools/blink")?.label).toBe("Catalogo");
    expect(getNavDestinationForPathname("/unknown")).toBeNull();
  });
});
