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
