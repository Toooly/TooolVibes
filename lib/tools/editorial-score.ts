import type {
  EditorialScoreDimension,
  ToolRecord,
} from "@/lib/types/tool";

export type EditorialScoreEntry = {
  key: EditorialScoreDimension;
  label: string;
  level: "measured" | "solid" | "strong";
  strength: number;
  descriptor: string;
};

type ScoreDimensionMeta = {
  key: EditorialScoreDimension;
  label: string;
};

const scoreDimensions: ScoreDimensionMeta[] = [
  { key: "ease_of_use", label: "Facilità d'uso" },
  { key: "versatility", label: "Versatilità" },
  { key: "polish", label: "Cura dell'interfaccia" },
  { key: "workflow_fit", label: "Integrazione nel flusso" },
  { key: "experimentation_value", label: "Valore sperimentale" },
  { key: "editorial_conviction", label: "Convinzione editoriale" },
];

const scoreLevelStrength: Record<"measured" | "solid" | "strong", number> = {
  measured: 1,
  solid: 2,
  strong: 3,
};

export function getEditorialScoreDimensions() {
  return scoreDimensions;
}

export function getEditorialScoreStrength(level: "measured" | "solid" | "strong") {
  return scoreLevelStrength[level];
}

export function getEditorialScoreLevelLabel(level: "measured" | "solid" | "strong") {
  if (level === "strong") {
    return "Molto forte";
  }

  if (level === "solid") {
    return "Solido";
  }

  return "Misurato";
}

function isScorecardMap(
  input: unknown,
): input is Partial<Record<EditorialScoreDimension, "measured" | "solid" | "strong">> {
  return (
    typeof input === "object" &&
    input !== null &&
    !Array.isArray(input) &&
    !("editorial_scorecard" in (input as Record<string, unknown>))
  );
}

/**
 * Restituisce le entry della scorecard editoriale. Closure 2026-08-03:
 * una scorecard parziale o derivata da `level`/`featured` NON è un
 * assessment editoriale. La funzione restituisce `[]` a meno che il
 * chiamante non passi esplicitamente una scorecard canonica verified
 * (con metadati di metodologia, data, fonti).
 *
 * Accetta sia una scorecard (record) sia un `ToolRecord` legacy (per
 * compatibilità con `EditorialScorecard` e altri componenti storici).
 */
export function getEditorialScorecard(
  input:
    | ToolRecord
    | Partial<Record<EditorialScoreDimension, "measured" | "solid" | "strong">>
    | null
    | undefined,
): EditorialScoreEntry[] {
  const scorecard = isScorecardMap(input)
    ? input
    : input?.editorial_scorecard ?? null;

  if (!scorecard) return [];

  return scoreDimensions
    .map((dimension) => {
      const level = scorecard[dimension.key];
      if (!level) return null;
      return {
        key: dimension.key,
        label: dimension.label,
        level,
        strength: scoreLevelStrength[level],
        descriptor: getEditorialScoreLevelLabel(level),
      };
    })
    .filter((entry): entry is EditorialScoreEntry => entry !== null);
}

export function getEditorialScoreHighlights(
  input:
    | ToolRecord
    | Partial<Record<EditorialScoreDimension, "measured" | "solid" | "strong">>
    | null
    | undefined,
  limit = 2,
) {
  return [...getEditorialScorecard(input)]
    .sort((left, right) => {
      if (right.strength !== left.strength) {
        return right.strength - left.strength;
      }

      return (
        scoreDimensions.findIndex((item) => item.key === left.key) -
        scoreDimensions.findIndex((item) => item.key === right.key)
      );
    })
    .slice(0, limit);
}

export function getEditorialScoreSummary(
  input:
    | ToolRecord
    | Partial<Record<EditorialScoreDimension, "measured" | "solid" | "strong">>
    | null
    | undefined,
  limit = 2,
) {
  return getEditorialScoreHighlights(input, limit).map((entry) => ({
    ...entry,
    summary: `${entry.label}: ${getEditorialScoreLevelLabel(entry.level)}`,
  }));
}

/**
 * Ritorna gli slug dei tool leader su una dimensione. Più tool possono
 * co-leaderare quando hanno lo stesso strength massimo. Nessun tie-break
 * di ordinamento: l'uguaglianza è una vera uguaglianza editoriale.
 *
 * Closure 2026-08-03: questa funzione non viene più usata nel runtime
 * pubblico (richiede scorecard verified con metadati). È mantenuta per
 * compatibilità con `compare-board.tsx` (legacy matrix) e con i test
 * storici.
 */
export function getCompareDimensionLeaders(
  tools: Array<
    | ToolRecord
    | { slug: string; scorecard: EditorialScoreEntry[] | null | undefined }
  >,
  dimension: EditorialScoreDimension,
): string[] {
  const resolved = tools.map((input) => {
    if ("scorecard" in input) {
      return { slug: input.slug, scorecard: input.scorecard };
    }
    return {
      slug: input.slug,
      scorecard: getEditorialScorecard(input as ToolRecord),
    };
  });

  let best: { strength: number; slugs: string[] } | null = null;

  for (const { slug, scorecard } of resolved) {
    const entry = (scorecard ?? []).find((item) => item.key === dimension);
    if (!entry) continue;
    if (best === null || entry.strength > best.strength) {
      best = { strength: entry.strength, slugs: [slug] };
    } else if (entry.strength === best.strength) {
      best.slugs.push(slug);
    }
  }

  return best?.slugs ?? [];
}
