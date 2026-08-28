import type {
  CompareObjective,
  WorkspaceDecisionOutcome,
  WorkspaceRelationshipEvent,
  WorkspaceStateV1,
  WorkspaceUsage,
} from "@/lib/discovery/types";
import { MAX_COMPARE_TOOLS } from "@/lib/discovery/workspace-constants";
import type { SaveReason, ShortlistStage } from "@/lib/types/tool";

import { compactPersonalStatus } from "./workspace-lifecycle";
import {
  PIPELINE_COLUMNS,
  activePersonalStacks,
  deriveResurfaceSignals,
  pipelineColumnForTool,
  type PipelineColumn,
} from "./workspace-pipeline";

export const SALVATI_LIBRARY_FILTERS = [
  "tutti",
  "da_valutare",
  "scelti",
  "in_uso",
  "rimandati",
  "scartati",
  "da_rivedere",
] as const;

export type SalvatiLibraryFilter = (typeof SALVATI_LIBRARY_FILTERS)[number];

export const SALVATI_LIBRARY_FILTER_LABELS: Record<SalvatiLibraryFilter, string> = {
  tutti: "Tutti",
  da_valutare: "Da valutare",
  scelti: "Scelti",
  in_uso: "In uso",
  rimandati: "Rimandati",
  scartati: "Scartati",
  da_rivedere: "Da rivedere",
};

export const SALVATI_SORTS = ["recent", "oldest", "alpha", "status"] as const;

export type SalvatiSort = (typeof SALVATI_SORTS)[number];

export const SALVATI_SORT_LABELS: Record<SalvatiSort, string> = {
  recent: "Aggiornati di recente",
  oldest: "Più vecchi",
  alpha: "A–Z",
  status: "Stato",
};

export const SALVATI_FEW_THRESHOLD = 4;

export type SalvatiPrimaryActionKind =
  | "rivedi"
  | "valuta"
  | "conferma_uso"
  | "continua_confronto"
  | "apri";

export type SalvatiPrimaryAction = {
  kind: SalvatiPrimaryActionKind;
  label: string;
  href?: string;
};

export type SalvatiRelationship = {
  slug: string;
  column: PipelineColumn;
  stage: ShortlistStage;
  outcome: WorkspaceDecisionOutcome | null;
  usage: WorkspaceUsage | null;
  replacedBy: string | null;
  compact: { key: string; label: string };
  pinned: boolean;
  note: string | null;
  saveReason: SaveReason | null;
  useCase: string | null;
  reason: string | null;
  alternatives: string[];
  compareObjective: CompareObjective | null;
  revisitAt: string | null;
  updatedAt: string | null;
  inCompare: boolean;
  compareFull: boolean;
  stackIds: string[];
  stackNames: string[];
  reviewDue: boolean;
  filoCount: number;
  filoLastAt: string | null;
  hasFiloEvents: boolean;
  primaryAction: SalvatiPrimaryAction;
  events: WorkspaceRelationshipEvent[];
};

export type SalvatiLibraryModel = {
  items: SalvatiRelationship[];
  filterCounts: Record<SalvatiLibraryFilter, number>;
  showFilters: boolean;
};

function outcomeOf(state: WorkspaceStateV1, slug: string) {
  return state.toolStates[slug]?.decision?.outcome ?? null;
}

function lastDecidedReason(events: WorkspaceRelationshipEvent[]) {
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index];
    if (event?.type !== "decided") continue;
    const reason = event.reason?.trim();
    if (reason) return reason;
  }
  return null;
}

function decisionAlternatives(
  state: WorkspaceStateV1,
  slug: string,
  inCompare: boolean,
) {
  const seen = new Set<string>();
  const ordered: string[] = [];
  const push = (value: string | null | undefined) => {
    if (!value || value === slug || seen.has(value)) return;
    seen.add(value);
    ordered.push(value);
  };
  for (const alt of state.toolStates[slug]?.alternatives ?? []) push(alt);
  if (inCompare) {
    for (const alt of state.compare.slugs) push(alt);
  }
  return ordered;
}

