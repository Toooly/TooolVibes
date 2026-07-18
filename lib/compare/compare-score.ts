import type { EditorialScoreLevel } from "@/lib/types/tool";
import type { ToolPublic } from "@/lib/types/tool-public";

/**
 * BATCH 33 / FLOW-602 — Compare scoring contract.
 *
 * Motore deterministico di scoring per il confronto pubblico.
 *
 * Garanzie del contratto:
 * - dipende SOLO dai campi canonici `ToolPublic` (mai da indici, hash,
 *   flag featured o campi legati alla sorgente CMS);
 * - l'ordine di input non cambia il risultato: il ranking usa un
 *   comparatore canonico (totale, copertura, slug);
 * - l'assenza di dati riduce la confidence: i componenti senza dati
 *   non contribuiscono e non vengono inventati punteggi;
 * - ogni componente dichiara la sua provenance (campo dominio + regola).
 */

export const COMPARE_SCORE_VERSION = "compare-score-v1";

export type CompareConfidenceLevel = "high" | "medium" | "low";

export type CompareScoreProvenance = {
  /** Campo canonico ToolPublic da cui deriva il componente. */
  field: string;
  /** Regola deterministica applicata al campo, in forma leggibile. */
  rule: string;
};

export type CompareScoreComponentKey =
  | "editorial-scorecard"
  | "editorial-evidence"
  | "use-case-coverage"
  | "taxonomy-context";

export type CompareScoreComponent = {
  key: CompareScoreComponentKey;
  label: string;
  /** Peso percentuale sul totale (somma dei pesi = 100). */
  weight: number;
  /** false quando il dato canonico manca: nessun contributo assegnato. */
  available: boolean;
  /** Valore normalizzato 0-100 del componente (0 quando non disponibile). */
  value: number;
  provenance: CompareScoreProvenance;
};

export type CompareScoreConfidence = {
  level: CompareConfidenceLevel;
  /** Quota di peso coperta da dati reali (0..1). */
  coverage: number;
  /** Etichette dei componenti senza dati + missingFields tracciati dalla sorgente. */
  missing: string[];
};

export type CompareScoreResult = {
  version: typeof COMPARE_SCORE_VERSION;
  slug: string;
  name: string;
  /** Punteggio complessivo 0-100, media pesata sui soli componenti disponibili. */
  total: number;
  /** Posizione nel ranking canonico; assegnata da rankCompareScores. */
  rank: number;
  confidence: CompareScoreConfidence;
  components: CompareScoreComponent[];
  /** Spiegazione stabile e leggibile del punteggio (una riga per fatto). */
  explanation: string[];
};

const SCORECARD_WEIGHT = 45;
const EVIDENCE_WEIGHT = 25;
const USE_CASE_WEIGHT = 20;
const TAXONOMY_WEIGHT = 10;
const TOTAL_WEIGHT = SCORECARD_WEIGHT + EVIDENCE_WEIGHT + USE_CASE_WEIGHT + TAXONOMY_WEIGHT;

const CONFIDENCE_HIGH_MIN_COVERAGE = 0.75;
const CONFIDENCE_MEDIUM_MIN_COVERAGE = 0.45;

const EVIDENCE_MAX_COUNTED = 3;
const EVIDENCE_POINTS_EACH = 25;
const REVIEW_POINTS = 25;

const USE_CASE_MAX_COUNTED = 4;
const USE_CASE_POINTS_EACH = 25;

const TAXONOMY_CATEGORY_POINTS = 50;
const TAXONOMY_MAX_TAGS_COUNTED = 4;
const TAXONOMY_TAG_POINTS = 12.5;

const scorecardLevelValue: Record<EditorialScoreLevel, number> = {
  measured: 55,
  solid: 75,
  strong: 95,
};

const confidenceLevelLabel: Record<CompareConfidenceLevel, string> = {
  high: "alta",
  medium: "media",
  low: "bassa",
};

function round(value: number) {
  return Math.round(value);
}

