/**
 * Partner Experience V3 contract tests.
 *
 * What is pinned here:
 *   - The home stage renders the partner-specific creative selected by the
 *     campaign registry (Taylora → taylora-flow narrative micro-world).
 *   - Unknown/absent creativeVariant values fall back to the generic
 *     partner creative (framework stays reusable, no Taylora hardcoding).
 *   - The catalogue editorial insert renders the strip density creative
 *     with disclosure and sponsored rel attributes, and carries no organic
 *     score/rank semantics.
 *   - The open slot renders the self-assembling media-kit preview with
 *     placement indicators and keeps data-sponsored="false".
 *   - The complete narrative is present as static markup: animation is an
 *     enhancement layer, never the only carrier of product information
 *     (reduced-motion contract).
 *   - The creative layer imports no analytics module: animations can never
 *     fire impressions or clicks.
 */

// @vitest-environment jsdom

import { readFileSync } from "node:fs";
import path from "node:path";

import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  FeaturedPartner,
  PartnerEditorialInsert,
  SponsorOpenSlot,
} from "@/components/monetization/partner-placements";
import { DefinitiveArchive } from "@/components/archive/definitive-archive";
import {
  CATALOG_FILTER_GROUPS,
  makeCatalogTool,
} from "@/__tests__/components/directory/catalog-test-fixtures";
import {
  OpenSlotPreviewCreative,
  PartnerCreativeRenderer,
  TayloraFlowCreative,
} from "@/components/monetization/partner-creatives";
import type { MonetizationPlacement } from "@/lib/monetization/placements";
import { TAYLORA_CAMPAIGN } from "@/lib/sponsors/sponsor-placements";

/* Rotation is date-driven by design; these tests pin the creative framework,
   not the daily pick — the resolver is stubbed to the Taylora campaign. */
vi.mock("@/lib/sponsors/partner-resolver", async (importOriginal) => {
  const actual = await importOriginal<
    typeof import("@/lib/sponsors/partner-resolver")
  >();
  return {
    ...actual,
    resolvePartnerCampaign: () => TAYLORA_CAMPAIGN,
  };
});

afterEach(() => {
  cleanup();
});

/* The real registry is used for Taylora: the campaign is active from
   2026-08-01 with no end date, so placements resolve publicly. */

describe("FeaturedPartner — Partner Experience stage", () => {
  it("renders the stage shell with the Taylora brand plate", () => {
    const { container } = render(
      <FeaturedPartner placementKey="home-featured-tool" trackerRoute="/" />,
    );

    const aside = container.querySelector("aside");
    expect(aside).not.toBeNull();
    expect(aside?.getAttribute("data-partner-experience")).toBe("stage");
    expect(aside?.getAttribute("data-sponsored")).toBe("true");

    const creative = container.querySelector('[data-creative="brand-plate"]');
    expect(creative).not.toBeNull();
    expect(creative?.getAttribute("data-creative-density")).toBe("stage");
    expect(creative?.getAttribute("aria-hidden")).toBe("true");
    expect(creative?.querySelector("img")?.getAttribute("src")).toContain("taylora-brand-plate");
  });

  it("keeps the sponsored disclosure visible in the stage", () => {
    const { container } = render(
      <FeaturedPartner placementKey="home-featured-tool" trackerRoute="/" />,
    );

    const disclosure = container.querySelector(".partner-placement__disclosure");
    expect(disclosure).not.toBeNull();
    expect(disclosure?.getAttribute("data-sponsored")).toBe("true");
    expect(disclosure?.textContent?.trim()).toBe("Partner di TooolVibes");
  });

  it("carries no organic score or rank semantics", () => {
    const { container } = render(
      <FeaturedPartner placementKey="home-featured-tool" trackerRoute="/" />,
    );

    expect(container.querySelector("[data-rank]")).toBeNull();
    expect(container.querySelector("[data-score]")).toBeNull();
    expect(container.querySelector("[data-tool-score]")).toBeNull();
    expect(container.textContent).not.toMatch(/punteggio|classifica|rank/i);
  });
});

