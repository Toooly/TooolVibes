export const WORKSPACE_VIEWS = [
  "riprendi",
  "biblioteca",
  "stack",
  "decisioni",
  "segnale",
  "attivita",
] as const;

export type WorkspaceView = (typeof WORKSPACE_VIEWS)[number];

export const WORKSPACE_VIEW_LABELS: Record<WorkspaceView, string> = {
  riprendi: "Riprendi",
  biblioteca: "Biblioteca",
  stack: "Stack",
  decisioni: "Decisioni",
  segnale: "Segnale",
  attivita: "Attività",
};

export const PIPELINE_LABELS = {
  salvato: "Salvato",
  da_valutare: "Da valutare",
  candidato: "Candidato",
  scelto: "Scelto",
  scartato: "Scartato",
  rimandato: "Rimandato",
} as const;

export function isWorkspaceView(value: string | null): value is WorkspaceView {
  return WORKSPACE_VIEWS.includes(value as WorkspaceView);
}
