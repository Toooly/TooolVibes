/**
 * Rendered tests for sponsor opportunity acquisition click wiring.
 *
 * Verifies that each real sponsorship-acquisition CTA emits exactly one
 * sponsor_opportunity_click on a user-initiated click, keeps navigation
 * hrefs intact, and survives analytics failures without blocking the click.
 *
 * The analytics module is mocked so each click can be asserted without
 * depending on console wiring. SponsorOpenSlot needs the placement module
 * for its props, so it is rendered with a fixture placement.
 */

// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SiteFooterV2 } from "@/components/layout/site-footer-v2";
import { AdvertisingConsentProvider } from "@/components/ads/advertising-consent-provider";
import { NavigationReleaseProvider } from "@/lib/navigation/navigation-release-context";
import { resolveNavigationRelease } from "@/lib/navigation/release";
import {
  SponsorOpportunityLink,
  SponsorOpenSlot,
} from "@/components/monetization/partner-placements";
import { SponsorOpportunityMailtoLink } from "@/components/monetization/sponsor-analytics-tracker";

const mockTrackSponsorOpportunityClick = vi.hoisted(() => vi.fn());
const mockTrackSponsorClick = vi.hoisted(() => vi.fn());

vi.mock("@/lib/analytics/sponsor-events", () => ({
  trackSponsorImpression: vi.fn(),
  trackSponsorClick: mockTrackSponsorClick,
  trackSponsorOpportunityClick: mockTrackSponsorOpportunityClick,
}));

vi.mock("@/components/layout/brand-logo", () => ({
  BrandLogo: () => <span data-testid="brand-logo" />,
}));

