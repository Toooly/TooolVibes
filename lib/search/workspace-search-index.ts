import type {
  WorkspaceDecisionOutcome,
  WorkspaceStateV1,
  WorkspaceUsage,
} from "@/lib/discovery/types";
import {
  activePersonalStacks,
  deriveResurfaceSignals,
  pipelineColumnForTool,
} from "@/lib/account/workspace-pipeline";
import { normalizeSearchText } from "@/lib/search/tool-search";

export type IndexedPersonalStack = {
  id: string;
  name: string;
  slugs: Set<string>;
};

export type WorkspaceSearchIndex = {
  savedSet: Set<string>;
  stackById: Map<string, IndexedPersonalStack>;
  stackIdsByNormalizedName: Map<string, string[]>;
  stackIdsBySlug: Map<string, string[]>;
  outcomeBySlug: Map<string, WorkspaceDecisionOutcome | null>;
  usageBySlug: Map<string, WorkspaceUsage | null>;
  noteBySlug: Map<string, string>;
  useCaseBySlug: Map<string, string>;
  alternativesBySlug: Map<string, string[]>;
  reviewDueSet: Set<string>;
  columnBySlug: Map<string, string>;
};

export function workspaceSearchIndexKey(state: WorkspaceStateV1) {
  const toolStamp = Object.entries(state.toolStates)
    .map(([slug, tool]) => `${slug}:${tool.updatedAt ?? ""}:${tool.note ? "n" : ""}`)
    .join("|");
  const stackStamp = state.personalStacks
    .map((stack) => `${stack.id}:${stack.updatedAt}:${stack.slugs.join(",")}`)
    .join("|");
  return [
    state.saved.updatedAt,
    state.compare.updatedAt,
    state.stack.updatedAt,
    stackStamp,
    toolStamp,
    String(state.events.length),
  ].join("~");
}

export function buildWorkspaceSearchIndex(
  state: WorkspaceStateV1,
  nowIso = new Date().toISOString(),
): WorkspaceSearchIndex {
  const savedSet = new Set(state.saved.slugs);
  const stackById = new Map<string, IndexedPersonalStack>();
  const stackIdsByNormalizedName = new Map<string, string[]>();
  const stackIdsBySlug = new Map<string, string[]>();

  for (const stack of activePersonalStacks(state)) {
    const slugs = new Set(stack.slugs);
    stackById.set(stack.id, { id: stack.id, name: stack.name, slugs });
    const nameKey = normalizeSearchText(stack.name);
    const ids = stackIdsByNormalizedName.get(nameKey) ?? [];
    ids.push(stack.id);
    stackIdsByNormalizedName.set(nameKey, ids);
    for (const slug of stack.slugs) {
      const owners = stackIdsBySlug.get(slug) ?? [];
      owners.push(stack.id);
      stackIdsBySlug.set(slug, owners);
    }
  }

  const outcomeBySlug = new Map<string, WorkspaceDecisionOutcome | null>();
  const usageBySlug = new Map<string, WorkspaceUsage | null>();
  const noteBySlug = new Map<string, string>();
  const useCaseBySlug = new Map<string, string>();
  const alternativesBySlug = new Map<string, string[]>();
  const columnBySlug = new Map<string, string>();

  for (const [slug, tool] of Object.entries(state.toolStates)) {
    outcomeBySlug.set(slug, tool.decision?.outcome ?? null);
    usageBySlug.set(slug, tool.usage);
    columnBySlug.set(
      slug,
      pipelineColumnForTool({
        stage: tool.stage,
        outcome: tool.decision?.outcome ?? null,
      }),
    );
    if (tool.note) noteBySlug.set(slug, tool.note);
    if (tool.useCase) useCaseBySlug.set(slug, tool.useCase);
    if (tool.alternatives.length > 0) {
      alternativesBySlug.set(slug, tool.alternatives);
    }
  }

  const reviewDueSet = new Set<string>();
  for (const signal of deriveResurfaceSignals(state, nowIso)) {
    if (signal.kind === "deferred_due" && signal.slug) {
      reviewDueSet.add(signal.slug);
    }
  }

  return {
    savedSet,
    stackById,
    stackIdsByNormalizedName,
    stackIdsBySlug,
    outcomeBySlug,
    usageBySlug,
    noteBySlug,
    useCaseBySlug,
    alternativesBySlug,
    reviewDueSet,
    columnBySlug,
  };
}

export function resolveStackIds(index: WorkspaceSearchIndex, value: string) {
  if (index.stackById.has(value)) return [value];
  const byName = index.stackIdsByNormalizedName.get(normalizeSearchText(value));
  return byName ? [...byName] : [];
}
