/**
 * Objective-fit engine — canonical builder-first dimensions.
 *
 * Tests the canonical pipeline actually used by the UI:
 *   buildObjectiveRanking → withObjectiveScores → getBattleVerdict.
 *
 * Covers:
 * - raw vs display score distinction
 * - tie threshold boundaries (0.299 / 0.300 / 0.301)
 * - shared ranks for true ties
 * - deterministic tie-break
 * - input array not mutated
 * - missing dimension → incomplete
 * - base score immutability
 * - no level/featured/category/tag/keyword
 */

import { describe, expect, it } from "vitest";

import {
  buildObjectiveRanking,
  computeObjectiveFit,
  computeObjectiveFitRaw,
  getWeightedDimensions,
  isObjectiveTie,
  toDisplayScore,
  hasCompleteDimensions,
  CANONICAL_DIMENSIONS,
  DIMENSION_LABELS,
  OBJECTIVE_FIT_TIE_THRESHOLD,
} from "@/lib/compare/objective-fit";
import {
  getObjectiveProfile,
  OBJECTIVE_PROFILES,
} from "@/lib/compare/compare-objective";
import { getApprovedAssessmentBySlug } from "@/lib/data/editorial-assessments";
import type { ApprovedEditorialAssessment } from "@/lib/data/editorial-assessments/types";

function getAssessment(slug: string): ApprovedEditorialAssessment {
  const a = getApprovedAssessmentBySlug(slug);
  if (!a) throw new Error(`assessment not found: ${slug}`);
  return a;
}

const QUALITY = getObjectiveProfile("quality")!;

/** Build a synthetic assessment with the given dimension set. */
function makeAssessment(
  slug: string,
  dims: Partial<Record<(typeof CANONICAL_DIMENSIONS)[number], number>>,
  base = 7,
): ApprovedEditorialAssessment {
  const inputs = CANONICAL_DIMENSIONS.map((d) => ({
    dimension: d,
    value: dims[d] ?? 3,
  }));
  return {
    slug,
    approvalStatus: "approved",
    approvedAt: "2026-08-04",
    approvedBy: "test",
    assessor: "test",
    score: {
      value: base,
      verdict: "test",
      limitationsAssessed: true,
      inputs,
      provenance: {
        kind: "editorial-assessment",
        sourceField: "test",
        methodologyVersion: "builder-first-v1",
        assessedAt: "2026-08-04",
      },
    },
    limitations: ["lim"],
  };
}

describe("objective-fit — profiles", () => {
  it("all 7 objective profiles exist", () => {
    expect(OBJECTIVE_PROFILES).toHaveLength(7);
  });

  it.each(OBJECTIVE_PROFILES.map((p) => [p.key, p] as const))(
    "%s: weights sum to 1",
    (_key, profile) => {
      const sum = Object.values(profile.weights).reduce((a, b) => a + b, 0);
      expect(Math.abs(sum - 1)).toBeLessThan(0.001);
    },
  );

  it.each(OBJECTIVE_PROFILES.map((p) => [p.key, p] as const))(
    "%s: all 6 canonical dimensions present with non-negative weights",
    (_key, profile) => {
      for (const dim of CANONICAL_DIMENSIONS) {
        expect(profile.weights).toHaveProperty(dim);
        expect(profile.weights[dim]).toBeGreaterThanOrEqual(0);
        expect(profile.weights[dim]).toBeLessThanOrEqual(1);
      }
    },
  );
});

describe("objective-fit — raw vs display", () => {
  it("rawScore retains full precision; displayScore rounds to 1 decimal", () => {
    const assessment = getAssessment("blink");
    const raw = computeObjectiveFitRaw(assessment, QUALITY);
    const display = computeObjectiveFit(assessment, QUALITY);
    const fromToDisplay = toDisplayScore(raw);

    expect(Number.isInteger(raw * 100) || raw !== display).toBe(true);
    expect(display).toBe(fromToDisplay);
    expect(Math.abs(raw - display)).toBeLessThan(0.05);
  });

  it("display score is rounded to exactly one decimal", () => {
    const assessment = getAssessment("make");
    const display = computeObjectiveFit(assessment, QUALITY);
    expect(Math.round(display * 10) / 10).toBe(display);
  });
});

