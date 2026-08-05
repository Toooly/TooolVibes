// @vitest-environment jsdom

import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { DiffMatrix } from "@/components/tools/mobile-compare-view";
import type {
  BattleVerdict,
  NormalisedTool,
} from "@/components/tools/tool-battle-shared";
import type { WeightedDimension } from "@/lib/compare/objective-fit";
import type { CompareObjective } from "@/lib/compare/compare-objective";
import type { CompareScoreResult } from "@/lib/compare/compare-score";



/* ---------- test builders ---------- */
function buildWeightedDimensions(): WeightedDimension[] {
  return [
    { key: "workflowFit", label: "Fit nel workflow", value: 4, weight: 0.1, contribution: 0.40, isPrimary: true },
    { key: "easeOfUse", label: "Velocita di adozione", value: 5, weight: 0.15, contribution: 0.75, isPrimary: true },
    { key: "versatility", label: "Ampiezza d'uso", value: 3, weight: 0.05, contribution: 0.15, isPrimary: false },
    { key: "experienceQuality", label: "Qualita esperienza/output", value: 4, weight: 0.12, contribution: 0.48, isPrimary: true },
    { key: "operationalMaturity", label: "Controllo e maturita", value: 3, weight: 0.08, contribution: 0.24, isPrimary: false },
    { key: "experimentationSpeed", label: "Velocita di validazione", value: 4, weight: 0.10, contribution: 0.40, isPrimary: false },
  ];
}

function buildCompareScore(slug: string, name: string): CompareScoreResult {
  return {
    version: "compare-score-v3-trust" as typeof import("@/lib/compare/compare-score").COMPARE_SCORE_VERSION,
    slug,
    name,
    total: 8,
    rank: 1,
    assessment: { state: "verified" as import("@/lib/compare/compare-score").CompareAssessmentState, missing: [] },
    confidence: { level: "high", coverage: 1, missing: [] },
    components: [],
    explanation: [],
  };
}

function buildTool(overrides: Partial<NormalisedTool> = {}): NormalisedTool {
  const slug = (overrides.slug as string) ?? "test-slug";
  const name = (overrides.name as string) ?? "Test Tool";
  return {
    slug,
    name,
    category: "category",
    categoryLabel: "Category",
    score: 8,
    editorialScore: 8,
    battleScore: 8,
    compareScore: buildCompareScore(slug, name),
    accentFrom: "#6a3cff",
    accentTo: "#6a3cff",
    tldr: "Test TLDR",
    useCase: "Test use case",
    review: "Test review",
    highlights: ["highlight1"],
    useCases: ["useCase1"],
    tags: ["tag1"],
    readingTime: "5 min",
    url: "https://example.com",
    logoUrl: "",
    isDirectory: false,
    useCasesCount: 1,
    weightedDimensions: buildWeightedDimensions(),
    objectiveScore: 7.5,
    objectiveRawScore: 7.5,
    objectiveRank: 1,
    ...overrides,
  };
}

function buildVerdict(overrides: Partial<BattleVerdict> = {}): BattleVerdict {
  return {
    state: "editorial_lead",
    label: "Esito comparativo",
    winner: null,
    scores: [],
    reasons: ["Reason 1", "Reason 2"],
    ...overrides,
  };
}

const Q: CompareObjective = "quality";
const ST: CompareObjective = "save-time";

