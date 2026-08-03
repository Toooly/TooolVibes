import {
  formatUtcTimeLabel,
  getRadarFreshnessThresholdMs,
  type ProductHuntItem,
  type ProductHuntPayload,
  type ProductHuntRange,
} from "@/lib/radar/product-hunt-contract";

/**
 * Internal Radar state model. Some states (fixture, missing-token) are
 * mapped to the V2 user-facing 5-state model (`loading | live | empty |
 * stale | error`) by the `statusLabel` / `stageTitle` / `stageBody`
 * triads below. The internal granularity is preserved so the API and
 * dev-only paths can keep their existing diagnostics without
 * fabricating user-visible text.
 */
export type RadarUiState =
  | "loading"
  | "live"
  | "fixture"
  | "stale"
  | "empty"
  | "missing-token"
  | "error";

/**
 * Periodi calendario (riferimento API: window rolling rispetto a now).
 * I periodi sono esposti in italiano secondo il contratto V2: rolling
 * `Oggi` / `Ultimi 7 giorni` / `Ultimi 30 giorni`.
 */
export const RADAR_RANGE_OPTIONS = [
  { key: "day", label: "Oggi" },
  { key: "week", label: "Ultimi 7 giorni" },
  { key: "month", label: "Ultimi 30 giorni" },
] as const satisfies ReadonlyArray<{
  key: ProductHuntRange;
  label: string;
}>;

/**
 * H2 live dinamico per periodo (rolling, V2 §10).
 */
export const RADAR_LIVE_H2: Record<ProductHuntRange, string> = {
  day: "Segnali di oggi",
  week: "Segnali degli ultimi 7 giorni",
  month: "Segnali degli ultimi 30 giorni",
};

export type RadarUiModel = Readonly<{
  state: RadarUiState;
  range: ProductHuntRange;
  rangeLabel: string;
  statusLabel: string;
  sourceLabel: string;
  updatedAtLabel: string;
  signalCount: number | null;
  stageTitle: string;
  stageBody: string;
  canRetry: boolean;
  isAnimated: boolean;
  /**
   * Varianza interna del flag `stale` basata sull'età reale del
   * `updatedAt` rispetto alla soglia di freshness. Closure check
   * 2026-08-03 §4: distingue "ultimo aggiornamento disponibile"
   * (transient error) da "aggiornamento non recente" (cache
   * scaduto). Solo significativa quando `state === "stale"`.
   */
  staleVariant: "recent" | "old" | null;
  items: readonly ProductHuntItem[];
}>;

/**
 * Mappe di copy per stato. Tutti i label sono UPPERCASE o sentence-case
 * secondo il contratto V2. La parola "LIVE" è bandita per scelta editoriale
 * (V2 §3): il live usa "Dati aggiornati".
 *
 * `fixture` resta "QA FIXTURE" come segnale di debug non visibile in
 * produzione (la fixture è gated da `process.env.NODE_ENV === "development"`
 * + `TOOOLVIBES_RADAR_QA_FIXTURE=1`).
 *
 * `missing-token` è un alias di `error` per il display (stessa copy
 * utente: "Dati non disponibili") ma mantiene l'internal state per
 * consentire diagnosi server-side senza leak tecnici in pagina.
 */
const STATE_COPY: Record<
  RadarUiState,
  Pick<RadarUiModel, "statusLabel" | "stageTitle" | "stageBody">
> = {
  loading: {
    statusLabel: "Connessione a Product Hunt",
    stageTitle: "Aggiornamento del Radar",
    stageBody:
      "Stiamo recuperando i segnali da Product Hunt. I risultati compariranno appena saranno disponibili.",
  },
  live: {
    statusLabel: "Dati aggiornati",
    stageTitle: "", // filled in by `stageTitleForRange` at resolve time
    stageBody:
      "Ordinati in base ai dati disponibili da Product Hunt. Apri un lancio per verificarlo alla fonte.",
  },
  fixture: {
    statusLabel: "QA FIXTURE",
    stageTitle: "Fixture visuale attiva",
    stageBody:
      "Dati simulati esclusivamente per il collaudo locale del layout.",
  },
  /**
   * Closure check 2026-08-03 §4: stale ha DUE varianti
   * (recent / old) selezionate a runtime in base all'età reale
   * di `updatedAt`. I placeholder `{updatedAt}` vengono
   * riempiti da `stageBodyForState` al resolve time.
   *
   * - recent: dati entro la soglia (60min). UI rassicura
   *   l'utente che l'errore live è stato transitorio.
   * - old: dati oltre la soglia. UI segnala chiaramente che il
   *   dato è vecchio.
   */
  stale: {
    statusLabel: "Ultimo aggiornamento disponibile", // placeholder, replaced by staleVariant
    stageTitle: "", // placeholder, replaced by staleVariant
    stageBody: "", // placeholder, replaced by staleVariant
  },
  empty: {
    statusLabel: "Nessun segnale disponibile",
    stageTitle: "Nessun segnale disponibile",
    stageBody:
      "Product Hunt non ha restituito dati per questo periodo. Prova un altro intervallo oppure riprova tra poco.",
  },
  "missing-token": {
    statusLabel: "Dati non disponibili",
    stageTitle: "Non riusciamo ad aggiornare il Radar",
    stageBody:
      "La connessione a Product Hunt non è disponibile in questo momento. Non mostriamo dati simulati o risultati precedenti come se fossero aggiornati.",
  },
  error: {
    statusLabel: "Dati non disponibili",
    stageTitle: "Non riusciamo ad aggiornare il Radar",
    stageBody:
      "La connessione a Product Hunt non è disponibile in questo momento. Non mostriamo dati simulati o risultati precedenti come se fossero aggiornati.",
  },
};