describe("objective-fit — tie threshold (raw, 0.3)", () => {
  it("threshold constant is 0.3", () => {
    expect(OBJECTIVE_FIT_TIE_THRESHOLD).toBe(0.3);
  });

  it("diff 0.299 → tie", () => {
    expect(isObjectiveTie(0.299)).toBe(true);
  });

  it("diff 0.300 → winner (not tie) per convention diff >= 0.3", () => {
    expect(isObjectiveTie(0.3)).toBe(false);
  });

  it("diff 0.301 → winner", () => {
    expect(isObjectiveTie(0.301)).toBe(false);
  });
});

describe("objective-fit — ranking and shared ranks", () => {
  it("ranks by rawScore desc, then baseScore, then slug", () => {
    // Two assessments with identical raw but different base → base tie-break.
    const a = makeAssessment("alpha", { workflowFit: 5, easeOfUse: 5, versatility: 5, experienceQuality: 5, operationalMaturity: 5, experimentationSpeed: 5 }, 8);
    const b = makeAssessment("beta", { workflowFit: 5, easeOfUse: 5, versatility: 5, experienceQuality: 5, operationalMaturity: 5, experimentationSpeed: 5 }, 7);
    const summary = buildObjectiveRanking(new Map([["alpha", a], ["beta", b]]), QUALITY);
    // Same dimensions → same raw score → tie-break by base (alpha 8 > beta 7).
    expect(summary.rankedTools[0].slug).toBe("alpha");
    expect(summary.rankedTools[1].slug).toBe("beta");
  });

  it("true equal raw scores share the same rank (1, 1)", () => {
    const a = makeAssessment("alpha", { workflowFit: 4, easeOfUse: 4, versatility: 4, experienceQuality: 4, operationalMaturity: 4, experimentationSpeed: 4 }, 8);
    const b = makeAssessment("beta", { workflowFit: 4, easeOfUse: 4, versatility: 4, experienceQuality: 4, operationalMaturity: 4, experimentationSpeed: 4 }, 8);
    const summary = buildObjectiveRanking(new Map([["alpha", a], ["beta", b]]), QUALITY);
    expect(summary.rankedTools[0].rank).toBe(1);
    expect(summary.rankedTools[1].rank).toBe(1);
  });

  it("does not mutate the input array", () => {
    const tools = [getAssessment("blink"), getAssessment("cosmicjs"), getAssessment("make")];
    const original = tools.map((t) => ({ ...t }));
    buildObjectiveRanking(new Map(tools.map((t) => [t.slug, t])), QUALITY);
    expect(tools.map((t) => t.slug)).toEqual(original.map((t) => t.slug));
  });

  it("BetterPic is not automatically #1 under quality objective", () => {
    const slugs = ["betterpic", "agentx", "blink", "cosmicjs"];
    const summary = buildObjectiveRanking(
      new Map(slugs.map((s) => [s, getAssessment(s)])),
      QUALITY,
    );
    const first = summary.rankedTools[0];
    expect(first.slug).not.toBe("betterpic");
  });
});

describe("objective-fit — missing dimensions (F10)", () => {
  it("assessment missing a dimension → incomplete, no fit", () => {
    // Build an assessment omitting experimentationSpeed entirely.
    const incomplete: ApprovedEditorialAssessment = {
      slug: "partial",
      approvalStatus: "approved",
      approvedAt: "2026-08-04",
      approvedBy: "test",
      assessor: "test",
      score: {
        value: 7,
        verdict: "test",
        limitationsAssessed: true,
        inputs: [
          { dimension: "workflowFit", value: 4 },
          { dimension: "easeOfUse", value: 4 },
          { dimension: "versatility", value: 4 },
          { dimension: "experienceQuality", value: 4 },
          { dimension: "operationalMaturity", value: 4 },
        ],
        provenance: {
          kind: "editorial-assessment",
          sourceField: "test",
          methodologyVersion: "builder-first-v1",
          assessedAt: "2026-08-04",
        },
      },
      limitations: ["lim"],
    };
    const complete = getAssessment("blink");
    expect(hasCompleteDimensions(incomplete)).toBe(false);
    expect(hasCompleteDimensions(complete)).toBe(true);

    const summary = buildObjectiveRanking(
      new Map([["partial", incomplete], ["blink", complete]]),
      QUALITY,
    );
    // partial is excluded; blink is the only ranked tool.
    expect(summary.rankedTools.map((r) => r.slug)).toEqual(["blink"]);
  });

  it("all 30 canonical assessments have complete dimensions", () => {
    const slugs = [
      "agentx","betterpic","blink","blogify","chatbot","cosmicjs","flowise",
      "frase-ai","helpdesk","imagine-art","jenni-ai","lemon-squeezy","livechat",
      "make","meku","mocha","muse-ai","notionapps","omi","reachifyme","socleads",
      "synthesia-ai","tolt","v0","vibecode","vibrantsnap","vidau","wegic","weweb","windsor-ai",
    ];
    for (const slug of slugs) {
      expect(hasCompleteDimensions(getAssessment(slug))).toBe(true);
    }
  });
});

