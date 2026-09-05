import type {
  WorkspaceDecisionOutcome,
  WorkspaceRelationshipEvent,
  WorkspaceStateV1,
} from "@/lib/discovery/types";

export const DECISION_REASON_CHIPS = [
  { id: "prezzo", label: "Prezzo" },
  { id: "facilita", label: "Facilità" },
  { id: "funzionalita", label: "Funzionalità" },
  { id: "integrazioni", label: "Integrazioni" },
  { id: "velocita", label: "Velocità" },
  { id: "affidabilita", label: "Affidabilità" },
  { id: "controllo", label: "Controllo" },
  { id: "privacy", label: "Privacy" },
  { id: "altro", label: "Altro" },
] as const;

export type DecisionMemoryStatus = "active" | "review" | "archived";

export type DecisionMemoryItem = {
  id: string;
  slug: string;
  outcome: WorkspaceDecisionOutcome;
  reason: string | null;
  useCase: string | null;
  vsSlugs: string[];
  at: string;
  status: DecisionMemoryStatus;
};

export function composeDecisionReason(
  chips: readonly string[],
  note: string,
): string | null {
  const labels = DECISION_REASON_CHIPS.filter((chip) => chips.includes(chip.id)).map(
    (chip) => chip.label,
  );
  const trimmed = note.trim();
  const parts = [...labels, trimmed].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : null;
}

export function listUsingStackSlugs(state: WorkspaceStateV1): string[] {
  return Object.entries(state.toolStates)
    .filter(([, tool]) => tool.usage === "using")
    .sort((left, right) =>
      (right[1].updatedAt ?? "").localeCompare(left[1].updatedAt ?? ""),
    )
    .map(([slug]) => slug);
}

function eventStatus(
  event: WorkspaceRelationshipEvent,
  state: WorkspaceStateV1,
): DecisionMemoryStatus {
  const current = state.toolStates[event.slug];
  if (!current?.decision?.outcome) return "archived";
  if (current.decision.outcome === "deferred") return "review";
  if (current.revisitAt && current.revisitAt <= new Date().toISOString()) return "review";
  if (current.decision.updatedAt && current.decision.updatedAt !== event.at) {
    return "archived";
  }
  return "active";
}

export function composeDecisionMemory(
  state: WorkspaceStateV1,
): DecisionMemoryItem[] {
  const fromEvents: DecisionMemoryItem[] = state.events
    .filter(
      (event): event is WorkspaceRelationshipEvent & { outcome: WorkspaceDecisionOutcome } =>
        event.type === "decided" &&
        (event.outcome === "selected" ||
          event.outcome === "rejected" ||
          event.outcome === "deferred"),
    )
    .map((event) => ({
      id: event.id,
      slug: event.slug,
      outcome: event.outcome,
      reason: event.reason?.trim() || null,
      useCase: event.useCase?.trim() || null,
      vsSlugs: (event.alternatives ?? state.toolStates[event.slug]?.alternatives ?? []).filter(
        (slug) => slug !== event.slug,
      ),
      at: event.at,
      status: eventStatus(event, state),
    }));

  const seen = new Set(fromEvents.map((item) => `${item.slug}:${item.at}`));
  for (const [slug, tool] of Object.entries(state.toolStates)) {
    const outcome = tool.decision?.outcome;
    const at = tool.decision?.updatedAt;
    if (!outcome || !at) continue;
    const key = `${slug}:${at}`;
    if (seen.has(key)) continue;
    seen.add(key);
    fromEvents.push({
      id: `state:${slug}:${at}`,
      slug,
      outcome,
      reason: null,
      useCase: tool.useCase?.trim() || null,
      vsSlugs: (tool.alternatives ?? []).filter((item) => item !== slug),
      at,
      status: eventStatus(
        { id: `state:${slug}:${at}`, type: "decided", slug, at, outcome },
        state,
      ),
    });
  }

  return fromEvents.sort((left, right) => right.at.localeCompare(left.at));
}

export function currentDecisionMemories(
  state: WorkspaceStateV1,
): DecisionMemoryItem[] {
  const seen = new Set<string>();
  const current: DecisionMemoryItem[] = [];
  for (const item of composeDecisionMemory(state)) {
    if (seen.has(item.slug)) continue;
    seen.add(item.slug);
    if (item.status === "archived") continue;
    current.push(item);
  }
  return current;
}
