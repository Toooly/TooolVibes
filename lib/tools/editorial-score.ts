import type {
  EditorialScoreDimension,
  EditorialScoreLevel,
  ToolCategory,
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

const scoreStrengthLevel: Record<number, EditorialScoreLevel> = {
  1: "measured",
  2: "solid",
  3: "strong",
};

const categoryScoreBase: Record<ToolCategory, Record<EditorialScoreDimension, number>> = {
  "Assistente AI": {
    ease_of_use: 2,
    versatility: 2,
    polish: 2,
    workflow_fit: 2,
    experimentation_value: 3,
    editorial_conviction: 2,
  },
  Design: {
    ease_of_use: 2,
    versatility: 2,
    polish: 3,
    workflow_fit: 2,
    experimentation_value: 3,
    editorial_conviction: 2,
  },
  Sviluppo: {
    ease_of_use: 1,
    versatility: 3,
    polish: 2,
    workflow_fit: 3,
    experimentation_value: 3,
    editorial_conviction: 2,
  },
  Marketing: {
    ease_of_use: 2,
    versatility: 2,
    polish: 3,
    workflow_fit: 2,
    experimentation_value: 2,
    editorial_conviction: 2,
  },
  Produttività: {
    ease_of_use: 3,
    versatility: 3,
    polish: 2,
    workflow_fit: 3,
    experimentation_value: 2,
    editorial_conviction: 2,
  },
  Video: {
    ease_of_use: 2,
    versatility: 2,
    polish: 3,
    workflow_fit: 3,
    experimentation_value: 3,
    editorial_conviction: 2,
  },
  Scrittura: {
    ease_of_use: 3,
    versatility: 2,
    polish: 2,
    workflow_fit: 3,
    experimentation_value: 2,
    editorial_conviction: 2,
  },
};

const descriptorCopy: Record<EditorialScoreDimension, Record<EditorialScoreLevel, string>> = {
  ease_of_use: {
    measured: "richiede un po' di contesto",
    solid: "si legge in fretta",
    strong: "entra subito in mano",
  },
  versatility: {
    measured: "più focalizzato",
    solid: "copre più scenari",
    strong: "regge bene contesti diversi",
  },
  polish: {
    measured: "funzionale",
    solid: "molto curato",
    strong: "rifinito con carattere",
  },
  workflow_fit: {
    measured: "serve il contesto giusto",
    solid: "si integra bene",
    strong: "entra facile nel flusso",
  },
  experimentation_value: {
    measured: "utile per test mirati",
    solid: "invita a sperimentare",
    strong: "accende subito nuove prove",
  },
  editorial_conviction: {
    measured: "resta in radar",
    solid: "merita attenzione",
    strong: "alto valore curatoriale",
  },
};

function clampScore(value: number) {
  return Math.max(1, Math.min(3, value));
}

function getEditorialConvictionBase(tool: ToolRecord) {
  if (tool.editorial_scorecard?.editorial_conviction) {
    return scoreLevelStrength[tool.editorial_scorecard.editorial_conviction];
  }

  if (tool.editorial_state === "In evidenza" || tool.is_featured) {
    return 3;
  }

  if (tool.editorial_state === "Da tenere d'occhio" || tool.editorial_state === "Nuovo in archivio") {
    return 3;
  }

  return 2;
}

function deriveEditorialScorecard(tool: ToolRecord): Record<EditorialScoreDimension, EditorialScoreLevel> {
  const base = { ...categoryScoreBase[tool.category] };
  const haystack = [
    tool.short_description_it,
    tool.description_it,
    tool.best_for ?? "",
    ...(tool.use_cases ?? []),
    ...(tool.tags ?? []),
    ...(tool.platforms ?? []),
  ]
    .join(" ")
    .toLowerCase();

  if (haystack.includes("rapido") || haystack.includes("rapida") || haystack.includes("no-code") || haystack.includes("workspace")) {
    base.ease_of_use = clampScore(base.ease_of_use + 1);
  }

  if (haystack.includes("team") || haystack.includes("workspace") || haystack.includes("landing") || haystack.includes("research")) {
    base.versatility = clampScore(base.versatility + 1);
  }

  if (haystack.includes("branding") || haystack.includes("visual") || haystack.includes("image") || haystack.includes("curata") || haystack.includes("moderni") || haystack.includes("estet")) {
    base.polish = clampScore(base.polish + 1);
  }

  if (haystack.includes("workflow") || haystack.includes("debug") || haystack.includes("refactor") || haystack.includes("operativa") || haystack.includes("post-produzione") || haystack.includes("integra")) {
    base.workflow_fit = clampScore(base.workflow_fit + 1);
  }

  if (haystack.includes("concept") || haystack.includes("creative") || haystack.includes("research") || haystack.includes("gen-ai") || haystack.includes("agentic") || haystack.includes("prototype") || haystack.includes("moodboard")) {
    base.experimentation_value = clampScore(base.experimentation_value + 1);
  }

  base.editorial_conviction = getEditorialConvictionBase(tool);

  const derived = Object.fromEntries(
    scoreDimensions.map((dimension) => [
      dimension.key,
      scoreStrengthLevel[base[dimension.key]],
    ]),
  ) as Record<EditorialScoreDimension, EditorialScoreLevel>;

  const explicit = tool.editorial_scorecard ?? {};

  return {
    ease_of_use: explicit.ease_of_use ?? derived.ease_of_use,
    versatility: explicit.versatility ?? derived.versatility,
    polish: explicit.polish ?? derived.polish,
    workflow_fit: explicit.workflow_fit ?? derived.workflow_fit,
    experimentation_value: explicit.experimentation_value ?? derived.experimentation_value,
    editorial_conviction: explicit.editorial_conviction ?? derived.editorial_conviction,
  };
}

export function getEditorialScoreDimensions() {
  return scoreDimensions;
}

export function getEditorialScoreStrength(level: EditorialScoreLevel) {
  return scoreLevelStrength[level];
}

export function getEditorialScorecard(tool: ToolRecord): EditorialScoreEntry[] {
  const levels = deriveEditorialScorecard(tool);

  return scoreDimensions.map((dimension) => ({
    key: dimension.key,
    label: dimension.label,
    level: levels[dimension.key],
    strength: scoreLevelStrength[levels[dimension.key]],
    descriptor: descriptorCopy[dimension.key][levels[dimension.key]],
  }));
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

export function getCompareDimensionLeaders(tools: ToolRecord[], dimension: EditorialScoreDimension) {
  const entries = tools.map((tool) => {
    const score = getEditorialScorecard(tool).find((item) => item.key === dimension);

    return {
      tool,
      strength: score?.strength ?? 1,
    };
  });

  const max = Math.max(...entries.map((entry) => entry.strength));
  return entries.filter((entry) => entry.strength === max).map((entry) => entry.tool.slug);
}