describe("MobileCompareView — accessibility della factor bar (P2 fix)", () => {
  afterEach(() => {
    cleanup();
  });

  it("rende le factor bar con role=meter e aria-label completi", () => {
    const tool1 = buildTool({ slug: "alpha", name: "Alpha" });
    const tool2 = buildTool({ slug: "beta", name: "Beta" });

    render(
      <DiffMatrix
        tools={[tool1, tool2]}
        objective={Q}
        verdict={buildVerdict({ winner: tool1 })}
        mobile={true}
      />,
    );

    const accordion = document.querySelector(".mobile-factor-accordion");
    expect(accordion).toBeTruthy();

    const meters = accordion!.querySelectorAll('[role="meter"]');
    expect(meters.length).toBeGreaterThanOrEqual(2);

    for (const meter of meters) {
      expect(meter.getAttribute("aria-valuemin")).toBe("1");
      expect(meter.getAttribute("aria-valuemax")).toBe("5");
      const now = Number(meter.getAttribute("aria-valuenow"));
      expect(now).toBeGreaterThanOrEqual(1);
      expect(now).toBeLessThanOrEqual(5);

      const label = meter.getAttribute("aria-label") ?? "";
      expect(label).toBeTruthy();
      expect(label).toMatch(/Alpha|Beta/);
      expect(label).toMatch(/valore [1-5] su 5, peso \d+%, contributo \d+\.\d{2}/);
    }
  });

  it("nessun aria-hidden=true sul meter nella factor bar", () => {
    const tool1 = buildTool({ slug: "alpha", name: "Alpha" });
    const tool2 = buildTool({ slug: "beta", name: "Beta" });

    render(
      <DiffMatrix
        tools={[tool1, tool2]}
        objective={Q}
        verdict={buildVerdict()}
        mobile={true}
      />,
    );

    const meters = document.querySelectorAll('[role="meter"]');
    for (const meter of meters) {
      expect(meter.getAttribute("aria-hidden")).toBeNull();
    }
  });

  it("il valore canonico 1-5 rimane invariato con obiettivo diverso", () => {
    const tool1 = buildTool({ slug: "alpha", name: "Alpha" });
    const tool2 = buildTool({ slug: "beta", name: "Beta" });

    const { rerender } = render(
      <DiffMatrix
        tools={[tool1, tool2]}
        objective={Q}
        verdict={buildVerdict()}
        mobile={true}
      />,
    );

    const metersQuality = document.querySelectorAll('[role="meter"]');
    expect(metersQuality.length).toBeGreaterThanOrEqual(2);

    rerender(
      <DiffMatrix
        tools={[tool1, tool2]}
        objective={ST}
        verdict={buildVerdict()}
        mobile={true}
      />,
    );

    const metersTime = document.querySelectorAll('[role="meter"]');
    expect(metersTime.length).toBeGreaterThanOrEqual(2);

    for (const meter of metersTime) {
      const now = Number(meter.getAttribute("aria-valuenow"));
      expect(now).toBeGreaterThanOrEqual(1);
      expect(now).toBeLessThanOrEqual(5);
    }
  });

  it("il label contiene nome tool, fattore, valore, peso e contributo", () => {
    const tool1 = buildTool({ slug: "alpha", name: "Alpha" });
    const tool2 = buildTool({ slug: "beta", name: "Beta" });

    render(
      <DiffMatrix
        tools={[tool1, tool2]}
        objective={Q}
        verdict={buildVerdict()}
        mobile={true}
      />,
    );

    const meters = document.querySelectorAll('[role="meter"]');
    for (const meter of meters) {
      const label = meter.getAttribute("aria-label") ?? "";
      expect(label).toMatch(/Alpha|Beta/);
      expect(label).toMatch(/valore [1-5] su 5/);
      expect(label).toMatch(/peso \d+%/);
      expect(label).toMatch(/contributo \d+\.\d{2}/);
    }
  });

  it("tool senza weightedDimensions mostra messaggio vuoto, non meter falsi", () => {
    const tool1 = buildTool({ slug: "empty1", name: "Empty1", weightedDimensions: undefined });
    const tool2 = buildTool({ slug: "empty2", name: "Empty2", weightedDimensions: undefined });

    render(
      <DiffMatrix
        tools={[tool1, tool2]}
        objective={Q}
        verdict={buildVerdict()}
        mobile={true}
      />,
    );

    const meters = document.querySelectorAll('[role="meter"]');
    expect(meters.length).toBe(0);

    const emptyMessage = document.querySelector(".mobile-factor-accordion__empty");
    expect(emptyMessage).toBeTruthy();
    expect(emptyMessage!.textContent).toContain("Seleziona un obiettivo");
  });
});
