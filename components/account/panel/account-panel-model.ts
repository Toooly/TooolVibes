import type { DiscoveryLocalSnapshot } from "@/lib/discovery/local-storage";
import { hasToolDecisionNote } from "@/lib/tools/discovery";

/* ═══════════════════════════════════════════════════════════════
   AccountPanel — modello puro (B27).
   Tipi e derivazioni senza React: snapshot workspace, label di
   stato/continuità, toni del messaggio auth. Logica invariata
   rispetto al monolite; test in
   __tests__/components/account/account-panel-model.test.ts.
   ═══════════════════════════════════════════════════════════════ */

export type WorkspaceSnapshot = {
  saved: number;
  compare: number;
  top: number;
  review: number;
  pinned: number;
  notes: number;
};

export type AccountSubmissionsPayload = {
  toolRequests: Array<{
    id: string;
    tool_name: string;
    tool_url: string;
    submitter_type?: "community" | "founder";
    status: string;
    created_at: string;
  }>;
  affiliateRequests: Array<{
    id: string;
    brand_name: string | null;
    status: string;
    referral_url: string | null;
    created_at: string;
  }>;
  remoteAvailable: boolean;
};

export type VibeSignupContext = {
  source: string;
  email: string;
  vibes: string;
  xp: string;
};

export type SavedToolCardView = {
  slug: string;
  name: string;
  category: string;
  description: string;
  stage: string;
  pinned: boolean;
  note: string;
};

export type AccountPanelStatus = "loading" | "guest" | "authenticated" | "unavailable";

/** Stato account minimo richiesto dalle derivazioni del pannello. */
export type AccountStateInput = {
  authEnabled: boolean;
  status: AccountPanelStatus;
  isAttaching: boolean;
  workspaceAttachPending: boolean;
};

/**
 * Slice strutturale del contesto account usato dalle sezioni.
 * Il valore di `useAccount()` è assegnabile per struttura: il
 * provider resta l'unica sorgente dello stato di sessione (B18/B19).
 */
export type AccountPanelAccountSlice = AccountStateInput & {
  isSendingLink: boolean;
  hasQuarantinedWorkspace: boolean;
  isRestoringQuarantinedWorkspace: boolean;
  authMessage?: string | null;
  user: { email?: string | null } | null;
  sendMagicLink: (
    email: string,
    metadata?: Record<string, string | number | boolean | null | undefined>,
  ) => Promise<{ ok: boolean; message: string }>;
  restoreQuarantinedWorkspace: () => Promise<{ ok: boolean; message: string }>;
  signOut: () => Promise<void>;
};

export type AccountPersistenceSlice = {
  mode: "local" | "remote";
  phase: string;
};

export function readWorkspaceSnapshot(snapshot: DiscoveryLocalSnapshot): WorkspaceSnapshot {
  const shortlist = snapshot.shortlist;
  const compare = snapshot.compare;
  const shortlistStages = snapshot.shortlistStages;
  const memories = snapshot.decisionMemories;

  return {
    saved: shortlist.length,
    compare: compare.length,
    top: shortlist.filter((slug) => (shortlistStages[slug] ?? "saved") === "top").length,
    review: shortlist.filter((slug) => (shortlistStages[slug] ?? "saved") === "review").length,
    pinned: shortlist.filter((slug) => Boolean(memories[slug]?.is_pinned)).length,
    notes: shortlist.filter((slug) => hasToolDecisionNote(memories[slug] ?? {})).length,
  };
}

export function getPersistenceLabel(persistence: AccountPersistenceSlice): string {
  return persistence.mode === "remote"
    ? persistence.phase === "saving"
      ? "Salvataggio in corso"
      : persistence.phase === "error"
        ? "Salvataggio in pausa"
        : "Selezione sincronizzata"
    : "Salvato su questo dispositivo";
}

export function getAccountStateLabel(account: AccountStateInput): string {
  return account.status === "authenticated"
    ? "Account attivo"
    : account.status === "loading"
      ? "Caricamento"
      : account.authEnabled
        ? "Accesso attivabile"
        : "Sessione locale";
}

export function getHeroBadgeLabel(account: AccountStateInput): string {
  return account.isAttaching
    ? "Collegamento in corso"
    : account.workspaceAttachPending
      ? "Sync in attesa"
      : getAccountStateLabel(account);
}

export function getContinuityStatusLabel(account: AccountStateInput): string {
  return account.isAttaching
    ? "Collegamento in corso"
    : account.workspaceAttachPending
      ? "Locale, sync in attesa"
      : account.status === "authenticated"
        ? "Account agganciato"
        : "Sessione pronta da collegare";
}

export function getContinuityCopy(account: AccountStateInput): string {
  return account.isAttaching
    ? "Stiamo collegando salvati, confronto e note all'account corrente senza perdere il lavoro già fatto."
    : account.workspaceAttachPending
      ? "La selezione resta disponibile in questo browser. La sincronizzazione online è in attesa; i dati locali non vengono spostati o cancellati."
      : account.status === "authenticated"
        ? "La selezione è agganciata all'account e resta pronta quando torni da un altro browser o da una nuova sessione."
        : account.authEnabled
          ? "La selezione esiste già e può essere collegata con una mail di conferma senza ricominciare da zero."
          : "La selezione resta in questo browser finché l'accesso email non viene attivato.";
}

export type AuthMessageTone = {
  borderColor: string;
  background: string;
};

/** Tono inline del messaggio auth (warning/success), invariato dal monolite. */
export function getAuthMessageTone(message: string): AuthMessageTone {
  return message.includes("non disponibile") ||
    message.includes("pausa") ||
    message.includes("supera il limite") ||
    message.includes("errore")
    ? {
        borderColor: "rgba(161,105,47,0.18)",
        background: "rgba(255,251,235,0.96)",
      }
    : {
        borderColor: "rgba(15,118,110,0.18)",
        background: "rgba(236,253,245,0.95)",
      };
}

/** Classe del messaggio auth: il set di keyword è volutamente quello originale. */
export function getAuthMessageClassName(message: string): string {
  return `account-message ${
    message.includes("non disponibile") ||
    message.includes("pausa") ||
    message.includes("errore")
      ? "account-message--warning"
      : "account-message--success"
  }`;
}