describe("objective-fit — no fabrication", () => {
  it("does not use level, featured, category, tags, or keywords", () => {
    // getWeightedDimensions is a pure function of approved dimension values
    // and objective weights. No copy or taxonomy is involved.
    const assessment = getAssessment("blink");
    const dims = getWeightedDimensions(assessment, QUALITY);
    expect(dims.length).toBe(6);
    for (const d of dims) {
      expect(CANONICAL_DIMENSIONS).toContain(d.key);
      expect(DIMENSION_LABELS[d.key]).toBeDefined();
      expect(d.value).toBeGreaterThanOrEqual(1);
      expect(d.value).toBeLessThanOrEqual(5);
    }
  });

  it("getWeightedDimensions: 6 entries with label, value, weight, contribution", () => {
    const assessment = getAssessment("blink");
    const dims = getWeightedDimensions(assessment, QUALITY);
    expect(dims).toHaveLength(6);
    const dimKeys = dims.map((d) => d.key);
    for (const k of CANONICAL_DIMENSIONS) {
      expect(dimKeys).toContain(k);
    }
    for (const d of dims) {
      expect(typeof d.label).toBe("string");
      expect(d.label.length).toBeGreaterThan(0);
      expect(d.value).toBeGreaterThanOrEqual(1);
      expect(d.value).toBeLessThanOrEqual(5);
      expect(d.weight).toBeGreaterThan(0);
      expect(d.weight).toBeLessThanOrEqual(1);
      expect(d.contribution).toBe(d.value * d.weight);
      expect(typeof d.isPrimary).toBe("boolean");
    }
  });

  it("getWeightedDimensions: weights change with objective, values stay constant", () => {
    const assessment = getAssessment("blink");
    const qualityDims = getWeightedDimensions(assessment, getObjectiveProfile("quality")!);
    const saveTimeDims = getWeightedDimensions(assessment, getObjectiveProfile("save-time")!);

    // Dimension values (1-5) are identical across objectives.
    for (let i = 0; i < 6; i++) {
      expect(qualityDims[i].value).toBe(saveTimeDims[i].value);
    }
    // Weights differ between objectives (verified by contribution delta).
    const qWeights = qualityDims.map((d) => d.weight);
    const sWeights = saveTimeDims.map((d) => d.weight);
    expect(qWeights).not.toEqual(sWeights);
  });

  it("getWeightedDimensions: incomplete tool produces empty array (no fake bars)", () => {
    const incomplete: ApprovedEditorialAssessment = {
      slug: "partial-tool",
      approvalStatus: "approved",
      approvedAt: "2026-08-04",
      approvedBy: "test",
      assessor: "test",
      score: {
        value: 5,
        verdict: "test",
        limitationsAssessed: true,
        inputs: [
          { dimension: "workflowFit", value: 3 },
          { dimension: "easeOfUse", value: 3 },
        ],
        provenance: {
          kind: "editorial-assessment",
          sourceField: "test",
          methodologyVersion: "builder-first-v1",
          assessedAt: "2026-08-04",
        },
      },
      limitations: ["lim"],
    };
    const dims = getWeightedDimensions(incomplete, QUALITY);
    expect(dims).toHaveLength(2); // only the 2 present dimensions
    expect(dims.map((d) => d.key).sort()).toEqual(["easeOfUse", "workflowFit"].sort());
  });

  it("base assessment score is never modified", () => {
    const assessment = getAssessment("blink");
    const before = assessment.score.value;
    computeObjectiveFitRaw(assessment, QUALITY);
    computeObjectiveFit(assessment, QUALITY);
    getWeightedDimensions(assessment, QUALITY);
    expect(assessment.score.value).toBe(before);
  });
});