describe("TayloraFlowCreative — narrative completeness", () => {
  it("renders the full content → protection → customer story as static markup", () => {
    const { container } = render(<TayloraFlowCreative density="stage" />);

    /* Sources: the knowledge modules claimed on the current Taylora site. */
    expect(container.textContent).toContain("Procedure");
    expect(container.textContent).toContain("Corsi");
    expect(container.textContent).toContain("Onboarding");

    /* Protection state and team outcome are static, not animated-only. */
    expect(container.textContent).toContain("Workspace protetto");
    expect(container.textContent).toContain("Team");

    /* Phase captions make the story readable with zero animation. */
    expect(container.textContent).toContain("Conoscenza");
    expect(container.textContent).toContain("Formazione");
    expect(container.textContent).toContain("Tracciamento");
  });

  it("exposes the composition as pure presentation", () => {
    const { container } = render(<TayloraFlowCreative density="strip" />);

    const root = container.querySelector('[data-creative="taylora-flow"]');
    expect(root?.getAttribute("aria-hidden")).toBe("true");
    expect(root?.getAttribute("role")).toBe("presentation");
    expect(root?.getAttribute("data-creative-density")).toBe("strip");
  });
});

describe("PartnerCreativeRenderer — variant selection", () => {
  it("falls back to the generic creative for unknown variants", () => {
    const { container } = render(
      <PartnerCreativeRenderer
        creativeVariant="some-future-partner"
        partnerName="Acme"
        density="stage"
      />,
    );

    expect(container.querySelector('[data-creative="generic"]')).not.toBeNull();
    expect(container.querySelector('[data-creative="taylora-flow"]')).toBeNull();
  });

  it("falls back to the generic creative when no variant is set", () => {
    const { container } = render(
      <PartnerCreativeRenderer partnerName="Acme" density="strip" />,
    );

    expect(container.querySelector('[data-creative="generic"]')).not.toBeNull();
  });

  it("selects the Taylora flow for the taylora-flow variant", () => {
    const { container } = render(
      <PartnerCreativeRenderer
        creativeVariant="taylora-flow"
        partnerName="Taylora"
        density="stage"
      />,
    );

    expect(container.querySelector('[data-creative="taylora-flow"]')).not.toBeNull();
    expect(container.querySelector('[data-creative="generic"]')).toBeNull();
  });
});

describe("PartnerEditorialInsert — catalogue feature strip", () => {
  it("renders the insert shell with the strip-density Taylora brand plate", () => {
    const { container } = render(
      <PartnerEditorialInsert
        placementKey="catalog-native-sponsor"
        trackerRoute="/archivio"
      />,
    );

    const aside = container.querySelector("aside");
    expect(aside).not.toBeNull();
    expect(aside?.getAttribute("data-partner-experience")).toBe("insert");
    expect(aside?.getAttribute("data-sponsored")).toBe("true");
    expect(aside?.getAttribute("data-tracking-id")).toBe("tv-catalog-native-taylora");

    const creative = container.querySelector('[data-creative="brand-plate"]');
    expect(creative).not.toBeNull();
    expect(creative?.getAttribute("data-creative-density")).toBe("strip");
  });

  it("keeps disclosure and sponsored rel on the outbound CTA", () => {
    const { container } = render(
      <PartnerEditorialInsert
        placementKey="catalog-native-sponsor"
        trackerRoute="/archivio"
      />,
    );

    const disclosure = container.querySelector(".partner-placement__disclosure");
    expect(disclosure?.textContent?.trim()).toBe("Sponsor");

    const link = container.querySelector(
      "a[href^='https://discover.taylora.com/']",
    );
    expect(link).not.toBeNull();
    expect(link?.getAttribute("href")).toContain("utm_source=tooolvibes");
    expect(link?.getAttribute("rel")).toBe("sponsored noopener noreferrer");
  });

  it("does not imitate organic catalogue cards", () => {
    const { container } = render(
      <PartnerEditorialInsert
        placementKey="catalog-native-sponsor"
        trackerRoute="/archivio"
      />,
    );

    expect(container.querySelector("[data-rank]")).toBeNull();
    expect(container.querySelector("[data-score]")).toBeNull();
    expect(container.textContent).not.toMatch(/punteggio|classifica/i);
  });
});

