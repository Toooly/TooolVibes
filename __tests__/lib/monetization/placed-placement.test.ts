/**
 * Tests for the TooolVibes monetization placements with Taylora wired in.
 *
 * Verifies the public-policy contract:
 *   - home-featured-tool and catalog-native-sponsor expose Taylora (real
 *     identity, active, status: ready).
 *   - tool-sponsored-alternative is intentionally not public yet (active: false).
 *   - The partner record is never flagged as a demo.
 *   - Editorial-relevance reason and date-window policy are enforced.
 */

import { describe, expect, it } from "vitest";

import {
  getMonetizationPlacement,
  isPublicMonetizationPlacement,
  resolvePublicMonetizationPlacement,
  type MonetizationPlacement,
} from "@/lib/monetization/placements";

describe("home-featured-tool placement", () => {
  const placement = getMonetizationPlacement("home-featured-tool");

  it("is defined in the registry", () => {
    expect(placement).toBeDefined();
  });

  it("is public (not isDemo, active, ready)", () => {
    expect(placement).toBeDefined();
    expect(isPublicMonetizationPlacement(placement)).toBe(true);
  });

  it("is not flagged as a demo partner", () => {
    expect(placement?.partner?.isDemo).toBe(false);
  });

  it("has Taylora as the partner and an editorial reason", () => {
    expect(placement?.partner?.name).toBe("Taylora");
    expect(placement?.partner?.href).toBe("https://taylora.com");
    expect(typeof placement?.editorialReason).toBe("string");
    expect((placement?.editorialReason ?? "").length).toBeGreaterThan(0);
  });

  it("has a complete CTA, title and label for the public surface", () => {
    expect((placement?.ctaLabel ?? "").length).toBeGreaterThan(0);
    expect((placement?.title ?? "").length).toBeGreaterThan(0);
    expect((placement?.label ?? "").length).toBeGreaterThan(0);
  });
});

describe("catalog-native-sponsor placement", () => {
  const placement = getMonetizationPlacement("catalog-native-sponsor");

  it("is defined in the registry", () => {
    expect(placement).toBeDefined();
  });

  it("is public (not isDemo, active, ready)", () => {
    expect(placement).toBeDefined();
    expect(isPublicMonetizationPlacement(placement)).toBe(true);
  });

  it("exposes Taylora as the partner", () => {
    expect(placement?.partner?.name).toBe("Taylora");
    expect(placement?.partner?.isDemo).toBe(false);
    expect(placement?.partner?.href).toBe("https://taylora.com");
  });
});

describe("tool-sponsored-alternative placement", () => {
  const placement = getMonetizationPlacement("tool-sponsored-alternative");

  it("is defined in the registry", () => {
    expect(placement).toBeDefined();
  });

  it("is NOT public because the slot is inactive (active: false)", () => {
    expect(placement?.active).toBe(false);
    expect(isPublicMonetizationPlacement(placement)).toBe(false);
  });
});

