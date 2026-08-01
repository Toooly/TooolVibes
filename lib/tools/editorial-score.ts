import type {
  EditorialScoreDimension,
  EditorialScoreLevel,
  ToolRecord,
} from "@/lib/types/tool";

export type EditorialScoreEntry = {
  key: EditorialScoreDimension;
  label: string;
  level: EditorialScoreLevel;
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

const scoreLevelStrength: Record<EditorialScoreLevel, number> = {
  measured: 1,
  solid: 2,
  strong: 3,
};

export function getEditorialScoreDimensions() {
  return scoreDimensions;
}

export function getEditorialScoreStrength(level: EditorialScoreLevel) {
  return scoreLevelStrength[level];
}

export function getEditorialScorecard(tool: ToolRecord): EditorialScoreEntry[] {
  /* A legacy scorecard alone has no verified date, verdict or limits contract.
     Keep it out of public decision surfaces instead of completing it from
     category, tags, featured state or copy. */
  void tool;
  return [];
}

export function getEditorialScoreLevelLabel(level: EditorialScoreLevel) {
  if (level === "strong") {
    return "Molto forte";
  }

  if (level === "solid") {
    return "Solido";
  }

  return "Misurato";
}

export function getEditorialScoreHighlights(tool: ToolRecord, limit = 2) {
  return [...getEditorialScorecard(tool)]
    .sort((left, right) => {
      if (right.strength !== left.strength) {
        return right.strength - left.strength;
      }

      return scoreDimensions.findIndex((item) => item.key === left.key) - scoreDimensions.findIndex((item) => item.key === right.key);
    })
    .slice(0, limit);
}

export function getEditorialScoreSummary(tool: ToolRecord, limit = 2) {
  return getEditorialScoreHighlights(tool, limit).map((entry) => ({
    ...entry,
    summary: `${entry.label}: ${entry.descriptor}`,
  }));
}

export function getCompareDimensionLeaders(
  tools: ToolRecord[],
  dimension: EditorialScoreDimension,
): string[] {
  void tools;
  void dimension;
  return [];
}
