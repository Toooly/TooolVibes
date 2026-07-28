import { describe, expect, it } from "vitest";

import {
  getMonetizationPlacement,
  isPublicMonetizationPlacement,
  type MonetizationPlacement,
} from "@/lib/monetization/placements";

describe("public monetization placement policy", () => {
  it("keeps reserved and planned inventory out of public routes", () => {
    expect(
      isPublicMonetizationPlacement(
        getMonetizationPlacement("home-featured-tool"),
      ),
    ).toBe(false);
    expect(
      isPublicMonetizationPlacement(
        getMonetizationPlacement("article-sidebar-sponsor"),
      ),
    ).toBe(false);
  });

  it("requires a real identity and editorial-relevance reason", () => {
    const incomplete: MonetizationPlacement = {
      key: "qa",
      surface: "QA",
      format: "Featured",
      packageName: "QA",
      label: "Partner",
      title: "Partner reale",
      body: "Contenuto",
      ctaLabel: "Apri",
      href: "/affiliati",
      status: "ready",
      visible: true,
      priority: 1,
      audience: "QA",
    };

    expect(isPublicMonetizationPlacement(incomplete)).toBe(false);
  });

  it("accepts only a complete ready placement", () => {
    const active: MonetizationPlacement = {
      key: "qa",
      surface: "QA",
      format: "Featured",
      packageName: "QA",
      label: "Partner",
      title: "Una scelta coerente con questo contesto.",
      body: "Contenuto",
      ctaLabel: "Apri il partner",
      href: "https://partner.example",
      status: "ready",
      visible: true,
      priority: 1,
      audience: "QA",
      partner: {
        name: "Partner Example",
        category: "Automazione",
        href: "https://partner.example",
      },
      editorialReason: "Risolve il problema descritto senza interrompere il percorso.",
    };

    expect(isPublicMonetizationPlacement(active)).toBe(true);
  });
});
