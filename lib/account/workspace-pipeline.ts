import type {
  PersonalStack,
  WorkspaceDecisionOutcome,
  WorkspaceStateV1,
  WorkspaceToolState,
} from "@/lib/discovery/types";
import type { ShortlistStage } from "@/lib/types/tool";

export const PIPELINE_COLUMNS = [
  "salvato",
  "da_valutare",
  "candidato",
  "scelto",
  "scartato",
  "rimandato",
] as const;

export type PipelineColumn = (typeof PIPELINE_COLUMNS)[number];

export type PipelineItem = {
  slug: string;
  column: PipelineColumn;
  stage: ShortlistStage;
  outcome: WorkspaceDecisionOutcome | null;
  pinned: boolean;
  updatedAt: string | null;
  note: string | null;
  revisitAt: string | null;
  stackNames: string[];
};

export type ResurfaceKind =
  | "stale_saved"
  | "open_compare"
  | "top_without_verdict"
  | "review_without_verdict"
  | "deferred_due";

export type ResurfaceSignal = {
  kind: ResurfaceKind;
  slug: string | null;
  at: string | null;
};

export type ResumeKind =
  | "continue_compare"
  | "review_decision"
  | "close_decision"
  | "evaluate_saved"
  | "empty";

export type ResumeAction = {
  kind: ResumeKind;
  slug: string | null;
};

export type DerivedActivityKind =
  | "saved"
  | "compared"
  | "decision"
  | "stack"
  | "journal";

export type DerivedActivityItem = {
  kind: DerivedActivityKind;
  slug: string | null;
  stackId: string | null;
  at: string;
};

const DAY = 24 * 60 * 60 * 1000;
const STALE_SAVED_MS = 30 * DAY;
const DEFERRED_STALE_MS = 90 * DAY;

function outcomeOf(state: WorkspaceToolState | undefined) {
  return state?.decision?.outcome ?? null;
}

export function pipelineColumnForTool(input: {
  stage: ShortlistStage;
  outcome: WorkspaceDecisionOutcome | null;
}): PipelineColumn {
  if (input.outcome === "selected") return "scelto";
  if (input.outcome === "rejected") return "scartato";
  if (input.outcome === "deferred") return "rimandato";
  if (input.stage === "review") return "da_valutare";
  if (input.stage === "top") return "candidato";
  return "salvato";
}

export function listPipelineItems(state: WorkspaceStateV1): PipelineItem[] {
  const stacks = activePersonalStacks(state);
  return state.saved.slugs.map((slug) => {
    const tool = state.toolStates[slug];
    const stage = tool?.stage ?? "saved";
    const outcome = outcomeOf(tool);
    const note = tool?.note?.trim() ? tool.note : null;

    return {
      slug,
      column: pipelineColumnForTool({ stage, outcome }),
      stage,
      outcome,
      pinned: tool?.pinned === true,
      updatedAt: tool?.updatedAt ?? tool?.decision?.updatedAt ?? state.saved.updatedAt,
      note,
      revisitAt: tool?.revisitAt ?? null,
      stackNames: stacks
        .filter((stack) => stack.slugs.includes(slug))
        .map((stack) => stack.name),
    };
  });
}

function timestampMs(value: string | null | undefined) {
  if (!value) return null;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : null;
}

export function deriveResurfaceSignals(
  state: WorkspaceStateV1,
  nowIso = new Date().toISOString(),
): ResurfaceSignal[] {
  const now = timestampMs(nowIso) ?? Date.now();
  const signals: ResurfaceSignal[] = [];

  if (state.compare.slugs.length >= 2) {
    signals.push({
      kind: "open_compare",
      slug: state.compare.slugs[0] ?? null,
      at: state.compare.updatedAt,
    });
  }

  for (const slug of state.saved.slugs) {
    const tool = state.toolStates[slug];
    const outcome = outcomeOf(tool);
    const updatedAt = tool?.updatedAt ?? state.saved.updatedAt;
    const updatedMs = timestampMs(updatedAt);

    if ((tool?.stage ?? "saved") === "saved" && !outcome && updatedMs !== null && now - updatedMs >= STALE_SAVED_MS) {
      signals.push({ kind: "stale_saved", slug, at: updatedAt });
    }

    if (tool?.stage === "top" && !outcome) {
      signals.push({
        kind: "top_without_verdict",
        slug,
        at: updatedAt,
      });
    }

    if (tool?.stage === "review" && !outcome) {
      signals.push({
        kind: "review_without_verdict",
        slug,
        at: updatedAt,
      });
    }

    if (outcome === "deferred") {
      const revisitMs = timestampMs(tool?.revisitAt);
      const decidedMs = timestampMs(tool?.decision?.updatedAt ?? null);
      const due =
        (revisitMs !== null && revisitMs <= now) ||
        (decidedMs !== null && now - decidedMs >= DEFERRED_STALE_MS);

      if (due) {
        signals.push({
          kind: "deferred_due",
          slug,
          at: tool?.revisitAt ?? tool?.decision?.updatedAt ?? null,
        });
      }
    }
  }

  return signals;
}