describe("isPublicMonetizationPlacement", () => {
  it("returns false for undefined inputs", () => {
    expect(isPublicMonetizationPlacement(undefined)).toBe(false);
  });

  it("returns false for demo records", () => {
    const demo: MonetizationPlacement = {
      key: "qa-demo",
      surface: "QA",
      format: "Featured",
      packageName: "QA",
      label: "Partner di TooolVibes",
      title: "Una scelta coerente con questo contesto.",
      body: "Demo body",
      ctaLabel: "Apri il partner",
      href: "https://partner.example",
      status: "ready",
      visible: true,
      priority: 1,
      audience: "QA",
      partner: {
        name: "Demo Partner",
        category: "Demo category",
        href: "https://demo.example",
        isDemo: true,
      },
      editorialReason: "Demo editorial reason.",
    };

    expect(isPublicMonetizationPlacement(demo)).toBe(false);
  });

  it("returns false when the partner URL is missing or unsafe", () => {
    const noUrl: MonetizationPlacement = {
      key: "qa-nourl",
      surface: "QA",
      format: "Featured",
      packageName: "QA",
      label: "Partner di TooolVibes",
      title: "Una scelta coerente con questo contesto.",
      body: "Body",
      ctaLabel: "Apri il partner",
      href: "/affiliati",
      status: "ready",
      visible: true,
      priority: 1,
      audience: "QA",
      partner: {
        name: "Partner senza URL",
        category: "Categoria valida",
        href: "",
      },
      editorialReason: "Rilevante nel contesto della pagina.",
    };

    expect(isPublicMonetizationPlacement(noUrl)).toBe(false);
  });

  it("returns false when the date window is in the future", () => {
    const futurePlacement: MonetizationPlacement = {
      key: "qa-future",
      surface: "QA",
      format: "Featured",
      packageName: "QA",
      label: "Partner di TooolVibes",
      title: "Una scelta coerente con questo contesto.",
      body: "Body",
      ctaLabel: "Apri il partner",
      href: "https://partner.example",
      status: "ready",
      visible: true,
      priority: 1,
      audience: "QA",
      partner: {
        name: "Taylora",
        category: "Partner di TooolVibes",
        href: "https://taylora.com",
        isDemo: false,
      },
      editorialReason: "Rilevante nel contesto della pagina.",
      startDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
        .toISOString()
        .slice(0, 10),
    };

    expect(isPublicMonetizationPlacement(futurePlacement)).toBe(false);
  });

  it("returns false when the date window is closed", () => {
    const expiredPlacement: MonetizationPlacement = {
      key: "qa-expired",
      surface: "QA",
      format: "Featured",
      packageName: "QA",
      label: "Partner di TooolVibes",
      title: "Una scelta coerente con questo contesto.",
      body: "Body",
      ctaLabel: "Apri il partner",
      href: "https://partner.example",
      status: "ready",
      visible: true,
      priority: 1,
      audience: "QA",
      partner: {
        name: "Taylora",
        category: "Partner di TooolVibes",
        href: "https://taylora.com",
        isDemo: false,
      },
      editorialReason: "Rilevante nel contesto della pagina.",
      endDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7)
        .toISOString()
        .slice(0, 10),
    };

    expect(isPublicMonetizationPlacement(expiredPlacement)).toBe(false);
  });

  it("returns true for a fully complete active placement within dates", () => {
    const active: MonetizationPlacement = {
      key: "qa-active",
      surface: "QA",
      format: "Featured",
      packageName: "QA",
      label: "Partner di TooolVibes",
      title: "Una scelta coerente con questo contesto.",
      body: "Body",
      ctaLabel: "Apri il partner",
      href: "https://partner.example",
      status: "ready",
      visible: true,
      active: true,
      priority: 1,
      audience: "QA",
      partner: {
        name: "Taylora",
        category: "Partner di TooolVibes",
        href: "https://taylora.com",
        isDemo: false,
      },
      editorialReason: "Rilevante nel contesto della pagina.",
    };

    expect(isPublicMonetizationPlacement(active)).toBe(true);
  });
});

describe("resolvePublicMonetizationPlacement", () => {
  it("returns the Taylora placement for home-featured-tool", () => {
    const placement = resolvePublicMonetizationPlacement("home-featured-tool");
    expect(placement).not.toBeNull();
    expect(placement?.partner.name).toBe("Taylora");
    expect(placement?.trackingId).toBe("tv-home-featured-taylora");
    expect(placement?.status).toBe("ready");
    expect(placement?.visible).toBe(true);
  });

  it("returns the Taylora placement for catalog-native-sponsor", () => {
    const placement = resolvePublicMonetizationPlacement(
      "catalog-native-sponsor",
    );
    expect(placement).not.toBeNull();
    expect(placement?.partner.name).toBe("Taylora");
    expect(placement?.trackingId).toBe("tv-catalog-native-taylora");
  });

  it("returns null for tool-sponsored-alternative (inactive slot)", () => {
    expect(
      resolvePublicMonetizationPlacement("tool-sponsored-alternative"),
    ).toBeNull();
  });
});

describe("editorial reason and date window for the Taylora placements", () => {
  it("home-featured-tool has an editorial reason populated by the campaign", () => {
    const placement = getMonetizationPlacement("home-featured-tool");
    expect(placement).toBeDefined();
    expect((placement?.editorialReason ?? "").length).toBeGreaterThan(0);
  });

  it("home-featured-tool is within its active date window at test time", () => {
    const placement = getMonetizationPlacement("home-featured-tool");
    expect(placement).toBeDefined();
    const now = Date.now();
    if (placement?.startDate) {
      const start = Date.parse(placement.startDate);
      expect(Number.isNaN(start)).toBe(false);
      expect(now).toBeGreaterThanOrEqual(start);
    }
    if (placement?.endDate) {
      const end = Date.parse(placement.endDate);
      expect(Number.isNaN(end)).toBe(false);
      expect(now).toBeLessThanOrEqual(end);
    }
  });

  it("catalog-native-sponsor is within its active date window at test time", () => {
    const placement = getMonetizationPlacement("catalog-native-sponsor");
    expect(placement).toBeDefined();
    const now = Date.now();
    if (placement?.startDate) {
      const start = Date.parse(placement.startDate);
      expect(Number.isNaN(start)).toBe(false);
      expect(now).toBeGreaterThanOrEqual(start);
    }
    if (placement?.endDate) {
      const end = Date.parse(placement.endDate);
      expect(Number.isNaN(end)).toBe(false);
      expect(now).toBeLessThanOrEqual(end);
    }
  });
});
