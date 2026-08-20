import type { WorkspaceDecisionOutcome, WorkspaceUsage } from "@/lib/discovery/types";
import type { ShortlistStage } from "@/lib/types/tool";

export const STAGE_LABELS = {
  saved: "Salvato",
  review: "Da valutare",
  top: "Candidato",
} as const satisfies Record<ShortlistStage, string>;

export const OUTCOME_STATE_LABELS = {
  selected: "Scelto",
  rejected: "Scartato",
  deferred: "Rimandato",
} as const satisfies Record<WorkspaceDecisionOutcome, string>;

export const OUTCOME_ACTION_LABELS = {
  selected: "Scegli",
  rejected: "Scarta",
  deferred: "Rimanda",
} as const satisfies Record<WorkspaceDecisionOutcome, string>;

export const USAGE_STATE_LABELS = {
  using: "In uso",
  stopped: "Non lo uso più",
  replaced: "Sostituito",
} as const satisfies Record<WorkspaceUsage, string>;

export const USAGE_ACTION_LABELS = {
  using: "Lo sto usando",
  stopped: "Non lo uso più",
  replaced: "Sostituito",
} as const satisfies Record<WorkspaceUsage, string>;

export const REVISIT_PRESET_IDS = ["1w", "1m", "3m"] as const;

export type RevisitPresetId = (typeof REVISIT_PRESET_IDS)[number];

const DAY_MS = 24 * 60 * 60 * 1000;

export const REVISIT_PRESETS: ReadonlyArray<{
  id: RevisitPresetId;
  label: string;
  ms: number;
}> = [
  { id: "1w", label: "1 settimana", ms: 7 * DAY_MS },
  { id: "1m", label: "1 mese", ms: 30 * DAY_MS },
  { id: "3m", label: "3 mesi", ms: 90 * DAY_MS },
];

export function revisitAtFromPreset(
  id: RevisitPresetId,
  now = Date.now(),
): string {
  const preset = REVISIT_PRESETS.find((item) => item.id === id);
  const ms = preset?.ms ?? 7 * DAY_MS;
  return new Date(now + ms).toISOString();
}

export function formatRevisitAt(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  return date.toLocaleDateString("it-IT", { day: "numeric", month: "short" });
}

export function formatRevisitLine(value: string | null | undefined): string | null {
  const formatted = formatRevisitAt(value);
  return formatted ? `Rivedi: ${formatted}` : null;
}

export function stageLabel(stage: ShortlistStage): string {
  return STAGE_LABELS[stage];
}

export function outcomeStateLabel(outcome: WorkspaceDecisionOutcome): string {
  return OUTCOME_STATE_LABELS[outcome];
}

export function outcomeActionLabel(outcome: WorkspaceDecisionOutcome): string {
  return OUTCOME_ACTION_LABELS[outcome];
}

export function usageStateLabel(usage: WorkspaceUsage): string {
  return USAGE_STATE_LABELS[usage];
}

export function usageActionLabel(usage: WorkspaceUsage): string {
  return USAGE_ACTION_LABELS[usage];
}

export function compactPersonalStatus(input: {
  usage: WorkspaceUsage | null | undefined;
  outcome: WorkspaceDecisionOutcome | null | undefined;
  stage: ShortlistStage;
}): { key: string; label: string } {
  if (input.usage) {
    return { key: input.usage, label: USAGE_STATE_LABELS[input.usage] };
  }
  if (input.outcome) {
    return { key: input.outcome, label: OUTCOME_STATE_LABELS[input.outcome] };
  }
  return { key: input.stage, label: STAGE_LABELS[input.stage] };
}
