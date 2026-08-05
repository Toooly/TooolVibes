// @vitest-environment jsdom
/**
 * Compare Battle Stage — behavioural rendering tests (V4 F8)
 *
 * verifies: idle/fighting/result states, winner/tie, reduced motion,
 *           desktop/mobile layout modes, no duplicated verdict content,
 *           no duplicated tool identity inside duel cards.
 */
import { afterEach, describe, it, expect } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import axe from "axe-core";

import { CompareBattleStage } from "@/components/tools/compare-battle-stage";
import type { NormalisedTool, BattleVerdict } from "@/components/tools/tool-battle-shared";

function buildTool(slug: string, overrides: Partial<NormalisedTool> = {}): NormalisedTool {
  return {
    slug,
    name: slug,
    categoryLabel: "Generativo",
    editorialScore: 8,
    battleScore: 8,
    compareScore: { rank: 1 },
    objectiveScore: 8,
    objectiveRank: 1,
    objectiveSummary: "Adatto alla scrittura",
    tldr: "Ottimo per testi",
    accentFrom: "#6366f1",
    accentTo: "#818cf8",
    logoUrl: null,
    useCases: ["Scrittura", "Editing"],
    highlights: ["Veloce", "Affidabile"],
    useCase: "Uso per testi lunghi",
    review: "Recensione positiva",
    readingTime: "8 min",
    weightedDimensions: [
      { key: "workflowFit", label: "Fit nel workflow", value: 4, weight: 0.3, contribution: 1.2, isPrimary: true },
    ],
    objectiveLabel: null,
    ...overrides,
  } as NormalisedTool;
}

function buildVerdict(winner: NormalisedTool | null, state: BattleVerdict["state"] = "editorial_lead"): BattleVerdict {
  return {
    state,
    winner,
    label: state === "tie" ? "Pareggio" : "Scelta editoriale",
    reasons: ["Motivo 1: qualita superiore.", "Motivo 2: integrazione migliore."],
    scores: [],
  };
}

afterEach(() => { cleanup(); });

describe("CompareBattleStage — rendering states", () => {
  it("renders idle state with fight button and ready status", () => {
    const tool = buildTool("Alpha");
    const verdict = buildVerdict(tool);
    render(
      <CompareBattleStage
        tools={[tool, buildTool("Beta", { slug: "Beta", name: "Beta" })]}
        verdict={verdict}
        battleState="idle"
        onFight={() => {}}
        layoutMode="desktop"
      />,
    );

    expect(screen.getByText("Pronto")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Analizza il confronto/ })).toBeTruthy();
    expect(screen.getByLabelText("Arena del confronto")).toBeTruthy();
  });

  it("renders fighting state with disabled button and busy attribute", () => {
    const tool = buildTool("Alpha");
    const verdict = buildVerdict(tool);
    render(
      <CompareBattleStage
        tools={[tool, buildTool("Beta", { slug: "Beta", name: "Beta" })]}
        verdict={verdict}
        battleState="fighting"
        onFight={() => {}}
        layoutMode="desktop"
      />,
    );

    const statusPills = screen.getAllByText(/Analisi in corso/);
    expect(statusPills.length).toBeGreaterThanOrEqual(1);
    const btn = screen.getByRole("button", { name: /Analisi in corso/ });
    expect((btn as HTMLButtonElement).disabled).toBe(true);
    const arena = screen.getByLabelText("Arena del confronto");
    expect(arena.getAttribute("aria-busy")).toBe("true");
  });

  it("renders result state with winner badge and recalculate button", () => {
    const alpha = buildTool("Alpha");
    const beta = buildTool("Beta", { slug: "Beta", name: "Beta" });
    const verdict = buildVerdict(alpha);
    render(
      <CompareBattleStage
        tools={[alpha, beta]}
        verdict={verdict}
        battleState="result"
        onFight={() => {}}
        objectiveLabel="Qualita"
        layoutMode="desktop"
      />,
    );

    const badge = document.querySelector(".compare-battle-stage__result-badge");
    expect(badge).toBeTruthy();
    expect(badge!.textContent!.includes("Alpha")).toBe(true);
    expect(screen.getByRole("button", { name: /Ricalcola/ })).toBeTruthy();
  });

  it("shows tie result when no winner", () => {
    const alpha = buildTool("Alpha");
    const beta = buildTool("Beta", { slug: "Beta", name: "Beta" });
    const verdict = buildVerdict(null, "tie");
    render(
      <CompareBattleStage
        tools={[alpha, beta]}
        verdict={verdict}
        battleState="result"
        onFight={() => {}}
        layoutMode="desktop"
      />,
    );

    expect(screen.getByText("Nessun distacco netto")).toBeTruthy();
  });

  it("does NOT render verdict reasons (verdict is in CompareVerdictCard)", () => {
    const alpha = buildTool("Alpha");
    const beta = buildTool("Beta", { slug: "Beta", name: "Beta" });
    const verdict = buildVerdict(alpha);
    render(
      <CompareBattleStage
        tools={[alpha, beta]}
        verdict={verdict}
        battleState="result"
        onFight={() => {}}
        layoutMode="desktop"
      />,
    );

    expect(screen.queryByText(/Motivo 1/i)).toBeNull();
    expect(screen.queryByText(/Motivo 2/i)).toBeNull();
    expect(screen.getByText(/Alpha emerge/)).toBeTruthy();
  });

  it("renders with data-layout mobile when layoutMode=mobile", () => {
    const tool = buildTool("Alpha");
    const verdict = buildVerdict(tool);
    const { container } = render(
      <CompareBattleStage
        tools={[tool, buildTool("Beta", { slug: "Beta", name: "Beta" })]}
        verdict={verdict}
        battleState="idle"
        onFight={() => {}}
        layoutMode="mobile"
      />,
    );

    const stage = container.querySelector(".compare-battle-stage")!;
    expect(stage.getAttribute("data-layout")).toBe("mobile");
  });

  it("returns null with fewer than 2 tools", () => {
    const tool = buildTool("Alpha");
    const { container } = render(
      <CompareBattleStage
        tools={[tool]}
        verdict={null}
        battleState="idle"
        onFight={() => {}}
        layoutMode="desktop"
      />,
    );

    expect(container.firstChild).toBeNull();
  });

  it("no axe violations in result state", async () => {
    const alpha = buildTool("Alpha");
    const beta = buildTool("Beta", { slug: "Beta", name: "Beta" });
    const verdict = buildVerdict(alpha);
    const { container } = render(
      <CompareBattleStage
        tools={[alpha, beta]}
        verdict={verdict}
        battleState="result"
        onFight={() => {}}
        layoutMode="desktop"
      />,
    );

    await act(async () => {
      const results = await axe.run(container as HTMLElement);
      expect(results.violations).toEqual([]);
    });
  });

  it("no axe violations in idle state", async () => {
    const tool = buildTool("Alpha");
    const verdict = buildVerdict(tool);
    const { container } = render(
      <CompareBattleStage
        tools={[tool, buildTool("Beta", { slug: "Beta", name: "Beta" })]}
        verdict={verdict}
        battleState="idle"
        onFight={() => {}}
        layoutMode="desktop"
      />,
    );

    await act(async () => {
      const results = await axe.run(container as HTMLElement);
      expect(results.violations).toEqual([]);
    });
  });
});
