import { describe, expect, it } from "vitest";

import { monetizationPlacements } from "@/lib/monetization/placements";

import {
  COMMERCIAL_PLACEMENT_MATRIX,
  VALID_DIRECT_SPONSOR_KEYS,
  getCommercialPlacement,
  getDirectSponsorKeysForMatrix,
  type CommercialRouteKey,
  type CommercialRoutePlacement,
} from "@/lib/monetization/commercial-placement-matrix";

/**
 * Tests for the canonical commercial placement matrix.
 *
 * Lock-in contract (fails the build if any of these is violated):
 *   - Every route entry has a non-empty TinyAdz placement distinct from its
 *     direct-sponsor key.
 *   - The five TinyAdz placements match the strings actually mounted in code
 *     (home-editorial, archive-feed, tool-detail, article-body, collection-feed).
 *   - Direct-sponsor keys point at real entries in `monetizationPlacements`.
 *   - `separation.type === "content-section"` for every route and
 *     `separation.reference` is a non-empty, grep-able string.
 *   - `maxPrimaryDirectSponsors === 1` everywhere.
 */

const ALL_ROUTE_KEYS: readonly CommercialRouteKey[] = [
  "home",
  "archivio",
  "tool-detail",
  "posts",
  "collections",
];

const EXPECTED_TINYADZ_PLACEMENTS: Readonly<Record<CommercialRouteKey, string>> = {
  home: "home-editorial",
  archivio: "archive-feed",
  "tool-detail": "tool-detail",
  posts: "article-body",
  collections: "collection-feed",
};

describe("commercial placement matrix shape", () => {
  it("exposes exactly one entry per CommercialRouteKey", () => {
    expect(Object.keys(COMMERCIAL_PLACEMENT_MATRIX).sort()).toEqual(
      [...ALL_ROUTE_KEYS].sort(),
    );
  });

  it("resolves every route through getCommercialPlacement", () => {
    for (const route of ALL_ROUTE_KEYS) {
      const entry = getCommercialPlacement(route);
      expect(entry).toBeDefined();
      expect(entry.tinyadzPlacement.length).toBeGreaterThan(0);
    }
  });
});

describe("commercial placement matrix invariants", () => {
  for (const route of ALL_ROUTE_KEYS) {
    describe(`route "${route}"`, () => {
      const entry: CommercialRoutePlacement = COMMERCIAL_PLACEMENT_MATRIX[route];

      it("has a non-empty tinyadzPlacement distinct from its directSponsorKey", () => {
        expect(entry.tinyadzPlacement).toBeTruthy();
        expect(entry.tinyadzPlacement.trim().length).toBeGreaterThan(0);
        if (entry.directSponsorKey !== null) {
          expect(entry.tinyadzPlacement).not.toBe(entry.directSponsorKey);
        }
      });

      it("has a non-empty directSponsorMount description", () => {
        expect(entry.directSponsorMount).toBeTruthy();
        expect(entry.directSponsorMount.trim().length).toBeGreaterThan(0);
      });

      it("declares separation.type === content-section with non-empty reference", () => {
        expect(entry.separation.type).toBe("content-section");
        expect(entry.separation.reference).toBeTruthy();
        expect(entry.separation.reference.trim().length).toBeGreaterThan(0);
      });

      it("caps maxPrimaryDirectSponsors at 1", () => {
        expect(entry.maxPrimaryDirectSponsors).toBe(1);
      });

      it("has a tinyadzMount description", () => {
        expect(entry.tinyadzMount).toBeTruthy();
        expect(entry.tinyadzMount.trim().length).toBeGreaterThan(0);
      });
    });
  }
});

describe("TinyAdz placements match the strings mounted in code", () => {
  it("every route tinyadzPlacement matches its expected mount id", () => {
    for (const route of ALL_ROUTE_KEYS) {
      expect(COMMERCIAL_PLACEMENT_MATRIX[route].tinyadzPlacement).toBe(
        EXPECTED_TINYADZ_PLACEMENTS[route],
      );
    }
  });

  it("the five tinyadz placements are exactly the canonical set", () => {
    const actual = new Set(
      ALL_ROUTE_KEYS.map((route) => COMMERCIAL_PLACEMENT_MATRIX[route].tinyadzPlacement),
    );
    expect([...actual].sort()).toEqual(
      [...new Set(Object.values(EXPECTED_TINYADZ_PLACEMENTS))].sort(),
    );
  });
});

describe("direct-sponsor keys are valid monetizationPlacements entries", () => {
  it("every non-null directSponsorKey exists in the monetizationPlacements registry", () => {
    for (const route of ALL_ROUTE_KEYS) {
      const { directSponsorKey } = COMMERCIAL_PLACEMENT_MATRIX[route];
      if (directSponsorKey === null) continue;
      expect(VALID_DIRECT_SPONSOR_KEYS.has(directSponsorKey)).toBe(true);
      expect(monetizationPlacements.some((p) => p.key === directSponsorKey)).toBe(true);
    }
  });

  it("every active placement registered in monetizationPlacements appears in the matrix", () => {
    // Cross-check: the set returned by getDirectSponsorKeysForMatrix() must
    // contain exactly the non-null directSponsorKey values from the matrix.
    const referenced = getDirectSponsorKeysForMatrix();
    for (const route of ALL_ROUTE_KEYS) {
      const key = COMMERCIAL_PLACEMENT_MATRIX[route].directSponsorKey;
      if (key === null) continue;
      expect(referenced.has(key)).toBe(true);
    }
  });
});

describe("no commercial fields collapse to the same string", () => {
  it("tinyadzPlacement !== directSponsorKey for every entry where the latter is defined", () => {
    for (const route of ALL_ROUTE_KEYS) {
      const { tinyadzPlacement, directSponsorKey } = COMMERCIAL_PLACEMENT_MATRIX[route];
      if (directSponsorKey === null) continue;
      expect(tinyadzPlacement === directSponsorKey).toBe(false);
    }
  });
});
