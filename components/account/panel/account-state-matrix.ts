import type { AccountPanelStatus } from "./account-panel-model";

/* ═══════════════════════════════════════════════════════════════
   Account state matrix — modello puro (B59 / STATE-1002).
   Deriva la cella di stato della matrice /account da slice account,
   stato rete e esiti noti. Regola di copy: nessuna cella promette
   una sincronizzazione non avvenuta — `syncClaim: "synced"` esiste
   solo sull'esito reale di attach riuscito (provider B18/B19),
   tutto il resto dichiara onestamente "local-only" o "none".
   ═══════════════════════════════════════════════════════════════ */

export type AccountStateCellKind =
  | "loading"
  | "offline"
  | "unavailable"
  | "guest"
  | "link-pending"
  | "authenticated"
  | "attach-in-progress"
  | "attach-local-pending"
  | "attach-retry"
  | "attach-success";

export type AccountStateCellTone = "info" | "success" | "warning";

/** Cosa la cella può affermare onestamente sulla sincronizzazione. */
export type AccountStateSyncClaim = "none" | "local-only" | "synced";

export type AccountStateCellAction = {
  id: "resend-link";
  label: string;
};

export type AccountStateCell = {
  kind: AccountStateCellKind;
  tone: AccountStateCellTone;
  title: string;
  body: string;
  syncClaim: AccountStateSyncClaim;
  /** Recovery esplicita; null = recovery automatica o nessuna azione. */
  action: AccountStateCellAction | null;
};

export type AccountStateMatrixInput = {
  status: AccountPanelStatus;
  authEnabled: boolean;
  isOnline: boolean;
  isAttaching: boolean;
  workspaceAttachPending: boolean;
  pendingLinkEmail: string | null;
  authMessage?: string | null;
};

/* Keyword condivise con il tono auth del modello B27: i messaggi di
   attach degrado del provider (B18/B19) contengono sempre una di
   queste; il messaggio di successo contiene "collegata all'account". */
const ATTACH_RETRY_KEYWORDS = [
  "pausa",
  "non disponibile",
  "non è disponibile",
  "supera il limite",
];
const ATTACH_SUCCESS_KEYWORD = "collegata all'account";

export function isAttachDegradedMessage(message: string): boolean {
  return ATTACH_RETRY_KEYWORDS.some((keyword) => message.includes(keyword));
}

export function isAttachSuccessMessage(message: string): boolean {
  return !isAttachDegradedMessage(message) && message.includes(ATTACH_SUCCESS_KEYWORD);
}

/**
 * Risolve la cella della matrice. Precedenza: offline contestualizza
 * ogni altro stato (spiega perché invio/collegamento sono in pausa),
 * poi loading/unavailable, poi gli esiti attach della sessione
 * autenticata, poi il pending del magic link per il guest.
 */
export function resolveAccountStateCell(
  input: AccountStateMatrixInput,
): AccountStateCell {
  if (!input.isOnline) {
    return {
      kind: "offline",
      tone: "warning",
      title: "Sei offline",
      body: "La selezione resta salvata su questo browser: niente viene spostato o cancellato mentre sei offline. Invio del link, collegamento e aggiornamenti ripartono da soli quando la connessione torna.",
      syncClaim: "local-only",
      action: null,
    };
  }

  if (input.status === "loading") {
    return {
      kind: "loading",
      tone: "info",
      title: "Prepariamo il tuo spazio",
      body: "Stiamo verificando sessione e selezione locale. Nessuna azione richiesta.",
      syncClaim: "none",
      action: null,
    };
  }

  if (input.status === "unavailable" || !input.authEnabled) {
    return {
      kind: "unavailable",
      tone: "warning",
      title: "Accesso email non disponibile",
      body: "L'accesso con email non è attivo in questo momento. La selezione continua a vivere solo su questo browser e non viene sincronizzata finché l'accesso non torna disponibile.",
      syncClaim: "local-only",
      action: null,
    };
  }

  if (input.status === "authenticated") {
    const message = input.authMessage ?? "";

    if (input.isAttaching) {
      return {
        kind: "attach-in-progress",
        tone: "info",
        title: "Collegamento in corso",
        body: "Stiamo agganciando salvati, confronto e note al tuo account. Intanto tutto resta registrato anche su questo browser.",
        syncClaim: "local-only",
        action: null,
      };
    }

    if (message && isAttachDegradedMessage(message)) {
      return {
        kind: "attach-retry",
        tone: "info",
        title: "Solo su questo dispositivo",
        body: message,
        syncClaim: "local-only",
        action: null,
      };
    }

    if (message && isAttachSuccessMessage(message)) {
      return {
        kind: "attach-success",
        tone: "success",
        title: "Selezione collegata",
        body: message,
        syncClaim: "synced",
        action: null,
      };
    }

    if (input.workspaceAttachPending) {
      return {
        kind: "attach-local-pending",
        tone: "warning",
        title: "Salvataggio in corso",
        body: "La selezione resta su questo dispositivo. Il salvataggio online riprenderà automaticamente.",
        syncClaim: "local-only",
        action: null,
      };
    }

    return {
      kind: "authenticated",
      tone: "info",
      title: "Account attivo",
      body: "La sessione è attiva. Lo stato di sincronizzazione della selezione è riportato nella riga persistenza del pannello.",
      syncClaim: "none",
      action: null,
    };
  }

  if (input.pendingLinkEmail) {
    return {
      kind: "link-pending",
      tone: "success",
      title: `Link inviato a ${input.pendingLinkEmail}`,
      body: "Apri la mail e conferma l'accesso: la selezione di questo browser viene agganciata all'account solo dopo la conferma. Se il link è scaduto o non arriva, inviane uno nuovo.",
      syncClaim: "local-only",
      action: { id: "resend-link", label: "Invia di nuovo il link" },
    };
  }

  return {
    kind: "guest",
    tone: "info",
    title: "Sessione locale",
    body: "La selezione vive su questo browser. Con una mail di conferma puoi agganciarla al tuo account senza ricominciare da zero.",
    syncClaim: "local-only",
    action: null,
  };
}

