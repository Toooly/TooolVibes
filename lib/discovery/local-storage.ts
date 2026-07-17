import type { ShortlistStage, ToolDecisionMemory } from "@/lib/types/tool";
import type {
  DiscoveryWorkspaceState,
  ToolUserState,
} from "@/lib/discovery/types";
import {
  normalizeDiscoveryWorkspaceState,
  reduceWorkspaceState,
} from "@/lib/discovery/workspace-state";
import { adaptLegacyDiscoveryWorkspaceState } from "@/lib/discovery/workspace-legacy-adapters";
import { mergeWorkspaceForSync } from "@/lib/discovery/workspace-sync";
import {
  commitCanonicalToolWorkspaceState,
  getCanonicalToolWorkspaceState,
} from "@/lib/stores/tool-workspace-store";
import { DISCOVERY_STORAGE_KEYS } from "@/lib/discovery/workspace-storage-keys";
import {
  dispatchWorkspaceChange,
  type WorkspaceChangeSource,
} from "@/lib/discovery/workspace-events";

export { DISCOVERY_STORAGE_KEYS } from "@/lib/discovery/workspace-storage-keys";
export { DISCOVERY_SYNC_EVENT } from "@/lib/discovery/workspace-events";

type WriteOptions = {
  dispatch?: boolean;
  source?: WorkspaceChangeSource;
};

type CompareMeta = {
  updated_at?: string | null;
};

export type DiscoveryLocalSnapshot = {
  visitedTools: string[];
  exploredCategories: string[];
  shortlist: string[];
  compare: string[];
  shortlistStages: Record<string, ShortlistStage>;
  decisionMemories: Record<string, ToolDecisionMemory>;
  toolStateMeta: Record<string, string>;
  compareMeta: CompareMeta;
};

function nowIso() {
  return new Date().toISOString();
}

function readList(key: string): string[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(key);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);

    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === "string") : [];
  } catch {
    return [];
  }
}

function writeList(key: string, values: string[], options: WriteOptions = {}) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(Array.from(new Set(values))));

  if (options.dispatch !== false) {
    dispatchWorkspaceChange({
      source: options.source ?? "local",
      scope: "telemetry",
    });
  }
}

function readMap<T>(key: string): Record<string, T> {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(key);

    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw);

    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export function getVisitedTools() {
  return readList(DISCOVERY_STORAGE_KEYS.visitedTools);
}

export function getExploredCategories() {
  return readList(DISCOVERY_STORAGE_KEYS.exploredCategories);
}

export function getShortlist() {
  return readList(DISCOVERY_STORAGE_KEYS.shortlist);
}

export function getCompareTools() {
  return readList(DISCOVERY_STORAGE_KEYS.compare);
}

export function getShortlistStages() {
  return readMap<ShortlistStage>(DISCOVERY_STORAGE_KEYS.shortlistState);
}

export function getDecisionMemories() {
  return readMap<ToolDecisionMemory>(DISCOVERY_STORAGE_KEYS.decisionMemory);
}

export function getShortlistStage(slug: string): ShortlistStage {
  return getShortlistStages()[slug] ?? "saved";
}

export function getToolDecisionMemory(slug: string): ToolDecisionMemory {
  return getDecisionMemories()[slug] ?? {};
}

function buildToolUserStates(snapshot: DiscoveryLocalSnapshot): Record<string, ToolUserState> {
  const { shortlist, shortlistStages, decisionMemories, toolStateMeta } = snapshot;
  const allSlugs = new Set([
    ...shortlist,
    ...Object.keys(shortlistStages),
    ...Object.keys(decisionMemories),
    ...Object.keys(toolStateMeta),
  ]);

  return Object.fromEntries(
    Array.from(allSlugs)
      .map((slug) => {
        const memory = decisionMemories[slug] ?? {};
        const state: ToolUserState = {
          is_saved: shortlist.includes(slug),
          shortlist_stage: shortlistStages[slug] ?? "saved",
          note: memory.note,
          save_reason: memory.save_reason ?? undefined,
          is_pinned: Boolean(memory.is_pinned),
          updated_at: memory.updated_at ?? toolStateMeta[slug] ?? null,
        };
        return [slug, state] as const;
      })
      .filter((entry) => entry[1].is_saved || entry[1].note || entry[1].save_reason || entry[1].is_pinned),
  );
}

