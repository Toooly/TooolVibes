/**
 * Resolver deterministico delle predizioni Radar (B36 / FLOW-606).
 *
 * Modulo TypeScript puro condiviso tra:
 * - la edge function Supabase `resolve-radar-predictions` (Deno, import relativo
 *   `../_shared/radar-prediction-resolver.ts`);
 * - l'app Next.js (hook/UI) e i test vitest (import via alias `@/supabase/...`).
 *
 * Regole di integrità:
 * - nessun hash placeholder: lo score deriva SOLO dai segnali reali Product Hunt
 *   (voti + commenti pesati); un tool assente dal feed live ha score 0 con
 *   evidenza dichiarata `absent-from-product-hunt-live`;
 * - feed non disponibile o vuoto (`signals` null/[]) → nessuna risoluzione:
 *   i pronostici restano `pending` e il chiamante dichiara il fallback;
 * - XP solo quando `rewardsEnabled` è true (flag B04
 *   `TOOOLVIBES_GAME_PREDICTION_MODE=REWARDED`); altrimenti xpAwarded = 0;
 * - data contesto sempre UTC (`getUtcContextDate`), indipendente dal timezone host.
 */

export const RADAR_PREDICTION_SCORE_COMMENT_WEIGHT = 2;
export const RADAR_PREDICTION_XP_WON = 80;
export const RADAR_PREDICTION_XP_CLOSE = 20;

export type RadarResolverSignal = {
  id: string;
  name: string;
  votesCount: number;
  commentsCount: number;
};

export type RadarPredictionCandidate = {
  toolSlug: string;
  contextDate: string;
};

export type RadarPredictionEvidence =
  /** Score calcolato dai contatori reali del feed Product Hunt. */
  | "product-hunt-live"
  /** Il tool non compare nel feed live: evidenza reale di assenza, score 0. */
  | "absent-from-product-hunt-live";

export type RadarPredictionOutcome = "won" | "close" | "lost";

export type RadarPredictionResolution = {
  toolSlug: string;
  contextDate: string;
  evidence: RadarPredictionEvidence;
  score: number;
  /** Competition ranking deterministico: 1 + numero di score strettamente maggiori. */
  rank: number;
  rankCount: number;
  status: RadarPredictionOutcome;
  xpAwarded: number;
  actualRankChange: number;
};

const UTC_DAY_MS = 86_400_000;

/**
 * Data contesto YYYY-MM-DD in UTC con offset in giorni.
 * `toISOString` è sempre UTC: il risultato non dipende dal timezone dell'host.
 */
export function getUtcContextDate(reference: Date, dayOffset = 0): string {
  const shifted = new Date(reference.getTime() + dayOffset * UTC_DAY_MS);
  return shifted.toISOString().slice(0, 10);
}

export function normalizeRadarSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export function scoreRadarSignal(signal: RadarResolverSignal): number {
  return (
    signal.votesCount +
    signal.commentsCount * RADAR_PREDICTION_SCORE_COMMENT_WEIGHT
  );
}

function findSignalForSlug(
  signals: readonly RadarResolverSignal[],
  toolSlug: string,
): RadarResolverSignal | null {
  for (const signal of signals) {
    if (signal.id === toolSlug || normalizeRadarSlug(signal.name) === toolSlug) {
      return signal;
    }
  }
  return null;
}

/**
 * Risolve i pronostici contro i segnali reali del feed.
 *
 * Deterministico: stesso input (candidati, segnali, opzioni) → stesso output,
 * qualunque sia l'ordine dei candidati in ingresso. I pareggi condividono lo
 * stesso rank (competition ranking), quindi l'ordine di input non influenza
 * status né XP.
 *
 * Restituisce le risoluzioni nello stesso ordine dei candidati in ingresso.
 */
export function resolveRadarPredictions(
  candidates: readonly RadarPredictionCandidate[],
  signals: readonly RadarResolverSignal[] | null,
  options: { rewardsEnabled: boolean },
): RadarPredictionResolution[] {
  // Fallback esplicito: senza segnali reali non si risolve nulla e non si
  // inventa alcun dato. Il chiamante mantiene i pronostici `pending`.
  if (!signals || signals.length === 0) {
    return [];
  }

  const scored = candidates.map((candidate) => {
    const signal = findSignalForSlug(signals, candidate.toolSlug);
    const evidence: RadarPredictionEvidence = signal
      ? "product-hunt-live"
      : "absent-from-product-hunt-live";
    return {
      candidate,
      evidence,
      score: signal ? scoreRadarSignal(signal) : 0,
    };
  });

  const rankCount = scored.length;
  const greaterCounts = scored.map(
    (entry) => scored.filter((other) => other.score > entry.score).length,
  );
  const topHalfThreshold = Math.max(1, Math.ceil(rankCount / 2));

  return scored.map((entry, index) => {
    const rank = greaterCounts[index] + 1;

    let status: RadarPredictionOutcome;
    let xpAwarded: number;
    if (rank === 1) {
      status = "won";
      xpAwarded = options.rewardsEnabled ? RADAR_PREDICTION_XP_WON : 0;
    } else if (rank <= topHalfThreshold) {
      status = "close";
      xpAwarded = options.rewardsEnabled ? RADAR_PREDICTION_XP_CLOSE : 0;
    } else {
      status = "lost";
      xpAwarded = 0;
    }

    const percentile =
      rankCount > 1 ? (rankCount - rank) / (rankCount - 1) : 1;
    const actualRankChange = Math.round(percentile * 10);

    return {
      toolSlug: entry.candidate.toolSlug,
      contextDate: entry.candidate.contextDate,
      evidence: entry.evidence,
      score: entry.score,
      rank,
      rankCount,
      status,
      xpAwarded,
      actualRankChange,
    };
  });
}