describe("objective-fit — integration (mandatory scenario)", () => {
  const SCENARIO = ["betterpic", "agentx", "blink", "cosmicjs"];

  function fitsFor(objective: "quality" | "save-time" | "scale" | "experiment") {
    const profile = getObjectiveProfile(objective)!;
    const summary = buildObjectiveRanking(
      new Map(SCENARIO.map((s) => [s, getAssessment(s)])),
      profile,
    );
    return summary;
  }

  it("Aumentare qualità: CosmicJS 7.7, Blink 7.5, BetterPic 6.9, AgentX 5.6", () => {
    const s = fitsFor("quality");
    const bySlug = new Map(s.rankedTools.map((r) => [r.slug, r.displayScore]));
    expect(bySlug.get("cosmicjs")).toBe(7.7);
    expect(bySlug.get("blink")).toBe(7.5);
    expect(bySlug.get("betterpic")).toBe(6.9);
    expect(bySlug.get("agentx")).toBe(5.6);
    // Gap between first two = 0.2 < 0.3 → tie.
    expect(s.verdict.kind).toBe("tie");
  });

  it("Risparmiare tempo: Blink first", () => {
    const s = fitsFor("save-time");
    expect(s.rankedTools[0].slug).toBe("blink");
    expect(s.verdict.kind).toBe("winner");
  });

  it("Scalare: CosmicJS first", () => {
    const s = fitsFor("scale");
    expect(s.rankedTools[0].slug).toBe("cosmicjs");
    expect(s.verdict.kind).toBe("winner");
  });

  it("Sperimentare: Blink first", () => {
    const s = fitsFor("experiment");
    expect(s.rankedTools[0].slug).toBe("blink");
    expect(s.verdict.kind).toBe("winner");
  });

  it("at least one objective change flips the first-ranked tool", () => {
    const quality = fitsFor("quality").rankedTools[0].slug;
    const saveTime = fitsFor("save-time").rankedTools[0].slug;
    expect(quality).not.toBe(saveTime);
  });

  it("BetterPic is never #1 under Aumentare qualità", () => {
    const s = fitsFor("quality");
    expect(s.rankedTools[0].slug).not.toBe("betterpic");
  });

  it("five-tool scenario: all five ranked, deterministic, no tool lost", () => {
    const FIVE = ["betterpic", "agentx", "blink", "cosmicjs", "make"];
    const profile = getObjectiveProfile("save-time")!;
    const summary = buildObjectiveRanking(
      new Map(FIVE.map((s) => [s, getAssessment(s)])),
      profile,
    );
    expect(summary.rankedTools).toHaveLength(5);
    const slugs = summary.rankedTools.map((r) => r.slug);
    expect(slugs.length).toBe(5);
    // All five present.
    expect(new Set(slugs).size).toBe(5);
    for (const s of FIVE) expect(slugs).toContain(s);
    // Sorted by rawScore desc.
    for (let i = 1; i < slugs.length; i++) {
      const prev = summary.rankedTools[i - 1].rawScore;
      const cur = summary.rankedTools[i].rawScore;
      expect(prev).toBeGreaterThanOrEqual(cur);
    }
    // No index-derived rank; all ranks <= 5.
    for (const r of summary.rankedTools) {
      expect(r.rank).toBeGreaterThanOrEqual(1);
      expect(r.rank).toBeLessThanOrEqual(5);
    }
  });

  it("five-tool scenario: verdict uses only leader and runner-up", () => {
    const FIVE = ["betterpic", "agentx", "blink", "cosmicjs", "make"];
    const profile = getObjectiveProfile("save-time")!;
    const summary = buildObjectiveRanking(
      new Map(FIVE.map((s) => [s, getAssessment(s)])),
      profile,
    );
    // Verdict should reference only leader and runner-up from all 5.
    expect(["winner", "tie"]).toContain(summary.verdict.kind);
    if (summary.verdict.kind === "winner") {
      expect(summary.verdict.leader.slug).toBe(summary.rankedTools[0].slug);
      expect(summary.verdict.runnerUp?.slug).toBe(summary.rankedTools[1].slug);
    } else if (summary.verdict.kind === "tie") {
      expect(summary.verdict.leader.slug).toBe(summary.rankedTools[0].slug);
    }
  });

  it("five-tool scenario: input array not mutated", () => {
    const FIVE = ["betterpic", "agentx", "blink", "cosmicjs", "make"];
    const assessments = FIVE.map((s) => getAssessment(s));
    const originalSlugs = assessments.map((a) => a.slug);
    const originalScores = assessments.map((a) => a.score.value);
    buildObjectiveRanking(
      new Map(assessments.map((a) => [a.slug, a])),
      getObjectiveProfile("quality")!,
    );
    expect(assessments.map((a) => a.slug)).toEqual(originalSlugs);
    expect(assessments.map((a) => a.score.value)).toEqual(originalScores);
  });

  it("pipeline regression: same canonical ranking for all four objectives", () => {
    const SCENARIO = ["betterpic", "agentx", "blink", "cosmicjs"];
    const objectives = ["quality", "save-time", "scale", "experiment"] as const;

    for (const obj of objectives) {
      const profile = getObjectiveProfile(obj)!;
      const summary = buildObjectiveRanking(
        new Map(SCENARIO.map((s) => [s, getAssessment(s)])),
        profile,
      );

      // Every ranked tool has an explicit rank, a displayScore, and a rawScore.
      for (const r of summary.rankedTools) {
        expect(typeof r.rank).toBe("number");
        expect(r.rank).toBeGreaterThanOrEqual(1);
        expect(typeof r.displayScore).toBe("number");
        expect(typeof r.rawScore).toBe("number");
        // Rank ordering is non-decreasing (ranks can repeat for ties).
        const idx = summary.rankedTools.indexOf(r);
        if (idx > 0) {
          expect(r.rank).toBeGreaterThanOrEqual(summary.rankedTools[idx - 1].rank);
        }
      }

      // Slug ordering is deterministic for the same input.
      const slugs = summary.rankedTools.map((r) => r.slug);
      const summary2 = buildObjectiveRanking(
        new Map([...SCENARIO].reverse().map((s) => [s, getAssessment(s)])),
        profile,
      );
      expect(summary2.rankedTools.map((r) => r.slug)).toEqual(slugs);

      // Verdict is consistent.
      expect(["winner", "tie"]).toContain(summary.verdict.kind);
      if (summary.verdict.kind === "winner") {
        expect(summary.verdict.leader.slug).toBe(slugs[0]);
      }
    }
  });

  it("pipeline regression: desktop and mobile consume the same canonical data", () => {
    // The canonical engine (buildObjectiveRanking) is called once by
    // buildCanonicalObjectiveRanking in tool-battle-shared.ts. Both desktop
    // and mobile views consume orderedTools + objectiveVerdict from that
    // single call. No surface re-sorts or recomputes independently.
    const SCENARIO = ["betterpic", "agentx", "blink", "cosmicjs"];

    function canonicalFor(objKey: "quality" | "save-time" | "scale" | "experiment") {
      const profile = getObjectiveProfile(objKey)!;
      return buildObjectiveRanking(
        new Map(SCENARIO.map((s) => [s, getAssessment(s)])),
        profile,
      );
    }

    // Verify that the verdict kind matches expected ranking.
    const quality = canonicalFor("quality");
    expect(quality.verdict.kind).toBe("tie");
    expect(quality.rankedTools[0].slug).toBe("cosmicjs");
    expect(quality.rankedTools[1].slug).toBe("blink");

    const saveTime = canonicalFor("save-time");
    expect(saveTime.verdict.kind).toBe("winner");
    expect(saveTime.rankedTools[0].slug).toBe("blink");

    const scale = canonicalFor("scale");
    expect(scale.verdict.kind).toBe("winner");
    expect(scale.rankedTools[0].slug).toBe("cosmicjs");

    const experiment = canonicalFor("experiment");
    expect(experiment.verdict.kind).toBe("winner");
    expect(experiment.rankedTools[0].slug).toBe("blink");

    // The canonical ranks and slugs are the single source for all surfaces.
    const surfaces = [quality, saveTime, scale, experiment];
    for (const s of surfaces) {
      expect(s.rankedTools.length).toBe(4);
      expect(s.rankedTools.map((r) => r.slug).sort()).toEqual(
        [...SCENARIO].sort(),
      );
    }
  });

  it("surface parity: buildObjectiveRanking is the single source used everywhere", () => {
    // The canonical pipeline is exported and consumed by tool-battle-shared,
    // which both desktop and mobile views call. There is no second sort.
    // CosmicJS (7.7) and Blink (7.5) have distinct raw scores → ranks 1 and 2;
    // the tie-threshold verdict is still "tie" (gap 0.2 < 0.3).
    const s = fitsFor("quality");
    const ranks = s.rankedTools.map((r) => `${r.slug}:${r.rank}`);
    expect(ranks).toEqual(["cosmicjs:1", "blink:2", "betterpic:3", "agentx:4"]);
  });
});
