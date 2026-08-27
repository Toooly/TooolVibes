export const WORKSPACE_VIEWS = [
  "riprendi",
  "salvati",
  "stack",
  "decisioni",
  "recenti",
  "segnale",
] as const;

export type WorkspaceView = (typeof WORKSPACE_VIEWS)[number];

export const WORKSPACE_VIEW_LABELS: Record<WorkspaceView, string> = {
  riprendi: "Home",
  salvati: "Salvati",
  stack: "Stack",
  decisioni: "Decisioni",
  recenti: "Recenti",
  segnale: "Segnale",
};

export const WORKSPACE_VIEW_KICKERS: Record<WorkspaceView, string> = {
  riprendi: "Riprendi",
  salvati: "Inventario",
  stack: "Banco",
  decisioni: "Diario",
  recenti: "Filo",
  segnale: "Progressione",
};

export const PIPELINE_LABELS = {
  salvato: "Salvato",
  da_valutare: "Da valutare",
  candidato: "Candidato",
  scelto: "Scelto",
  scartato: "Scartato",
  rimandato: "Rimandato",
} as const;

export {
  OUTCOME_ACTION_LABELS,
  OUTCOME_STATE_LABELS,
  STAGE_LABELS,
  formatRevisitLine,
} from "@/lib/account/workspace-lifecycle";

export const GUEST_SALVATI_HREF = "/shortlist";

const LEGACY_WORKSPACE_VIEWS: Record<string, WorkspaceView> = {
  attivita: "recenti",
  biblioteca: "salvati",
};

export function isWorkspaceView(value: string | null): value is WorkspaceView {
  return WORKSPACE_VIEWS.includes(value as WorkspaceView);
}

export function parseWorkspaceView(value: string | null | undefined): WorkspaceView {
  if (!value) return "riprendi";
  if (isWorkspaceView(value)) return value;
  return LEGACY_WORKSPACE_VIEWS[value] ?? "riprendi";
}

export function workspaceViewHref(
  view: WorkspaceView,
  extras?: { focus?: string; stack?: string },
): string {
  const focus = extras?.focus?.trim() ?? "";
  const stack = extras?.stack?.trim() ?? "";
  const hasExtras = Boolean(focus || stack);
  if (view === "riprendi" && !hasExtras) return "/account";

  const params = new URLSearchParams();
  params.set("view", view);
  if (focus) params.set("focus", focus);
  if (stack) params.set("stack", stack);
  return `/account?${params.toString()}`;
}

export function workspaceFocusHref(view: WorkspaceView, slug: string) {
  return workspaceViewHref(view, { focus: slug });
}

export function salvatiHref(authenticated: boolean) {
  return authenticated ? workspaceViewHref("salvati") : GUEST_SALVATI_HREF;
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
