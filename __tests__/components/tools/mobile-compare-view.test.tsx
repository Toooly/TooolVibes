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

    const accordion = document.querySelector(".compare-factor-accordion");
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

    const emptyMessage = document.querySelector(".compare-factor-accordion__empty");
    expect(emptyMessage).toBeTruthy();
    expect(emptyMessage!.textContent).toContain("Seleziona un obiettivo");
  });
});


/* ---------- Adaptive matrix: content-driven rows, no clipping, tool counts ---------- */

type ToolCountMode = 2 | 3 | 4 | 5;

function buildTools(count: ToolCountMode): NormalisedTool[] {
  return Array.from({ length: count }, (_, i) =>
    buildTool({
      slug: `tool-${i}`,
      name: `Tool ${i}`,
      objectiveScore: 7.5 - i * 0.3,
      objectiveRank: i + 1,
    }),
  );
}

function buildVerdictFromTools(tools: NormalisedTool[]): BattleVerdict {
  return {
    state: "editorial_lead" as BattleVerdict["state"],
    label: "Esito comparativo",
    winner: tools[0],
    scores: tools.map((t) => ({ tool: t, score: t.battleScore ?? 8, rank: (t.objectiveRank ?? 1) })),
    reasons: ["Reason A", "Reason B"],
  };
}

