import { describe, expect, it } from "vitest";

import {
  buildAlternativeWhy,
  deriveEditorialScore,
  deriveEssentialDifference,
  deriveScoreDimensions,
  deriveTrend,
  deriveVotes,
} from "@/lib/data/tool-detail-derivation";
import type { ToolPublicView } from "@/lib/data/tool-public-view";
import { completeToolPublicFixture } from "@/__tests__/fixtures/tool-public";

/**
 * Test suite for the Tool Detail v4 derivation helpers.
 *
 * These helpers power the new /toools/[slug] page. They MUST:
 *  - be deterministic (same input → same output)
 *  - never fabricate data (no real PH votes, real Product Hunt rankings, etc.)
 *  - cap outputs at safe, honest ranges (score ∈ [6.0, 9.5], votes >= 18)
 */

function makeTool(overrides: Partial<ToolPublicView> = {}): ToolPublicView {
  return {
    publicTool: completeToolPublicFixture,
    presentationKind: "canonical",
    id: "test-id",
    slug: "blink",
    name: "Blink",
    category: "vibe-coding",
    categoryLabel: "Vibe coding / builder app AI",
    level: "featured",
    levelLabel: "Segnalato",
    segments: ["vibe-coding", "ai-app-builder"],
    filterGroups: ["vibe-coding", "ai-app-builder"],
    shortDescription: "AI app builder che trasforma un'idea in un'app.",
    description: "AI app builder che trasforma un'idea in un'app.",
    longDescription: "AI app builder che trasforma un'idea in un'app.",
    whyItMatters: "Se vuoi validare un'idea in fretta, Blink è il primo da aprire.",
    tldr: "AI app builder rapido.",
    whatItDoes: "Genera app da prompt.",
    idealUseCase: "Validare MVP in ore.",
    editorialReview: "Solido per MVP rapidi.",
    externalUrl: "https://blink.new",
    affiliateUrl: null,
    url: "https://blink.new",
    originalSourceUrl: null,
    originalArticleUrl: null,
    featured: true,
    toolOfWeek: true,
    tags: ["vibe coding", "ai app builder", "prompt-to-app", "web app", "prototype"],
    ctaLabel: "Prova Blink",
    publishedAt: "2026-02-05",
    readingTime: "2 min",
    domain: "blink.new",
    sourceSite: "tooolvibes.com",
    useCases: ["Validare MVP in ore"],
    highlights: ["Dal prompt all'app", "MVP rapido"],
    cautions: [],
    accentFrom: "#6d3bff",
    accentTo: "#43c6ff",
    extendedContent: null,
    ...overrides,
  };
}

describe("deriveEditorialScore (delegates to the editorial-assessment contract)", () => {
  it("does not infer an assessment from name, featured state or tool of the week", () => {
    const result = deriveEditorialScore(makeTool());

    expect(result).toMatchObject({ status: "in_preparation", value: null });
  });

  it("preserves a supported public assessment", () => {
    const tool = makeTool({
      publicTool: {
        ...completeToolPublicFixture,
        score: {
          ...completeToolPublicFixture.score,
          value: 8.4,
          verdict: "Scelta solida per ricerche tracciabili.",
          limitationsAssessed: true,
        },
      },
    });

    expect(deriveEditorialScore(tool)).toMatchObject({
      status: "assessed",
      value: 8.4,
      verdict: "Scelta solida per ricerche tracciabili.",
    });
  });
});

describe("deriveVotes", () => {
  it("does not manufacture a vote count", () => {
    expect(deriveVotes(makeTool())).toBeNull();
  });
});

describe("deriveTrend", () => {
  it("marks unavailable trend evidence explicitly", () => {
    expect(deriveTrend(makeTool())).toEqual({
      value: "Non disponibile",
      direction: "flat",
    });
  });
});

