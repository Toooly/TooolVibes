import { describe, expect, it } from "vitest";

import {
  completeToolPublicFixture,
  partialToolPublicFixture,
} from "@/__tests__/fixtures/tool-public";
import {
  COMPARE_OBJECTIVE_KEYWORDS,
  COMPARE_OBJECTIVES,
  describeCompareObjectiveWeights,
  getCompareObjectiveLabel,
  isCompareObjective,
  type CompareObjective,
} from "@/lib/compare/compare-objective";
import {
  getBattleVerdict,
  normalise,
  withBattleScores,
  withObjectiveScores,
} from "@/components/tools/tool-battle-shared";
import { createToolPublicView } from "@/lib/data/tool-public-view";

const allObjectives = COMPARE_OBJECTIVES.map((objective) => objective.key);
const views = [
  createToolPublicView(completeToolPublicFixture),
  createToolPublicView(partialToolPublicFixture),
];

function basePipeline(slugs: string[]) {
  return withBattleScores(normalise(views, slugs));
}

describe("compare-objective configuration", () => {
  it("declares unique objectives with labels and usable keywords", () => {
    expect(new Set(allObjectives).size).toBe(allObjectives.length);

    for (const objective of COMPARE_OBJECTIVES) {
      expect(getCompareObjectiveLabel(objective.key)).toBe(objective.label);
      expect(COMPARE_OBJECTIVE_KEYWORDS[objective.key].length).toBeGreaterThan(0);
      expect(describeCompareObjectiveWeights(objective.key).join(" ")).not.toHaveLength(0);
    }
  });

  it("accepts only known objective keys", () => {
    for (const objective of allObjectives) expect(isCompareObjective(objective)).toBe(true);
    expect(isCompareObjective("unknown")).toBe(false);
    expect(isCompareObjective(null)).toBe(false);
  });
});

describe("compare objectives under the truth contract", () => {
  it.each(allObjectives)(
    "objective %s does not create a numeric score or delta",
    (objective: CompareObjective) => {
      const base = basePipeline(["atlas-ai", "partial-tool"]);
      const prioritised = withObjectiveScores(base, objective);

      expect(prioritised.map((tool) => tool.battleScore)).toEqual(base.map((tool) => tool.battleScore));
      expect(prioritised.every((tool) => tool.objectiveScore === undefined)).toBe(true);
      expect(prioritised.every((tool) => tool.objectiveDelta === undefined)).toBe(true);
    },
  );

  it("does not turn a priority into a winner when evidence is incomplete", () => {
    const verdict = getBattleVerdict(
      withObjectiveScores(basePipeline(["atlas-ai", "partial-tool"]), "save-time"),
      "save-time",
    );

    expect(verdict.state).toBe("insufficient_evidence");
    expect(verdict.winner).toBeNull();
  });
});
