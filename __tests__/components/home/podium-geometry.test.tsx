// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

import { DefinitiveHome } from "@/components/home/definitive-home";
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

describe("DefinitiveHome — podio geometria (Stato B)", () => {
  afterEach(cleanup);

  it("mostra 'Tre tool da esplorare' senza rank/score quando meno di 3 tool sono valutati", () => {
    render(<DefinitiveHome tools={tools} />);

    expect(screen.getByText("Dal catalogo")).toBeTruthy();
    expect(screen.getByText("Tre tool da esplorare.")).toBeTruthy();

    // Nessun punteggio numerico e nessuna posizione/rank.
    expect(document.querySelector(".def-editorial__pod-rank")).toBeNull();
    expect(document.querySelector(".def-editorial__pod-score")).toBeNull();

    // Nessuna dichiarazione di classifica.
    expect(document.querySelector(".def-editorial__pod-eyebrow")?.textContent).not.toContain("Classifica");
  });

  it("dispone i tre tool nella geometria da podio (stage + tre cellule)", () => {
    render(<DefinitiveHome tools={tools} />);

    const stage = document.querySelector(".def-editorial__pod-stage");
    expect(stage).not.toBeNull();

    const cells = document.querySelectorAll(".def-editorial__pod-cell");
    expect(cells.length).toBe(3);

    expect(document.querySelector(".def-editorial__pod-cell--first")).not.toBeNull();
    expect(document.querySelector(".def-editorial__pod-cell--second")).not.toBeNull();
    expect(document.querySelector(".def-editorial__pod-cell--third")).not.toBeNull();

    // Tre card esplorative presenti.
    expect(document.querySelectorAll(".def-editorial__exploratory-card").length).toBe(3);
  });
});