/**
 * Quali celle diventano banner nel facade. Esclusi gli stati già
 * coperti dalla UI esistente B27/B39: loading (gate + spinner),
 * guest (form), authenticated (sezioni) e attach-in-progress
 * (badge hero + card continuità; coincide anche col sign-out).
 */
export function shouldRenderAccountStateBanner(cell: AccountStateCell): boolean {
  return (
    cell.kind === "offline" ||
    cell.kind === "unavailable" ||
    cell.kind === "link-pending" ||
    cell.kind === "attach-local-pending" ||
    cell.kind === "attach-retry" ||
    cell.kind === "attach-success"
  );
}

/* ── Matrice errori submission account ─────────────────────────── */

export type AccountSubmissionsErrorKind =
  | "unauthorized"
  | "rate-limited"
  | "server"
  | "offline"
  | "unavailable";

/** Classifica l'esito della fetch submission: 401/403/429/5xx/offline. */
export function classifySubmissionsHttpStatus(
  status: number | undefined,
  isOffline: boolean,
): AccountSubmissionsErrorKind {
  if (isOffline) {
    return "offline";
  }
  if (status === 401 || status === 403) {
    return "unauthorized";
  }
  if (status === 429) {
    return "rate-limited";
  }
  if (status !== undefined && status >= 500) {
    return "server";
  }
  return "unavailable";
}

export type AccountSubmissionsErrorCell = {
  kind: AccountSubmissionsErrorKind;
  title: string;
  body: string;
  retryLabel: string;
};

/** Copy esplicita per ogni cella di errore: nessun silent empty state. */
export function resolveSubmissionsErrorCell(
  kind: AccountSubmissionsErrorKind,
): AccountSubmissionsErrorCell {
  switch (kind) {
    case "unauthorized":
      return {
        kind,
        title: "Sessione non riconosciuta",
        body: "Il servizio ha risposto 401: la sessione non risulta più valida. Le submission restano associate alla tua email; esci e riaccedi, oppure riprova tra un istante.",
        retryLabel: "Riprova",
      };
    case "rate-limited":
      return {
        kind,
        title: "Troppe richieste",
        body: "Il servizio submission ha risposto 429. Attendi qualche istante prima di riprovare: nessun dato è stato perso.",
        retryLabel: "Riprova tra poco",
      };
    case "server":
      return {
        kind,
        title: "Servizio submission non disponibile",
        body: "Il servizio ha risposto con un errore 5xx. Le tue submission non risultano caricate, non perse: riprova a breve.",
        retryLabel: "Riprova",
      };
    case "offline":
      return {
        kind,
        title: "Sei offline",
        body: "Le submission si aggiornano quando la connessione torna. Intanto la selezione resta salvata su questo browser.",
        retryLabel: "Riprova ora",
      };
    default:
      return {
        kind: "unavailable",
        title: "Submission non caricate",
        body: "Non siamo riusciti a recuperare le submission in questo momento. Nessun dato è stato modificato: puoi riprovare subito.",
        retryLabel: "Riprova",
      };
  }
}