export function salvatiPrimaryAction(input: {
  reviewDue: boolean;
  inCompare: boolean;
  compareCount: number;
  outcome: WorkspaceDecisionOutcome | null;
  usage: WorkspaceUsage | null;
  slug: string;
}): SalvatiPrimaryAction {
  if (input.reviewDue) {
    return { kind: "rivedi", label: "Rivedi" };
  }
  if (input.inCompare && input.compareCount >= 2) {
    return { kind: "continua_confronto", label: "Continua confronto", href: "/compare" };
  }
  if (!input.outcome && input.usage !== "using") {
    return { kind: "valuta", label: "Valuta" };
  }
  if (input.outcome === "selected" && input.usage == null) {
    return { kind: "conferma_uso", label: "Conferma uso" };
  }
  return { kind: "apri", label: "Apri", href: `/toools/${input.slug}` };
}

export function matchesSalvatiFilter(
  item: SalvatiRelationship,
  filter: SalvatiLibraryFilter,
) {
  if (filter === "tutti") return true;
  if (filter === "da_rivedere") return item.reviewDue;
  if (filter === "in_uso") return item.usage === "using";
  if (filter === "scelti") {
    return item.outcome === "selected" && item.usage !== "using";
  }
  if (filter === "rimandati") return item.outcome === "deferred";
  if (filter === "scartati") return item.outcome === "rejected";
  return (
    item.outcome == null &&
    item.usage !== "using" &&
    (item.column === "salvato" ||
      item.column === "da_valutare" ||
      item.column === "candidato")
  );
}

export function countSalvatiFilters(
  items: readonly SalvatiRelationship[],
): Record<SalvatiLibraryFilter, number> {
  const counts = {
    tutti: items.length,
    da_valutare: 0,
    scelti: 0,
    in_uso: 0,
    rimandati: 0,
    scartati: 0,
    da_rivedere: 0,
  };
  for (const item of items) {
    if (matchesSalvatiFilter(item, "da_valutare")) counts.da_valutare += 1;
    if (matchesSalvatiFilter(item, "scelti")) counts.scelti += 1;
    if (matchesSalvatiFilter(item, "in_uso")) counts.in_uso += 1;
    if (matchesSalvatiFilter(item, "rimandati")) counts.rimandati += 1;
    if (matchesSalvatiFilter(item, "scartati")) counts.scartati += 1;
    if (matchesSalvatiFilter(item, "da_rivedere")) counts.da_rivedere += 1;
  }
  return counts;
}

export function visibleSalvatiFilters(
  counts: Record<SalvatiLibraryFilter, number>,
  showFilters: boolean,
): SalvatiLibraryFilter[] {
  if (!showFilters) return [];
  return SALVATI_LIBRARY_FILTERS.filter((id) => id === "tutti" || counts[id] > 0);
}

export function compareSalvatiRelationships(
  left: SalvatiRelationship,
  right: SalvatiRelationship,
  sort: SalvatiSort,
  nameOf: (slug: string) => string,
) {
  const byName = nameOf(left.slug).localeCompare(nameOf(right.slug), "it");
  if (sort === "alpha") return byName;
  if (sort === "status") {
    const delta = PIPELINE_COLUMNS.indexOf(left.column) - PIPELINE_COLUMNS.indexOf(right.column);
    return delta !== 0 ? delta : byName;
  }
  const leftAt = left.updatedAt ?? "";
  const rightAt = right.updatedAt ?? "";
  const byDate = leftAt.localeCompare(rightAt);
  if (sort === "oldest") return byDate !== 0 ? byDate : byName;
  return byDate !== 0 ? -byDate : byName;
}

export function matchesSalvatiSearch(
  item: SalvatiRelationship,
  needle: string,
  catalog: { name: string; categoryLabel: string },
) {
  if (!needle) return true;
  return (
    catalog.name.toLowerCase().includes(needle) ||
    item.slug.toLowerCase().includes(needle) ||
    catalog.categoryLabel.toLowerCase().includes(needle) ||
    (item.useCase ?? "").toLowerCase().includes(needle)
  );
}

