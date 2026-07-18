import { describe, expect, it } from "vitest";

import {
  COMPARE_OBJECTIVE_KEYWORDS,
  COMPARE_OBJECTIVE_MAX_DELTA,
  COMPARE_OBJECTIVE_SOURCE_WEIGHTS,
  COMPARE_OBJECTIVES,
  describeCompareObjectiveWeights,
  getCompareObjectiveLabel,
  isCompareObjective,
  type CompareObjective,
} from "@/lib/compare/compare-objective";
import {
  completeToolPublicFixture,
  partialToolPublicFixture,
} from "@/__tests__/fixtures/tool-public";
import {
  getBattleVerdict,
  normalise,
  withBattleScores,
  withObjectiveScores,
  type NormalisedTool,
} from "@/components/tools/tool-battle-shared";
import { createToolPublicView } from "@/lib/data/tool-public-view";
import type { ToolPublic } from "@/lib/types/tool-public";

/* Tool ricco di segnali "save-time" (come nel test adapter B33). */
const gamma: ToolPublic = {
  ...completeToolPublicFixture,
  slug: "gamma-app",
  name: "Gamma",
  taxonomy: {
    canonicalCategory: "Produttività",
    sourceCategory: "Produttività",
    sourceCategoryLabel: "Produttività",
    tags: ["automation", "workflow", "team", "prototype"],
  },
  content: {
    summary: "Automazione completa dei flussi ripetitivi.",
    description: "Gamma automatizza workflow di team con approvazioni tracciate.",
    bestFor: "Team che vogliono automazione workflow completa",
    useCases: [
      "Automazione onboarding",
      "Approvazioni ricorrenti",
      "Sincronizzazione strumenti",
      "Report automatici",
    ],
  },
  editorial: {
    evidence: [
      { kind: "review", text: "Il motore di regole resta leggibile.", sourceField: "editorial_note" },
      { kind: "strength", text: "Automazione workflow completa", sourceField: "strengths" },
      { kind: "strength", text: "Permessi granulari", sourceField: "strengths" },
      { kind: "highlight", text: "Template pronti", sourceField: "highlights" },
    ],
  },
  score: {
    inputs: [
      { dimension: "ease_of_use", level: "strong" },
      { dimension: "workflow_fit", level: "strong" },
      { dimension: "editorial_conviction", level: "solid" },
    ],
    provenance: {
      kind: "editorial-assessment",
      sourceField: "editorial_scorecard",
      methodologyVersion: "editorial-scorecard-v2",
      assessedAt: "2026-07-12T10:00:00.000Z",
    },
  },
  provenance: {
    ...completeToolPublicFixture.provenance,
    sourceId: "tool-gamma",
  },
};

const views = [
  createToolPublicView(completeToolPublicFixture),
  createToolPublicView(gamma),
  createToolPublicView(partialToolPublicFixture),
];

const ALL_OBJECTIVES = COMPARE_OBJECTIVES.map((objective) => objective.key);

function basePipeline(slugs: string[]): NormalisedTool[] {
  return withBattleScores(normalise(views, slugs));
}

describe("compare-objective config (B34)", () => {
  it("dichiara 7 obiettivi con chiavi uniche, label e keyword non vuote", () => {
    expect(ALL_OBJECTIVES).toHaveLength(7);
    expect(new Set(ALL_OBJECTIVES).size).toBe(ALL_OBJECTIVES.length);

    for (const objective of COMPARE_OBJECTIVES) {
      expect(objective.label.trim().length).toBeGreaterThan(0);
      expect(COMPARE_OBJECTIVE_KEYWORDS[objective.key].length).toBeGreaterThan(0);
      expect(getCompareObjectiveLabel(objective.key)).toBe(objective.label);
    }
  });

  it("pesi delle fonti espliciti e ordinati per importanza decrescente", () => {
    const weights = COMPARE_OBJECTIVE_SOURCE_WEIGHTS.map((source) => source.weight);
    expect(weights).toEqual([1.5, 1, 0.75, 0.5]);
    for (const source of COMPARE_OBJECTIVE_SOURCE_WEIGHTS) {
      expect(source.label.trim().length).toBeGreaterThan(0);
    }
  });

  it("isCompareObjective valida chiavi note e scarta il resto", () => {
    for (const key of ALL_OBJECTIVES) {
      expect(isCompareObjective(key)).toBe(true);
    }
    expect(isCompareObjective("neutral")).toBe(false);
    expect(isCompareObjective("")).toBe(false);
    expect(isCompareObjective(null)).toBe(false);
    expect(isCompareObjective(undefined)).toBe(false);
    expect(isCompareObjective(42)).toBe(false);
  });

  it("spiegazione pesi: il neutro dichiara il contratto base B33", () => {
    const lines = describeCompareObjectiveWeights(null);
    expect(lines.join("\n")).toContain("Obiettivo neutro");
    expect(lines.join("\n")).toContain("B33");
    expect(lines.join("\n")).toContain("45%");
  });

  it("spiegazione pesi: ogni obiettivo dichiara delta massimo e pesi fonti", () => {
    for (const key of ALL_OBJECTIVES) {
      const text = describeCompareObjectiveWeights(key).join("\n");
      expect(text).toContain(getCompareObjectiveLabel(key));
      expect(text).toContain(`+${COMPARE_OBJECTIVE_MAX_DELTA} punti`);
      expect(text).toContain("punti di forza ×1,5");
      expect(text).toContain("casi d'uso ×1");
      expect(text).toContain("tag ×0,75");
      expect(text).toContain("categoria ×0,5");
    }
  });
});