function scorecardComponent(tool: ToolPublic): CompareScoreComponent {
  const field = "score.inputs";

  if (!tool.score || tool.score.inputs.length === 0) {
    return {
      key: "editorial-scorecard",
      label: "Valutazione editoriale",
      weight: SCORECARD_WEIGHT,
      available: false,
      value: 0,
      provenance: {
        field,
        rule: "richiede la scorecard editoriale canonica; assente, nessun valore stimato",
      },
    };
  }

  const inputs = tool.score.inputs;
  const average =
    inputs.reduce((sum, input) => sum + scorecardLevelValue[input.level], 0) / inputs.length;

  return {
    key: "editorial-scorecard",
    label: "Valutazione editoriale",
    weight: SCORECARD_WEIGHT,
    available: true,
    value: round(average),
    provenance: {
      field,
      rule: `media dei livelli editoriali (measured=55, solid=75, strong=95) su ${inputs.length} dimensioni; metodologia ${tool.score.provenance.methodologyVersion} (${tool.score.provenance.kind})`,
    },
  };
}

function evidenceComponent(tool: ToolPublic): CompareScoreComponent {
  const field = "editorial.evidence";
  const strengths = tool.editorial.evidence.filter(
    (item) => item.kind === "strength" || item.kind === "highlight",
  ).length;
  const hasReview = tool.editorial.evidence.some((item) => item.kind === "review");

  if (strengths === 0 && !hasReview) {
    return {
      key: "editorial-evidence",
      label: "Prove editoriali",
      weight: EVIDENCE_WEIGHT,
      available: false,
      value: 0,
      provenance: {
        field,
        rule: "richiede punti di forza o una recensione editoriale; assenti, nessun valore stimato",
      },
    };
  }

  const counted = Math.min(strengths, EVIDENCE_MAX_COUNTED);
  const value = counted * EVIDENCE_POINTS_EACH + (hasReview ? REVIEW_POINTS : 0);

  return {
    key: "editorial-evidence",
    label: "Prove editoriali",
    weight: EVIDENCE_WEIGHT,
    available: true,
    value: round(value),
    provenance: {
      field,
      rule: `${strengths} ${strengths === 1 ? "punto" : "punti"} di forza (max ${EVIDENCE_MAX_COUNTED} contati, ${EVIDENCE_POINTS_EACH} pt cad.)${hasReview ? ` + recensione presente (${REVIEW_POINTS} pt)` : ""}`,
    },
  };
}

function caseCoverageComponent(tool: ToolPublic): CompareScoreComponent {
  const field = "content.useCases";
  const count = tool.content.useCases.length;

  if (count === 0) {
    return {
      key: "use-case-coverage",
      label: "Copertura casi d'uso",
      weight: USE_CASE_WEIGHT,
      available: false,
      value: 0,
      provenance: {
        field,
        rule: "richiede casi d'uso dichiarati; assenti, nessun valore stimato",
      },
    };
  }

  const counted = Math.min(count, USE_CASE_MAX_COUNTED);

  return {
    key: "use-case-coverage",
    label: "Copertura casi d'uso",
    weight: USE_CASE_WEIGHT,
    available: true,
    value: round(counted * USE_CASE_POINTS_EACH),
    provenance: {
      field,
      rule: `${count} casi d'uso dichiarati (max ${USE_CASE_MAX_COUNTED} contati, ${USE_CASE_POINTS_EACH} pt cad.)`,
    },
  };
}

function taxonomyComponent(tool: ToolPublic): CompareScoreComponent {
  const field = "taxonomy";
  const hasCanonicalCategory = tool.taxonomy.canonicalCategory !== null;
  const tagCount = tool.taxonomy.tags.length;

  if (!hasCanonicalCategory && tagCount === 0) {
    return {
      key: "taxonomy-context",
      label: "Contesto tassonomico",
      weight: TAXONOMY_WEIGHT,
      available: false,
      value: 0,
      provenance: {
        field,
        rule: "richiede categoria canonica o tag; assenti, nessun valore stimato",
      },
    };
  }

  const countedTags = Math.min(tagCount, TAXONOMY_MAX_TAGS_COUNTED);
  const value =
    (hasCanonicalCategory ? TAXONOMY_CATEGORY_POINTS : 0) + countedTags * TAXONOMY_TAG_POINTS;

  return {
    key: "taxonomy-context",
    label: "Contesto tassonomico",
    weight: TAXONOMY_WEIGHT,
    available: true,
    value: round(value),
    provenance: {
      field,
      rule: `categoria canonica ${hasCanonicalCategory ? `presente (${TAXONOMY_CATEGORY_POINTS} pt)` : "assente"} + ${tagCount} tag (max ${TAXONOMY_MAX_TAGS_COUNTED} contati, 12,5 pt cad.)`,
    },
  };
}

