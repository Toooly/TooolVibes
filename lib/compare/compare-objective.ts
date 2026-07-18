/**
 * BATCH 34 / FLOW-603 — Compare per obiettivo.
 *
 * Configurazione canonica degli obiettivi del confronto: etichette,
 * parole chiave e pesi delle fonti usati dall'adapter
 * `tool-battle-shared.withObjectiveScores`.
 *
 * Garanzie del contratto:
 * - configurazione dichiarativa e versionata: ogni obiettivo elenca le
 *   parole chiave cercate nei campi testuali del tool e i pesi delle
 *   fonti sono espliciti (nessun punteggio nascosto);
 * - l'impatto è limitato: il boost obiettivo è al massimo
 *   `COMPARE_OBJECTIVE_MAX_DELTA` punti sul punteggio base;
 * - l'obiettivo neutro (`null`) non tocca il motore: il risultato
 *   riproduce il contratto base B33 (`lib/compare/compare-score`).
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

/**
 * Punteggio massimo che l'obiettivo può aggiungere al punteggio base
 * (il totale resta comunque clammato in 0-100 dall'adapter).
 */
export const COMPARE_OBJECTIVE_MAX_DELTA = 15;

/** Punti assegnati per ogni hit pesato di parola chiave. */
export const COMPARE_OBJECTIVE_POINTS_PER_HIT = 2.5;

/**
 * Pesi delle fonti testuali in cui si cercano le parole chiave.
 * Ordine stabile: è anche l'ordine in cui i pesi sono spiegati in UI.
 */
export const COMPARE_OBJECTIVE_SOURCE_WEIGHTS = [
  { key: "highlights", label: "punti di forza", weight: 1.5 },
  { key: "useCases", label: "casi d'uso", weight: 1 },
  { key: "tags", label: "tag", weight: 0.75 },
  { key: "category", label: "categoria", weight: 0.5 },
] as const;

export type CompareObjectiveSourceKey =
  (typeof COMPARE_OBJECTIVE_SOURCE_WEIGHTS)[number]["key"];

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

function formatWeight(weight: number): string {
  return String(weight).replace(".", ",");
}

/**
 * Spiegazione stabile e leggibile dei pesi dell'obiettivo, condivisa
 * identica tra mobile e desktop (FLOW-603). Per l'obiettivo neutro
 * dichiara che il contratto base B33 resta invariato.
 */
export function describeCompareObjectiveWeights(
  objective: CompareObjective | null,
): string[] {
  if (objective === null) {
    return [
      "Obiettivo neutro: nessun boost applicato, il confronto riproduce il contratto base dello score (B33).",
      `Pesi delle dimensioni invariati: valutazione editoriale 45%, prove editoriali 25%, casi d'uso 20%, contesto tassonomico 10%.`,
    ];
  }

  const label = getCompareObjectiveLabel(objective);
  const sources = COMPARE_OBJECTIVE_SOURCE_WEIGHTS.map(
    (source) => `${source.label} ×${formatWeight(source.weight)}`,
  ).join(", ");
  const keywordCount = COMPARE_OBJECTIVE_KEYWORDS[objective].length;

  return [
    `Obiettivo "${label}": fino a +${COMPARE_OBJECTIVE_MAX_DELTA} punti sul punteggio base, in base ai segnali trovati nel tool.`,
    `Pesi delle fonti: ${sources}. Ogni hit vale ${formatWeight(COMPARE_OBJECTIVE_POINTS_PER_HIT)} punti.`,
    `${keywordCount} parole chiave associate a questo obiettivo; il punteggio base (B33) resta il punto di partenza.`,
  ];
}