export function listSalvatiRelationships(
  state: WorkspaceStateV1,
  nowIso = new Date().toISOString(),
): SalvatiRelationship[] {
  const compareSet = new Set(state.compare.slugs);
  const compareCount = state.compare.slugs.length;
  const compareFull = compareCount >= MAX_COMPARE_TOOLS;
  const stackIdsBySlug = new Map<string, string[]>();
  const stackNamesBySlug = new Map<string, string[]>();
  for (const stack of activePersonalStacks(state)) {
    for (const slug of stack.slugs) {
      const ids = stackIdsBySlug.get(slug);
      if (ids) ids.push(stack.id);
      else stackIdsBySlug.set(slug, [stack.id]);
      const names = stackNamesBySlug.get(slug);
      if (names) names.push(stack.name);
      else stackNamesBySlug.set(slug, [stack.name]);
    }
  }

  const eventsBySlug = new Map<string, WorkspaceRelationshipEvent[]>();
  for (const event of state.events) {
    const list = eventsBySlug.get(event.slug);
    if (list) list.push(event);
    else eventsBySlug.set(event.slug, [event]);
  }
  for (const list of eventsBySlug.values()) {
    list.sort((left, right) => {
      const byAt = left.at.localeCompare(right.at);
      return byAt !== 0 ? byAt : left.id.localeCompare(right.id);
    });
  }

  const reviewDue = new Set<string>();
  for (const signal of deriveResurfaceSignals(state, nowIso)) {
    if (signal.kind === "deferred_due" && signal.slug) reviewDue.add(signal.slug);
  }

  return state.saved.slugs.map((slug) => {
    const tool = state.toolStates[slug];
    const stage = tool?.stage ?? "saved";
    const outcome = outcomeOf(state, slug);
    const usage = tool?.usage ?? null;
    const inCompare = compareSet.has(slug);
    const events = eventsBySlug.get(slug) ?? [];
    const judged = Boolean(tool?.decision?.outcome || tool?.usage || tool?.replacedBy);
    const filo =
      events.length > 0
        ? {
            count: events.length,
            lastAt: events[events.length - 1]?.at ?? null,
            hasEvents: true,
          }
        : judged
          ? {
              count: 1,
              lastAt: tool?.updatedAt ?? tool?.decision?.updatedAt ?? null,
              hasEvents: false,
            }
          : { count: 0, lastAt: null, hasEvents: false };
    const due = reviewDue.has(slug);
    return {
      slug,
      column: pipelineColumnForTool({ stage, outcome }),
      stage,
      outcome,
      usage,
      replacedBy: tool?.replacedBy ?? null,
      compact: compactPersonalStatus({ usage, outcome, stage }),
      pinned: tool?.pinned === true,
      note: tool?.note?.trim() ? tool.note : null,
      saveReason: tool?.saveReason ?? null,
      useCase: tool?.useCase?.trim() ? tool.useCase : null,
      reason: lastDecidedReason(events),
      alternatives: decisionAlternatives(state, slug, inCompare),
      compareObjective: tool?.compareObjective ?? null,
      revisitAt: tool?.revisitAt ?? null,
      updatedAt: tool?.updatedAt ?? tool?.decision?.updatedAt ?? state.saved.updatedAt,
      inCompare,
      compareFull: !inCompare && compareFull,
      stackIds: stackIdsBySlug.get(slug) ?? [],
      stackNames: stackNamesBySlug.get(slug) ?? [],
      reviewDue: due,
      filoCount: filo.count,
      filoLastAt: filo.lastAt,
      hasFiloEvents: filo.hasEvents,
      primaryAction: salvatiPrimaryAction({
        reviewDue: due,
        inCompare,
        compareCount,
        outcome,
        usage,
        slug,
      }),
      events,
    };
  });
}

export function composeSalvatiLibrary(
  state: WorkspaceStateV1,
  nowIso = new Date().toISOString(),
): SalvatiLibraryModel {
  const items = listSalvatiRelationships(state, nowIso);
  return {
    items,
    filterCounts: countSalvatiFilters(items),
    showFilters: items.length >= SALVATI_FEW_THRESHOLD,
  };
}

export function formatStackContext(names: readonly string[]) {
  if (names.length === 0) return null;
  if (names.length === 1) return names[0] ?? null;
  return `${names[0]} +${names.length - 1}`;
}