describe("Adaptive matrix — content-driven rows", () => {
  afterEach(() => {
    cleanup();
  });

  it("le righe della matrice non hanno overflow:hidden", () => {
    const tools = buildTools(3);
    render(
      <DiffMatrix tools={tools} objective={Q} verdict={buildVerdictFromTools(tools)} />,
    );

    const rows = document.querySelectorAll(".compare-factor-matrix__row");
    for (const row of rows) {
      const style = window.getComputedStyle(row);
      expect(style.overflow).not.toBe("hidden");
    }
  });

  it("le celle summary (__matrix-long) non hanno line-clamp", () => {
    const tools = buildTools(3);
    render(
      <DiffMatrix tools={tools} objective={Q} verdict={buildVerdictFromTools(tools)} />,
    );

    const longCells = document.querySelectorAll(".compare-factor-matrix__long");
    for (const cell of longCells) {
      const style = window.getComputedStyle(cell);
      const clamp = style.webkitLineClamp;
      expect(clamp === "" || clamp === "none").toBe(true);
      expect(style.overflow).not.toBe("hidden");
    }
  });

  it("le celle della matrice hanno height:auto (nessuna altezza fissa)", () => {
    const tools = buildTools(3);
    render(
      <DiffMatrix tools={tools} objective={Q} verdict={buildVerdictFromTools(tools)} />,
    );

    const cells = document.querySelectorAll(".compare-factor-matrix__cell");
    for (const cell of cells) {
      const style = window.getComputedStyle(cell);
      const mh = style.minHeight;
      expect(mh === "" || mh === "auto").toBe(true);
    }
  });

  it("le factor bar sono renderizzate con role=meter preservato", () => {
    const tools = buildTools(3);
    render(
      <DiffMatrix tools={tools} objective={Q} verdict={buildVerdictFromTools(tools)} />,
    );

    const meters = document.querySelectorAll('[role="meter"]');
    expect(meters.length).toBe(tools.length * 6);
    for (const meter of meters) {
      expect(meter.getAttribute("aria-valuemin")).toBe("1");
      expect(meter.getAttribute("aria-valuemax")).toBe("5");
      expect(meter.getAttribute("aria-label")).toBeTruthy();
    }
  });

  it("2 tool: la matrice esiste ed è leggibile", () => {
    const tools = buildTools(2);
    render(
      <DiffMatrix tools={tools} objective={Q} verdict={buildVerdictFromTools(tools)} />,
    );

    const matrix = document.querySelector(".compare-factor-matrix");
    expect(matrix).toBeTruthy();
    expect(matrix!.getAttribute("data-count")).toBe("2");

    const cells = document.querySelectorAll(".compare-factor-matrix__cell");
    expect(cells.length).toBeGreaterThanOrEqual(2);
  });

  it("3 tool: la matrice esiste con 3 colonne", () => {
    const tools = buildTools(3);
    render(
      <DiffMatrix tools={tools} objective={Q} verdict={buildVerdictFromTools(tools)} />,
    );

    const matrix = document.querySelector(".compare-factor-matrix");
    expect(matrix!.getAttribute("data-count")).toBe("3");
  });

  it("4 tool: la matrice esiste con 4 colonne", () => {
    const tools = buildTools(4);
    render(
      <DiffMatrix tools={tools} objective={Q} verdict={buildVerdictFromTools(tools)} />,
    );

    const matrix = document.querySelector(".compare-factor-matrix");
    expect(matrix!.getAttribute("data-count")).toBe("4");
  });

  it("5 tool: la matrice esiste con 5 colonne e grid scrollabile", () => {
    const tools = buildTools(5);
    render(
      <DiffMatrix tools={tools} objective={Q} verdict={buildVerdictFromTools(tools)} />,
    );

    const matrix = document.querySelector(".compare-factor-matrix");
    expect(matrix!.getAttribute("data-count")).toBe("5");

    const grid = document.querySelector(".compare-factor-matrix__rows");
    expect(grid!.getAttribute("data-scrollable")).toBe("true");
  });

  it("data-count corrisponde al numero di tool (2–5)", () => {
    for (const count of [2, 3, 4, 5] as ToolCountMode[]) {
      const tools = buildTools(count);
      render(
        <DiffMatrix tools={tools} objective={Q} verdict={buildVerdictFromTools(tools)} />,
      );

      const matrix = document.querySelector(".compare-factor-matrix");
      expect(matrix).toBeTruthy();
      expect(matrix!.getAttribute("data-count")).toBe(String(count));

      cleanup();
    }
  });

  it("data-count e --tool-count coesistono senza selettori fragili nello style", () => {
    const tools = buildTools(3);
    render(
      <DiffMatrix tools={tools} objective={Q} verdict={buildVerdictFromTools(tools)} />,
    );

    const matrix = document.querySelector(".compare-factor-matrix") as HTMLElement;
    expect(matrix).toBeTruthy();
    expect(matrix.getAttribute("data-count")).toBe("3");
    expect(matrix.style.getPropertyValue("--tool-count")).toBe("3");
  });

  it("5 tool: data-scrollable='true' sulla grid", () => {
    const tools = buildTools(5);
    render(
      <DiffMatrix tools={tools} objective={Q} verdict={buildVerdictFromTools(tools)} />,
    );

    const grid = document.querySelector(".compare-factor-matrix__rows");
    expect(grid!.getAttribute("data-scrollable")).toBe("true");
  });

  it("Nota decisiva: le celle matrix-long non sono troncate (no line-clamp)", () => {
    const tools = buildTools(4);
    render(
      <DiffMatrix tools={tools} objective={Q} verdict={buildVerdictFromTools(tools)} />,
    );

    const longCells = document.querySelectorAll(".compare-factor-matrix__long");
    for (const cell of longCells) {
      const style = window.getComputedStyle(cell);
      const clamp = style.webkitLineClamp;
      expect(clamp === "" || clamp === "none").toBe(true);
      expect(style.overflow).not.toBe("hidden");
    }
  });

  it("factor bars contengono tutte e 6 le dimensioni", () => {
    const tools = buildTools(2);
    render(
      <DiffMatrix tools={tools} objective={Q} verdict={buildVerdictFromTools(tools)} />,
    );

    const factorRows = document.querySelectorAll(".compare-factor-matrix__row");
    expect(factorRows.length).toBe(6);

    for (const row of factorRows) {
      const cells = row.querySelectorAll(".compare-factor-matrix__factor-cell");
      expect(cells.length).toBe(tools.length);
    }
  });
});
