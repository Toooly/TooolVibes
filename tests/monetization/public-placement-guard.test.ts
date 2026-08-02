import { describe, expect, it } from "vitest";

import {
  isPublicMonetizationPlacement,
  type MonetizationPlacement,
} from "@/lib/monetization/placements";

function readyPlacement(
  overrides: Partial<MonetizationPlacement> = {},
): MonetizationPlacement {
  return {
    key: "test-placement",
    surface: "Test",
    format: "Native",
    packageName: "Test package",
    label: "Partner",
    title: "Una proposta contestuale.",
    body: "Contesto utile.",
    ctaLabel: "Apri il partner",
    href: "/affiliati",
    status: "ready",
    visible: true,
    priority: 1,
    audience: "Audience",
    partner: {
      name: "Partner reale",
      category: "Automazione",
      href: "https://example.com",
    },
    editorialReason: "È rilevante per questo percorso.",
    ...overrides,
  };
}

describe("public partner placement guard", () => {
  it("accepts only a complete ready placement", () => {
    expect(isPublicMonetizationPlacement(readyPlacement())).toBe(true);
  });

  it.each([
    readyPlacement({ status: "reserved" }),
    readyPlacement({ visible: false }),
    readyPlacement({
      partner: { name: " ", category: "Automazione", href: "https://example.com" },
    }),
    readyPlacement({
      partner: { name: "Partner", category: " ", href: "https://example.com" },
    }),
    readyPlacement({
      partner: { name: "Partner", category: "Automazione", href: "javascript:alert(1)" },
    }),
    readyPlacement({ editorialReason: " " }),
  ])("rejects incomplete or non-public inventory", (placement) => {
    expect(isPublicMonetizationPlacement(placement)).toBe(false);
  });

  it("accepts same-site relative partner URLs for internal CTAs", () => {
    expect(
      isPublicMonetizationPlacement(
        readyPlacement({
          partner: {
            name: "Demo Partner",
            category: "Dato di sviluppo",
            href: "/affiliati",
          },
        }),
      ),
    ).toBe(true);
  });
});
