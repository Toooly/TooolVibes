/**
 * Objective-fit engine — builder-first-v1 canonical dimensions.
 *
 * Computes a dynamic "fit for objective" score (0-10) from the 6 canonical
 * approved dimensions of a tool's assessment and the weight profile of the
 * selected objective. Never uses keywords, copy, level, or featured.
 *
 * Base score (canonical assessment value) is never modified. The fit score
 * only affects ranking, Arena, and the decision workspace.
 *
 * RAW vs DISPLAY:
 *   - `rawScore` retains full floating-point precision (used for ranking and
 *     tie threshold).
 *   - `displayScore` is rounded to one decimal (used only in the UI).
 *   No component is allowed to re-round the raw value.
 *
 * Tie convention (documented): diff < 0.3 → tie; diff >= 0.3 → winner.
 * True equal raw scores share the same rank (e.g. 1, 1, 3).
 */

import type { ApprovedEditorialAssessment } from "@/lib/data/editorial-assessments/types";

/** Canonical builder-first dimensions (0-5 integers). */
export type CanonicalDimension =
  | "workflowFit"
  | "easeOfUse"
  | "versatility"
  | "experienceQuality"
  | "operationalMaturity"
  | "experimentationSpeed";

export const CANONICAL_DIMENSIONS: readonly CanonicalDimension[] = [
  "workflowFit",
  "easeOfUse",
  "versatility",
  "experienceQuality",
  "operationalMaturity",
  "experimentationSpeed",
] as const;

/** Human-readable labels for each dimension. */
export const DIMENSION_LABELS: Record<CanonicalDimension, string> = {
  workflowFit: "Fit nel workflow",
  easeOfUse: "Velocità di adozione",
  versatility: "Ampiezza d'uso",
  experienceQuality: "Qualità esperienza/output",
  operationalMaturity: "Controllo e maturità",
  experimentationSpeed: "Velocità di validazione",
};

/** Tie threshold on the 0-10 scale, applied to RAW scores. */
export const OBJECTIVE_FIT_TIE_THRESHOLD = 0.3;

/** Numeric tolerance for comparing raw scores (avoids float equality). */
export const OBJECTIVE_FIT_EPSILON = 1e-9;

/**
 * Tie convention predicate. diff < threshold → tie; >= threshold → winner.
 * Applied to raw scores. The EPSILON guards floating-point boundary drift.
 */
export function isObjectiveTie(gap: number): boolean {
  return gap < OBJECTIVE_FIT_TIE_THRESHOLD - OBJECTIVE_FIT_EPSILON;
}

/** Weight profile for an objective. Sum must equal 1. */
export type ObjectiveProfile = {
  key: string;
  label: string;
  /** Weight per canonical dimension. Sum must be exactly 1. */
  weights: Record<CanonicalDimension, number>;
  /** Top 2-3 dimensions that drive this objective (for factor bars). */
  primaryDimensions: CanonicalDimension[];
  /** Short rationale for the weight distribution. */
  rationale: string;
};

/** Per-dimension contribution used by factor bars and explanations. */
export type WeightedDimension = {
  key: CanonicalDimension;
  label: string;
  /** Approved dimension value (1-5). */
  value: number;
  /** Objective weight for this dimension. */
  weight: number;
  /** value * weight (contribution to the raw weighted sum). */
  contribution: number;
  isPrimary: boolean;
};

/**
 * Compute the raw objective fit score (0-10) for a single tool.
 *
 * Formula: raw = sum(dimensionValue * weight) / 5 * 10
 * Returns full floating-point precision (do NOT round this value).
 */
export function computeObjectiveFitRaw(
  assessment: ApprovedEditorialAssessment,
  profile: ObjectiveProfile,
): number {
  const inputs = assessment.score.inputs;
  let weighted = 0;

  for (const dim of CANONICAL_DIMENSIONS) {
    const input = inputs.find((i) => i.dimension === dim);
    const value = input?.value ?? 0;
    weighted += value * profile.weights[dim];
  }

  // weighted is on a 0-5 scale (max value 5 * 1 = 5)
  // Scale to 0-10
  return (weighted / 5) * 10;
}

/** Round a raw score to one decimal for display. */
export function toDisplayScore(raw: number): number {
  return Math.round(raw * 10) / 10;
}