function compareStillOpen(state: WorkspaceStateV1) {
  if (state.compare.slugs.length < 2) return false;
  return state.compare.slugs.some((slug) => outcomeOf(state.toolStates[slug]) === null);
}

export function chooseResumeAction(
  state: WorkspaceStateV1,
  nowIso = new Date().toISOString(),
): ResumeAction {
  if (compareStillOpen(state)) {
    return { kind: "continue_compare", slug: state.compare.slugs[0] ?? null };
  }

  const resurface = deriveResurfaceSignals(state, nowIso);
  const deferred = resurface.find((item) => item.kind === "deferred_due");
  if (deferred) {
    return { kind: "review_decision", slug: deferred.slug };
  }

  const top = resurface.find((item) => item.kind === "top_without_verdict");
  if (top) {
    return { kind: "close_decision", slug: top.slug };
  }

  const reviewing = resurface.find((item) => item.kind === "review_without_verdict");
  if (reviewing) {
    return { kind: "evaluate_saved", slug: reviewing.slug };
  }

  const stale = resurface.find((item) => item.kind === "stale_saved");
  if (stale) {
    return { kind: "evaluate_saved", slug: stale.slug };
  }

  const unfinished = state.saved.slugs.find((slug) => {
    const outcome = outcomeOf(state.toolStates[slug]);
    return outcome === null;
  });
  if (unfinished) {
    return { kind: "evaluate_saved", slug: unfinished };
  }

  return { kind: "empty", slug: null };
}

function pushActivity(
  items: DerivedActivityItem[],
  item: Omit<DerivedActivityItem, "at"> & { at: string | null },
) {
  if (!item.at) return;
  items.push({ ...item, at: item.at });
}

export function deriveWorkspaceActivity(
  state: WorkspaceStateV1,
): DerivedActivityItem[] {
  const items: DerivedActivityItem[] = [];

  pushActivity(items, {
    kind: "saved",
    slug: state.saved.slugs[0] ?? null,
    stackId: null,
    at: state.saved.updatedAt,
  });
  pushActivity(items, {
    kind: "compared",
    slug: state.compare.slugs[0] ?? null,
    stackId: null,
    at: state.compare.updatedAt,
  });

  for (const [slug, tool] of Object.entries(state.toolStates)) {
    pushActivity(items, {
      kind: "decision",
      slug,
      stackId: null,
      at: tool.decision?.updatedAt ?? null,
    });
    if (tool.note || tool.useCase) {
      pushActivity(items, {
        kind: "journal",
        slug,
        stackId: null,
        at: tool.updatedAt,
      });
    }
  }

  for (const stack of state.personalStacks) {
    pushActivity(items, {
      kind: "stack",
      slug: stack.slugs[0] ?? null,
      stackId: stack.id,
      at: stack.updatedAt,
    });
  }

  return items.sort((left, right) => right.at.localeCompare(left.at));
}

export function activePersonalStacks(state: WorkspaceStateV1): PersonalStack[] {
  return state.personalStacks.filter((stack) => !stack.archivedAt);
}


export type PersonalRecord = {
  id: string;
  label: string;
  value: number;
};

export function derivePersonalRecords(state: WorkspaceStateV1): PersonalRecord[] {
  const decided = listPipelineItems(state).filter((item) =>
    item.column === "scelto" || item.column === "scartato" || item.column === "rimandato",
  ).length;
  const stacks = activePersonalStacks(state);
  const largest = stacks.reduce((max, stack) => Math.max(max, stack.slugs.length), 0);
  const compares = state.compare.slugs.length;
  const records: PersonalRecord[] = [
    { id: "decisions", label: "Decisioni registrate", value: decided },
    { id: "stack", label: "Stack più ampio", value: largest },
    { id: "compare", label: "In confronto ora", value: compares },
  ];
  return records.filter((record) => record.value > 0);
}
