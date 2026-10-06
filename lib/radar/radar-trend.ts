/**
 * Radar trend truth rules.
 *
 * HARD RULE (spec §6/§14/§16): a trend claim may only be emitted when the
 * underlying signal is real and inspectable. There is currently NO Product
 * Hunt feed history on this platform, therefore:
 *
 *   - "In accelerazione" (momentum/delta)  → NOT AVAILABLE. Never emitted.
 *   - Sparklines / timeline points         → NOT AVAILABLE. Never fabricated.
 *   - "Nuovi ingressi"                     → available ONLY when the source
 *     supplies a real `launchedAt` inside the selected window.
 *   - "Più discussi" / "Più votati"       → available from the current
 *     snapshot (real `commentsCount` / `votesCount`).
 *
 * Every emitted entry exposes `signals[]` with the concrete measured values
 * that justify the ranking, plus an `explanation` string. There is no
 * aggregated magic score.
 */

import type { RadarTool } from "@/lib/radar/radar-domain";

export type RadarTrendKey =
  | "top-voted"
  | "discussion"
  | "new-entries"
  | "acceleration"
  | "cooling";

/**
 * Presentation group (visual convergence §9).
 * `today`    → current-snapshot intelligence, always real.
 * `movement` → requires historical snapshots; currently unavailable.
 */
export type RadarTrendGroup = "today" | "movement";

export type RadarTrendSignal = {
  key: "votes" | "comments" | "attention" | "recency" | "rank";
  label: string;
  value: number;
  /** Human-readable measured value, e.g. "128 voti". */
  display: string;
};

export type RadarTrendEntry = {
  tool: RadarTool;
  /** Why this tool is ranked here. Always grounded in `signals`. */
  explanation: string;
  signals: readonly RadarTrendSignal[];
};

export type RadarTrendSection = {
  key: RadarTrendKey;
  group: RadarTrendGroup;
  title: string;
  description: string;
  /** False → render the honest "Dati storici in raccolta" state instead of entries. */
  available: boolean;
  /** Why the section is unavailable (shown to the user). */
  unavailableReason?: string;
  entries: readonly RadarTrendEntry[];
};

export const RADAR_HISTORY_UNAVAILABLE_REASON =
  "Dati storici in raccolta: servono più snapshot per calcolare la variazione.";

function recencySignal(tool: RadarTool): RadarTrendSignal | null {
  if (tool.launchedAt === null) return null;
  return {
    key: "recency",
    label: "Lancio",
    value: tool.ageHours ?? 0,
    display: formatAge(tool.ageHours),
  };
}

export function formatAge(ageHours: number | null): string {
  if (ageHours === null || !Number.isFinite(ageHours)) return "data non disponibile";
  if (ageHours < 1) return "negli ultimi 60 minuti";
  if (ageHours < 24) return `${Math.round(ageHours)} h fa`;
  const days = Math.round(ageHours / 24);
  return days === 1 ? "1 giorno fa" : `${days} giorni fa`;
}

function baseSignals(tool: RadarTool): RadarTrendSignal[] {
  const signals: RadarTrendSignal[] = [
    {
      key: "votes",
      label: "Voti",
      value: tool.votesCount,
      display: `${tool.votesCount} voti`,
    },
    {
      key: "comments",
      label: "Commenti",
      value: tool.commentsCount,
      display: `${tool.commentsCount} commenti`,
    },
    {
      key: "rank",
      label: "Posizione",
      value: tool.rank,
      display: `#${tool.rank} nel periodo`,
    },
  ];
  const recency = recencySignal(tool);
  if (recency) signals.push(recency);
  return signals;
}

function explainSignals(signals: readonly RadarTrendSignal[]): string {
  return signals.map((signal) => signal.display).join(" · ");
}

/**
 * Builds the Trend view from a single current snapshot.
 * Sections that require history are returned with `available: false`.
 */
