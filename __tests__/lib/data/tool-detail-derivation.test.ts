import { describe, expect, it } from "vitest";

import {
  buildAlternativeWhy,
  deriveEditorialScore,
  deriveScoreDimensions,
  deriveTrend,
  deriveVotes,
} from "@/lib/data/tool-detail-derivation";
import type { ToolPublicView } from "@/lib/data/tool-public-view";

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
    publicTool: {} as ToolPublicView["publicTool"],
    presentationKind: "canonical",
    id: "test-id",
    slug: "blink",
    name: "Blink",
    category: "vibe-coding",
    categoryLabel: "Vibe coding / builder app AI",
    level: "featured",
    levelLabel: "In evidenza",
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
    ...overrides,
  };
}

describe("deriveEditorialScore (delegates to canonical computeEditorialScore)", () => {
  it("returns 8.4 for Blink (matches Archive card)", () => {
    const result = deriveEditorialScore({ name: "Blink", toolOfWeek: true });
    expect(result.value).toBe(8.4);
    expect(result.label).toBe("Solido");
  });

  it("is deterministic — same input → same output", () => {
    const tool = makeTool();
    expect(deriveEditorialScore(tool)).toEqual(deriveEditorialScore(tool));
  });

  it("never exceeds 9.5 even with all bonuses", () => {
    const tool = makeTool({ toolOfWeek: true, featured: true, level: "featured" });
    const result = deriveEditorialScore(tool);
    expect(result.value).toBeLessThanOrEqual(9.5);
  });

  it("never drops below 6.8", () => {
    const tool = makeTool({ toolOfWeek: false, featured: false, level: "beginner", name: "X" });
    const result = deriveEditorialScore(tool);
    expect(result.value).toBeGreaterThanOrEqual(6.8);
  });
});

describe("deriveVotes", () => {
  it("returns a positive integer >= 18", () => {
    const votes = deriveVotes(makeTool());
    expect(votes).toBeGreaterThanOrEqual(18);
    expect(votes).toBeLessThan(200);
  });

  it("is deterministic", () => {
    expect(deriveVotes(makeTool())).toBe(deriveVotes(makeTool()));
  });
});

describe("deriveTrend", () => {
  it("returns one of the 5 known trend values", () => {
    const values = ["+24%", "+82%", "+6%", "—", "-3%"];
    for (let i = 0; i < 10; i++) {
      const tool = makeTool({ name: `Tool${i}` });
      const trend = deriveTrend(tool);
      expect(values).toContain(trend.value);
      expect(["up", "down", "flat"]).toContain(trend.direction);
    }
  });
});

describe("deriveScoreDimensions", () => {
  it("returns 4 dimensions", () => {
    const dims = deriveScoreDimensions(makeTool());
    expect(dims).toHaveLength(4);
  });

  it("marks Velocità as Alta for toolOfWeek/featured", () => {
    const dims = deriveScoreDimensions(makeTool({ toolOfWeek: true }));
    expect(dims.find((d) => d.label === "Velocità")?.value).toBe("Alta");
  });

  it("marks Curva as Impegnativa for expert", () => {
    const dims = deriveScoreDimensions(makeTool({ level: "expert" }));
    expect(dims.find((d) => d.label === "Curva")?.value).toBe("Impegnativa");
  });

  it("marks Flessibilità as Ampia when tags > 4", () => {
    const dims = deriveScoreDimensions(makeTool({ tags: ["a", "b", "c", "d", "e"] }));
    expect(dims.find((d) => d.label === "Flessibilità")?.value).toBe("Ampia");
  });

  it("marks Supporto as Editoriale when editorialReview present", () => {
    const dims = deriveScoreDimensions(makeTool({ editorialReview: "x" }));
    expect(dims.find((d) => d.label === "Supporto")?.value).toBe("Editoriale TooolVibes");
  });
});

describe("buildAlternativeWhy", () => {
  it("mentions the current tool name", () => {
    const current = makeTool({ name: "Blink" });
    // alt has a different filterGroup so we exercise the "Approccio diverso" branch
    const alt = makeTool({
      slug: "vibecode",
      name: "VibeCode",
      filterGroups: ["no-code"],
      toolOfWeek: false,
      featured: false,
    });
    const why = buildAlternativeWhy(current, alt);
    expect(why).toContain("Blink");
  });

  it("mentions higher level when alt is expert", () => {
    const current = makeTool({ name: "Blink", level: "intermediate" });
    const alt = makeTool({ slug: "vibecode", name: "VibeCode", level: "expert" });
    const why = buildAlternativeWhy(current, alt);
    expect(why).toMatch(/avanzata|stretto/i);
  });

  it("falls back to a default when no clear differentiator", () => {
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
    expect(why).toContain("Blink");
  });
});
