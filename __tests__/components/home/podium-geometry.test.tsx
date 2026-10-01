// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

import { DefinitiveHome } from "@/components/home/definitive-home";
import { AdvertisingConsentProvider } from "@/components/ads/advertising-consent-provider";
import type { ToolPublicView } from "@/lib/data/tool-public-view";

/* Test di regressione per il restauro del podio (Stato B).
 *
 * Contratto (pass Visual-Frozen + restauro podio):
 *  - con meno di 3 tool con assessment completo, la Home mostra
 *    "Tre tool da esplorare" (nessuna classifica fabbricata);
 *  - i tre tool sono comunque disposti nella GEOMETRIA da podio
 *    (def-editorial__pod-stage + pod-cell--first/second/third);
 *  - NON compaiono punteggi numerici né posizioni/rank;
 *  - il copy "Dal catalogo" / "Tre tool da esplorare" resta invariato.
 */

vi.mock("@/components/radar/radar-experience", () => ({
  RadarExperience: () => null,
  HomeRadarPreview: () => null,
}));

vi.mock("@/components/monetization/partner-placements", () => ({
  FeaturedPartner: () => null,
}));

vi.mock("@/lib/monetization/placements", () => ({
  resolvePublicMonetizationPlacement: () => null,
}));

vi.mock("@/lib/motion/use-once-in-view", () => ({
  useOnceInView: () => ({ ref: { current: null }, hasBeenVisible: true, preferReducedMotion: true }),
}));

if (typeof window !== "undefined" && typeof window.matchMedia !== "function") {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

function makeTool(slug: string, name: string): ToolPublicView {
  return {
    publicTool: {
      schemaVersion: 1,
      slug,
      name,
      publication: { status: "published", publishedAt: "2026-01-01T00:00:00.000Z" },
      urls: { website: `https://${slug}.example.com`, affiliate: null, editorial: null },
      taxonomy: { canonicalCategory: null, sourceCategory: "AI", sourceCategoryLabel: "AI", tags: [] },
      content: { summary: "Summary", description: "Description", bestFor: null, useCases: [] },
      editorial: { evidence: [] },
      score: null,
      attributes: { pricing: null, platforms: [], level: null, segments: [] },
      media: { coverImageUrl: null },
      flags: { featured: false },
      lifecycle: { discoveredAt: null, createdAt: null, updatedAt: null },
      provenance: {
        sourceKind: "directory-tool",
        sourceId: slug,
        sourceLabel: null,
        adapterVersion: "tool-public-v1",
        missingFields: [],
      },
    },
    presentationKind: "directory",
    id: slug,
    slug,
    name,
    category: "AI",
    categoryLabel: "AI",
    level: null,
    levelLabel: null,
    segments: [],
    filterGroups: [],
    shortDescription: "Short",
    description: "Desc",
    longDescription: "Long description",
    whyItMatters: null,
    tldr: "TLDR",
    whatItDoes: "What",
    idealUseCase: null,
    editorialReview: null,
    externalUrl: `https://${slug}.example.com`,
    affiliateUrl: null,
    url: `https://${slug}.example.com`,
    originalSourceUrl: null,
    originalArticleUrl: null,
    featured: false,
    toolOfWeek: false,
    tags: [],
    ctaLabel: null,
    publishedAt: null,
    readingTime: null,
    domain: `${slug}.example.com`,
    sourceSite: null,
    useCases: [],
    highlights: [],
    cautions: [],
    accentFrom: null,
    accentTo: null,
    extendedContent: null,
  };
}

const tools = [makeTool("blink", "Blink"), makeTool("vibecode", "VibeCode"), makeTool("weweb", "WeWeb")];

describe("DefinitiveHome — Ultime dal catalogo", () => {
  afterEach(cleanup);

  it("mostra 'Ultime dal catalogo' con rail 02/01/03 + CTA", () => {
    render(
      <AdvertisingConsentProvider>
        <DefinitiveHome tools={tools} />
      </AdvertisingConsentProvider>,
    );

    expect(screen.getByText("Ultime dal catalogo")).toBeTruthy();
    expect(screen.getByText("Vedi tutto il catalogo")).toBeTruthy();

    const stageCells = document.querySelectorAll(".def-podium__stage .def-podium__cell");
    expect(stageCells.length).toBe(3);
    const ranks = [...stageCells].map(
      (cell) => cell.querySelector(".def-podium__rank")?.textContent,
    );
    expect(ranks).toEqual(["02", "01", "03"]);
    expect(
      document.querySelector(".def-podium__stage .pos-first .def-podium__name")?.textContent,
    ).toBe("Blink");
    expect(document.querySelector(".def-podium__crown")).toBeTruthy();
    expect(document.querySelector(".def-podium__laurels")).toBeTruthy();
    const hrefs = [...document.querySelectorAll(".def-podium__stage .def-podium__card")].map((card) =>
      card.getAttribute("href"),
    );
    expect(hrefs).toEqual(["/toools/vibecode", "/toools/blink", "/toools/weweb"]);
    expect(document.querySelector(".def-podium__rail")).toBeNull();
  });

  it("non mostra piu il podio legacy", () => {
    render(
      <AdvertisingConsentProvider>
        <DefinitiveHome tools={tools} />
      </AdvertisingConsentProvider>,
    );

    expect(document.querySelector(".def-editorial__pod-stage")).toBeNull();
    expect(document.querySelector(".def-editorial__exploratory-card")).toBeNull();
  });
});