/**
 * Compute the objective fit score (0-10) for a single tool, rounded to one
 * decimal. This is the DISPLAY value. Use `computeObjectiveFitRaw` for
 * ranking and tie decisions.
 */
export function computeObjectiveFit(
  assessment: ApprovedEditorialAssessment,
  profile: ObjectiveProfile,
): number {
  return toDisplayScore(computeObjectiveFitRaw(assessment, profile));
}

/**
 * Whether an assessment has all 6 canonical dimensions present.
 * A dimension is considered missing when its value is not a finite number.
 */
export function hasCompleteDimensions(
  assessment: ApprovedEditorialAssessment,
): boolean {
  const inputs = assessment.score.inputs;
  for (const dim of CANONICAL_DIMENSIONS) {
    const input = inputs.find((i) => i.dimension === dim);
    const value = input?.value;
    if (typeof value !== "number" || Number.isNaN(value)) {
      return false;
    }
  }
  return true;
}

/**
 * Per-dimension contribution breakdown for factor bars and explanations.
 * Dimensions present in the assessment contribute their real value; missing
 * dimensions are omitted (they are never silently treated as 0 for a fit).
 */
export function getWeightedDimensions(
  assessment: ApprovedEditorialAssessment,
  profile: ObjectiveProfile,
): WeightedDimension[] {
  const inputs = assessment.score.inputs;
  return CANONICAL_DIMENSIONS.flatMap((dim) => {
    const input = inputs.find((i) => i.dimension === dim);
    const value = input?.value;
    if (typeof value !== "number" || Number.isNaN(value)) {
      return [];
    }
    const weight = profile.weights[dim];
    return [{
      key: dim,
      label: DIMENSION_LABELS[dim],
      value,
      weight,
      contribution: value * weight,
      isPrimary: profile.primaryDimensions.includes(dim),
    }];
  });
}

/** Complete per-tool objective fit result from the canonical pipeline. */
export type ObjectiveFitResult = {
  slug: string;
  baseScore: number;
  objectiveId: string;
  /** Full precision. Used for ranking and tie. */
  rawScore: number;
  /** Rounded to one decimal. Used for display only. */
  displayScore: number;
  weightedDimensions: WeightedDimension[];
  rank: number;
  summary: string;
  decisiveFactors: string[];
  tradeoffs: string[];
  confidence: string;
  limitations: string[];
};

/** Summary of the objective fit for a set of ranked tools. */
export type ObjectiveFitSummary = {
  objective: string;
  objectiveLabel: string;
  rankedTools: ObjectiveFitResult[];
  verdict: ObjectiveVerdict;
};

/** Verdict kind for the objective comparison. */
export type ObjectiveVerdict =
  | { kind: "incomplete"; reason: string }
  | {
      kind: "tie";
      leader: ObjectiveFitResult;
      runnerUp: ObjectiveFitResult;
      gap: number;
    }
  | {
      kind: "winner";
      leader: ObjectiveFitResult;
      runnerUp: ObjectiveFitResult | null;
      gap: number;
      decisiveFactors: string[];
      limitations: string[];
    };