describe("deriveScoreDimensions", () => {
  it("returns no dimensions while the assessment is not supported", () => {
    expect(deriveScoreDimensions(makeTool())).toEqual([]);
  });

  it("uses only explicit assessment inputs", () => {
    const tool = makeTool({
      publicTool: {
        ...completeToolPublicFixture,
        score: {
          ...completeToolPublicFixture.score,
          value: 8.4,
          verdict: "Scelta solida per ricerche tracciabili.",
          limitationsAssessed: true,
        },
      },
    });

    expect(deriveScoreDimensions(tool)).toEqual([
      { label: "ease of use", value: "Solido" },
      { label: "editorial conviction", value: "Forte" },
    ]);
  });
});

describe("buildAlternativeWhy", () => {
  it("uses the authored description for a tool with a different filter group", () => {
    const current = makeTool({ name: "Blink" });
    const alt = makeTool({
      slug: "vibecode",
      name: "VibeCode",
      filterGroups: ["no-code"],
      toolOfWeek: false,
      featured: false,
    });
    const why = buildAlternativeWhy(current, alt);
    expect(why).toBe(alt.shortDescription);
  });

  it("uses the authored description instead of inferring benefits from a higher level", () => {
    const current = makeTool({ name: "Blink", level: "intermediate" });
    const alt = makeTool({ slug: "vibecode", name: "VibeCode", level: "expert" });
    const why = buildAlternativeWhy(current, alt);
    expect(why).toBe(alt.shortDescription);
  });

  it("omits generic complementary copy when there is no real difference", () => {
    const current = makeTool({ name: "Blink" });
    const alt = makeTool({
      slug: "same",
      name: "Same",
      filterGroups: ["vibe-coding"],
      tags: [],
      level: null,
      toolOfWeek: false,
      featured: false,
    });
    const why = buildAlternativeWhy(current, alt);
    expect(why).toBeNull();
  });
});

describe("deriveEssentialDifference", () => {
  it("returns a unique level or group fact", () => {
    const current = makeTool({ name: "Blink", level: "intermediate" });
    const expert = makeTool({ slug: "vibecode", name: "VibeCode", level: "expert" });
    expect(deriveEssentialDifference(current, expert)).toBe("Livello avanzato");

    const beginner = makeTool({ slug: "easy", name: "Easy", level: "beginner" });
    expect(deriveEssentialDifference(current, beginner)).toBe("Livello base");

    const grouped = makeTool({
      slug: "nocode",
      name: "NoCode",
      filterGroups: ["no-code"],
      level: current.level,
    });
    expect(deriveEssentialDifference(current, grouped)).toBe("No Code");
  });

  it("returns a unique tag when that is the only fact", () => {
    const current = makeTool({
      name: "Blink",
      filterGroups: ["vibe-coding"],
      tags: ["vibe coding"],
      level: "featured",
    });
    const alt = makeTool({
      slug: "other",
      name: "Other",
      filterGroups: ["vibe-coding"],
      tags: ["vibe coding", "prototype"],
      level: "featured",
      toolOfWeek: false,
      featured: false,
    });
    expect(deriveEssentialDifference(current, alt)).toBe("prototype");
  });

  it("returns null instead of fake Complementare or In evidenza copy", () => {
    const current = makeTool({ name: "Blink" });
    const featuredOnly = makeTool({
      slug: "same",
      name: "Same",
      filterGroups: current.filterGroups,
      tags: current.tags,
      level: current.level,
      toolOfWeek: true,
      featured: true,
      categoryLabel: "Vibe coding / builder app AI",
    });
    expect(deriveEssentialDifference(current, featuredOnly)).toBeNull();

    const noFact = makeTool({
      slug: "blank",
      name: "Blank",
      filterGroups: ["vibe-coding"],
      tags: [],
      level: null,
      toolOfWeek: false,
      featured: false,
      categoryLabel: "",
    });
    expect(deriveEssentialDifference(current, noFact)).toBeNull();
  });
});
