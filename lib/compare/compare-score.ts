import type { ToolPublic } from "@/lib/types/tool-public";

/**
 * Compare's public assessment contract.
 *
 * A number is deliberately available only when the canonical editorial
 * assessment is complete. Evidence, use cases, taxonomy, names, slugs, and
 * field coverage may explain a comparison, but must never manufacture or
 * alter its score.
 *
 * Closure 2026-08-03 §8 — gerarchia di availability:
 *  1. `verified` — `ToolPublic.score` è un assessment editoriale completo
 *     (valore, fonte, metodologia, data, verdetto, evidenza, limiti). Solo
 *     `verified` pubblica un totale in Confronto / Arena.
 *  2. `derived_from_verified_scorecard` — riservato a un futuro scorecard
 *     canonico verificato editorialmente con metadati (data, metodologia,
 *     fonti). Per oggi nessun tool di directory ha uno scorecard verified:
 *     questo stato non viene mai pubblicato in produzione.
 *  3. `draft_review_required` — proposta editoriale non approvata. Non
 *     pubblicabile come punteggio definitivo.
 *  4. `not_assessed` — nessun dato editoriale. UI mostra "Valutazione
 *     editoriale in preparazione".
 *
 * Nessun valore viene dedotto da: completezza dei campi, use cases, tag,
 * evidenze libere, livello del tool, featured, popolarità o posizionamento
 * di marketing. Il commit `ab5ae91` ("fix(trust): remove synthetic public
 * scores") ha esplicitamente vietato la sintesi automatica; questo
 * contratto la ribadisce.
 */
export const COMPARE_SCORE_VERSION = "compare-score-v3-trust";

export type CompareConfidenceLevel = "high" | "medium" | "low";

export type CompareAssessmentState =
  | "verified"
  | "derived_from_verified_scorecard"
  | "draft_review_required"
  | "not_assessed";

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

const SUPPORT_FIELDS = "valutazione-editoriale";

/** Public-facing labels for incomplete assessment requirements. Never expose raw schema keys. */
const REQUIREMENT_PUBLIC_LABEL: Record<CompareAssessmentRequirement, string> = {
  "score.value": "punteggio editoriale",
  "score.provenance.kind": "fonte della valutazione",
  "score.provenance.methodologyVersion": "metodo di valutazione",
  "score.provenance.assessedAt": "data di verifica",
  "score.verdict": "verdetto editoriale",
  "editorial.evidence": "evidenze a supporto",
  "editorial.limitations": "limiti dichiarati",
};

export function formatCompareMissingRequirements(
  missing: readonly CompareAssessmentRequirement[],
): string {
  if (missing.length === 0) return "";
  const labels = missing.map((key) => REQUIREMENT_PUBLIC_LABEL[key] ?? "dato editoriale");
  if (labels.length === 1) return labels[0];
  if (labels.length === 2) return `${labels[0]} e ${labels[1]}`;
  return `${labels.slice(0, -1).join(", ")} e ${labels[labels.length - 1]}`;
}

export const COMPARE_INSUFFICIENT_EVIDENCE_MESSAGE =
  "Valutazione editoriale in preparazione.";

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

function supportedComponent(tool: ToolPublic): CompareScoreComponent {
  const available = typeof tool.score?.value === "number";

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

function formatAssessedDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function buildExplanation(
  tool: ToolPublic,
  state: CompareAssessmentState,
  total: number | null,
): string[] {
  if (state === "verified") {
    const verifiedOn = formatAssessedDate(tool.score?.provenance.assessedAt);
    return [
      verifiedOn
        ? `${tool.name}: valutazione editoriale ${total}/10, verificata il ${verifiedOn}.`
        : `${tool.name}: valutazione editoriale ${total}/10.`,
      tool.score?.verdict
        ? `Esito: ${tool.score.verdict}.`
        : "Esito disponibile.",
      "Il valore non incorpora quantità di prove, casi d'uso, tag o completezza dei campi.",
    ];
  }

  return [
    `${tool.name}: valutazione editoriale in preparazione.`,
    "Nessun punteggio viene mostrato finché l'assessment editoriale non sarà verificato.",
  ];
}

/**
 * Calcola la valutazione editoriale di un tool. Nessun punteggio viene
 * fabbricato da `level`, `featured`, `editorialScorecard` di default,
 * scorecard parziali, popolarità o altri campi non editoriali.
 *
 * Stati pubblicabili nel Confronto (closure 2026-08-03 §8):
 * - `verified` → `total = ToolPublic.score.value`
 * - `derived_from_verified_scorecard` → riservato a scorecard canoniche
 *   verificate con metadati editoriali; non si verifica in produzione.
 *
 * Stati non pubblicabili come punteggio definitivo:
 * - `draft_review_required`
 * - `not_assessed`
 */
export function scoreToolForCompare(tool: ToolPublic): CompareScoreResult {
  const missing = getMissingRequirements(tool);
  const state: CompareAssessmentState =
    missing.length === 0 ? "verified" : "not_assessed";
  const total = state === "verified" ? tool.score?.value ?? null : null;

  return {
    version: COMPARE_SCORE_VERSION,
    slug: tool.slug,
    name: tool.name,
    total,
    rank: null,
    assessment: { state, missing },
    confidence: {
      level: state === "verified" ? "high" : "low",
      coverage: state === "verified" ? 1 : 0,
      missing,
    },
    components: [supportedComponent(tool)],
    explanation: buildExplanation(tool, state, total),
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