function buildResult(
  assessment: ApprovedEditorialAssessment,
  profile: ObjectiveProfile,
): ObjectiveFitResult {
  const baseScore = assessment.score.value ?? 0;
  const rawScore = computeObjectiveFitRaw(assessment, profile);
  const displayScore = toDisplayScore(rawScore);
  const weightedDimensions = getWeightedDimensions(assessment, profile);

  const primary = weightedDimensions.filter((d) => d.isPrimary);
  const strong = primary
    .filter((d) => d.value >= 4)
    .map((d) => `${d.label} (${d.value}/5)`);
  const weak = primary
    .filter((d) => d.value <= 2)
    .map((d) => `${d.label} (${d.value}/5)`);

  const decisiveFactors: string[] = [];
  if (strong.length > 0) {
    decisiveFactors.push(`Punti forti: ${strong.join(", ")}.`);
  }
  if (weak.length > 0) {
    decisiveFactors.push(`Da tenere d'occhio: ${weak.join(", ")}.`);
  }

  const nonPrimaryWeak = weightedDimensions
    .filter((d) => !d.isPrimary && d.value <= 2)
    .map((d) => d.label);
  const tradeoffs: string[] =
    nonPrimaryWeak.length > 0
      ? [`Punti deboli secondari: ${nonPrimaryWeak.join(", ")}.`]
      : [];

  // Top primary dimension by contribution drives the summary lead.
  const topDim = [...primary].sort((a, b) => b.contribution - a.contribution)[0];
  const lead = topDim
    ? topDim.label.toLowerCase()
    : "dimensioni chiave";

  let summary: string;
  if (displayScore >= 8) {
    summary = `Emerge per ${lead} e qualità complessiva.`;
  } else if (displayScore >= 6.5) {
    summary = `Buon fit per ${lead}, con margini di miglioramento.`;
  } else if (displayScore >= 5) {
    summary = `Fit parziale per ${lead}; valutare trade-off prima della scelta.`;
  } else {
    summary = `Fit limitato per ${lead} rispetto ad alternative.`;
  }

  return {
    slug: assessment.slug,
    baseScore,
    objectiveId: profile.key,
    rawScore,
    displayScore,
    weightedDimensions,
    rank: 0,
    summary,
    decisiveFactors,
    tradeoffs,
    confidence: assessment.score.limitationsAssessed ? "media" : "bassa",
    limitations: [...assessment.limitations],
  };
}

/**
 * Canonical objective-fit pipeline. Produces a single ranked result used by
 * every surface (desktop, mobile, Arena, sidebar, decision workspace).
 *
 * - Uses RAW scores for ranking and tie.
 * - Does not mutate the input array.
 * - Assigns shared ranks for true equal raw scores (1, 1, 3).
 * - Missing dimensions mark the tool as incomplete (never a silent 0).
 */
export function buildObjectiveRanking(
  assessments: Map<string, ApprovedEditorialAssessment>,
  profile: ObjectiveProfile,
): ObjectiveFitSummary {
  const results: ObjectiveFitResult[] = [];
  let incompleteReason = "";

  for (const [, assessment] of assessments) {
    if (!hasCompleteDimensions(assessment)) {
      incompleteReason = "Uno o più tool hanno dimensioni di valutazione incomplete.";
      continue;
    }
    results.push(buildResult(assessment, profile));
  }

  // Sort by rawScore desc, baseScore desc, slug asc. Uses a copy (no mutation).
  const sorted = [...results].sort((a, b) => {
    const rawGap = b.rawScore - a.rawScore;
    if (Math.abs(rawGap) > OBJECTIVE_FIT_EPSILON) return rawGap > 0 ? 1 : -1;
    const baseGap = b.baseScore - a.baseScore;
    if (baseGap !== 0) return baseGap > 0 ? 1 : -1;
    return a.slug.localeCompare(b.slug);
  });

  // Assign shared ranks based on raw equality.
  let rank = 1;
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0) {
      const prevRaw = sorted[i - 1].rawScore;
      const curRaw = sorted[i].rawScore;
      const rawEqual = Math.abs(prevRaw - curRaw) <= OBJECTIVE_FIT_EPSILON;
      if (!rawEqual) {
        rank = i + 1;
      }
    }
    sorted[i].rank = rank;
  }

  // Build verdict.
  let verdict: ObjectiveVerdict;
  if (incompleteReason && sorted.length === 0) {
    verdict = { kind: "incomplete", reason: incompleteReason };
  } else if (sorted.length === 0) {
    verdict = { kind: "incomplete", reason: "Nessun tool con valutazione disponibile." };
  } else {
    const leader = sorted[0];
    const runnerUp = sorted[1] ?? null;
    const gap = runnerUp ? leader.rawScore - runnerUp.rawScore : Infinity;

    if (isObjectiveTie(gap)) {
      verdict = {
        kind: "tie",
        leader,
        runnerUp: runnerUp ?? leader,
        gap,
      };
    } else {
      verdict = {
        kind: "winner",
        leader,
        runnerUp,
        gap,
        decisiveFactors: leader.decisiveFactors,
        limitations: leader.limitations,
      };
    }
  }

  return {
    objective: profile.key,
    objectiveLabel: profile.label,
    rankedTools: sorted,
    verdict,
  };
}
