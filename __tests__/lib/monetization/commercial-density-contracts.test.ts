/**
 * Commercial inventory finalization — duplication & density contracts.
 *
 * Static, deterministic guarantees over the shipped source tree:
 *   - max one primary Partner Experience mount per route file;
 *   - max one TinyAdz mount per route file (inline only — no rail exists
 *     because no route offers a genuinely unused >= 280px column);
 *   - archive partner insertion index !== TinyAdz insertion index;
 *   - Open Slot disappears when a paid contextual campaign is eligible;
 *   - Compare / account / legal / sponsorizza carry zero TinyAdz and zero
 *     primary direct sponsorship;
 *   - /sponsorizza partner previews never emit paid impressions;
 *   - self-sponsorship is excluded by the resolver (covered in
     __tests__/lib/sponsors/partner-resolver.test.ts).
 */

import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  PARTNER_INSERT_AFTER,
  TINYADZ_INSERT_AFTER,
} from "@/components/archive/definitive-archive";
import { COMMERCIAL_PLACEMENT_MATRIX } from "@/lib/monetization/commercial-placement-matrix";

const root = path.resolve(__dirname, "../../..");
const read = (relativePath: string) =>
  readFileSync(path.join(root, relativePath), "utf8");

const PARTNER_MOUNT_PATTERN =
  /<(FeaturedPartner|PartnerEditorialInsert|PartnerToolCard|ContextualPartnerBlock|PartnerCollectionModule)\b/g;

const ROUTE_FILES: Record<string, string> = {
  home: "components/home/definitive-home.tsx",
  archivio: "app/(marketing)/archivio/page.tsx",
  "tool-detail": "components/tool-detail-final/tool-detail-final-page.tsx",
  posts: "app/(marketing)/posts/[slug]/page.tsx",
  "collections-detail": "app/(marketing)/collections/[slug]/page.tsx",
  "collections-list": "components/collections/mobile-collections-view.tsx",
  radar: "components/radar/radar-experience.tsx",
  compare: "app/(marketing)/compare/page.tsx",
  account: "app/(marketing)/account/page.tsx",
  sponsorizza: "app/(marketing)/sponsorizza/page.tsx",
};

describe("one primary Partner Experience per route", () => {
  it.each(Object.entries(ROUTE_FILES))(
    "%s mounts at most one primary partner component",
    (_route, file) => {
      const source = read(file);
      const mounts = source.match(PARTNER_MOUNT_PATTERN) ?? [];
      expect(mounts.length).toBeLessThanOrEqual(1);
    },
  );

  it("the matrix caps every route at one primary direct sponsor", () => {
    for (const entry of Object.values(COMMERCIAL_PLACEMENT_MATRIX)) {
      expect(entry.maxPrimaryDirectSponsors).toBe(1);
    }
  });
});

describe("one TinyAdz mount per route (inline only)", () => {
  it.each(Object.entries(ROUTE_FILES))(
    "%s mounts at most one TinyAdzInlineSlot",
    (_route, file) => {
      const source = read(file);
      const mounts = source.match(/<TinyAdzInlineSlot\b/g) ?? [];
      expect(mounts.length).toBeLessThanOrEqual(1);
    },
  );

  it("no rail mount exists outside the inline primitive", () => {
    /* The desktop rail strategy stays inactive: audited layouts have no
       genuinely unused >= 280px column, so no second mount component may
       exist. If a rail is ever activated it must reuse TinyAdzInlineSlot
       and this test must be updated in the same change. */
    const rail = path.join(root, "components/ads");
    const files = readdirSync(rail).join("\n");
    expect(files).not.toContain("rail");
  });
});

describe("archivio insertion indexes", () => {
  it("partner and TinyAdz never share an insertion index", () => {
    expect(PARTNER_INSERT_AFTER).toBe(6);
    expect(TINYADZ_INSERT_AFTER).toBe(18);
    expect(TINYADZ_INSERT_AFTER).not.toBe(PARTNER_INSERT_AFTER);
    /* Twelve organic cards separate the two units — natural desktop gap. */
    expect(TINYADZ_INSERT_AFTER - PARTNER_INSERT_AFTER).toBeGreaterThanOrEqual(12);
  });

  it("both indexes divide the 2-col and 3-col grids (no orphan rows)", () => {
    for (const index of [PARTNER_INSERT_AFTER, TINYADZ_INSERT_AFTER]) {
      expect(index % 2).toBe(0);
      expect(index % 3).toBe(0);
    }
  });
});

describe("zero-commercial routes", () => {
  it.each(["compare", "account", "sponsorizza"])(
    "%s mounts no TinyAdz and no primary partner component",
    (route) => {
      const source = read(ROUTE_FILES[route] as string);
      expect(source).not.toContain("TinyAdzInlineSlot");
      const mounts = source.match(PARTNER_MOUNT_PATTERN) ?? [];
      expect(mounts.length).toBe(0);
    },
  );

  it("legal routes mount no TinyAdz", () => {
    for (const file of [
      "app/(marketing)/privacy/page.tsx",
      "app/(marketing)/termini/page.tsx",
      "app/(marketing)/cookie/page.tsx",
    ]) {
      const source = read(file);
      expect(source).not.toContain("TinyAdzInlineSlot");
    }
  });
});