describe("SponsorOpenSlot — V3 media-kit preview", () => {
  function buildPlacement(): MonetizationPlacement {
    return {
      key: "tool-sponsored-alternative",
      placementId: "tool-sponsored-alternative",
      surface: "Scheda tool",
      format: "Alternativa sponsorizzata",
      packageName: "Tool profile native",
      label: "Contenuto sponsorizzato",
      title: "Alternativa partner in scheda tool (disponibile).",
      body: "Placement contestuale su scheda tool / confronto.",
      ctaLabel: "Diventa sponsor",
      href: "/sponsorizza",
      status: "ready",
      active: false,
      visible: true,
      priority: 5,
      audience: "Utenti in fase di decisione su una scheda tool.",
      trackingId: "tv-tool-alternative-open",
    };
  }

  it("renders the self-assembling campaign preview with placement indicators", () => {
    const { container } = render(
      <SponsorOpenSlot placement={buildPlacement()} trackerRoute="/toools/blink" />,
    );

    const aside = container.querySelector("aside");
    expect(aside?.getAttribute("data-partner-experience")).toBe("open-slot");
    expect(aside?.getAttribute("data-sponsored")).toBe("false");

    const preview = container.querySelector('[data-creative="open-slot-preview"]');
    expect(preview).not.toBeNull();
    expect(preview?.getAttribute("aria-hidden")).toBe("true");
    expect(preview?.textContent).toContain("Il tuo logo");
    expect(preview?.textContent).toContain("La tua CTA");
    expect(preview?.textContent).toContain("Homepage");
    expect(preview?.textContent).toContain("Catalogo");
    expect(preview?.textContent).toContain("Editoriale");
  });

  it("keeps the opportunity copy and the /sponsorizza CTA prominent", () => {
    const { container, getByRole } = render(
      <SponsorOpenSlot placement={buildPlacement()} trackerRoute="/toools/blink" />,
    );

    expect(container.textContent).toContain(
      "Il prossimo tool qui potrebbe essere il tuo.",
    );

    const cta = getByRole("link", {
      name: /Sponsorizza il tuo tool su TooolVibes/,
    });
    expect(cta.getAttribute("href")).toBe("/sponsorizza");
    expect(cta.getAttribute("rel")).toBe("sponsored");
  });

  it("renders the assembled sheet statically when never scrolled into view", () => {
    const { container } = render(<OpenSlotPreviewCreative />);

    /* Without IntersectionObserver (jsdom) data-in-view stays false and no
       assembly animation runs: the sheet markup must already be complete. */
    const root = container.querySelector('[data-creative="open-slot-preview"]');
    expect(root?.getAttribute("data-in-view")).toBe("false");
    expect(root?.textContent).toContain("Il tuo logo");
    expect(root?.textContent).toContain("La tua CTA");
  });
});

describe("creative layer isolation", () => {
  it("imports no analytics module, so animations can never fire events", () => {
    const source = readFileSync(
      path.resolve(
        __dirname,
        "../../../components/monetization/partner-creatives.tsx",
      ),
      "utf8",
    );

    expect(source).not.toMatch(/lib\/analytics/);
    expect(source).not.toMatch(/trackSponsor/);
  });
});

describe("V3.1 — partner creative theme", () => {
  it("applies the campaign theme key on the stage shell", () => {
    const { container } = render(
      <FeaturedPartner placementKey="home-featured-tool" trackerRoute="/" />,
    );

    const aside = container.querySelector("aside");
    expect(aside?.getAttribute("data-partner-theme")).toBe("gold-cyan");
  });

  it("omits the identity monogram when the brand plate owns the visual field", () => {
    const { container } = render(
      <FeaturedPartner placementKey="home-featured-tool" trackerRoute="/" />,
    );

    const mark = container.querySelector(
      ".partner-placement__identity-mark--monogram",
    );
    expect(mark).toBeNull();
    expect(container.querySelector('[data-creative="brand-plate"]')).not.toBeNull();
  });
});

