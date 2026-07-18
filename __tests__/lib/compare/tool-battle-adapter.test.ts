import { describe, expect, it } from "vitest";

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

const beta: ToolPublic = {
  ...completeToolPublicFixture,
  slug: "beta-clone",
  name: "Beta Clone",
  provenance: {
    ...completeToolPublicFixture.provenance,
    sourceId: "tool-beta",
  },
};

const sparse: ToolPublic = {
  ...partialToolPublicFixture,
  slug: "sparse-tool",
  name: "Sparse Tool",
  provenance: {
    ...partialToolPublicFixture.provenance,
    sourceId: "tool-sparse",
  },
};

const views = [
  createToolPublicView(completeToolPublicFixture),
  createToolPublicView(gamma),
  createToolPublicView(beta),
  createToolPublicView(partialToolPublicFixture),
  createToolPublicView(sparse),
];

function permutations<T>(items: T[]): T[][] {
  if (items.length <= 1) return [items];

  return items.flatMap((item, index) =>
    permutations([...items.slice(0, index), ...items.slice(index + 1)]).map((rest) => [
      item,
      ...rest,
    ]),
  );
}

function battlePipeline(slugs: string[]): NormalisedTool[] {
  return withBattleScores(normalise(views, slugs));
}

describe("tool-battle adapter sul nuovo scoring contract (B33)", () => {
  it("normalise + withBattleScores: le permutazioni di compareSlugs non cambiano score e rank", () => {
    const slugs = ["atlas-ai", "gamma-app", "partial-tool"];
    const signatures = permutations(slugs).map((order) =>
      battlePipeline(order)
        .map((tool) => ({
          slug: tool.slug,
          battleScore: tool.battleScore,
          rank: tool.compareScore.rank,
          explanation: tool.compareScore.explanation,
        }))
        .sort((a, b) => (a.slug < b.slug ? -1 : 1)),
    );

    for (const signature of signatures) {
      expect(signature).toEqual(signatures[0]);
    }
  });

  it("il verdetto è identico per ogni permutazione dell'input", () => {
    const slugs = ["atlas-ai", "gamma-app", "partial-tool"];
    const verdicts = permutations(slugs).map((order) => {
      const verdict = getBattleVerdict(battlePipeline(order));

      return {
        winner: verdict.winner.slug,
        label: verdict.label,
        reasons: verdict.reasons,
        ranks: verdict.scores.map((entry) => [entry.tool.slug, entry.rank]),
      };
    });

    for (const verdict of verdicts) {
      expect(verdict).toEqual(verdicts[0]);
    }

    expect(verdicts[0].winner).toBe("gamma-app");
  });

  it("pareggio perfetto: il vincitore è deciso dallo slug, non dall'ordine", () => {
    const forward = getBattleVerdict(battlePipeline(["atlas-ai", "beta-clone"]));
    const reversed = getBattleVerdict(battlePipeline(["beta-clone", "atlas-ai"]));

    expect(forward.winner.slug).toBe("atlas-ai");
    expect(reversed.winner.slug).toBe("atlas-ai");
    expect(reversed.reasons).toEqual(forward.reasons);
  });

  it("dati insufficienti: il verdetto lo dichiara invece di fingere precisione", () => {
    const verdict = getBattleVerdict(battlePipeline(["partial-tool", "sparse-tool"]));

    expect(verdict.label).toBe("Verdetto provvisorio: dati insufficienti");
    expect(verdict.reasons[0]).toContain("confidence bassa");
    expect(verdict.reasons[0]).toContain("copertura dati al 0%");
    expect(verdict.winner.battleScore).toBe(0);
  });

  it("confidence media/alta: la dicitura appare solo quando la copertura è ridotta", () => {
    const richVerdict = getBattleVerdict(battlePipeline(["gamma-app", "atlas-ai"]));
    expect(richVerdict.reasons.join("\n")).not.toContain("confidence");

    const mixedVerdict = getBattleVerdict(battlePipeline(["gamma-app", "partial-tool"]));
    expect(mixedVerdict.winner.slug).toBe("gamma-app");
    expect(mixedVerdict.reasons.join("\n")).not.toContain("confidence bassa");
  });

  it("objective score: deterministico, basato su evidenze e limitato a 0-100", () => {
    const base = battlePipeline(["gamma-app", "atlas-ai"]);
    const forward = withObjectiveScores(base, "save-time");
    const reversed = withObjectiveScores([...base].reverse(), "save-time");

    const deltaBySlug = (tools: NormalisedTool[]) =>
      new Map(tools.map((tool) => [tool.slug, tool.objectiveDelta]));

    expect(deltaBySlug(reversed)).toEqual(deltaBySlug(forward));

    const gammaTool = forward.find((tool) => tool.slug === "gamma-app");
    expect(gammaTool?.objectiveDelta).toBeGreaterThan(0);
    expect(gammaTool?.objectiveScore).toBeLessThanOrEqual(100);
    expect(gammaTool?.objectiveScore).toBeGreaterThanOrEqual(0);

    const noObjective = withObjectiveScores(base, null);
    expect(noObjective.every((tool) => tool.objectiveScore === undefined)).toBe(true);
  });

  it("explanation del verdetto stabile su fixture (snapshot)", () => {
    const verdict = getBattleVerdict(battlePipeline(["gamma-app", "atlas-ai"]));

    expect({
      label: verdict.label,
      winner: verdict.winner.slug,
      reasons: verdict.reasons,
      winnerExplanation: verdict.winner.compareScore.explanation,
    }).toMatchSnapshot();
  });
});
