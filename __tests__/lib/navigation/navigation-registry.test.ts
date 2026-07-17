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
  getNavItemsForSurface,
  isNavRouteActive,
} from "@/lib/navigation/selectors";
import {
  NAV_AUDIENCES,
  NAV_SCOPES,
  NAV_SURFACES,
  type NavSurface,
} from "@/lib/navigation/types";
import { siteConfig } from "@/lib/config/site";

/**
 * BATCH 29 — Contract test del registry canonico di navigazione.
 *
 * Lo snapshot per surface qui sotto è l'INVENTARIO PRE-MIGRAZIONE copiato dai
 * consumer originali (header v2, header legacy, bottom nav, footer legacy,
 * footer v2): garantisce la reversibilità richiesta dal batch, cioè che la
 * config canonica riproduca esattamente l'IA esistente.
 */

const EXPECTED_SURFACE_INVENTORY: Readonly<
  Record<NavSurface, ReadonlyArray<readonly [string, string]>>
> = {
  "header-v2-desktop": [
    ["Home", "/"],
    ["Catalogo", "/archivio"],
    ["Radar", "/radar"],
    ["Confronto", "/compare"],
    ["Salvati", "/shortlist"],
  ],
  "header-v2-mobile": [
    ["Home", "/"],
    ["Catalogo", "/archivio"],
    ["Radar", "/radar"],
    ["Confronto", "/compare"],
    ["Salvati", "/shortlist"],
    ["Shop", "/shop"],
    ["Community", "/community"],
  ],
  "header-legacy-nav": [
    ["Home", "/"],
    ["Catalogo", "/archivio"],
    ["Radar live", "/radar"],
    ["Suggerisci", "/shortlist#wishlist"],
    ["Diventa affiliato", "/affiliati"],
    ["Shop", "/shop"],
    ["Community", "/community"],
  ],
  "header-legacy-actions": [["Admin", "/admin/login"]],
  "bottom-nav": [
    ["Home", "/"],
    ["Catalogo", "/archivio"],
    ["Radar", "/radar"],
    ["Salvati", "/shortlist"],
    ["Confronto", "/compare"],
  ],
  "footer-nav": [
    ["Home", "/"],
    ["Catalogo", "/archivio"],
    ["Categorie", "/tags"],
    ["Suggerisci", "/shortlist#wishlist"],
    ["Diventa affiliato", "/affiliati"],
    ["Radar", "/radar"],
    ["Community", "/community"],
    ["Shop digitale", "/shop"],
    ["Login amministratore", "/admin/login"],
  ],
  "footer-categories": [
    ["Vibe coding", "/archivio?group=vibe-coding"],
    ["Builder app AI", "/archivio?group=ai-app-builder"],
    ["No-code", "/archivio?group=no-code"],
    ["Automazioni", "/archivio?group=automation"],
    ["Agenti AI", "/archivio?group=ai-agents"],
    ["Video AI", "/archivio?group=ai-video"],
  ],
  "footer-meta": [
    ["Shop", siteConfig.shopUrl],
    ["Product Hunt", "/radar"],
    ["Suggerisci", "/shortlist#wishlist"],
    ["Diventa affiliato", "/affiliati"],
    ["Archivio", "/archivio"],
  ],
  "footer-v2-explore": [
    ["Catalogo", "/archivio"],
    ["Radar", "/radar"],
    ["Confronto", "/compare"],
    ["Salvati", "/shortlist"],
  ],
  "footer-v2-community": [
    ["Chi siamo", "/chi-siamo"],
    ["Shop", "/shop"],
    ["Community", "/community"],
    ["Blog", "/posts"],
    ["Affiliati", "/affiliati"],
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

describe("B29 navigation registry — schema IA-501/IA-503", () => {
  it("ogni destinazione ha id, owner, audience, kpi, scope, release flag e decisione univoci", () => {
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
      expect(
        Object.hasOwn(navReleaseFlagRegistry, destination.releaseFlag),
      ).toBe(true);
    }
  });

  it("le env key dei release flag sono univoche e tutte di default ON (IA invariata)", () => {
    const envKeys = Object.values(navReleaseFlagRegistry).map(
      (definition) => definition.envKey,
    );
    expect(new Set(envKeys).size).toBe(envKeys.length);
    for (const definition of Object.values(navReleaseFlagRegistry)) {
      expect(definition.defaultEnabled).toBe(true);
      expect(definition.envKey).toMatch(/^TOOOLVIBES_NAV_[A-Z0-9_]+_ENABLED$/);
    }
  });

  it("gli order di placement sono univoci e consecutivi per ogni surface", () => {
    for (const surface of NAV_SURFACES) {
      const orders = navigationRegistry
        .flatMap((destination) => destination.placements)
        .filter((placement) => placement.surface === surface)
        .map((placement) => placement.order)
        .sort((a, b) => a - b);
      expect(orders).toEqual(orders.map((_, index) => index));
    }
  });

  it("label canoniche univoche per le destinazioni primarie (Catalogo/Salvati/Confronto)", () => {
    expect(getNavDestination("catalog").label).toBe("Catalogo");
    expect(getNavDestination("shortlist").label).toBe("Salvati");
    expect(getNavDestination("compare").label).toBe("Confronto");

    const primaryLabels = navigationRegistry
      .filter((destination) => destination.scope === "primary")
      .map((destination) => destination.label);
    expect(new Set(primaryLabels).size).toBe(primaryLabels.length);
  });

  it("decisione IA-503 esplicita per Community e Shop: keep secondary, proposta documentata non applicata", () => {
    for (const id of ["community", "shop"]) {
      const destination = getNavDestination(id);
      expect(destination.scope).toBe("secondary");
      expect(destination.scopeDecision).toContain("IA-503");
      expect(destination.scopeDecision).toContain("keep secondary");
      expect(destination.proposal).toBeDefined();
      expect(destination.proposal).toContain("NON applicata");
    }
  });
});

describe("B29 navigation registry — inventory e broken-link check", () => {
  it("ogni surface riproduce esattamente l'inventario pre-migrazione (label, href, ordine)", () => {
    for (const surface of NAV_SURFACES) {
      const items = getNavItemsForSurface(surface);
      const actual = items.map(
        (item) => [item.label, item.href] as const,
      );
      expect(actual, `surface ${surface}`).toEqual(
        EXPECTED_SURFACE_INVENTORY[surface],
      );
    }
  });

  it("ogni destinazione route/facet del registry risolve a una page esistente in app/", () => {
    const routable = navigationRegistry.filter(
      (destination) => destination.kind !== "external",
    );
    expect(routable.length).toBeGreaterThan(0);

    for (const destination of routable) {
      const routePath =
        destination.href.split("#")[0]?.split("?")[0] || "/";
      expect(
        routeFileExists(routePath),
        `${destination.id} (${destination.href}) deve risolvere a app/**/page.tsx`,
      ).toBe(true);
    }
  });

  it("le destinazioni external usano URL assoluti e restano fuori dal broken-link check", () => {
    const externals = navigationRegistry.filter(
      (destination) => destination.kind === "external",
    );
    expect(externals.length).toBeGreaterThan(0);
    for (const destination of externals) {
      expect(destination.href).toMatch(/^(https?:\/\/|mailto:)/);
    }
  });

  it("nessuna route primaria è duplicata o mancante dalle surface principali", () => {
    const primaryIds = navigationRegistry
      .filter((destination) => destination.scope === "primary")
      .map((destination) => destination.id);
    expect(primaryIds).toEqual([
      "home",
      "catalog",
      "radar",
      "compare",
      "shortlist",
    ]);

    for (const surface of [
      "header-v2-desktop",
      "header-v2-mobile",
      "bottom-nav",
    ] as const) {
      const ids = getNavItemsForSurface(surface).map((item) => item.id);
      expect(new Set(ids).size).toBe(ids.length);
      for (const primaryId of primaryIds) {
        expect(ids).toContain(primaryId);
      }
    }
  });
});

describe("B29 navigation release flags", () => {
  it("default: tutte le destinazioni abilitate (riproduce l'IA corrente)", () => {
    const release = resolveNavigationRelease({});
    for (const destination of navigationRegistry) {
      expect(release[destination.releaseFlag]).toBe(true);
    }
  });

  it("destinazione con flag OFF esclusa dai selector di ogni surface", () => {
    const release = resolveNavigationRelease({
      TOOOLVIBES_NAV_SHOP_ENABLED: "0",
    });

    for (const surface of NAV_SURFACES) {
      const items = getNavItemsForSurface(surface, release);
      expect(items.map((item) => item.id)).not.toContain("shop");
    }

    const mobile = getNavItemsForSurface("header-v2-mobile", release);
    expect(mobile).toHaveLength(6);
    expect(mobile.map((item) => item.id)).toEqual([
      "home",
      "catalog",
      "radar",
      "compare",
      "shortlist",
      "community",
    ]);
  });

  it("una flag OFF non influenza le altre destinazioni", () => {
    const release = resolveNavigationRelease({
      TOOOLVIBES_NAV_COMPARE_ENABLED: "off",
    });
    expect(release.compare).toBe(false);
    expect(release.shop).toBe(true);
    expect(release.community).toBe(true);

    const bottomNav = getNavItemsForSurface("bottom-nav", release);
    expect(bottomNav.map((item) => item.id)).toEqual([
      "home",
      "catalog",
      "radar",
      "shortlist",
    ]);
  });

  it("valori non booleani generano NavigationReleaseConfigError", () => {
    expect(() =>
      resolveNavigationRelease({ TOOOLVIBES_NAV_SHOP_ENABLED: "maybe" }),
    ).toThrow(NavigationReleaseConfigError);
  });
});

describe("B29 isNavRouteActive — matcher attivo canonico", () => {
  it.each([
    ["/", "/", true],
    ["/archivio", "/", false],
    ["/archivio", "/archivio", true],
    ["/archivio/vibe", "/archivio", true],
    ["/archiv", "/archivio", false],
    ["/radar", "/radar", true],
    ["/compare", "/compare", true],
    ["/shortlist", "/shortlist#wishlist", true],
    ["/shortlist", "/shortlist", true],
    ["/shop", "/shop", true],
    ["/community", "/community", true],
    ["/admin", "/", false],
    ["/tags", "/tags", true],
    ["/archivio", "/archivio?group=vibe-coding", true],
  ])("pathname %s vs href %s → %s", (pathname, href, expected) => {
    expect(isNavRouteActive(pathname, href)).toBe(expected);
  });

  it("pathname null/empty non è mai attivo; href esterni non sono attivi", () => {
    expect(isNavRouteActive(null, "/archivio")).toBe(false);
    expect(isNavRouteActive("", "/archivio")).toBe(false);
    expect(isNavRouteActive("/shop", "https://shop.tooolvibes.com")).toBe(
      false,
    );
    expect(isNavRouteActive("/x", "mailto:hello@tooolvibes.com")).toBe(false);
  });
});
