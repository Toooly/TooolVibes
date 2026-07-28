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
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  return `${hours}:${minutes} UTC`;
}