export function getDiscoveryLocalSnapshot(): DiscoveryLocalSnapshot {
  const workspace = getCanonicalToolWorkspaceState();
  const shortlistStages = Object.fromEntries(
    workspace.saved.slugs.map((slug) => [slug, workspace.toolStates[slug]?.stage ?? "saved"]),
  );
  const decisionMemories = Object.fromEntries(
    Object.entries(workspace.toolStates).flatMap(([slug, state]) => {
      const memory: ToolDecisionMemory = {
        note: state.note ?? undefined,
        save_reason: state.saveReason ?? undefined,
        is_pinned: state.pinned,
        updated_at: state.updatedAt ?? state.decision?.updatedAt ?? undefined,
      };
      return memory.note || memory.save_reason || memory.is_pinned
        ? [[slug, memory] as const]
        : [];
    }),
  );
  const toolStateMeta = Object.fromEntries(
    Object.entries(workspace.toolStates).flatMap(([slug, state]) =>
      state.updatedAt ? [[slug, state.updatedAt] as const] : [],
    ),
  );

  return {
    visitedTools: getVisitedTools(),
    exploredCategories: getExploredCategories(),
    shortlist: [...workspace.saved.slugs],
    compare: [...workspace.compare.slugs],
    shortlistStages,
    decisionMemories,
    toolStateMeta,
    compareMeta: { updated_at: workspace.compare.updatedAt },
  };
}

export function getToolUserStates(): Record<string, ToolUserState> {
  return buildToolUserStates(getDiscoveryLocalSnapshot());
}

/** Temporary legacy-B read boundary for consumers not yet migrated in B32. */
export function getLocalDiscoveryWorkspaceState(): DiscoveryWorkspaceState {
  const snapshot = getDiscoveryLocalSnapshot();
  return normalizeDiscoveryWorkspaceState({
    tool_states: buildToolUserStates(snapshot),
    compare: { slugs: snapshot.compare, updated_at: snapshot.compareMeta.updated_at ?? null },
  });
}

/** Temporary legacy-B input boundary. Remote sync no longer emits this shape. */
export function applyDiscoveryWorkspaceState(
  workspaceState: DiscoveryWorkspaceState,
  options: WriteOptions = { source: "remote" },
) {
  const current = getCanonicalToolWorkspaceState();
  const incoming = adaptLegacyDiscoveryWorkspaceState(workspaceState);
  const merged = mergeWorkspaceForSync(incoming, current);
  commitCanonicalToolWorkspaceState(merged);
  if (options.dispatch !== false) {
    dispatchWorkspaceChange({
      source: options.source ?? "remote",
      scope: "workspace",
    });
  }
  return normalizeDiscoveryWorkspaceState(workspaceState);
}

function commitAction(
  action: Parameters<typeof reduceWorkspaceState>[1],
  source: WorkspaceChangeSource = "local",
) {
  const current = getCanonicalToolWorkspaceState();
  const next = reduceWorkspaceState(current, action);
  if (JSON.stringify(current) !== JSON.stringify(next)) {
    commitCanonicalToolWorkspaceState(next);
    dispatchWorkspaceChange({ source, scope: "workspace" });
  }
  return next;
}

export function toggleShortlistItem(slug: string) {
  return commitAction({ type: "saved/toggle", slug, at: nowIso() }).saved.slugs;
}

export function setShortlistStage(slug: string, stage: ShortlistStage) {
  commitAction({ type: "tool/stage", slug, stage, at: nowIso() });
}

export function updateToolDecisionMemory(
  slug: string,
  patch: Partial<ToolDecisionMemory>,
) {
  const timestamp = nowIso();
  const current = getCanonicalToolWorkspaceState();
  let state = current;
  if ("note" in patch) {
    state = reduceWorkspaceState(state, { type: "tool/note", slug, note: patch.note ?? null, at: timestamp });
  }
  if ("save_reason" in patch) {
    state = reduceWorkspaceState(state, {
      type: "tool/save-reason",
      slug,
      saveReason: patch.save_reason ?? null,
      at: timestamp,
    });
  }
  if ("is_pinned" in patch) {
    state = reduceWorkspaceState(state, {
      type: "tool/pin",
      slug,
      pinned: Boolean(patch.is_pinned),
      at: timestamp,
    });
  }
  if (JSON.stringify(current) !== JSON.stringify(state)) {
    commitCanonicalToolWorkspaceState(state);
    dispatchWorkspaceChange({ source: "local", scope: "workspace" });
  }
  return getToolDecisionMemory(slug);
}

export function toggleToolPin(slug: string) {
  const current = getCanonicalToolWorkspaceState();
  const pinned = !current.toolStates[slug]?.pinned;
  commitAction({ type: "tool/pin", slug, pinned, at: nowIso() });
  return getToolDecisionMemory(slug);
}

export function toggleCompareTool(slug: string) {
  return commitAction({ type: "compare/toggle", slug, at: nowIso() }).compare.slugs;
}

export function clearCompareTools() {
  commitAction({ type: "compare/clear", at: nowIso() });
}

export function markToolVisited(slug: string, category: string) {
  writeList(DISCOVERY_STORAGE_KEYS.visitedTools, [...getVisitedTools(), slug]);
  writeList(DISCOVERY_STORAGE_KEYS.exploredCategories, [...getExploredCategories(), category]);
}

export function markCategoryExplored(category: string) {
  writeList(DISCOVERY_STORAGE_KEYS.exploredCategories, [...getExploredCategories(), category]);
}
