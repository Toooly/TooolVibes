/**
 * TooolVibes — Canonical Commercial Placement Matrix
 *
 * ARCHITECTURAL INVARIANT
 * -----------------------
 * TooolVibes runs TWO INDEPENDENT monetization systems that MUST coexist,
 * never replace each other:
 *
 *   1. TinyAdz      — third-party programmatic ads, consent-gated.
 *   2. Taylora      — direct, first-party curated sponsors (see
 *                      `lib/monetization/placements.ts` and
 *                      `lib/sponsors/sponsor-placements.ts`).
 *
 * Each system resolves its OWN eligibility (TinyAdz: consent + eligibility
 * path + configured site id; direct sponsor: `resolvePublicMonetizationPlacement`
 * filters out demo / fixture / placeholder / reserved / planned records).
 * Each system mounts independently in the page tree, with its OWN placement
 * id, its OWN analytics tracker, and its OWN visible disclosure label.
 *
 * VISUAL ADJACENCY RULE
 * ---------------------
 * The two commercial units MUST NEVER be visually adjacent. A minimum of one
 * FULL SEMANTIC CONTENT SECTION (a real `<section>` carrying its own
 * `aria-labelledby`) must always sit between the TinyAdz mount and the
 * direct sponsor mount on the same route. When TinyAdz has no fill (or
 * the vendor does not paint within the wait window) the slot unmounts to
 * `null` and consumes no layout; if a sponsor mount is allowed to sit directly
 * above or below the TinyAdz mount, the sponsor will appear to "replace"
 * the ad when the ad is blank. The separation section fixes that by
 * giving both units their own editorial runway and reinforcing the
 * independence guarantee to the reader.
 *
 * This module is the SINGLE SOURCE OF TRUTH for that separation contract.
 * If you add a route, mount a new TinyAdz slot, or wire a new direct
 * sponsor placement, you MUST update this matrix in the same change so
 * the test suite continues to describe reality.
 */

import {
  monetizationPlacements,
  type MonetizationPlacementKey,
} from "@/lib/monetization/placements";

/**
 * Every public route that hosts one or more commercial units.
 * Adding a new route? Add a new key here AND a row in the matrix below.
 */
export type CommercialRouteKey =
  | "home"
  | "archivio"
  | "tool-detail"
  | "posts"
  | "collections"
  | "radar";

export type CommercialRouteSeparation = {
  /**
   * "content-section": a real semantic `<section>` with its own
   * `aria-labelledby` between the two commercial units.
   * "grid-distance": both units live inside the same discovery grid at
   * different insertion indexes with multiple organic rows between them —
   * the equivalent natural page distance (allowed since the commercial
   * inventory finalization; never zero, never adjacent indexes).
   */
  type: "content-section" | "grid-distance";
  /**
   * Human-readable reference to the actual content section that sits
   * between the two commercial units. Should be grep-able in the codebase
   * (class name, component name, or section id) so reviewers can verify it.
   */
  reference: string;
};

export type CommercialRoutePlacement = {
  /**
   * Exact placement string passed to `<TinyAdzInlineSlot placement=...>` on
   * this route. Must match the value wired in the route component.
   */
  tinyadzPlacement: string;
  /**
   * Short human description of WHERE TinyAdz mounts on this route.
   */
  tinyadzMount: string;
  /**
   * The `MonetizationPlacementKey` rendered by the direct-sponsor mount on
   * this route, or `null` if no direct sponsor is mounted here.
   */
  directSponsorKey: MonetizationPlacementKey | null;
  /**
   * Short human description of WHERE the direct-sponsor mount lives on this
   * route (or "none mounted" when `directSponsorKey` is null).
   */
  directSponsorMount: string;
  /**
   * The semantic content section that separates the two commercial units.
   * The presence and identity of this section is the core visual contract.
   */
  separation: CommercialRouteSeparation;
  /**
   * Maximum number of primary direct-sponsor placements on this route.
   * Always `1` today — the launch inventory reserves exactly one slot per
   * surface. If a route ever grows a secondary sponsor placement, this
   * value is the single knob the test suite will guard.
   */
  maxPrimaryDirectSponsors: 1;
};

/**
 * Canonical commercial placement matrix.
 *
 * `Readonly<Record<…>>` keeps entries immutable and forces TS to flag any
 * missing route key at compile time when a new `CommercialRouteKey` is
 * added.
 */
export const COMMERCIAL_PLACEMENT_MATRIX: Readonly<
  Record<CommercialRouteKey, CommercialRoutePlacement>
