import { compactPersonalStatus, formatRevisitLine } from "@/lib/account/workspace-lifecycle";
import { formatStackContext } from "@/lib/account/salvati-relationship";
import { excerptPrivateNote } from "@/lib/account/private-note";
import {
  humanizeFiloEvent,
  listFiloEvents,
} from "@/lib/account/workspace-filo";
import { buildWorkspaceSearchIndex } from "@/lib/search/workspace-search-index";
import type {
  WorkspaceDecisionOutcome,
  WorkspaceStateV1,
  WorkspaceUsage,
} from "@/lib/discovery/types";

export type ComparePersonalContext = {
  toolSlug: string;
  saved: boolean;
  relationship: { key: string; label: string } | null;
  decision: WorkspaceDecisionOutcome | null;
  decisionReason: string | null;
  usage: WorkspaceUsage | null;
  replacedBy: string | null;
  replacedByName: string | null;
  stackNames: string[];
  stackContext: string | null;
  note: string | null;
  noteExcerpt: string | null;
  revisitAt: string | null;
  reviewDue: boolean;
  lastEventLine: string | null;
  hasPersonalFact: boolean;
};

export type CompareNameLookup = (slug: string) => string;

function lastDecidedReason(state: WorkspaceStateV1, slug: string) {
  const events = listFiloEvents(state, slug);
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index];
    if (event?.type !== "decided") continue;
    const reason = event.reason?.trim();
    if (reason) return reason;
  }
  return null;
}

export function deriveComparePersonalContext(
  state: WorkspaceStateV1,
  slug: string,
  nameOf: CompareNameLookup = (value) => value,
  nowIso = new Date().toISOString(),
): ComparePersonalContext {
  return listComparePersonalContexts(state, [slug], nameOf, nowIso)[0]!;
}

export function listComparePersonalContexts(
  state: WorkspaceStateV1,
  slugs: readonly string[],
  nameOf: CompareNameLookup = (value) => value,
  nowIso = new Date().toISOString(),
): ComparePersonalContext[] {
  const index = buildWorkspaceSearchIndex(state, nowIso);

  return slugs.map((slug) => {
    const tool = state.toolStates[slug];
    const saved = index.savedSet.has(slug);
    const outcome = tool?.decision?.outcome ?? index.outcomeBySlug.get(slug) ?? null;
    const usage = tool?.usage ?? index.usageBySlug.get(slug) ?? null;
    const stage = tool?.stage ?? "saved";
    const relationship =
      saved || outcome || usage
        ? compactPersonalStatus({ usage, outcome, stage })
        : null;
    const stackIds = index.stackIdsBySlug.get(slug) ?? [];
    const stackNames = stackIds
      .map((id) => index.stackById.get(id)?.name)
      .filter((name): name is string => Boolean(name));
    const note = index.noteBySlug.get(slug) ?? tool?.note ?? null;
    const replacedBy = usage === "replaced" ? tool?.replacedBy ?? null : null;
    const events = listFiloEvents(state, slug);
    const lastEvent = events.at(-1);
    const lastEventLine = lastEvent
      ? humanizeFiloEvent(lastEvent, nameOf).line
      : null;
    const reviewDue = index.reviewDueSet.has(slug);
    const hasPersonalFact = Boolean(
      saved ||
        outcome ||
        usage ||
        stackNames.length > 0 ||
        note ||
        reviewDue ||
        replacedBy ||
        lastEventLine,
    );

    return {
      toolSlug: slug,
      saved,
      relationship,
      decision: outcome,
      decisionReason: lastDecidedReason(state, slug),
      usage,
      replacedBy,
      replacedByName: replacedBy ? nameOf(replacedBy) : null,
      stackNames,
      stackContext: formatStackContext(stackNames),
      note,
      noteExcerpt: excerptPrivateNote(note, 120),
      revisitAt: tool?.revisitAt ?? null,
      reviewDue,
      lastEventLine,
      hasPersonalFact,
    };
  });
}

export function comparePersonalL1Chips(context: ComparePersonalContext) {
  const chips: { key: string; label: string }[] = [];
  if (context.relationship) {
    chips.push({ key: context.relationship.key, label: context.relationship.label });
  }
  if (context.stackContext) {
    chips.push({ key: "stack", label: `Stack: ${context.stackContext}` });
  }
  if (context.note) {
    chips.push({ key: "note", label: "Nota presente" });
  }
  if (context.reviewDue) {
    chips.push({ key: "review", label: "Da rivedere" });
  }
  return chips;
}

export function comparePersonalL2Lines(
  context: ComparePersonalContext,
): { key: string; label: string }[] {
  const lines: { key: string; label: string }[] = [];
  if (context.noteExcerpt) {
    lines.push({ key: "note", label: context.noteExcerpt });
  }
  if (context.decisionReason) {
    lines.push({ key: "reason", label: context.decisionReason });
  }
  const revisit = formatRevisitLine(context.revisitAt);
  if (revisit && !context.reviewDue) {
    lines.push({ key: "revisit", label: revisit });
  }
  if (context.replacedByName) {
    lines.push({ key: "replaced", label: `Sostituito da ${context.replacedByName}` });
  }
  if (context.lastEventLine) {
    lines.push({ key: "filo", label: context.lastEventLine });
  }
  return lines;
}