vi.mock("next/link", () => ({
  default: (props: {
    href: string;
    onClick?: () => void;
    className?: string;
    children: React.ReactNode;
  }) => <a href={props.href} onClick={props.onClick} className={props.className}>{props.children}</a>,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

function buildFixturePlacement() {
  return {
    key: "tool-sponsored-alternative",
    placementId: "tool-sponsored-alternative",
    surface: "Scheda tool",
    format: "Alternativa sponsorizzata",
    packageName: "Tool profile native",
    label: "Contenuto sponsorizzato",
    title: "Alternativa partner in scheda tool (disponibile).",
    body: "Placement contestuale su scheda tool / confronto.",
    description: "Placement contestuale su scheda tool / confronto.",
    ctaLabel: "Diventa sponsor",
    href: "/sponsorizza",
    status: "ready" as const,
    visible: true as const,
    active: false,
    priority: 5,
    audience: "Utenti in fase di decisione su una scheda tool.",
    trackingId: "tv-tool-alternative-open",
    startDate: null,
    endDate: null,
    partner: {
      name: "Il tuo tool qui",
      category: "Opportunità partner",
      href: "/sponsorizza",
      isDemo: false,
    },
    editorialReason: "Questo spazio è disponibile per un partner.",
  };
}

describe("SponsorOpportunityLink", () => {
  beforeEach(() => {
    mockTrackSponsorOpportunityClick.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("emits exactly one sponsor_opportunity_click on click", () => {
    render(
      <SponsorOpportunityLink placementId="home-sponsor-opportunity" route="/" />,
    );

    fireEvent.click(screen.getByRole("link"));

    expect(mockTrackSponsorOpportunityClick).toHaveBeenCalledTimes(1);
    expect(mockTrackSponsorOpportunityClick).toHaveBeenCalledWith({
      placementId: "home-sponsor-opportunity",
      route: "/",
      destination: "/sponsorizza",
    });
  });

  it("keeps the navigation href intact", () => {
    render(
      <SponsorOpportunityLink placementId="archive-sponsor-opportunity" route="/archivio" />,
    );

    const link = screen.getByRole("link");
    expect(link.getAttribute("href")).toBe("/sponsorizza");
  });

  it("rerender does not emit; one click produces one event", () => {
    const { rerender } = render(
      <SponsorOpportunityLink placementId="posts-sponsor-opportunity" route="/posts/guida" />,
    );

    rerender(
      <SponsorOpportunityLink placementId="posts-sponsor-opportunity" route="/posts/guida" />,
    );
    expect(mockTrackSponsorOpportunityClick).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("link"));
    expect(mockTrackSponsorOpportunityClick).toHaveBeenCalledTimes(1);
  });

  it("analytics throw does not block the link click", () => {
    mockTrackSponsorOpportunityClick.mockImplementation(() => {
      throw new Error("analytics backend down");
    });

    render(
      <SponsorOpportunityLink placementId="collections-sponsor-opportunity" route="/collections/x" />,
    );

    const link = screen.getByRole("link");
    expect(() => fireEvent.click(link)).not.toThrow();
    expect(link.getAttribute("href")).toBe("/sponsorizza");
  });
});

describe("SponsorOpenSlot CTA", () => {
  beforeEach(() => {
    mockTrackSponsorOpportunityClick.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("emits exactly one sponsor_opportunity_click on the open-slot CTA", () => {
    const placement = buildFixturePlacement();
    render(
      <SponsorOpenSlot placement={placement} trackerRoute="/toools/blink" />,
    );

    const cta = screen.getByRole("link", {
      name: /Sponsorizza il tuo tool su TooolVibes/,
    });

    fireEvent.click(cta);

    expect(mockTrackSponsorOpportunityClick).toHaveBeenCalledTimes(1);
    expect(mockTrackSponsorOpportunityClick).toHaveBeenCalledWith({
      placementId: "tool-detail-open-slot",
      route: "/toools/blink",
      destination: "/sponsorizza",
    });
    expect(cta.getAttribute("href")).toBe("/sponsorizza");
  });
});

describe("SponsorOpportunityMailtoLink", () => {
  beforeEach(() => {
    mockTrackSponsorOpportunityClick.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("emits one event and keeps the mailto href intact", () => {
    const href =
      "mailto:hello@tooolvibes.com?subject=Richiesta%20informazioni%20sponsorship";
    render(
      <SponsorOpportunityMailtoLink
        placementId="sponsor-page-hero"
        route="/sponsorizza"
        href={href}
      >
        Richiedi informazioni
      </SponsorOpportunityMailtoLink>,
    );

    const link = screen.getByRole("link", { name: /Richiedi informazioni/ });
    expect(link.getAttribute("href")).toBe(href);

    fireEvent.click(link);

    expect(mockTrackSponsorOpportunityClick).toHaveBeenCalledTimes(1);
    expect(mockTrackSponsorOpportunityClick).toHaveBeenCalledWith({
      placementId: "sponsor-page-hero",
      route: "/sponsorizza",
      destination: href,
    });
  });

  it("final CTA fires its own placement and never blocks the mail client", () => {
    const href =
      "mailto:hello@tooolvibes.com?subject=Richiesta%20informazioni%20sponsorship";
    render(
      <SponsorOpportunityMailtoLink
        placementId="sponsor-page-final-cta"
        route="/sponsorizza"
        href={href}
      >
        Scrivi a hello@tooolvibes.com
      </SponsorOpportunityMailtoLink>,
    );

    const link = screen.getByRole("link", { name: /Scrivi a hello/ });

    let prevented = false;
    link.addEventListener("click", (event) => {
      if (event.defaultPrevented) prevented = true;
    });

    fireEvent.click(link);

    expect(prevented).toBe(false);
    expect(mockTrackSponsorOpportunityClick).toHaveBeenCalledTimes(1);
    expect(mockTrackSponsorOpportunityClick).toHaveBeenCalledWith({
      placementId: "sponsor-page-final-cta",
      route: "/sponsorizza",
      destination: href,
    });
  });
});

describe("footer /sponsorizza link", () => {
  const release = resolveNavigationRelease({});

  beforeEach(() => {
    mockTrackSponsorOpportunityClick.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("emits one sponsor_opportunity_click on the single footer Sponsorizza link", () => {
    render(
      <AdvertisingConsentProvider>
        <NavigationReleaseProvider value={release}>
          <SiteFooterV2 />
        </NavigationReleaseProvider>
      </AdvertisingConsentProvider>,
    );

    const sponsorLinks = screen
      .getAllByRole("link")
      .filter((link) => link.getAttribute("href") === "/sponsorizza");
    expect(sponsorLinks).toHaveLength(1);

    fireEvent.click(sponsorLinks[0]);

    expect(mockTrackSponsorOpportunityClick).toHaveBeenCalledTimes(1);
    expect(mockTrackSponsorOpportunityClick.mock.calls[0]?.[0]).toMatchObject({
      placementId: "footer-sponsor-opportunity",
      destination: "/sponsorizza",
    });
  });
});

describe("event distinctness", () => {
  beforeEach(() => {
    mockTrackSponsorClick.mockReset();
    mockTrackSponsorOpportunityClick.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("sponsor_click and sponsor_opportunity_click stay distinct", () => {
    render(
      <SponsorOpportunityLink placementId="home-sponsor-opportunity" route="/" />,
    );

    fireEvent.click(screen.getByRole("link"));

    expect(mockTrackSponsorOpportunityClick).toHaveBeenCalledTimes(1);
    expect(mockTrackSponsorClick).not.toHaveBeenCalled();
  });
});
