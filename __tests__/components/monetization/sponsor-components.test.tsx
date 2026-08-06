/**
 * Tests for the sponsor surfaces in components/monetization/partner-placements.
 *
 * The contract under test:
 *   - FeaturedPartner and PartnerToolCard render a Taylora block when the
 *     underlying monetization placement is public (with data-sponsored="true",
 *     a tracking id, disclosure copy, partner name and external rel).
 *   - FeaturedPartner renders null for inactive placements (no public slot).
 *   - SponsorOpenSlot renders with data-sponsored="false" and an aria-label
 *     announcing the opportunity for /sponsorizza.
 *   - SponsorOpportunityLink targets /sponsorizza.
 *   - No demo badge is rendered alongside the active Taylora placements.
 *   - External links carry rel="sponsored noopener noreferrer".
 *
 * The placement registry is mocked so each test can toggle between public,
 * inactive and missing states deterministically.
 */

// @vitest-environment jsdom

import { createElement } from "react";
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

/* Hoisted mutable state lets each test decide which placements are
   registered and which of them resolve as "public" (real partner). */
const state: {
  registered: Record<string, unknown>;
  publicKeys: Set<string>;
  openSlotKeys: Set<string>;
} = vi.hoisted(() => ({
  registered: {} as Record<string, unknown>,
  publicKeys: new Set<string>(["home-featured-tool"]),
  openSlotKeys: new Set<string>(["tool-sponsored-alternative"]),
}));

function buildPublicPlacement(key: string): Record<string, unknown> {
  return {
    key,
    placementId: key,
    surface: key === "catalog-native-sponsor" ? "Catalogo" : "Homepage",
    format: key === "catalog-native-sponsor" ? "Sponsored Tool Card" : "Partner Spotlight",
    packageName: key === "catalog-native-sponsor" ? "Category native" : "Homepage spotlight",
    label: "Partner di TooolVibes",
    title: "Distribuisci contenuti digitali protetti senza compliche.",
    body: "Taylora permette a creator, coach ed editori di vendere contenuti digitali protetti.",
    ctaLabel: "Scopri Taylora",
    href: "https://taylora.com",
    status: "ready",
    visible: true,
    active: true,
    priority: key === "catalog-native-sponsor" ? 2 : 1,
    audience: "Utenti in esplorazione.",
    trackingId: key === "catalog-native-sponsor"
      ? "tv-catalog-native-taylora"
      : "tv-home-featured-taylora",
    startDate: "2026-08-01",
    endDate: null,
    partner: {
      name: "Taylora",
      category: "Partner di TooolVibes",
      href: "https://taylora.com",
      isDemo: false,
    },
    editorialReason:
      "Partner selezionato per chi vuole distribuire contenuti digitali protetti.",
  };
}

function buildOpenSlotPlacement(key: string): Record<string, unknown> {
  return {
    key,
    placementId: key,
    surface: "Scheda tool",
    format: "Alternativa sponsorizzata",
    packageName: "Tool profile native",
    label: "Contenuto sponsorizzato",
    title: "Alternativa partner in scheda tool (disponibile).",
    body: "Placement contestuale su scheda tool / confronto.",
    ctaLabel: "Diventa sponsor",
    href: "/sponsorizza",
    status: "ready",
    visible: true,
    active: false,
    priority: 5,
    audience: "Utenti in fase di decisione su una scheda tool.",
    trackingId: "tv-tool-alternative-open",
    partner: {
      name: "Il tuo tool qui",
      category: "Opportunità partner",
      href: "/sponsorizza",
      isDemo: false,
    },
    editorialReason:
      "Questo spazio è disponibile per un partner che offre un'alternativa.",
  };
}

vi.mock("@/lib/monetization/placements", () => ({
  getMonetizationPlacement: (key: string) => state.registered[key],
  isPublicMonetizationPlacement: (placement: { key?: string; partner?: { isDemo?: boolean } } | undefined) => {
    if (!placement) return false;
    if (placement.partner?.isDemo === true) return false;
    if (placement.key && state.publicKeys.has(placement.key)) return true;
    return false;
  },
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    rel,
    target,
    "data-tracking-id": dataTrackingId,
    "data-sponsored": dataSponsored,
    className,
    "aria-label": ariaLabel,
  }: {
    href: string;
    children: React.ReactNode;
    rel?: string;
    target?: string;
    "data-tracking-id"?: string;
    "data-sponsored"?: string;
    className?: string;
    "aria-label"?: string;
  }) =>
    createElement(
      "a",
      {
        href,
        rel,
        target,
        "data-tracking-id": dataTrackingId,
        "data-sponsored": dataSponsored,
        className,
        "aria-label": ariaLabel,
      },
      children,
    ),
}));