> = {
  home: {
    tinyadzPlacement: "home-editorial",
    tinyadzMount:
      "between IvoryEditorial and Method sections (definitive-home.tsx)",
    directSponsorKey: "home-featured-tool",
    directSponsorMount:
      "SponsorSection rendered AFTER the Method section (definitive-home.tsx)",
    separation: {
      type: "content-section",
      reference: "Method section (def-method)",
    },
    maxPrimaryDirectSponsors: 1,
  },
  archivio: {
    tinyadzPlacement: "archive-feed",
    tinyadzMount:
      "inside the catalog grid after 18 organic cards (ar4-grid__item--ad), pristine discovery view only",
    directSponsorKey: "catalog-native-sponsor",
    directSponsorMount:
      "PartnerEditorialInsert inside the catalog grid after 6 organic cards (ar4-grid__item--partner)",
    separation: {
      type: "grid-distance",
      reference:
        "insertion index 6 (partner) vs 18 (TinyAdz): twelve organic catalog cards between the two mounts",
    },
    maxPrimaryDirectSponsors: 1,
  },
  "tool-detail": {
    tinyadzPlacement: "tool-detail",
    tinyadzMount:
      "after ToolDetailExtendedContent (tool-detail-final-page.tsx)",
    directSponsorKey: "tool-sponsored-alternative",
    directSponsorMount:
      "td-final-page__partner near the footer — contextual campaign via resolver, Open Slot V3.1 fallback (tool-detail-final-page.tsx)",
    separation: {
      type: "content-section",
      reference:
        "ToolDetailInformation + ToolDetailSignal + ToolDetailAlternatives sections",
    },
    maxPrimaryDirectSponsors: 1,
  },
  posts: {
    tinyadzPlacement: "article-body",
    tinyadzMount:
      "after the intro section (app/(marketing)/posts/[slug]/page.tsx)",
    directSponsorKey: "guide-inline-promo",
    directSponsorMount:
      "ContextualPartnerBlock after the article body panel (contextual resolver; renders null without semantic relevance)",
    separation: {
      type: "content-section",
      reference: "article body panel",
    },
    maxPrimaryDirectSponsors: 1,
  },
  collections: {
    tinyadzPlacement: "collection-feed",
    tinyadzMount:
      "between hero and others list (components/collections/mobile-collections-view.tsx)",
    directSponsorKey: "collection-native-sponsor",
    directSponsorMount:
      "PartnerCollectionModule as an ending Partner Experience after the full curated tool list (contextual resolver on included-tool directory segments; renders null without semantic relevance)",
    separation: {
      type: "content-section",
      reference: "collections list section",
    },
    maxPrimaryDirectSponsors: 1,
  },
  radar: {
    tinyadzPlacement: "radar-feed",
    tinyadzMount:
      "after the results block (#tv-radar-results), before the provenance section (components/radar/radar-experience.tsx)",
    directSponsorKey: null,
    directSponsorMount: "none mounted",
    separation: {
      type: "content-section",
      reference: "RadarProvenance section (tv-radar-provenance)",
    },
    maxPrimaryDirectSponsors: 1,
  },
} as const;

const VALID_DIRECT_SPONSOR_KEYS: ReadonlySet<string> = new Set(
  monetizationPlacements.map((placement) => placement.key),
);

/**
 * Look up the canonical commercial placement entry for a route.
 * Throws if the key is unknown so callers never silently fall back to a
 * missing route — the matrix is the contract.
 */
export function getCommercialPlacement(
  route: CommercialRouteKey,
): CommercialRoutePlacement {
  const entry = COMMERCIAL_PLACEMENT_MATRIX[route];
  if (!entry) {
    throw new Error(
      `Commercial placement matrix is missing an entry for route "${route}". Update lib/monetization/commercial-placement-matrix.ts.`,
    );
  }
  return entry;
}

/**
 * Returns the subset of `MonetizationPlacementKey` values that are referenced
 * as a primary direct-sponsor mount on at least one route. Used by the test
 * suite (and potentially by future analytics surfaces) to verify that every
 * "active" placement actually has a home, and every "home" actually points
 * to a real registry entry.
 */
export function getDirectSponsorKeysForMatrix(): ReadonlySet<MonetizationPlacementKey> {
  const referenced = new Set<MonetizationPlacementKey>();
  for (const entry of Object.values(COMMERCIAL_PLACEMENT_MATRIX)) {
    if (entry.directSponsorKey) referenced.add(entry.directSponsorKey);
  }
  return referenced;
}

export { VALID_DIRECT_SPONSOR_KEYS };
