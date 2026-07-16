import type { ShortlistStage, ToolDecisionMemory } from "@/lib/types/tool";
import type {
  DiscoveryWorkspaceState,
  ToolUserState,
} from "@/lib/discovery/types";
import { normalizeDiscoveryWorkspaceState } from "@/lib/discovery/workspace-state";
import { MAX_COMPARE_TOOLS } from "@/lib/discovery/workspace-constants";

type DiscoverySyncSource = "local" | "remote";
type WriteOptions = {
  dispatch?: boolean;
  source?: DiscoverySyncSource;
};

type CompareMeta = {
  updated_at?: string | null;
};

export const DISCOVERY_SYNC_EVENT = "tooolvibes:discovery-sync";

export const DISCOVERY_STORAGE_KEYS = {
  visitedTools: "tooolvibes:visited-tools",
  exploredCategories: "tooolvibes:explored-categories",
  shortlist: "tooolvibes:shortlist",
  shortlistState: "tooolvibes:shortlist-state",
  decisionMemory: "tooolvibes:decision-memory",
  compare: "tooolvibes:compare",
  toolStateMeta: "tooolvibes:tool-state-meta",
  compareMeta: "tooolvibes:compare-meta",
} as const;

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

function dispatchDiscoverySync(source: DiscoverySyncSource = "local") {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(DISCOVERY_SYNC_EVENT, {
      detail: { source },
    }),
  );
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
    dispatchDiscoverySync(options.source);
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

function writeMap<T>(key: string, value: Record<string, T>, options: WriteOptions = {}) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));

  if (options.dispatch !== false) {
    dispatchDiscoverySync(options.source);
  }
}

function readObject<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);

    if (!raw) {
      return fallback;
    }

    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function writeObject<T>(key: string, value: T, options: WriteOptions = {}) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));

  if (options.dispatch !== false) {
    dispatchDiscoverySync(options.source);
  }
}

function getToolStateMeta() {
  return readMap<string>(DISCOVERY_STORAGE_KEYS.toolStateMeta);
}

function setToolStateMeta(value: Record<string, string>, options: WriteOptions = {}) {
  writeMap(DISCOVERY_STORAGE_KEYS.toolStateMeta, value, options);
}

function touchToolState(slug: string, timestamp = nowIso(), options: WriteOptions = {}) {
  setToolStateMeta(
    {
      ...getToolStateMeta(),
      [slug]: timestamp,
    },
    options,
  );
}

function removeToolStateTouch(slug: string, options: WriteOptions = {}) {
  const current = { ...getToolStateMeta() };
  delete current[slug];
  setToolStateMeta(current, options);
}

function getCompareMeta() {
  return readObject<CompareMeta>(DISCOVERY_STORAGE_KEYS.compareMeta, {});
}

function setCompareMeta(value: CompareMeta, options: WriteOptions = {}) {
  writeObject(DISCOVERY_STORAGE_KEYS.compareMeta, value, options);
}

function persistShortlistStateForSlug(slug: string, stage: ShortlistStage, timestamp: string, source: DiscoverySyncSource) {
  const shortlist = getShortlist();
  const stages = getShortlistStages();

  if (!shortlist.includes(slug)) {
    writeList(DISCOVERY_STORAGE_KEYS.shortlist, [...shortlist, slug], {
      dispatch: false,
      source,
    });
  }

  writeMap(
    DISCOVERY_STORAGE_KEYS.shortlistState,
    {
      ...stages,
      [slug]: stage,
    },
    { dispatch: false, source },
  );

  touchToolState(slug, timestamp, { dispatch: false, source });
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
  return {
    visitedTools: getVisitedTools(),
    exploredCategories: getExploredCategories(),
    shortlist: getShortlist(),
    compare: getCompareTools(),
    shortlistStages: getShortlistStages(),
    decisionMemories: getDecisionMemories(),
    toolStateMeta: getToolStateMeta(),
    compareMeta: getCompareMeta(),
  };
}