import {
  FeaturedPartner,
  PartnerToolCard,
  SponsorOpportunityLink,
} from "@/components/monetization/partner-placements";

function resetState() {
  state.registered = {};
  state.publicKeys = new Set<string>(["home-featured-tool"]);
  state.openSlotKeys = new Set<string>(["tool-sponsored-alternative"]);
}

afterEach(() => {
  cleanup();
  resetState();
});

describe("FeaturedPartner", () => {
  it("renders with data-sponsored='true' and the Taylora tracking id", () => {
    state.registered = {
      "home-featured-tool": buildPublicPlacement("home-featured-tool"),
    };
    state.publicKeys = new Set(["home-featured-tool"]);
    state.openSlotKeys = new Set();

    const { container } = render(<FeaturedPartner placementKey="home-featured-tool" />);

    const aside = container.querySelector("aside");
    expect(aside).not.toBeNull();
    expect(aside?.getAttribute("data-sponsored")).toBe("true");
    expect(aside?.getAttribute("data-tracking-id")).toBe(
      "tv-home-featured-taylora",
    );
    expect(aside?.getAttribute("data-placement-id")).toBe("home-featured-tool");
    expect(aside?.getAttribute("data-placement-surface")).toBe("Homepage");
    expect(aside?.getAttribute("aria-label")).toBe(
      "Contenuto sponsorizzato: Taylora",
    );
  });

  it("renders the partner name and editorial reason", () => {
    state.registered = {
      "home-featured-tool": buildPublicPlacement("home-featured-tool"),
    };
    state.publicKeys = new Set(["home-featured-tool"]);
    state.openSlotKeys = new Set();

    const { container } = render(<FeaturedPartner placementKey="home-featured-tool" />);

    expect(container.textContent).toContain("Taylora");
    expect(container.textContent).toContain("Partner di TooolVibes");
    expect(container.textContent).toContain(
      "Partner selezionato per chi vuole distribuire contenuti digitali protetti.",
    );
  });

  it("renders the disclosure label text", () => {
    state.registered = {
      "home-featured-tool": buildPublicPlacement("home-featured-tool"),
    };
    state.publicKeys = new Set(["home-featured-tool"]);
    state.openSlotKeys = new Set();

    const { container } = render(<FeaturedPartner placementKey="home-featured-tool" />);

    const disclosure = container.querySelector(
      ".partner-placement__disclosure",
    );
    expect(disclosure).not.toBeNull();
    expect(disclosure?.textContent?.trim()).toBe("Partner di TooolVibes");
    expect(disclosure?.getAttribute("data-sponsored")).toBe("true");
  });

  it("uses rel='sponsored noopener noreferrer' for the external Taylora link", () => {
    state.registered = {
      "home-featured-tool": buildPublicPlacement("home-featured-tool"),
    };
    state.publicKeys = new Set(["home-featured-tool"]);
    state.openSlotKeys = new Set();

    const { container } = render(<FeaturedPartner placementKey="home-featured-tool" />);

    const link = container.querySelector("a[href='https://taylora.com']");
    expect(link).not.toBeNull();
    expect(link?.getAttribute("rel")).toBe("sponsored noopener noreferrer");
    expect(link?.getAttribute("target")).toBe("_blank");
  });

  it("renders null for an inactive (no-public-slot, no-open-slot) placement", () => {
    state.registered = {};
    state.publicKeys = new Set();
    state.openSlotKeys = new Set();

    const { container } = render(<FeaturedPartner placementKey="guide-inline-promo" />);

    expect(container.firstChild).toBeNull();
  });

  it("renders null when no placement matches the requested key", () => {
    state.registered = {};
    state.publicKeys = new Set();
    state.openSlotKeys = new Set(["tool-sponsored-alternative"]);

    const { container } = render(<FeaturedPartner placementKey={"missing-key" as never} />);

    expect(container.firstChild).toBeNull();
  });

  it("falls back to the open-slot variant when the public placement is missing but the open-slot is registered", () => {
    state.registered = {
      "tool-sponsored-alternative": buildOpenSlotPlacement("tool-sponsored-alternative"),
    };
    state.publicKeys = new Set();
    state.openSlotKeys = new Set(["tool-sponsored-alternative"]);

    const { container } = render(
      <FeaturedPartner placementKey="tool-sponsored-alternative" />,
    );

    const aside = container.querySelector("aside");
    expect(aside).not.toBeNull();
    expect(aside?.getAttribute("data-sponsored")).toBe("false");
    expect(aside?.getAttribute("data-tracking-id")).toBe(
      "tv-tool-alternative-open",
    );
  });
});

