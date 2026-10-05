/**
 * Contratto dati condiviso tra l'adapter Product Hunt
 * (`app/api/product-hunt/route.ts`) e gli stati UI del Radar (B36 / FLOW-606).
 *
 * Regola di integrità: il ranking dichiara sempre provenienza (`source`),
 * timestamp di origine (`updatedAt`) e fallback esplicito (`stale` + `message`).
 * Nessun dato inventato: quando il feed non è disponibile `items` resta vuoto
 * e `source` è `"none"`.
 */

export type ProductHuntRange = "day" | "week" | "month";

export type ProductHuntItem = {
  id: string;
  name: string;
  tagline: string;
  votesCount: number;
  commentsCount: number;
  productHuntUrl: string;
  thumbnailUrl?: string;
  /**
   * ISO launch timestamp from the source (`createdAt`). Optional and additive:
   * older fixtures and cached payloads remain valid without it. When absent the
   * Radar NEVER infers recency from anything else.
   */
  launchedAt?: string;
  /** Product Hunt topic names (source transparency only — never a category). */
  topics?: string[];
  /** Product Hunt post slug (source identity, used for catalog matching). */
  slug?: string;
};

export type ProductHuntSource =
  /** Risposta live dell'API Product Hunt in questa richiesta. */
  | "product-hunt-live"
  /** Ultima classifica reale sincronizzata, servita come fallback dichiarato. */
  | "product-hunt-stale"
  /** Fixture deterministica, attivabile solo in sviluppo e dichiarata nella UI. */
  | "qa-fixture"
  /** Nessun dato reale disponibile (token assente o errore senza cache). */
  | "none";

export type ProductHuntPayload = {
  status: "ok" | "missing-token" | "error";
  source: ProductHuntSource;
  /** true solo quando il payload è l'ultima sync reale ri-servita dopo un errore live. */
  stale: boolean;
  range: ProductHuntRange;
  /** ISO timestamp di produzione dei dati all'origine; mai riscritto dal fallback stale. */
  updatedAt: string;
  items: ProductHuntItem[];
  message?: string;
  diag?: string;
  diagDetail?: string;
};

export type RadarDataState =
  | "loading"
  | "ready"
  | "empty"
  | "missing-token"
  | "error";

export function resolveRadarDataState(
  payload: ProductHuntPayload | undefined | null,
): RadarDataState {
  if (!payload) return "loading";
  if (payload.status !== "ok") return payload.status;
  return payload.items.length > 0 ? "ready" : "empty";
}

/**
 * Formattazione deterministica e timezone-esplicita del timestamp di origine.
 * Usata da UI e test: nessuna dipendenza dal locale o dal fuso dell'host.
 */
export function formatUtcTimeLabel(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  if (Number.isNaN(date.getTime())) return "orario sconosciuto";
  const months = [
    "gen",
    "feb",
    "mar",
    "apr",
    "mag",
    "giu",
    "lug",
    "ago",
    "set",
    "ott",
    "nov",
    "dic",
  ] as const;
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = months[date.getUTCMonth()];
  const year = date.getUTCFullYear();
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  return `${day} ${month} ${year} · ${hours}:${minutes} UTC`;
}

/**
 * Configurazione canonica per ogni range del Radar (range-aware,
 * closure 2026-08-03 §1-2).
 *
 * L'API Product Hunt (`app/api/product-hunt/route.ts`) usa gli
 * stessi valori per dimensionare la finestra di fetch e il TTL
 * della cache. La UI usa `ttlMs` come soglia di freshness per
 * decidere la variante "recent" vs "old" del fallback stale
 * (closure 2026-08-03 §1-3).
 *
 * Single source of truth: NON duplicare questi numeri altrove.
 * Per aggiungere un nuovo range aggiorna questa mappa E il tipo
 * `ProductHuntRange`.
 */
export const RADAR_RANGE_SETTINGS = {
  day: { days: 1, ttlMs: 30 * 60 * 1000, first: 20 },
  week: { days: 7, ttlMs: 3 * 60 * 60 * 1000, first: 30 },
  month: { days: 30, ttlMs: 12 * 60 * 60 * 1000, first: 40 },
} as const satisfies Record<
  ProductHuntRange,
  { days: number; ttlMs: number; first: number }
>;

/**
 * Soglia di freshness per il fallback stale del Radar, derivata
 * per range da `RADAR_RANGE_SETTINGS[range].ttlMs`.
 *
 * Closure 2026-08-03 §1-3: la soglia è range-aware (non più un
 * singolo valore globale di 1h). I valori:
 *
 *  - day:  30 min  → un dato "stale" con meno di 30 min è ancora
 *                   "ultimo aggiornamento disponibile"; oltre 30
 *                   min è "aggiornamento non recente".
 *  - week: 3 ore
 *  - month: 12 ore
 *
 * Concettualmente: `ttlMs` è la finestra di cache lato server
 * (dopo la quale il server invalida la cache). Se l'API serve un
 * payload con `stale: true` e `age < ttlMs`, vuol dire che
 * l'errore live è stato transitorio: UI rassicura l'utente.
 * Se `age >= ttlMs`, vuol dire che la cache è scaduta e il dato
 * è effettivamente vecchio: UI segnala.
 */
export function getRadarFreshnessThresholdMs(
  range: ProductHuntRange,
): number {
  return RADAR_RANGE_SETTINGS[range].ttlMs;
}