const STALE_RECENT_COPY = {
  statusLabel: "Ultimo aggiornamento disponibile",
  stageTitle: "Stai visualizzando l'ultimo aggiornamento disponibile",
  stageBody:
    "Non siamo riusciti a recuperare dati più recenti. I risultati mostrati risalgono al {updatedAt}.",
} as const;

const STALE_OLD_COPY = {
  statusLabel: "Aggiornamento non recente",
  stageTitle: "I dati potrebbero non essere aggiornati",
  stageBody:
    "L'ultimo aggiornamento risale al {updatedAt}. Puoi consultare i risultati disponibili oppure riprovare.",
} as const;

function resolveState(payload: ProductHuntPayload | undefined): RadarUiState {
  if (!payload) return "loading";
  if (payload.status !== "ok") return payload.status;
  if (payload.items.length === 0) return "empty";
  if (payload.source === "qa-fixture") return "fixture";
  return payload.stale ? "stale" : "live";
}

/**
 * Source label V2 (provenance nota utente):
 * - live: "Fonte: Product Hunt. Disponibilità e frequenza di
 *   aggiornamento dipendono dalla fonte."
 * - stale: "Aggiornamento non recente — ultima sync {updatedAt}."
 * - error/empty: "Dati non disponibili" / "Nessun segnale disponibile".
 *
 * Non dichiara: aggiornamento in tempo reale, feed completo,
 * classifica verificata, rilevanza editoriale.
 */
function resolveSourceLabel(
  state: RadarUiState,
  payload: ProductHuntPayload | undefined,
  updatedAtLabel: string,
): string {
  if (state === "live") {
    return "Fonte: Product Hunt. Disponibilità e frequenza di aggiornamento dipendono dalla fonte.";
  }
  if (state === "stale") {
    return `Ultima sincronizzazione Product Hunt · ${updatedAtLabel}`;
  }
  if (state === "loading") {
    return "Connessione a Product Hunt";
  }
  if (state === "empty") {
    return "Product Hunt non ha restituito dati per questo periodo.";
  }
  if (state === "missing-token") {
    return "Feed Product Hunt non configurato";
  }
  if (state === "error") {
    return payload?.message ?? "Feed Product Hunt temporaneamente non disponibile";
  }
  if (state === "fixture") {
    return `Fixture QA locale · dati simulati · ${updatedAtLabel}`;
  }
  return "Feed Product Hunt";
}

function stageTitleForRange(
  state: RadarUiState,
  range: ProductHuntRange,
  staleVariant: "recent" | "old" | null,
): string {
  if (state === "live") {
    return RADAR_LIVE_H2[range];
  }
  if (state === "stale" && staleVariant === "recent") {
    return STALE_RECENT_COPY.stageTitle;
  }
  if (state === "stale" && staleVariant === "old") {
    return STALE_OLD_COPY.stageTitle;
  }
  return STATE_COPY[state].stageTitle;
}

function stageBodyForState(
  state: RadarUiState,
  body: string,
  updatedAtLabel: string,
  staleVariant: "recent" | "old" | null,
): string {
  if (state === "stale" && staleVariant === "recent") {
    return STALE_RECENT_COPY.stageBody.replace(
      "{updatedAt}",
      updatedAtLabel,
    );
  }
  if (state === "stale" && staleVariant === "old") {
    return STALE_OLD_COPY.stageBody.replace(
      "{updatedAt}",
      updatedAtLabel,
    );
  }
  if (state === "error" && body) {
    return body;
  }
  return body;
}

