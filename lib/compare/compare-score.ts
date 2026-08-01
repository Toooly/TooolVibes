import type { ToolPublic } from "@/lib/types/tool-public";

/**
 * Compare's public assessment contract.
 *
 * A number is deliberately available only when the canonical editorial
 * assessment is complete. Evidence, use cases, taxonomy, names, slugs, and
 * field coverage may explain a comparison, but must never manufacture or
 * alter its score.
 */
export const COMPARE_SCORE_VERSION = "compare-score-v2";

export type CompareConfidenceLevel = "high" | "medium" | "low";

export type CompareAssessmentState = "supported" | "insufficient_evidence";

export type CompareAssessmentRequirement =
  | "score.value"
  | "score.provenance.kind"
  | "score.provenance.methodologyVersion"
  | "score.provenance.assessedAt"
  | "score.verdict"
  | "editorial.evidence"
  | "editorial.limitations";

export type CompareScoreProvenance = {
  /** Canonical fields which support the displayed assessment. */
  field: string;
  /** Human-readable contract rule. */
  rule: string;
};

export type CompareScoreComponentKey = "editorial-assessment";

export type CompareScoreComponent = {
  key: CompareScoreComponentKey;
  label: string;
  /** Kept for compatible consumers; the sole supported component is 100%. */
  weight: number;
  /** False means that no numeric assessment may be displayed. */
  available: boolean;
  /** The explicitly stored 0-10 editorial score, never a derived value. */
  value: number | null;
  provenance: CompareScoreProvenance;
};

export type CompareScoreConfidence = {
  level: CompareConfidenceLevel;
  /** 1 for a fully-supported assessment, otherwise 0. Never used to rank. */
  coverage: number;
  /** Requirements absent from the canonical assessment. */
  missing: string[];
};

export type CompareScoreResult = {
  version: typeof COMPARE_SCORE_VERSION;
  slug: string;
  name: string;
  /** Explicit 0-10 editorial score, or null when the assessment is incomplete. */
  total: number | null;
  /** Equal scores share a rank; incomplete assessments are intentionally unranked. */
  rank: number | null;
  assessment: {
    state: CompareAssessmentState;
    missing: CompareAssessmentRequirement[];
  };
  confidence: CompareScoreConfidence;
  components: CompareScoreComponent[];
  explanation: string[];
};

const SUPPORT_FIELDS =
  "score.value, score.provenance.kind, score.provenance.methodologyVersion, score.provenance.assessedAt, score.verdict, editorial.evidence, editorial.limitations";

function hasText(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function getMissingRequirements(tool: ToolPublic): CompareAssessmentRequirement[] {
  const score = tool.score;

  if (!score) {
    return [
      "score.value",
      "score.provenance.kind",
      "score.provenance.methodologyVersion",
      "score.provenance.assessedAt",
      "score.verdict",
      "editorial.evidence",
      "editorial.limitations",
    ];
  }

  const missing: CompareAssessmentRequirement[] = [];

  if (typeof score.value !== "number") missing.push("score.value");
  if (score.provenance.kind !== "editorial-assessment") {
    missing.push("score.provenance.kind");
  }
  if (!hasText(score.provenance.methodologyVersion)) {
    missing.push("score.provenance.methodologyVersion");
  }
  if (!score.provenance.assessedAt) missing.push("score.provenance.assessedAt");
  if (!hasText(score.verdict)) missing.push("score.verdict");
  if (!tool.editorial.evidence.some((item) => hasText(item.sourceField))) {
    missing.push("editorial.evidence");
  }
  if (
    !score.limitationsAssessed &&
    !tool.editorial.evidence.some((item) => item.kind === "caution" && hasText(item.sourceField))
  ) {
    missing.push("editorial.limitations");
  }

  return missing;
}

function assessmentComponent(
  tool: ToolPublic,
  state: CompareAssessmentState,
): CompareScoreComponent {
  const available = state === "supported";

  return {
    key: "editorial-assessment",
    label: "Valutazione editoriale",
    weight: 100,
    available,
    value: available ? tool.score?.value ?? null : null,
    provenance: {
      field: SUPPORT_FIELDS,
      rule: available
        ? "usa esclusivamente il valore editoriale esplicito, con metodologia, data di verifica, verdetto, evidenza e limiti dichiarati"
        : "senza tutti i requisiti editoriali non viene mostrato né stimato alcun punteggio",
    },
  };
}

function buildExplanation(
  tool: ToolPublic,
  total: number | null,
  missing: CompareAssessmentRequirement[],
): string[] {
  if (total === null) {
    return [
      `${tool.name}: valutazione editoriale in preparazione. Nessun punteggio viene mostrato finché non sono disponibili: ${missing.join(", ")}.`,
    ];
  }

  return [
    `${tool.name}: valutazione editoriale esplicita ${total}/10, verificata il ${tool.score?.provenance.assessedAt}.`,
    `Verdetto editoriale: ${tool.score?.verdict}.`,
    "Il valore non incorpora quantità di prove, casi d'uso, tag o completezza dei campi.",
  ];
}

/**
 * Produces an honest, per-tool assessment. No score is inferred from content
 * richness or metadata: only a complete canonical editorial assessment can
 * expose `total`.
 */
export function scoreToolForCompare(tool: ToolPublic): CompareScoreResult {
  const missing = getMissingRequirements(tool);
  const state: CompareAssessmentState = missing.length === 0 ? "supported" : "insufficient_evidence";
  const total = state === "supported" ? tool.score?.value ?? null : null;
  const confidence: CompareScoreConfidence = {
    level: state === "supported" ? "high" : "low",
    coverage: state === "supported" ? 1 : 0,
    missing,
  };

  return {
    version: COMPARE_SCORE_VERSION,
    slug: tool.slug,
    name: tool.name,
    total,
    rank: null,
    assessment: { state, missing },
    confidence,
    components: [assessmentComponent(tool, state)],
    explanation: buildExplanation(tool, total, missing),
  };
}

/**
 * Orders only distinct explicit values. Equal or incomplete assessments are
 * deliberately indistinguishable to the comparator: no slug/name fallback is
 * permitted.
 */
export function compareScoreResults(
  left: CompareScoreResult,
  right: CompareScoreResult,
): number {
  if (left.total === null || right.total === null) return 0;
  return right.total - left.total;
}

/**
 * Assigns a shared rank to each distinct supported value while preserving the
 * caller's candidate order. There is no tie-break and incomplete entries have
 * no rank.
 */
export function rankCompareScores(results: CompareScoreResult[]): CompareScoreResult[] {
  const rankedValues = [...new Set(
    results.flatMap((result) => (result.total === null ? [] : [result.total])),
  )].sort((left, right) => right - left);

  return results.map((result) => ({
    ...result,
    rank: result.total === null ? null : rankedValues.indexOf(result.total) + 1,
  }));
}

/**
 * Pure per-tool assessment pipeline. Input order is retained because it is
 * never evidence of superiority; scores/ranks themselves are order-independent.
 */
export function compareToolsForCompare(tools: ToolPublic[]): CompareScoreResult[] {
  return rankCompareScores(tools.map(scoreToolForCompare));
}
