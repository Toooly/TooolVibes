import type {
  WorkspaceRelationshipEvent,
  WorkspaceStateV1,
} from "@/lib/discovery/types";

import { formatRevisitAt } from "./workspace-lifecycle";

export type FiloSummary = {
  count: number;
  lastAt: string | null;
};

export type FiloNameLookup = (slug: string) => string;

export type HumanFiloEvent = {
  date: string | null;
  line: string;
};

function compareFiloEvents(
  left: WorkspaceRelationshipEvent,
  right: WorkspaceRelationshipEvent,
) {
  const byAt = left.at.localeCompare(right.at);
  if (byAt !== 0) return byAt;
  return left.id.localeCompare(right.id);
}

export function listFiloEvents(
  state: WorkspaceStateV1,
  slug: string,
): WorkspaceRelationshipEvent[] {
  return state.events.filter((event) => event.slug === slug).sort(compareFiloEvents);
}

function snapshotHasJudgment(state: WorkspaceStateV1, slug: string) {
  const tool = state.toolStates[slug];
  if (!tool) return false;
  return Boolean(tool.decision?.outcome || tool.usage || tool.replacedBy);
}

export function summarizeFilo(state: WorkspaceStateV1, slug: string): FiloSummary {
  const events = listFiloEvents(state, slug);
  if (events.length > 0) {
    return {
      count: events.length,
      lastAt: events[events.length - 1]?.at ?? null,
    };
  }

  if (!snapshotHasJudgment(state, slug)) {
    return { count: 0, lastAt: null };
  }

  const tool = state.toolStates[slug];
  return {
    count: 1,
    lastAt: tool?.updatedAt ?? tool?.decision?.updatedAt ?? null,
  };
}

export function formatFiloSummary(
  summary: FiloSummary,
  hasEvents: boolean,
): string | null {
  if (summary.count <= 0) return null;
  if (!hasEvents) return "1 stato";

  const countLabel = summary.count === 1 ? "1 evento" : `${summary.count} eventi`;
  const date = formatRevisitAt(summary.lastAt);
  return date ? `${countLabel} · ultimo ${date}` : countLabel;
}

function decidedVerb(outcome: WorkspaceRelationshipEvent["outcome"]) {
  if (outcome === "rejected") return "Scartato";
  if (outcome === "deferred") return "Rimandato";
  return "Scelto";
}

function decidedContext(
  event: WorkspaceRelationshipEvent,
  nameOf: FiloNameLookup,
) {
  const useCase = event.useCase?.trim();
  if (useCase) return useCase;
  const reason = event.reason?.trim();
  if (reason) return reason;
  const alts = (event.alternatives ?? []).filter((slug) => slug && slug !== event.slug);
  if (alts.length === 0) return null;
  return alts.map(nameOf).join(", ");
}

export function humanizeFiloEvent(
  event: WorkspaceRelationshipEvent,
  nameOf: FiloNameLookup = (slug) => slug,
): HumanFiloEvent {
  const date = formatRevisitAt(event.at);

  if (event.type === "decided") {
    const verb = decidedVerb(event.outcome);
    const context = decidedContext(event, nameOf);
    return { date, line: context ? `${verb} · ${context}` : verb };
  }

  if (event.type === "reopened") {
    return { date, line: "Riaperta" };
  }

  if (event.type === "started_using") {
    return { date, line: "In uso" };
  }

  if (event.type === "stopped_using") {
    return { date, line: "Non in uso" };
  }

  if (event.type === "replaced") {
    const from = nameOf(event.slug);
    const to = event.replacementSlug ? nameOf(event.replacementSlug) : null;
    return { date, line: to ? `${from} → ${to}` : from };
  }

  if (event.type === "revisit_set") {
    const when = formatRevisitAt(event.revisitAt);
    return { date, line: when ? `Rivedi il ${when}` : "Rivedi" };
  }

  return { date, line: "Riconsiderata" };
}
