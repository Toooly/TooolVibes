/**
 * §10 RELEASE-READINESS CONTRACT — production public gate must stay OPEN.
 *
 * The canonical production build path is `npm run build` →
 * `scripts/next-release-build.mjs` → `npx next build` (and
 * `npm run build:cloudflare` → `scripts/run-cloudflare-build.mjs`).
 * Neither forwards `TOOOLVIBES_PUBLIC_GATE_ENABLED` from `wrangler.jsonc`,
 * so the flag resolves from `releaseFeatureRegistry.publicGate.defaultEnabled`.
 *
 * If that default were ever flipped to `true`, every marketing route would
 * prerender WITHOUT `MarketingChrome` (no `#main-content`, no Bottom Nav) and
 * the whole product would silently ship as a coming-soon page. This test pins
 * the production default and the exact downstream consequences.
 */
import { describe, expect, it } from "vitest";

import { releaseFeatureRegistry, releaseFeatures } from "@/lib/config/release-features";
import { isPublicProductOpen } from "@/lib/gate/public-product-open";
import { CATALOGO_FACETS } from "@/components/archive/catalogo-facet-head";
import { navigationRegistry } from "@/lib/navigation/destinations";
import { getNavItemsForSurface } from "@/lib/navigation/selectors";
import { applyAuthenticatedPrimaryNav } from "@/lib/navigation/account-primary-nav";

describe("production public-gate-open contract", () => {
  it("REGRESSION: production default leaves the public gate DISABLED (open)", () => {
    expect(releaseFeatureRegistry.publicGate.defaultEnabled).toBe(false);
    expect(releaseFeatureRegistry.publicGate.envKey).toBe("TOOOLVIBES_PUBLIC_GATE_ENABLED");
  });

  it("REGRESSION: gate open -> MarketingChrome contract is reachable", () => {
    // `isPublicProductOpen()` is the single switch MarketingLayout uses to
    // decide whether it mounts MarketingChrome (#main-content + Bottom Nav).
    expect(isPublicProductOpen()).toBe(releaseFeatures.publicGate.enabled === false);
    expect(isPublicProductOpen()).toBe(true);
  });

  it("REGRESSION: gate closed must be an explicit opt-in, never the default", () => {
    expect(releaseFeatures.publicGate.enabled).toBe(false);
  });

  it("REGRESSION: Bottom Nav exists and is auth-aware (guest 4 / logged 5)", () => {
    const guest = applyAuthenticatedPrimaryNav(getNavItemsForSurface("bottom-nav"), false);
    const logged = applyAuthenticatedPrimaryNav(getNavItemsForSurface("bottom-nav"), true);

    // Guest keeps the exact frozen production nav — Radar is NOT injected.
    expect(guest.map((i) => i.href)).toEqual(["/", "/archivio", "/collections", "/shortlist"]);
    expect(guest.some((i) => i.id === "radar")).toBe(false);

    // Logged adds Radar and remaps to the canonical destinations.
    expect(logged.map((i) => i.href)).toEqual([
      "/",
      "/archivio",
      "/radar",
      "/account?view=decisioni",
      "/account?view=salvati",
    ]);
    expect(logged.some((i) => i.id === "radar")).toBe(true);
  });

  it("REGRESSION: Catalogo facet still exposes the Radar lens", () => {
    expect(CATALOGO_FACETS.map((f) => f.id)).toEqual(["tutti", "radar"]);
  });

  it("REGRESSION: radar destination is a primary/bottom-nav placement", () => {
    const radar = navigationRegistry.find((d) => d.id === "radar");
    expect(radar?.placements.some((p) => p.surface === "bottom-nav")).toBe(true);
    expect(radar?.placements.some((p) => p.surface === "footer-v2-product")).toBe(true);
  });
});