describe("V3.1 — open slot campaign canvas", () => {
  function buildPlacement(): MonetizationPlacement {
    return {
      key: "tool-sponsored-alternative",
      placementId: "tool-sponsored-alternative",
      surface: "Scheda tool",
      format: "Alternativa sponsorizzata",
      packageName: "Tool profile native",
      label: "Contenuto sponsorizzato",
      title: "Alternativa partner in scheda tool (disponibile).",
      body: "Placement contestuale su scheda tool / confronto.",
      ctaLabel: "Diventa sponsor",
      href: "/sponsorizza",
      status: "ready",
      active: false,
      visible: true,
      priority: 5,
      audience: "Utenti in fase di decisione su una scheda tool.",
      trackingId: "tv-tool-alternative-open",
    };
  }

  it("renders the morphing canvas with one accent per placement silhouette", () => {
    const { container } = render(
      <SponsorOpenSlot placement={buildPlacement()} trackerRoute="/toools/blink" />,
    );

    const preview = container.querySelector('[data-creative="open-slot-preview"]');
    expect(preview).not.toBeNull();
    expect(
      preview?.querySelector(".open-slot-preview__accent--spotlight"),
    ).not.toBeNull();
    expect(
      preview?.querySelector(".open-slot-preview__accent--insert"),
    ).not.toBeNull();
    expect(
      preview?.querySelector(".open-slot-preview__accent--editorial"),
    ).not.toBeNull();
  });

  it("exposes the three placement contexts as mode indicators", () => {
    const { container } = render(
      <SponsorOpenSlot placement={buildPlacement()} trackerRoute="/toools/blink" />,
    );

    const modes = container.querySelectorAll(".open-slot-preview__modes li");
    expect(modes.length).toBe(3);
    expect(modes[0]?.getAttribute("data-mode")).toBe("spotlight");
    expect(modes[1]?.getAttribute("data-mode")).toBe("insert");
    expect(modes[2]?.getAttribute("data-mode")).toBe("editorial");
  });

  it("keeps the conversion hierarchy: headline, one line, CTA, commercial cue", () => {
    const { container } = render(
      <SponsorOpenSlot placement={buildPlacement()} trackerRoute="/toools/blink" />,
    );

    expect(container.textContent).toContain(
      "Il prossimo tool qui potrebbe essere il tuo.",
    );
    expect(container.textContent).toContain(
      "Partner Experience curate da TooolVibes",
    );
    /* Generic spec bullets removed: the visual communicates them. */
    expect(container.querySelector(".partner-placement__micro-spec")).toBeNull();
  });
});

describe("V3.1 — catalog insert inside the discovery flow", () => {
  it("renders between organic groups inside the catalogue grid", () => {
    const tools = Array.from({ length: 12 }, (_, i) =>
      makeCatalogTool({ slug: `tool-${String(i + 1).padStart(2, "0")}` }),
    );

    const { container } = render(
      <DefinitiveArchive
        tools={tools}
        filterGroups={CATALOG_FILTER_GROUPS}
        partnerInsert={
          <div data-testid="partner-insert">Partner Experience</div>
        }
      />,
    );

    const list = container.querySelector(".ar4-grid__list");
    expect(list).not.toBeNull();

    const items = Array.from(list?.children ?? []);
    const insertIndex = items.findIndex(
      (item) => item.classList.contains("ar4-grid__item--partner"),
    );

    /* After exactly 6 organic cards, before the 7th — 6 divides both the
       2-col and 3-col grids, so no orphan card precedes the insert. */
    expect(insertIndex).toBe(6);
    expect(items.length).toBe(12 + 1);

    /* Organic order is untouched around the insertion point. */
    const organicHtml = items
      .filter((item) => !item.classList.contains("ar4-grid__item--partner"))
      .map((item) => item.innerHTML)
      .join("");
    const firstSix = organicHtml.indexOf("tool-06");
    const seventh = organicHtml.indexOf("tool-07");
    expect(firstSix).toBeGreaterThan(-1);
    expect(seventh).toBeGreaterThan(firstSix);
  });

  it("does not render inside filtered result sets", () => {
    const tools = Array.from({ length: 12 }, (_, i) =>
      makeCatalogTool({ slug: `tool-${String(i + 1).padStart(2, "0")}` }),
    );

    const { container } = render(
      <DefinitiveArchive
        tools={tools}
        filterGroups={CATALOG_FILTER_GROUPS}
        initialQuery="tool-01"
        partnerInsert={
          <div data-testid="partner-insert">Partner Experience</div>
        }
      />,
    );

    expect(container.querySelector(".ar4-grid__item--partner")).toBeNull();
  });
});