describe("/sponsorizza showcase previews", () => {
  it("render partner creatives without any paid tracker wrapper", () => {
    const source = read("app/(marketing)/sponsorizza/page.tsx");
    expect(source).toContain("PartnerCreativeRenderer");
    expect(source).not.toContain("SponsorImpressionTracker");
    expect(source).not.toContain("SponsorClickHandler");
    /* Showcase links are marked as sponsored and open in a new tab. */
    expect(source).toContain('rel="sponsored noopener noreferrer"');
  });
});

describe("open slot fallback", () => {
  it("tool detail source keeps the Open Slot fallback wiring", () => {
    const source = read("components/tool-detail-final/tool-detail-final-page.tsx");
    /* The mount passes subject context; the resolver drives partner-vs-slot. */
    expect(source).toContain('placementKey="tool-sponsored-alternative"');
    expect(source).toContain("context={{");
    expect(source).toContain("toolSlug: slug");
  });
});


describe("/sponsorizza live partner previews count", () => {
  it("maps exactly the three active campaigns once each", () => {
    const source = read("app/(marketing)/sponsorizza/page.tsx");
    expect(source).toContain("LIVE_PARTNER_CAMPAIGNS");
    expect(source).toContain("ALL_SPONSOR_CAMPAIGNS.filter");
    /* One card per campaign in the showcase grid — no duplicated map. */
    const cardMaps = source.match(/LIVE_PARTNER_CAMPAIGNS\.map/g) ?? [];
    expect(cardMaps.length).toBe(1);
    const registry = read("lib/sponsors/sponsor-placements.ts");
    const active = [...registry.matchAll(/status:\s*"active"/g)];
    expect(active.length).toBe(3);
    for (const name of ["Taylora", "OnWeb24", "ZapLater"]) {
      expect(registry).toContain(`name: "${name}"`);
    }
  });
});

describe("paid partner and Open Slot are mutually exclusive", () => {
  it("resolveVariantPlacement prefers public campaign over open-slot", () => {
    const source = read("components/monetization/partner-placements.tsx");
    /* Public branch returns before open-slot branch. */
    const publicIdx = source.indexOf('if (publicPlacement)');
    const openIdx = source.indexOf("if (isOpenSlotPlacement(placement))");
    expect(publicIdx).toBeGreaterThan(-1);
    expect(openIdx).toBeGreaterThan(publicIdx);
  });
});

describe("excluded TinyAdz routes stay in the eligibility denylist", () => {
  it("covers compare, account, legal and sponsorizza", () => {
    const source = read("lib/ads/tinyadz-config.ts");
    for (const route of ["/account", "/compare", "/privacy", "/termini", "/cookie", "/sponsorizza"]) {
      expect(source).toContain(`"${route}"`);
    }
  });
});


describe("commercial density policy", () => {
  it("keeps desktop rail disabled for the current TinyAdz creative width", async () => {
    const policy = await import("@/lib/monetization/commercial-density-policy");
    expect(policy.TINYADZ_DESKTOP_RAIL_ENABLED).toBe(false);
    expect(
      policy.isTinyAdzRailGeometryEligible({
        viewportWidth: 1920,
        usableGutterPx: 395,
      }),
    ).toBe(false);
    expect(
      policy.isTinyAdzRailGeometryEligible({
        viewportWidth: 1920,
        usableGutterPx: 960,
        railEnabled: true,
      }),
    ).toBe(true);
  });

  it("paid partner outranks TinyAdz on posts surfaces", async () => {
    const policy = await import("@/lib/monetization/commercial-density-policy");
    expect(
      policy.shouldSuppressTinyAdzForPaidPartner({
        hasPaidPartner: true,
        surface: "posts",
      }),
    ).toBe(true);
    expect(
      policy.shouldSuppressTinyAdzForPaidPartner({
        hasPaidPartner: false,
        surface: "posts",
      }),
    ).toBe(false);
    expect(
      policy.shouldSuppressTinyAdzForPaidPartner({
        hasPaidPartner: true,
        surface: "tool-detail",
        estimatedSeparationPx: 1350,
      }),
    ).toBe(false);
  });

  it("Open Slot yields to TinyAdz on short pages", async () => {
    const policy = await import("@/lib/monetization/commercial-density-policy");
    expect(
      policy.shouldSuppressOpenSlotForTinyAdz({
        hasTinyAdz: true,
        pageHeightPx: 1800,
      }),
    ).toBe(true);
    expect(
      policy.shouldSuppressOpenSlotForTinyAdz({
        hasTinyAdz: true,
        pageHeightPx: 7000,
      }),
    ).toBe(false);
  });

  it("archive insertion constants match the density policy", async () => {
    const policy = await import("@/lib/monetization/commercial-density-policy");
    expect(PARTNER_INSERT_AFTER).toBe(policy.ARCHIVE_PARTNER_AFTER_ORGANIC);
    expect(TINYADZ_INSERT_AFTER).toBe(policy.ARCHIVE_TINYADZ_AFTER_ORGANIC);
  });
});
