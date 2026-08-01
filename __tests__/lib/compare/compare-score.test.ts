import { describe, expect, it } from "vitest";

import {
  completeToolPublicFixture,
  partialToolPublicFixture,
} from "@/__tests__/fixtures/tool-public";
import {
  COMPARE_SCORE_VERSION,
  compareScoreResults,
  compareToolsForCompare,
  rankCompareScores,
  scoreToolForCompare,
} from "@/lib/compare/compare-score";
import type { ToolPublic } from "@/lib/types/tool-public";

function withSupportedAssessment(
  tool: ToolPublic,
  value: number,
): ToolPublic {
  const score = tool.score;
  if (!score) throw new Error("A scorecard is required for this fixture.");

  return {
    ...tool,
    score: {
      ...score,
      value,
      verdict: "Valutazione editoriale verificata.",
      limitationsAssessed: true,
      provenance: {
        ...score.provenance,
        kind: "editorial-assessment",
        methodologyVersion: "editorial-score-v1",
        assessedAt: "2026-08-01T10:00:00.000Z",
      },
    },
    editorial: {
      evidence: [
        { kind: "review", text: "Prova verificata.", sourceField: "editorial_note" },
        { kind: "caution", text: "Limite verificato.", sourceField: "cautions" },
      ],
    },
  };
}

const atlas = withSupportedAssessment(completeToolPublicFixture, 8.4);
const beta = withSupportedAssessment(
  { ...completeToolPublicFixture, slug: "beta-clone", name: "Beta Clone" },
  8.4,
);
const gamma = withSupportedAssessment(
  { ...completeToolPublicFixture, slug: "gamma-app", name: "Gamma" },
  9.1,
);

describe("compare-score truth contract", () => {
  it("exposes a number only for a fully-supported editorial assessment", () => {
    const supported = scoreToolForCompare(atlas);
    const incomplete = scoreToolForCompare(partialToolPublicFixture);

    expect(supported.version).toBe(COMPARE_SCORE_VERSION);
    expect(supported.total).toBe(8.4);
    expect(supported.assessment.state).toBe("supported");
    expect(supported.components).toEqual([
      expect.objectContaining({
        key: "editorial-assessment",
        available: true,
        value: 8.4,
      }),
    ]);

    expect(incomplete.total).toBeNull();
    expect(incomplete.rank).toBeNull();
    expect(incomplete.assessment.state).toBe("insufficient_evidence");
    expect(incomplete.explanation.join(" ")).toContain("in preparazione");
  });

  it("does not derive a number from evidence, use cases, or taxonomy", () => {
    const richerMetadata: ToolPublic = {
      ...atlas,
      taxonomy: {
        ...atlas.taxonomy,
        tags: ["research", "assistant", "automation", "workflow"],
      },
      content: {
        ...atlas.content,
        useCases: ["Ricerca", "Sintesi", "Automazione", "Report"],
      },
      editorial: {
        evidence: [
          ...atlas.editorial.evidence,
          { kind: "strength", text: "Ulteriore segnale.", sourceField: "strengths" },
        ],
      },
    };

    expect(scoreToolForCompare(richerMetadata).total).toBe(atlas.score?.value);
    expect(scoreToolForCompare(richerMetadata).total).toBe(8.4);
  });

  it("requires the explicit score, methodology, verification date, verdict, evidence, and limitations", () => {
    const missingValue: ToolPublic = {
      ...atlas,
      score: { ...atlas.score!, value: null },
    };
    const missingVerdict: ToolPublic = {
      ...atlas,
      score: { ...atlas.score!, verdict: null },
    };
    const missingLimitations: ToolPublic = {
      ...atlas,
      score: { ...atlas.score!, limitationsAssessed: false },
      editorial: {
        evidence: [{ kind: "review", text: "Prova verificata.", sourceField: "editorial_note" }],
      },
    };

    for (const tool of [missingValue, missingVerdict, missingLimitations]) {
      expect(scoreToolForCompare(tool).total).toBeNull();
      expect(scoreToolForCompare(tool).assessment.state).toBe("insufficient_evidence");
    }
  });

  it("gives equal explicit scores the same rank without a slug tie-break", () => {
    const atlasResult = scoreToolForCompare(atlas);
    const betaResult = scoreToolForCompare(beta);
    const gammaResult = scoreToolForCompare(gamma);

    expect(compareScoreResults(atlasResult, betaResult)).toBe(0);

    const ranked = rankCompareScores([betaResult, gammaResult, atlasResult]);
    expect(ranked.map(({ slug, rank }) => [slug, rank])).toEqual([
      ["beta-clone", 2],
      ["gamma-app", 1],
      ["atlas-ai", 2],
    ]);
  });

  it("keeps candidate order while keeping assessment values and ranks permutation-independent", () => {
    const forward = compareToolsForCompare([atlas, gamma, beta]);
    const reversed = compareToolsForCompare([beta, gamma, atlas]);

    const signature = (results: typeof forward) =>
      new Map(results.map(({ slug, total, rank }) => [slug, { total, rank }]));

    expect(signature(reversed)).toEqual(signature(forward));
    expect(forward.map(({ slug }) => slug)).toEqual(["atlas-ai", "gamma-app", "beta-clone"]);
  });
});