function buildExplanation(
  name: string,
  total: number,
  confidence: CompareScoreConfidence,
  components: CompareScoreComponent[],
  trackedMissingFields: string[],
): string[] {
  const coveragePercent = round(confidence.coverage * 100);
  const lines = [
    `${name}: punteggio ${total}/100 con confidence ${confidenceLevelLabel[confidence.level]} (copertura dati ${coveragePercent}%).`,
  ];

  for (const component of components) {
    if (component.available) {
      lines.push(
        `+ ${component.label}: ${component.value}/100, peso ${component.weight}% — ${component.provenance.rule} [fonte: ${component.provenance.field}].`,
      );
    } else {
      lines.push(
        `- ${component.label}: dati assenti, nessun contributo assegnato [fonte attesa: ${component.provenance.field}].`,
      );
    }
  }

  if (trackedMissingFields.length > 0) {
    lines.push(`Campi mancanti dichiarati dalla sorgente: ${[...trackedMissingFields].sort().join(", ")}.`);
  }

  return lines;
}

/**
 * Punteggio deterministico di un singolo tool. Funzione pura:
 * stesso input canonico → stesso output, indipendentemente da
 * ordine, indice o contesto degli altri candidati.
 */
export function scoreToolForCompare(tool: ToolPublic): CompareScoreResult {
  const components = [
    scorecardComponent(tool),
    evidenceComponent(tool),
    caseCoverageComponent(tool),
    taxonomyComponent(tool),
  ];

  const availableWeight = components
    .filter((component) => component.available)
    .reduce((sum, component) => sum + component.weight, 0);

  const weightedSum = components
    .filter((component) => component.available)
    .reduce((sum, component) => sum + component.value * component.weight, 0);

  const total = availableWeight === 0 ? 0 : round(weightedSum / availableWeight);
  const coverage = availableWeight / TOTAL_WEIGHT;

  const level: CompareConfidenceLevel =
    coverage >= CONFIDENCE_HIGH_MIN_COVERAGE
      ? "high"
      : coverage >= CONFIDENCE_MEDIUM_MIN_COVERAGE
        ? "medium"
        : "low";

  const missing = [
    ...components
      .filter((component) => !component.available)
      .map((component) => component.label),
    ...tool.provenance.missingFields,
  ];

  const confidence: CompareScoreConfidence = { level, coverage, missing };

  return {
    version: COMPARE_SCORE_VERSION,
    slug: tool.slug,
    name: tool.name,
    total,
    rank: 0,
    confidence,
    components,
    explanation: buildExplanation(
      tool.name,
      total,
      confidence,
      components,
      tool.provenance.missingFields,
    ),
  };
}

/**
 * Comparatore canonico del ranking: totale decrescente, poi copertura
 * dati decrescente, poi slug crescente. Nessun riferimento all'ordine
 * di input: le permutazioni producono lo stesso ranking.
 */
export function compareScoreResults(
  left: CompareScoreResult,
  right: CompareScoreResult,
): number {
  if (right.total !== left.total) {
    return right.total - left.total;
  }

  if (right.confidence.coverage !== left.confidence.coverage) {
    return right.confidence.coverage - left.confidence.coverage;
  }

  return left.slug < right.slug ? -1 : left.slug > right.slug ? 1 : 0;
}

/**
 * Ordina i risultati con il comparatore canonico e assegna i rank 1..N.
 */
export function rankCompareScores(results: CompareScoreResult[]): CompareScoreResult[] {
  return [...results].sort(compareScoreResults).map((result, index) => ({
    ...result,
    rank: index + 1,
  }));
}

/**
 * Pipeline completa: scoring puro per tool + ranking canonico.
 */
export function compareToolsForCompare(tools: ToolPublic[]): CompareScoreResult[] {
  return rankCompareScores(tools.map(scoreToolForCompare));
}
