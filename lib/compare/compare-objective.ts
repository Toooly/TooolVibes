/**
 * BATCH 34 / FLOW-603 — Compare per obiettivo.
 *
 * Configurazione canonica degli obiettivi del confronto: etichette e parole
 * chiave utili a guidare la lettura, senza trasformarle in un punteggio.
 *
 * Garanzie del contratto:
 * - configurazione dichiarativa e versionata: ogni obiettivo elenca parole
 *   chiave da considerare nei campi testuali del tool;
 * - le priorità non modificano una valutazione editoriale né scelgono un
 *   vincitore automatico;
 * - l'obiettivo neutro (`null`) mantiene la lettura generale invariata.
 */

export const COMPARE_OBJECTIVE_CONFIG_VERSION = "compare-objective-v1";

export const COMPARE_OBJECTIVES = [
  { key: "save-time", label: "Risparmiare tempo" },
  { key: "quality", label: "Aumentare qualità" },
  { key: "save-money", label: "Ridurre costi" },
  { key: "learn-fast", label: "Imparare velocemente" },
  { key: "collaborate", label: "Collaborare" },
  { key: "scale", label: "Scalare" },
  { key: "experiment", label: "Sperimentare" },
] as const;

export type CompareObjective = (typeof COMPARE_OBJECTIVES)[number]["key"];

/** Chiave di persistenza locale dell'obiettivo selezionato (versionata). */
export const COMPARE_OBJECTIVE_STORAGE_KEY = "tooolvibes:compare-objective:v1";

/** Nome del parametro di deep link (`/compare?objective=save-time`). */
export const COMPARE_OBJECTIVE_QUERY_PARAM = "objective";

export const COMPARE_OBJECTIVE_KEYWORDS: Record<CompareObjective, readonly string[]> = {
  "save-time": [
    "automation",
    "automazione",
    "productivity",
    "produttività",
    "no-code",
    "low-code",
    "workflow",
    "save time",
    "risparmiare tempo",
    "faster",
    "quick",
    "rapid",
    "velocizza",
    "ai writing",
    "ai image",
    "ai video",
    "generate fast",
    "veloce",
  ],
  quality: [
    "design",
    "video",
    "polish",
    "professional",
    "high quality",
    "high-quality",
    "refined",
    "pixel-perfect",
    "creative",
    "craft",
    "visuals",
    "production",
    "qualità",
    "professionale",
  ],
  "save-money": [
    "free",
    "freemium",
    "open source",
    "affordable",
    "cheap",
    "low cost",
    "cost-effective",
    "budget",
    "gratis",
    "senza costi",
    "economico",
    "risparmiare",
  ],
  "learn-fast": [
    "beginner",
    "intuitive",
    "intuitivo",
    "easy",
    "facile",
    "simple",
    "template",
    "tutorial",
    "onboarding",
    "gentle",
    "low learning curve",
    "impara velocemente",
  ],
  collaborate: [
    "team",
    "collaboration",
    "collaborazione",
    "collaborare",
    "share",
    "condividi",
    "feedback",
    "comment",
    "workspace",
    "customer support",
    "comunicazione",
  ],
  scale: [
    "expert",
    "enterprise",
    "scalability",
    "scalabilità",
    "scalare",
    "api",
    "integration",
    "enterprise-grade",
    "growth",
    "infra",
    "performante",
    "grandi volumi",
  ],
  experiment: [
    "vibe-coding",
    "ai-app-builder",
    "prototype",
    "prototipo",
    "beta",
    "experiment",
    "test",
    "hackathon",
    "try",
    "playful",
    "sandbox",
    "new tech",
    "sperimentare",
  ],
};

export function isCompareObjective(value: unknown): value is CompareObjective {
  return (
    typeof value === "string" &&
    COMPARE_OBJECTIVES.some((objective) => objective.key === value)
  );
}

export function getCompareObjectiveLabel(key: CompareObjective): string {
  const definition = COMPARE_OBJECTIVES.find((objective) => objective.key === key);
  return definition?.label ?? key;
}

/**
 * Stable, shared objective guidance. The export name is retained for current
 * consumers, but it no longer describes weights or score boosts.
 */
export function describeCompareObjectiveWeights(
  objective: CompareObjective | null,
): string[] {
  if (objective === null) {
    return [
      "Obiettivo neutro: confronta le valutazioni editoriali e le differenze verificabili.",
      "Nessun punteggio aggiuntivo o vincitore automatico viene applicato.",
    ];
  }

  const label = getCompareObjectiveLabel(objective);

  return [
    `Obiettivo “${label}”: usalo per leggere casi d'uso e limiti nel tuo contesto.`,
    "La priorità non modifica la valutazione editoriale e non assegna un vincitore automatico.",
  ];
}

// ---------------------------------------------------------------------------
// Builder-first objective profiles (dimension weights)
// ---------------------------------------------------------------------------

import type { CanonicalDimension } from "./objective-fit";
import { DIMENSION_LABELS } from "./objective-fit";

/** Weight profile for an objective. Sum must equal 1. */
export type ObjectiveProfile = {
  key: CompareObjective;
  label: string;
  weights: Record<CanonicalDimension, number>;
  primaryDimensions: CanonicalDimension[];
  rationale: string;
};

/** Validate that profile weights sum to 1. */
function validateWeights(profile: ObjectiveProfile): ObjectiveProfile {
  const sum = Object.values(profile.weights).reduce((a, b) => a + b, 0);
  if (Math.abs(sum - 1) > 0.001) {
    throw new Error(
      `Objective profile "${profile.key}" weights sum to ${sum}, expected 1.`,
    );
  }
  return profile;
}

