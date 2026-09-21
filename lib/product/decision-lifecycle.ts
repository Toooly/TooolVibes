export const DECISION_LIFECYCLE = [
  "scopri",
  "valuta",
  "confronta",
  "decidi",
  "ricorda",
] as const;

export type DecisionLifecycleStage = (typeof DECISION_LIFECYCLE)[number];

export const DECISION_LIFECYCLE_LABELS: Record<DecisionLifecycleStage, string> = {
  scopri: "Scopri",
  valuta: "Valuta",
  confronta: "Confronta",
  decidi: "Decidi",
  ricorda: "Ricorda",
};

export const DECISION_LIFECYCLE_HINTS: Record<DecisionLifecycleStage, string> = {
  scopri: "Catalogo",
  valuta: "Schede",
  confronta: "Differenze",
  decidi: "Scelta",
  ricorda: "Perché",
};

export const DECISION_LIFECYCLE_HREFS: Record<DecisionLifecycleStage, string> = {
  scopri: "/archivio",
  valuta: "/archivio",
  confronta: "/compare",
  decidi: "/compare",
  ricorda: "/shortlist",
};

export function formatDecisionLifecycle(separator = " → "): string {
  return DECISION_LIFECYCLE.map((stage) => DECISION_LIFECYCLE_LABELS[stage]).join(
    separator,
  );
}

export const SHORTLIST_MEANING =
  "Candidati che stai considerando. Salvare non è decidere.";

export const DECISION_MEANING =
  "Hai scelto un tool, rispetto ad altri, per un motivo.";

export const DECISION_LIFECYCLE_COPY: Record<DecisionLifecycleStage, string> = {
  scopri: "Parti dal catalogo, da un obiettivo.",
  valuta: "Leggi scheda, limiti e livello prima di scegliere.",
  confronta: "Tieni in gioco solo le alternative che contano.",
  decidi: "Scegli con un criterio, e tieni il perché.",
  ricorda: "Conserva il motivo. Tra tre mesi ti servirà.",
};
