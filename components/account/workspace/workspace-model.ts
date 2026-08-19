export const WORKSPACE_VIEWS = [
  "riprendi",
  "biblioteca",
  "stack",
  "decisioni",
  "recenti",
  "segnale",
] as const;

export type WorkspaceView = (typeof WORKSPACE_VIEWS)[number];

export const WORKSPACE_VIEW_LABELS: Record<WorkspaceView, string> = {
  riprendi: "Home",
  biblioteca: "Biblioteca",
  stack: "Stack",
  decisioni: "Decisioni",
  recenti: "Recenti",
  segnale: "Segnale",
};

export const WORKSPACE_PRIMARY_VIEWS = [
  "riprendi",
  "biblioteca",
  "stack",
  "decisioni",
] as const;

export const WORKSPACE_SECONDARY_VIEWS = ["recenti", "segnale"] as const;

export const WORKSPACE_DISCOVER_LINKS = [
  { href: "/archivio", label: "Catalogo" },
  { href: "/radar", label: "Radar" },
  { href: "/compare", label: "Confronto" },
] as const;

export const PIPELINE_LABELS = {
  salvato: "Salvato",
  da_valutare: "Da valutare",
  candidato: "Candidato",
  scelto: "Scelto",
  scartato: "Scartato",
  rimandato: "Rimandato",
} as const;

const LEGACY_WORKSPACE_VIEWS: Record<string, WorkspaceView> = {
  attivita: "recenti",
};

export function isWorkspaceView(value: string | null): value is WorkspaceView {
  return WORKSPACE_VIEWS.includes(value as WorkspaceView);
}

export function parseWorkspaceView(value: string | null | undefined): WorkspaceView {
  if (!value) return "riprendi";
  if (isWorkspaceView(value)) return value;
  return LEGACY_WORKSPACE_VIEWS[value] ?? "riprendi";
}

export function workspaceViewHref(view: WorkspaceView): string {
  return view === "riprendi" ? "/account" : `/account?view=${view}`;
}

export function formatWorkspaceDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  return date.toLocaleDateString("it-IT", { day: "numeric", month: "short" });
}

export function emailLocalPart(email: string | null | undefined): string {
  const local = email?.split("@")[0]?.trim();
  return local || "account";
}

export function initialsFromEmail(email: string | null | undefined): string {
  const local = emailLocalPart(email);
  const parts = local.split(/[._+\-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
  }
  return (local.slice(0, 2) || "TV").toUpperCase();
}