const PROFILE_DEFINITIONS: Array<{
  key: CompareObjective;
  label: string;
  weights: Record<CanonicalDimension, number>;
  primaryDimensions: CanonicalDimension[];
  rationale: string;
}> = [
  {
    key: "save-time",
    label: "Risparmiare tempo",
    weights: {
      workflowFit: 0.3,
      easeOfUse: 0.25,
      versatility: 0.15,
      experienceQuality: 0.05,
      operationalMaturity: 0.05,
      experimentationSpeed: 0.2,
    },
    primaryDimensions: ["workflowFit", "easeOfUse", "experimentationSpeed"],
    rationale:
      "Privilegia l'adozione rapida, l'integrazione nel flusso esistente e la velocita di validazione rispetto alla qualita percepita o alla maturita operativa.",
  },
  {
    key: "quality",
    label: "Aumentare qualità",
    weights: {
      workflowFit: 0.1,
      easeOfUse: 0.05,
      versatility: 0.2,
      experienceQuality: 0.35,
      operationalMaturity: 0.2,
      experimentationSpeed: 0.1,
    },
    primaryDimensions: ["experienceQuality", "operationalMaturity", "versatility"],
    rationale:
      "Mette al centro la qualita dell'output e la credibilita professionale, seguite da maturita operativa e copertura di casi d'uso.",
  },
  {
    key: "save-money",
    label: "Ridurre costi",
    weights: {
      workflowFit: 0.25,
      easeOfUse: 0.1,
      versatility: 0.15,
      experienceQuality: 0.05,
      operationalMaturity: 0.35,
      experimentationSpeed: 0.1,
    },
    primaryDimensions: ["operationalMaturity", "workflowFit", "versatility"],
    rationale:
      "Misura l'efficienza operativa e la riduzione della complessita. Non finge di conoscere il pricing: premia controllo dei dati, export e bassa dipendenza dal vendor.",
  },
  {
    key: "learn-fast",
    label: "Imparare velocemente",
    weights: {
      workflowFit: 0.1,
      easeOfUse: 0.45,
      versatility: 0.1,
      experienceQuality: 0.15,
      operationalMaturity: 0.05,
      experimentationSpeed: 0.15,
    },
    primaryDimensions: ["easeOfUse", "experimentationSpeed", "experienceQuality"],
    rationale:
      "La facilita d'uso domina: quanto e rapido arrivare al primo risultato utile senza attrito iniziale.",
  },
  {
    key: "collaborate",
    label: "Collaborare",
    weights: {
      workflowFit: 0.2,
      easeOfUse: 0.15,
      versatility: 0.15,
      experienceQuality: 0.1,
      operationalMaturity: 0.3,
      experimentationSpeed: 0.1,
    },
    primaryDimensions: ["operationalMaturity", "workflowFit", "easeOfUse"],
    rationale:
      "Privilegia permessi, gestione dei dati e controllo operativo, seguiti da fit nel workflow di team.",
  },
  {
    key: "scale",
    label: "Scalare",
    weights: {
      workflowFit: 0.15,
      easeOfUse: 0.05,
      versatility: 0.2,
      experienceQuality: 0.1,
      operationalMaturity: 0.4,
      experimentationSpeed: 0.1,
    },
    primaryDimensions: ["operationalMaturity", "versatility", "workflowFit"],
    rationale:
      "La maturita operativa e la capacita di gestire volumi e integrazioni sono dominanti.",
  },
  {
    key: "experiment",
    label: "Sperimentare",
    weights: {
      workflowFit: 0.1,
      easeOfUse: 0.2,
      versatility: 0.15,
      experienceQuality: 0.05,
      operationalMaturity: 0.05,
      experimentationSpeed: 0.45,
    },
    primaryDimensions: ["experimentationSpeed", "easeOfUse", "versatility"],
    rationale:
      "La velocita di validazione e la rapidita di adozione dominano: quanto si riesce a testare in fretta senza setup pesanti.",
  },
];

/** Objective profiles with validated weights. */
export const OBJECTIVE_PROFILES: ReadonlyArray<ObjectiveProfile> =
  PROFILE_DEFINITIONS.map(validateWeights);

/** Map for quick lookup by objective key. */
const profileByKey = new Map(OBJECTIVE_PROFILES.map((p) => [p.key, p]));

/** Get the weight profile for an objective. Returns null for unknown keys. */
export function getObjectiveProfile(
  key: CompareObjective | null,
): ObjectiveProfile | null {
  if (key === null) return null;
  return profileByKey.get(key) ?? null;
}

/** Describe the objective profile for UI explanation. */
export function describeObjectiveProfile(
  profile: ObjectiveProfile | null,
): string[] {
  if (!profile) {
    return [
      "Obiettivo neutro: il confronto usa la valutazione editoriale generale senza aggiustamenti.",
      "I pesi delle sei dimensioni seguono la formula canonica builder-first.",
    ];
  }

  const parts = Object.entries(profile.weights)
    .filter(([, w]) => w >= 0.15)
    .sort(([, a], [, b]) => b - a)
    .map(([dim, w]) => `${DIMENSION_LABELS[dim as CanonicalDimension]} ${Math.round(w * 100)}%`)
    .join(", ");

  return [
    `Obiettivo "${profile.label}": ${profile.rationale}`,
    `Pesi principali: ${parts}.`,
    "Il punteggio TooolVibes (valutazione generale) non cambia; il fit influenza solo ranking, Arena e decision workspace.",
  ];
}