export function getToolUserStates(): Record<string, ToolUserState> {
  return buildToolUserStates(getDiscoveryLocalSnapshot());
}

export function getLocalDiscoveryWorkspaceState(): DiscoveryWorkspaceState {
  const snapshot = getDiscoveryLocalSnapshot();

  return normalizeDiscoveryWorkspaceState({
    tool_states: buildToolUserStates(snapshot),
    compare: {
      slugs: snapshot.compare,
      updated_at: snapshot.compareMeta.updated_at ?? null,
    },
  });
}

export function applyDiscoveryWorkspaceState(
  workspaceState: DiscoveryWorkspaceState,
  options: WriteOptions = { source: "remote" },
) {
  const normalized = normalizeDiscoveryWorkspaceState(workspaceState);
  const shortlistSlugs = Object.entries(normalized.tool_states)
    .filter(([, state]) => state.is_saved)
    .map(([slug]) => slug);
  const shortlistStages = Object.fromEntries(
    Object.entries(normalized.tool_states)
      .filter(([, state]) => state.is_saved)
      .map(([slug, state]) => [slug, state.shortlist_stage]),
  );
  const decisionMemories = Object.fromEntries(
    Object.entries(normalized.tool_states)
      .map(([slug, state]) => {
        const memory: ToolDecisionMemory = {
          note: state.note,
          save_reason: state.save_reason ?? undefined,
          is_pinned: Boolean(state.is_pinned),
          updated_at: state.updated_at ?? undefined,
        };

        const hasMeaningfulData = Boolean(memory.note || memory.save_reason || memory.is_pinned);
        return hasMeaningfulData ? ([slug, memory] as const) : null;
      })
      .filter((entry): entry is [string, ToolDecisionMemory] => Boolean(entry)),
  );
  const toolStateMeta = Object.fromEntries(
    Object.entries(normalized.tool_states)
      .filter(([, state]) => Boolean(state.updated_at))
      .map(([slug, state]) => [slug, state.updated_at ?? nowIso()]),
  );

  writeList(DISCOVERY_STORAGE_KEYS.shortlist, shortlistSlugs, {
    dispatch: false,
    source: options.source,
  });
  writeMap(DISCOVERY_STORAGE_KEYS.shortlistState, shortlistStages, {
    dispatch: false,
    source: options.source,
  });
  writeMap(DISCOVERY_STORAGE_KEYS.decisionMemory, decisionMemories, {
    dispatch: false,
    source: options.source,
  });
  setToolStateMeta(toolStateMeta, {
    dispatch: false,
    source: options.source,
  });
  writeList(DISCOVERY_STORAGE_KEYS.compare, normalized.compare.slugs, {
    dispatch: false,
    source: options.source,
  });
  setCompareMeta(
    {
      updated_at: normalized.compare.updated_at ?? null,
    },
    {
      dispatch: false,
      source: options.source,
    },
  );

  if (options.dispatch !== false) {
    dispatchDiscoverySync(options.source);
  }

  return normalized;
}

export function toggleShortlistItem(slug: string) {
  const timestamp = nowIso();
  const current = getShortlist();
  const stages = getShortlistStages();
  const decisionMemories = getDecisionMemories();
  const next = current.includes(slug)
    ? current.filter((item) => item !== slug)
    : [...current, slug];

  writeList(DISCOVERY_STORAGE_KEYS.shortlist, next, {
    dispatch: false,
    source: "local",
  });

  if (next.includes(slug)) {
    writeMap(
      DISCOVERY_STORAGE_KEYS.shortlistState,
      {
        ...stages,
        [slug]: stages[slug] ?? "saved",
      },
      { dispatch: false, source: "local" },
    );
    touchToolState(slug, timestamp, { dispatch: false, source: "local" });
  } else {
    if (stages[slug]) {
      const nextStages = { ...stages };
      delete nextStages[slug];
      writeMap(DISCOVERY_STORAGE_KEYS.shortlistState, nextStages, {
        dispatch: false,
        source: "local",
      });
    }

    if (decisionMemories[slug]) {
      const nextMemories = { ...decisionMemories };
      delete nextMemories[slug];
      writeMap(DISCOVERY_STORAGE_KEYS.decisionMemory, nextMemories, {
        dispatch: false,
        source: "local",
      });
    }

    removeToolStateTouch(slug, { dispatch: false, source: "local" });
  }

  dispatchDiscoverySync("local");
  return next;
}