export function buildRadarTrendSections(
  tools: readonly RadarTool[],
  options: { historyAvailable: boolean; rangeLabel: string } = {
    historyAvailable: false,
    rangeLabel: "del periodo",
  },
): RadarTrendSection[] {
  const withLaunchDate = tools.filter((tool) => tool.launchedAt !== null);

  const topVoted: RadarTrendSection = {
    key: "top-voted",
    group: "today",
    title: "Più votati",
    description: "Ordinati per numero reale di voti sul periodo.",
    available: tools.length > 0,
    unavailableReason:
      tools.length === 0 ? "Nessun segnale nel periodo selezionato." : undefined,
    entries: tools
      .slice()
      .sort(
        (a, b) =>
          b.votesCount - a.votesCount ||
          b.commentsCount - a.commentsCount ||
          a.rank - b.rank,
      )
      .slice(0, 6)
      .map((tool) => {
        const signals = baseSignals(tool);
        return {
          tool,
          signals,
          explanation: `${tool.votesCount} voti · ${tool.commentsCount} commenti · #${tool.rank} nel periodo`,
        };
      }),
  };

  const acceleration: RadarTrendSection = {
    key: "acceleration",
    group: "movement",
    title: "In accelerazione",
    description: `Crescita misurata rispetto allo snapshot precedente.`,
    available: options.historyAvailable,
    unavailableReason: RADAR_HISTORY_UNAVAILABLE_REASON,
    entries: [],
  };

  const cooling: RadarTrendSection = {
    key: "cooling",
    group: "movement",
    title: "In raffreddamento",
    description: "Calo misurato rispetto allo snapshot precedente.",
    available: options.historyAvailable,
    unavailableReason: RADAR_HISTORY_UNAVAILABLE_REASON,
    entries: [],
  };

  const newEntries: RadarTrendSection = {
    key: "new-entries",
    group: "today",
    title: "Nuovi ingressi",
    description: `Lanci con data di pubblicazione ${options.rangeLabel}.`,
    available: withLaunchDate.length > 0,
    unavailableReason:
      withLaunchDate.length === 0
        ? "La fonte non sta fornendo la data di lancio: impossibile distinguere i nuovi ingressi senza inventarli."
        : undefined,
    entries: withLaunchDate
      .slice()
      .sort((a, b) => (a.ageHours ?? 0) - (b.ageHours ?? 0) || a.rank - b.rank)
      .slice(0, 6)
      .map((tool) => {
        const signals = baseSignals(tool);
        return {
          tool,
          signals,
          explanation: `Lanciato ${formatAge(tool.ageHours)} · ${explainSignals(signals)}`,
        };
      }),
  };

  const discussion: RadarTrendSection = {
    key: "discussion",
    group: "today",
    title: "Più discussi",
    description: "Ordinati per numero reale di commenti sul periodo.",
    available: tools.length > 0,
    unavailableReason:
      tools.length === 0 ? "Nessun segnale nel periodo selezionato." : undefined,
    entries: tools
      .slice()
      .sort(
        (a, b) =>
          b.commentsCount - a.commentsCount ||
          b.votesCount - a.votesCount ||
          a.rank - b.rank,
      )
      .slice(0, 6)
      .map((tool) => {
        const signals = baseSignals(tool);
        return {
          tool,
          signals,
          explanation: `${tool.commentsCount} commenti · ${tool.votesCount} voti · #${tool.rank} nel periodo`,
        };
      }),
  };

  // §9 — current-snapshot intelligence first, movement (history) last.
  return [topVoted, discussion, newEntries, acceleration, cooling];
}

/**
 * Trend chart data. ALWAYS empty while history is unavailable — callers must
 * render "Dati storici in raccolta" and never synthesize points.
 */
export type RadarSparkPoint = { at: string; value: number };

export function buildRadarSparkline(
  _tool: RadarTool,
  historyAvailable: boolean,
): RadarSparkPoint[] {
  return historyAvailable ? [] : [];
}