describe("PartnerToolCard", () => {
  it("renders with the data-tracking-id for the public Taylora placement", () => {
    state.registered = {
      "catalog-native-sponsor": buildPublicPlacement("catalog-native-sponsor"),
    };
    state.publicKeys = new Set(["catalog-native-sponsor"]);
    state.openSlotKeys = new Set();

    const { container } = render(
      <PartnerToolCard placementKey="catalog-native-sponsor" />,
    );

    const aside = container.querySelector("aside");
    expect(aside).not.toBeNull();
    expect(aside?.getAttribute("data-tracking-id")).toBe(
      "tv-catalog-native-taylora",
    );
    expect(aside?.getAttribute("data-sponsored")).toBe("true");
  });

  it("renders null for a placement key that is not registered", () => {
    state.registered = {};
    state.publicKeys = new Set();
    state.openSlotKeys = new Set();

    const { container } = render(
      <PartnerToolCard placementKey={"missing-key" as never} />,
    );

    expect(container.firstChild).toBeNull();
  });

  it("falls back to the open-slot variant for tool-sponsored-alternative", () => {
    state.registered = {
      "tool-sponsored-alternative": buildOpenSlotPlacement("tool-sponsored-alternative"),
    };
    state.publicKeys = new Set();
    state.openSlotKeys = new Set(["tool-sponsored-alternative"]);

    const { container } = render(
      <PartnerToolCard placementKey="tool-sponsored-alternative" />,
    );

    const aside = container.querySelector("aside");
    expect(aside).not.toBeNull();
    expect(aside?.getAttribute("data-sponsored")).toBe("false");
  });
});

describe("SponsorOpenSlot (rendered as a fallback)", () => {
  it("renders with data-sponsored='false' when no public placement is available for an open-slot key", () => {
    state.registered = {
      "tool-sponsored-alternative": buildOpenSlotPlacement("tool-sponsored-alternative"),
    };
    state.publicKeys = new Set();
    state.openSlotKeys = new Set(["tool-sponsored-alternative"]);

    const { container } = render(
      <FeaturedPartner placementKey="tool-sponsored-alternative" />,
    );

    const aside = container.querySelector("aside");
    expect(aside?.getAttribute("data-sponsored")).toBe("false");
    expect(aside?.getAttribute("data-tracking-id")).toBe(
      "tv-tool-alternative-open",
    );
  });

  it("uses the 'Opportunità sponsor' aria-label on the open-slot aside", () => {
    state.registered = {
      "tool-sponsored-alternative": buildOpenSlotPlacement("tool-sponsored-alternative"),
    };
    state.publicKeys = new Set();
    state.openSlotKeys = new Set(["tool-sponsored-alternative"]);

    const { container } = render(
      <FeaturedPartner placementKey="tool-sponsored-alternative" />,
    );

    const aside = container.querySelector("aside");
    expect(aside?.getAttribute("aria-label")).toBe("Opportunità sponsor");
  });

  it("links to /sponsorizza from the action area", () => {
    state.registered = {
      "tool-sponsored-alternative": buildOpenSlotPlacement("tool-sponsored-alternative"),
    };
    state.publicKeys = new Set();
    state.openSlotKeys = new Set(["tool-sponsored-alternative"]);

    const { container } = render(
      <FeaturedPartner placementKey="tool-sponsored-alternative" />,
    );

    const link = container.querySelector("a[href='/sponsorizza']");
    expect(link).not.toBeNull();
    expect(link?.getAttribute("rel")).toBe("sponsored");
  });
});

describe("SponsorOpportunityLink", () => {
  it("links to /sponsorizza with a tracking id", () => {
    const { container } = render(<SponsorOpportunityLink />);

    const link = container.querySelector("a");
    expect(link).not.toBeNull();
    expect(link?.getAttribute("href")).toBe("/sponsorizza");
    expect(link?.getAttribute("data-tracking-id")).toBe(
      "tv-sponsor-opportunity",
    );
  });

  it("renders the opportunity copy", () => {
    const { container } = render(<SponsorOpportunityLink />);

    expect(container.textContent).toContain("Vuoi presentare il tuo tool qui?");
  });
});

describe("no demo badge alongside the active Taylora placements", () => {
  it("FeaturedPartner does not render a demo warning next to a public Taylora placement", () => {
    state.registered = {
      "home-featured-tool": buildPublicPlacement("home-featured-tool"),
    };
    state.publicKeys = new Set(["home-featured-tool"]);
    state.openSlotKeys = new Set();

    const { container } = render(<FeaturedPartner placementKey="home-featured-tool" />);

    expect(container.textContent).not.toMatch(/demo/i);
    expect(container.querySelector("[data-demo]")).toBeNull();
    expect(container.querySelector("[data-demo-badge]")).toBeNull();
  });
});
