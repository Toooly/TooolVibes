import {
  formatUtcTimeLabel,
  type ProductHuntItem,
  type ProductHuntPayload,
  type ProductHuntRange,
} from "@/lib/radar/product-hunt-contract";

export type RadarUiState =
  | "loading"
  | "live"
  | "fixture"
  | "stale"
  | "empty"
  | "missing-token"
  | "error";

export const RADAR_RANGE_OPTIONS = [
  { key: "day", label: "Giorno" },
  { key: "week", label: "Settimana" },
  { key: "month", label: "Mese" },
] as const satisfies ReadonlyArray<{
  key: ProductHuntRange;
  label: string;
}>;

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
  items: readonly ProductHuntItem[];
}>;

const STATE_COPY: Record<
  RadarUiState,
  Pick<RadarUiModel, "statusLabel" | "stageTitle" | "stageBody">
> = {
  loading: {
    statusLabel: "CONNESSIONE",
    stageTitle: "Aggiorno il Radar",
    stageBody:
      "I segnali compaiono solo dopo una risposta reale di Product Hunt.",
  },
  live: {
    statusLabel: "LIVE",
    stageTitle: "Scansione attiva",
    stageBody: "Segnali Product Hunt aggiornati in tempo reale.",
  },
  fixture: {
    statusLabel: "QA FIXTURE",
    stageTitle: "Fixture visuale attiva",
    stageBody:
      "Dati simulati esclusivamente per il collaudo locale del layout.",
  },
  stale: {
    statusLabel: "ULTIMA SYNC",
    stageTitle: "Ultima sincronizzazione",
    stageBody:
      "Il feed live non ha risposto: mostriamo l'ultima classifica reale disponibile.",
  },
  empty: {
    statusLabel: "NESSUN SEGNALE",
    stageTitle: "Nessun lancio nel periodo",
    stageBody:
      "Product Hunt non ha restituito risultati reali per questo intervallo.",
  },
  "missing-token": {
    statusLabel: "IN PAUSA",
    stageTitle: "Radar in pausa",
    stageBody:
      "Il feed Product Hunt non è disponibile in questo momento. Nessun dato è stato simulato.",
  },
  error: {
    statusLabel: "OFFLINE",
    stageTitle: "Connessione non riuscita",
    stageBody:
      "Il feed Product Hunt non ha risposto. Riprova senza introdurre dati fittizi.",
  },
};

function resolveState(payload: ProductHuntPayload | undefined): RadarUiState {
  if (!payload) return "loading";
  if (payload.status !== "ok") return payload.status;
  if (payload.items.length === 0) return "empty";
  if (payload.source === "qa-fixture") return "fixture";
  return payload.stale ? "stale" : "live";
}

export function resolveRadarUiModel(
  payload: ProductHuntPayload | undefined,
  requestedRange: ProductHuntRange,
): RadarUiModel {
  const state = resolveState(payload);
  const range = payload?.range ?? requestedRange;
  const rangeLabel =
    RADAR_RANGE_OPTIONS.find((option) => option.key === range)?.label ?? range;
  const copy = STATE_COPY[state];
  const updatedAtLabel =
    payload?.status === "ok"
      ? formatUtcTimeLabel(payload?.updatedAt ?? "")
      : "—";
  const signalCount =
    state === "live" || state === "fixture" || state === "stale"
      ? payload?.items.length ?? 0
      : state === "empty"
        ? 0
        : null;
  const sourceLabel =
    state === "live"
      ? `Dati live Product Hunt · aggiornati il ${updatedAtLabel}`
      : state === "fixture"
        ? `Fixture QA locale · dati simulati · ${updatedAtLabel}`
      : state === "stale"
        ? `Ultima classifica reale Product Hunt · ${updatedAtLabel}`
        : state === "loading"
          ? "Connessione al feed Product Hunt"
          : state === "empty"
            ? payload?.source === "product-hunt-stale"
              ? `Ultima verifica reale Product Hunt · nessun lancio · ${updatedAtLabel}`
              : payload?.source === "qa-fixture"
                ? `Fixture QA locale · nessun lancio simulato · ${updatedAtLabel}`
                : `Feed Product Hunt verificato · nessun lancio · ${updatedAtLabel}`
            : state === "missing-token"
              ? "Feed Product Hunt non configurato"
              : "Feed Product Hunt temporaneamente non disponibile";

  return Object.freeze({
    state,
    range,
    rangeLabel,
    statusLabel: copy.statusLabel,
    sourceLabel,
    updatedAtLabel,
    signalCount,
    stageTitle: copy.stageTitle,
    stageBody:
      state === "error" && payload?.message ? payload.message : copy.stageBody,
    canRetry: state === "error" || state === "stale" || state === "empty",
    isAnimated: state === "live",
    items: payload?.items ?? [],
  });
}

export function formatRadarSignal(item: ProductHuntItem): string {
  if (item.votesCount > 0 && item.commentsCount > 0) {
    return `${item.votesCount} voti · ${item.commentsCount} commenti`;
  }
  if (item.votesCount > 0) return `${item.votesCount} voti`;
  if (item.commentsCount > 0) return `${item.commentsCount} commenti`;
  return "Segnale in verifica";
}