export function setShortlistStage(slug: string, stage: ShortlistStage) {
  const timestamp = nowIso();
  persistShortlistStateForSlug(slug, stage, timestamp, "local");
  dispatchDiscoverySync("local");
}

export function updateToolDecisionMemory(
  slug: string,
  patch: Partial<ToolDecisionMemory>,
) {
  const timestamp = nowIso();
  persistShortlistStateForSlug(slug, getShortlistStage(slug), timestamp, "local");

  const current = getToolDecisionMemory(slug);
  const nextMemory: ToolDecisionMemory = {
    ...current,
    ...patch,
  };

  const trimmedNote = nextMemory.note?.trim() ?? "";
  nextMemory.note = trimmedNote || undefined;
  nextMemory.save_reason = nextMemory.save_reason ?? undefined;
  nextMemory.is_pinned = Boolean(nextMemory.is_pinned);

  const hasMeaningfulData = Boolean(nextMemory.note || nextMemory.save_reason || nextMemory.is_pinned);
  const nextMemories = { ...getDecisionMemories() };

  if (!hasMeaningfulData) {
    delete nextMemories[slug];
    writeMap(DISCOVERY_STORAGE_KEYS.decisionMemory, nextMemories, {
      dispatch: false,
      source: "local",
    });
    touchToolState(slug, timestamp, { dispatch: false, source: "local" });
    dispatchDiscoverySync("local");
    return {};
  }

  nextMemory.updated_at = timestamp;
  nextMemories[slug] = nextMemory;
  writeMap(DISCOVERY_STORAGE_KEYS.decisionMemory, nextMemories, {
    dispatch: false,
    source: "local",
  });
  touchToolState(slug, timestamp, { dispatch: false, source: "local" });
  dispatchDiscoverySync("local");
  return nextMemory;
}

export function toggleToolPin(slug: string) {
  const current = getToolDecisionMemory(slug);
  return updateToolDecisionMemory(slug, {
    is_pinned: !current.is_pinned,
  });
}

export function toggleCompareTool(slug: string) {
  const current = getCompareTools();
  const timestamp = nowIso();

  if (current.includes(slug)) {
    const next = current.filter((item) => item !== slug);
    writeList(DISCOVERY_STORAGE_KEYS.compare, next, {
      dispatch: false,
      source: "local",
    });
    setCompareMeta({ updated_at: timestamp }, { dispatch: false, source: "local" });
    dispatchDiscoverySync("local");
    return next;
  }

  const next = [...current, slug].slice(-MAX_COMPARE_TOOLS);
  writeList(DISCOVERY_STORAGE_KEYS.compare, next, {
    dispatch: false,
    source: "local",
  });
  setCompareMeta({ updated_at: timestamp }, { dispatch: false, source: "local" });
  dispatchDiscoverySync("local");
  return next;
}

export function clearCompareTools() {
  writeList(DISCOVERY_STORAGE_KEYS.compare, [], {
    dispatch: false,
    source: "local",
  });
  setCompareMeta({ updated_at: nowIso() }, { dispatch: false, source: "local" });
  dispatchDiscoverySync("local");
}

export function markToolVisited(slug: string, category: string) {
  writeList(DISCOVERY_STORAGE_KEYS.visitedTools, [...getVisitedTools(), slug]);
  writeList(DISCOVERY_STORAGE_KEYS.exploredCategories, [...getExploredCategories(), category]);
}

export function markCategoryExplored(category: string) {
  writeList(DISCOVERY_STORAGE_KEYS.exploredCategories, [...getExploredCategories(), category]);
}
