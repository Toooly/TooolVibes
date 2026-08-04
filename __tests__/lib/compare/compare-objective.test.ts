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
import type { ApprovedEditorialAssessment } from "@/lib/data/editorial-assessments/types";

/** Mock assessment for the atlas-ai fixture (not in the real registry). */
function mockAtlasAssessment(): ApprovedEditorialAssessment {
  return {
    slug: "atlas-ai",
    approvalStatus: "approved",
    approvedAt: "2026-08-04",
    approvedBy: "test",
    assessor: "test",
    score: {
      value: 8.4,
      verdict: "test",
      limitationsAssessed: true,
      inputs: [
        { dimension: "workflowFit", value: 4 },
        { dimension: "easeOfUse", value: 4 },
        { dimension: "versatility", value: 4 },
        { dimension: "experienceQuality", value: 5 },
        { dimension: "operationalMaturity", value: 4 },
        { dimension: "experimentationSpeed", value: 4 },
      ],
      provenance: { kind: "editorial-assessment", sourceField: "test", methodologyVersion: "builder-first-v1", assessedAt: "2026-08-04" },
    },
    limitations: ["no hands-on"],
  };
}

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
    "objective %s computes a fit score without altering base scores",
    (objective: CompareObjective) => {
      const base = basePipeline(["atlas-ai", "partial-tool"]);
      const assessments = new Map([["atlas-ai", mockAtlasAssessment()]]);
      const prioritised = withObjectiveScores(base, objective, assessments);

      // Base editorial scores are never modified by the objective.
      expect(prioritised.map((tool) => tool.battleScore).sort()).toEqual(
        base.map((tool) => tool.battleScore).sort(),
      );
      // The assessed tool receives a fit score; the unassessed tool does not.
      const atlas = prioritised.find((t) => t.slug === "atlas-ai");
      const partial = prioritised.find((t) => t.slug === "partial-tool");
      expect(typeof atlas?.objectiveScore).toBe("number");
      expect(partial?.objectiveScore).toBeUndefined();
    },
  );

  it("keeps the unassessed-tool fallback (insufficient evidence) when evidence is incomplete", () => {
    const verdict = getBattleVerdict(
      withObjectiveScores(
        basePipeline(["atlas-ai", "partial-tool"]),
        "save-time",
        new Map([["atlas-ai", mockAtlasAssessment()]]),
      ),
      "save-time",
    );

    expect(verdict.state).toBe("insufficient_evidence");
    expect(verdict.winner).toBeNull();
  });
});