describe("compare-objective engine adapter (B34)", () => {
  it.each(ALL_OBJECTIVES)(
    "objective %s: deterministico, limitato e indipendente dall'ordine",
    (objective: CompareObjective) => {
      const slugs = ["atlas-ai", "gamma-app", "partial-tool"];
      const forward = withObjectiveScores(basePipeline(slugs), objective);
      const reversed = withObjectiveScores(basePipeline([...slugs].reverse()), objective);

      const signature = (tools: NormalisedTool[]) =>
        new Map(
          tools.map((tool) => [
            tool.slug,
            {
              objectiveScore: tool.objectiveScore,
              objectiveDelta: tool.objectiveDelta,
              battleScore: tool.battleScore,
              rank: tool.compareScore.rank,
            },
          ]),
        );

      expect(signature(reversed)).toEqual(signature(forward));

      for (const tool of forward) {
        expect(tool.objectiveScore).toBeGreaterThanOrEqual(0);
        expect(tool.objectiveScore).toBeLessThanOrEqual(100);
        expect(tool.objectiveDelta).toBe(
          (tool.objectiveScore ?? tool.battleScore) - tool.battleScore,
        );
        // L'obiettivo non riscrive mai il contratto base B33.
        expect(tool.compareScore.rank).toBeGreaterThan(0);
      }
    },
  );

  it("il boost obiettivo non supera mai il delta massimo configurato", () => {
    for (const objective of ALL_OBJECTIVES) {
      const scored = withObjectiveScores(basePipeline(["gamma-app", "atlas-ai"]), objective);
      for (const tool of scored) {
        expect(Math.abs(tool.objectiveDelta ?? 0)).toBeLessThanOrEqual(
          COMPARE_OBJECTIVE_MAX_DELTA,
        );
      }
    }
  });

  it("obiettivo neutro: riproduce il contratto base B33 (score, rank, explanation)", () => {
    const slugs = ["atlas-ai", "gamma-app", "partial-tool"];
    const base = basePipeline(slugs);
    const neutral = withObjectiveScores(base, null);

    expect(neutral.map((tool) => tool.objectiveScore)).toEqual(
      base.map(() => undefined),
    );
    expect(neutral.map((tool) => tool.objectiveDelta)).toEqual(
      base.map(() => undefined),
    );
    expect(
      neutral.map((tool) => [
        tool.slug,
        tool.battleScore,
        tool.compareScore.rank,
        tool.compareScore.explanation,
      ]),
    ).toEqual(
      base.map((tool) => [
        tool.slug,
        tool.battleScore,
        tool.compareScore.rank,
        tool.compareScore.explanation,
      ]),
    );

    const baseVerdict = getBattleVerdict(base);
    const neutralVerdict = getBattleVerdict(neutral, null);
    expect(neutralVerdict.winner.slug).toBe(baseVerdict.winner.slug);
    expect(neutralVerdict.label).toBe(baseVerdict.label);
    expect(neutralVerdict.reasons).toEqual(baseVerdict.reasons);
  });

  it.each(ALL_OBJECTIVES)(
    "verdetto con objective %s: identico per ogni permutazione dell'input",
    (objective: CompareObjective) => {
      const slugs = ["atlas-ai", "gamma-app", "partial-tool"];
      const verdicts = [slugs, [...slugs].reverse()].map((order) => {
        const verdict = getBattleVerdict(
          withObjectiveScores(basePipeline(order), objective),
          objective,
        );
        return {
          winner: verdict.winner.slug,
          label: verdict.label,
          reasons: verdict.reasons,
          ranks: verdict.scores.map((entry) => [entry.tool.slug, entry.rank]),
        };
      });

      expect(verdicts[1]).toEqual(verdicts[0]);
    },
  );

  it("obiettivo con segnali: il verdetto dichiara l'orientamento", () => {
    const tools = withObjectiveScores(basePipeline(["gamma-app", "atlas-ai"]), "save-time");
    const verdict = getBattleVerdict(tools, "save-time");

    expect(verdict.label).toBe("Verdetto orientato a Risparmiare tempo");
    expect(verdict.reasons.join("\n")).toContain("Risparmiare tempo");
    expect(tools.some((tool) => (tool.objectiveDelta ?? 0) > 0)).toBe(true);
  });

  it("obiettivo senza segnali: il verdetto lo dichiara invece di inventare impatto", () => {
    const tools = withObjectiveScores(
      basePipeline(["partial-tool", "atlas-ai"]),
      "scale",
    );
    const verdict = getBattleVerdict(tools, "scale");

    expect(
      verdict.reasons.some((reason) =>
        reason.includes("Nessun dato specifico per Scalare"),
      ),
    ).toBe(true);
  });
});