function resolveStaleVariant(
  payload: ProductHuntPayload,
  range: ProductHuntRange,
  now: number,
): "recent" | "old" {
  const updatedAtMs = Date.parse(payload.updatedAt);
  if (Number.isNaN(updatedAtMs)) {
    // Senza timestamp valido, consideriamo "old" per coerenza
    // con la regola V2 §3 (no "Dati aggiornati" senza timestamp
    // verificabile).
    return "old";
  }
  const ageMs = Math.max(0, now - updatedAtMs);
  // Closure 2026-08-03 §1-3: la soglia è range-aware. Deriva da
  // RADAR_RANGE_SETTINGS[range].ttlMs (single source of truth,
  // condivisa con l'API route). Usiamo il `range` passato dal
  // chiamante (range effettivamente selezionato nella UI) come
  // chiave: in produzione corrisponde a `payload.range` perché
  // la UI fa una fetch per range, ma il parametro esplicito è
  // più robusto in test e garantisce che cambio range ricalcoli
  // correttamente la variante.
  const threshold = getRadarFreshnessThresholdMs(range);
  return ageMs < threshold ? "recent" : "old";
}

export function resolveRadarUiModel(
  payload: ProductHuntPayload | undefined,
  requestedRange: ProductHuntRange,
  now: number = Date.now(),
): RadarUiModel {
  const state = resolveState(payload);
  const range = payload?.range ?? requestedRange;
  const rangeLabel =
    RADAR_RANGE_OPTIONS.find((option) => option.key === range)?.label ?? range;
  const copy = STATE_COPY[state];
  // Closure 2026-08-03 §1-3: solo se status !== "ok" mostriamo
  // "—" (non c'è proprio un timestamp). Se status === "ok" ma
  // updatedAt è vuoto o malformato, lasciamo che formatUtcTimeLabel
  // produca "orario sconosciuto" (mai "Invalid Date").
  const updatedAtLabel =
    payload?.status === "ok"
      ? formatUtcTimeLabel(payload.updatedAt)
      : "—";
  const signalCount =
    state === "live" || state === "fixture" || state === "stale"
      ? payload?.items.length ?? 0
      : state === "empty"
        ? 0
        : null;
  const sourceLabel = resolveSourceLabel(state, payload, updatedAtLabel);

  // Closure check 2026-08-03 §1-3: per lo stato `stale`, distingui
  // "ultimo aggiornamento disponibile" (age < threshold del range,
  // transient error) da "aggiornamento non recente" (age >=
  // threshold del range, cache scaduto). La soglia è range-aware:
  // day=30min, week=3h, month=12h.
  //
  // Usiamo `requestedRange` (esplicito) come chiave per la soglia
  // perché in produzione la UI fa una fetch per ogni cambio di
  // range, quindi `payload.range === requestedRange`. In test
  // usiamo direttamente `requestedRange` per dimostrare che
  // cambio range ricalcola correttamente la variante stale.
  const staleVariant: "recent" | "old" | null =
    state === "stale" && payload
      ? resolveStaleVariant(payload, requestedRange, now)
      : null;
  const staleCopy =
    staleVariant === "recent"
      ? STALE_RECENT_COPY
      : staleVariant === "old"
        ? STALE_OLD_COPY
        : null;
  const effectiveStatusLabel = staleCopy?.statusLabel ?? copy.statusLabel;

  return Object.freeze({
    state,
    range,
    rangeLabel,
    statusLabel: effectiveStatusLabel,
    sourceLabel,
    updatedAtLabel,
    signalCount,
    stageTitle: stageTitleForRange(state, range, staleVariant),
    stageBody:
      state === "error" && payload?.message
        ? payload.message
        : stageBodyForState(state, copy.stageBody, updatedAtLabel, staleVariant),
    canRetry:
      state === "error" ||
      state === "stale" ||
      state === "empty" ||
      state === "missing-token",
    isAnimated: state === "live",
    staleVariant,
    items: payload?.items ?? [],
  });
}

/**
 * Format deterministica del singolo segnale (per aria-label e righe elenco).
 * `votesCount` < 1 o `commentsCount` < 1 non vengono inventati: cadenza
 * "1 voto" / "N voti" o "1 commento" / "N commenti"; in mancanza
 * "Dato non disponibile" (V2 §15 mappa / §16 elenco).
 */
export function formatRadarSignal(item: ProductHuntItem): string {
  const parts: string[] = [];
  if (item.votesCount > 0) {
    parts.push(`${item.votesCount} ${item.votesCount === 1 ? "voto" : "voti"}`);
  }
  if (item.commentsCount > 0) {
    parts.push(
      `${item.commentsCount} ${item.commentsCount === 1 ? "commento" : "commenti"}`,
    );
  }
  return parts.length > 0 ? parts.join(" · ") : "Dato non disponibile";
}
