"use client";

import { create } from "zustand";
import { persist, type PersistStorage } from "zustand/middleware";

import { MAX_COMPARE_TOOLS } from "@/lib/discovery/workspace-constants";
import { adaptLegacyToolWorkspaceState } from "@/lib/discovery/workspace-legacy-adapters";
import { normalizeWorkspaceState, reduceWorkspaceState } from "@/lib/discovery/workspace-state";
import {
  getBrowserWorkspaceStorage,
  loadWorkspaceStateFromStorage,
  persistWorkspaceStateToStorage,
  updateWorkspaceCollections,
} from "@/lib/discovery/workspace-storage";
import { createEmptyWorkspaceState } from "@/lib/discovery/workspace-state";
import { WORKSPACE_STORAGE_KEY } from "@/lib/discovery/workspace-storage-keys";
import {
  getActiveWorkspaceOwner,
  scopeWorkspaceStorage,
  setActiveWorkspaceOwner,
  workspaceStorageKeyForOwner,
  type WorkspaceOwner,
} from "@/lib/discovery/workspace-owner-storage";
import { dispatchWorkspaceChange } from "@/lib/discovery/workspace-events";
import type {
  WorkspaceAction,
  WorkspaceStateV1,
  WorkspaceToolState,
} from "@/lib/discovery/types";

export { MAX_COMPARE_TOOLS } from "@/lib/discovery/workspace-constants";
export { MIN_COMPARE_TOOLS } from "@/lib/discovery/workspace-constants";

export type ToolWorkspaceState = {
  savedSlugs: string[];
  compareSlugs: string[];
  stackSlugs: string[];
  selectedSlug: string | null;
  isCommandOpen: boolean;
  setSelectedSlug: (slug: string | null) => void;
  setCommandOpen: (open: boolean) => void;
  toggleSaved: (slug: string) => boolean;
  toggleCompare: (slug: string) => { added: boolean; limited: boolean };
  addToStack: (slug: string) => boolean;
  removeFromStack: (slug: string) => void;
  reorderStack: (slugs: string[]) => void;
  clearCompare: () => void;
  clearWorkspace: () => void;
};

type ToolWorkspaceCollections = Pick<
  ToolWorkspaceState,
  "savedSlugs" | "compareSlugs" | "stackSlugs"
>;

function nowIso() {
  return new Date().toISOString();
}

type VolatileWorkspaceState = {
  base: WorkspaceStateV1;
  desired: WorkspaceStateV1;
};

const volatileWorkspaceStates = new Map<string, VolatileWorkspaceState>();
let suppressPersistWrite = false;

function workspaceKey(owner: WorkspaceOwner) {
  return workspaceStorageKeyForOwner(owner);
}

function activeWorkspaceKey() {
  return workspaceKey(getActiveWorkspaceOwner());
}

function getBrowserWorkspaceStorageForOwner(owner: WorkspaceOwner) {
  const storage = getBrowserWorkspaceStorage();
  return storage
    ? scopeWorkspaceStorage(storage, owner)
    : null;
}

function getActiveBrowserWorkspaceStorage() {
  return getBrowserWorkspaceStorageForOwner(getActiveWorkspaceOwner());
}

export function selectCanonicalWorkspaceState(
  state: ToolWorkspaceCollections,
): WorkspaceStateV1 {
  return adaptLegacyToolWorkspaceState(state);
}

function projectWorkspaceCollections(
  state: WorkspaceStateV1,
): ToolWorkspaceCollections {
  return {
    savedSlugs: state.saved.slugs,
    compareSlugs: state.compare.slugs,
    stackSlugs: state.stack.slugs,
  };
}

function canonicalStatesMatch(
  left: WorkspaceStateV1,
  right: WorkspaceStateV1,
) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function renderWorkspaceStateWithoutPersist(state: WorkspaceStateV1) {
  suppressPersistWrite = true;
  try {
    useToolWorkspaceStore.setState(projectWorkspaceCollections(state));
  } finally {
    suppressPersistWrite = false;
  }
}

export function rebaseWorkspaceIntent(
  base: WorkspaceStateV1,
  desired: WorkspaceStateV1,
  durable: WorkspaceStateV1,
) {
  const timestamp = (value: string | null) => {
    if (!value) return null;
    const parsed = new Date(value).getTime();
    return Number.isFinite(parsed) ? parsed : null;
  };
  const latestTimestamp = (left: string | null, right: string | null) => {
    const leftTime = timestamp(left);
    const rightTime = timestamp(right);
    if (leftTime === null) return right;
    if (rightTime === null) return left;
    return leftTime >= rightTime ? left : right;
  };
  const localClearChanged = base.clearedAt !== desired.clearedAt;
  const localClearTime = localClearChanged ? timestamp(desired.clearedAt) : null;
  const remoteClearChanged = base.clearedAt !== durable.clearedAt;
  const remoteClearTime = remoteClearChanged
    ? timestamp(durable.clearedAt)
    : null;

  const rebaseList = (
    baseList: WorkspaceStateV1["saved"],
    desiredList: WorkspaceStateV1["saved"],
    durableList: WorkspaceStateV1["saved"],
    ordered = false,
  ) => {
    if (JSON.stringify(baseList) === JSON.stringify(desiredList)) {
      return durableList;
    }
    const desiredListTime = timestamp(desiredList.updatedAt);
    if (remoteClearTime !== null &&
        (desiredListTime === null || desiredListTime <= remoteClearTime)) {
      return durableList;
    }
    const removed = new Set(
      baseList.slugs.filter((slug) => !desiredList.slugs.includes(slug)),
    );
    const locallyAdded = desiredList.slugs.filter(
      (slug) => !baseList.slugs.includes(slug),
    );
    const durableListTime = timestamp(durableList.updatedAt);
    const durableSlugs = localClearTime !== null &&
        (durableListTime === null || durableListTime <= localClearTime)
      ? []
      : durableList.slugs;
    let slugs = durableSlugs.filter((slug) => !removed.has(slug));
    for (const slug of locallyAdded) {
      if (!slugs.includes(slug)) slugs.push(slug);
    }
    if (ordered) {
      const desiredOrder = desiredList.slugs.filter((slug) => slugs.includes(slug));
      slugs = [
        ...desiredOrder,
        ...slugs.filter((slug) => !desiredOrder.includes(slug)),
      ];
    }
    return {
      slugs,
      updatedAt: latestTimestamp(desiredList.updatedAt, durableList.updatedAt),
    };
  };

  const toolStates = { ...durable.toolStates };
  for (const slug of new Set([
    ...Object.keys(base.toolStates),
    ...Object.keys(desired.toolStates),
    ...Object.keys(durable.toolStates),
  ])) {
    const baseState = base.toolStates[slug];
    const desiredState = desired.toolStates[slug];
    const durableState = durable.toolStates[slug];
    if (JSON.stringify(baseState) === JSON.stringify(desiredState)) continue;

    const desiredActivityTime = Math.max(
      timestamp(desiredState?.updatedAt ?? null) ?? Number.NEGATIVE_INFINITY,
      timestamp(desiredState?.decision?.updatedAt ?? null) ??
        Number.NEGATIVE_INFINITY,
    );
    if (remoteClearTime !== null && desiredActivityTime <= remoteClearTime) {
      continue;
    }

    if (!desiredState) {
      const durableActivityTime = Math.max(
        timestamp(durableState?.updatedAt ?? null) ?? Number.NEGATIVE_INFINITY,
        timestamp(durableState?.decision?.updatedAt ?? null) ??
          Number.NEGATIVE_INFINITY,
      );
      if (localClearTime === null || durableActivityTime <= localClearTime) {
        delete toolStates[slug];
      }
      continue;
    }

    const defaultState: WorkspaceToolState = {
      stage: "saved",
      note: null,
      saveReason: null,
      pinned: false,
      decision: null,
      updatedAt: null,
    };
    const baseline = baseState ?? defaultState;
    const remote = durableState ?? baseline;
    const changed = <K extends keyof WorkspaceToolState>(key: K) =>
      JSON.stringify(baseline[key]) !== JSON.stringify(desiredState[key]);
    toolStates[slug] = {
      stage: changed("stage") ? desiredState.stage : remote.stage,
      note: changed("note") ? desiredState.note : remote.note,
      saveReason: changed("saveReason")
        ? desiredState.saveReason
        : remote.saveReason,
      pinned: changed("pinned") ? desiredState.pinned : remote.pinned,
      decision: changed("decision")
        ? desiredState.decision
        : remote.decision,
      updatedAt: latestTimestamp(desiredState.updatedAt, remote.updatedAt),
    };
  }

  return normalizeWorkspaceState({
    ...durable,
    clearedAt: localClearChanged
      ? latestTimestamp(desired.clearedAt, durable.clearedAt)
      : durable.clearedAt,
    saved: rebaseList(base.saved, desired.saved, durable.saved),
    compare: rebaseList(base.compare, desired.compare, durable.compare),
    stack: rebaseList(base.stack, desired.stack, durable.stack, true),
    toolStates,
  });
}

export function getToolWorkspaceStateForOwner(owner: WorkspaceOwner) {
  const key = workspaceKey(owner);
  const volatile = volatileWorkspaceStates.get(key);
  const storage = getBrowserWorkspaceStorageForOwner(owner);
  const durable = storage
    ? loadWorkspaceStateFromStorage(storage).state
    : createEmptyWorkspaceState();

  if (!volatile) return durable;
  const candidate = rebaseWorkspaceIntent(
    volatile.base,
    volatile.desired,
    durable,
  );
  if (canonicalStatesMatch(candidate, durable)) {
    volatileWorkspaceStates.delete(key);
    return durable;
  }
  volatileWorkspaceStates.set(key, { base: durable, desired: candidate });
  return candidate;
}

function resolveCanonicalWorkspaceState(state: ToolWorkspaceCollections) {
  const owner = getActiveWorkspaceOwner();
  const storage = getBrowserWorkspaceStorageForOwner(owner);
  if (!storage && !volatileWorkspaceStates.has(workspaceKey(owner))) {
    return selectCanonicalWorkspaceState(state);
  }
  return getToolWorkspaceStateForOwner(owner);
}

function persistCanonicalWorkspaceState(state: WorkspaceStateV1) {
  const key = activeWorkspaceKey();
  const storage = getActiveBrowserWorkspaceStorage();

  if (!storage) {
    const existing = volatileWorkspaceStates.get(key);
    volatileWorkspaceStates.set(key, {
      base: existing?.base ?? createEmptyWorkspaceState(),
      desired: state,
    });
    return { state, persisted: false, issues: [] };
  }

  const durable = loadWorkspaceStateFromStorage(storage).state;
  const result = persistWorkspaceStateToStorage(storage, state);
  if (result.persisted) volatileWorkspaceStates.delete(key);
  else {
    const existing = volatileWorkspaceStates.get(key);
    volatileWorkspaceStates.set(key, {
      base: existing?.base ?? durable,
      desired: state,
    });
  }
  return result;
}

function reduceCollections(
  state: ToolWorkspaceCollections,
  action: WorkspaceAction,
) {
  const current = resolveCanonicalWorkspaceState(state);
  const next = reduceWorkspaceState(current, action);

  if (!canonicalStatesMatch(current, next)) {
    persistCanonicalWorkspaceState(next);
    dispatchWorkspaceChange({ source: "local", scope: "workspace" });
  }

  return next;
}

export const canonicalToolWorkspacePersistStorage: PersistStorage<ToolWorkspaceCollections> = {
  getItem: () => {
    const storage = getActiveBrowserWorkspaceStorage();

    if (!storage) {
      return null;
    }

    const result = loadWorkspaceStateFromStorage(storage);

    return {
      state: projectWorkspaceCollections(result.state),
      version: 1,
    };
  },
  setItem: (_name, value) => {
    if (suppressPersistWrite) return;
    const storage = getActiveBrowserWorkspaceStorage();

    if (!storage) {
      return;
    }

    const current = loadWorkspaceStateFromStorage(storage).state;
    const next = updateWorkspaceCollections(
      current,
      value.state,
      nowIso(),
    );

    if (!canonicalStatesMatch(current, next)) {
      persistCanonicalWorkspaceState(next);
    }
  },
  removeItem: () => {
    const storage = getActiveBrowserWorkspaceStorage();

    if (!storage) {
      return;
    }

    const current = loadWorkspaceStateFromStorage(storage).state;
    const cleared = reduceWorkspaceState(current, {
      type: "workspace/clear",
      at: nowIso(),
    });

    persistCanonicalWorkspaceState(cleared);
  },
};

export const useToolWorkspaceStore = create<ToolWorkspaceState>()(
  persist(
    (set, get) => ({
      savedSlugs: [],
      compareSlugs: [],
      stackSlugs: [],
      selectedSlug: null,
      isCommandOpen: false,
      setSelectedSlug: (slug) => set({ selectedSlug: slug }),
      setCommandOpen: (open) => set({ isCommandOpen: open }),
      toggleSaved: (slug) => {
        const next = reduceCollections(get(), {
          type: "saved/toggle",
          slug,
          at: nowIso(),
        });
        set(projectWorkspaceCollections(next));
        return next.saved.slugs.includes(slug);
      },
      toggleCompare: (slug) => {
        const current = resolveCanonicalWorkspaceState(get());
        const alreadyAdded = current.compare.slugs.includes(slug);
        const next = reduceCollections(get(), {
          type: "compare/toggle",
          slug,
          at: nowIso(),
        });
        const added = next.compare.slugs.includes(slug);
        const limited =
          !alreadyAdded &&
          !added &&
          current.compare.slugs.length >= MAX_COMPARE_TOOLS;
        set(projectWorkspaceCollections(next));
        return { added, limited };
      },
      addToStack: (slug) => {
        const current = resolveCanonicalWorkspaceState(get());

        if (current.stack.slugs.includes(slug)) {
          return false;
        }

        const next = reduceCollections(get(), {
          type: "stack/add",
          slug,
          at: nowIso(),
        });
        set(projectWorkspaceCollections(next));
        return next.stack.slugs.includes(slug);
      },
      removeFromStack: (slug) => {
        set(
          projectWorkspaceCollections(
            reduceCollections(get(), {
              type: "stack/remove",
              slug,
              at: nowIso(),
            }),
          ),
        );
      },
      reorderStack: (slugs) => {
        set(
          projectWorkspaceCollections(
            reduceCollections(get(), {
              type: "stack/reorder",
              slugs,
              at: nowIso(),
            }),
          ),
        );
      },
      clearCompare: () => {
        set(
          projectWorkspaceCollections(
            reduceCollections(get(), {
              type: "compare/clear",
              at: nowIso(),
            }),
          ),
        );
      },
      clearWorkspace: () => {
        const next = reduceCollections(get(), {
          type: "workspace/clear",
          at: nowIso(),
        });
        set({
          ...projectWorkspaceCollections(next),
          selectedSlug: null,
        });
      },
    }),
    {
      name: WORKSPACE_STORAGE_KEY,
      version: 1,
      storage: canonicalToolWorkspacePersistStorage,
      partialize: (state) => ({
        savedSlugs: state.savedSlugs,
        compareSlugs: state.compareSlugs,
        stackSlugs: state.stackSlugs,
      }),
      skipHydration: true,
    },
  ),
);

export function getCanonicalToolWorkspaceState() {
  return resolveCanonicalWorkspaceState(useToolWorkspaceStore.getState());
}

export function hasVolatileToolWorkspaceState() {
  return volatileWorkspaceStates.has(activeWorkspaceKey());
}

export function refreshCanonicalToolWorkspaceStateFromStorage() {
  const state = getToolWorkspaceStateForOwner(getActiveWorkspaceOwner());
  renderWorkspaceStateWithoutPersist(state);
  return state;
}

export function commitCanonicalToolWorkspaceState(input: unknown) {
  const state = normalizeWorkspaceState(input);
  const storage = getActiveBrowserWorkspaceStorage();

  if (!storage) {
    const key = activeWorkspaceKey();
    const existing = volatileWorkspaceStates.get(key);
    volatileWorkspaceStates.set(key, {
      base: existing?.base ?? createEmptyWorkspaceState(),
      desired: state,
    });
    renderWorkspaceStateWithoutPersist(state);
    return { state, persisted: false, issues: [] };
  }

  const durable = loadWorkspaceStateFromStorage(storage).state;
  const result = persistWorkspaceStateToStorage(storage, state);
  if (result.persisted) {
    volatileWorkspaceStates.delete(activeWorkspaceKey());
    renderWorkspaceStateWithoutPersist(result.state);
  } else {
    const key = activeWorkspaceKey();
    const existing = volatileWorkspaceStates.get(key);
    volatileWorkspaceStates.set(key, {
      base: existing?.base ?? durable,
      desired: state,
    });
    renderWorkspaceStateWithoutPersist(state);
  }
  return result;
}

export function retainVolatileToolWorkspaceOwner(
  owner: WorkspaceOwner,
  input: unknown,
) {
  const state = normalizeWorkspaceState(input);
  setActiveWorkspaceOwner(owner);
  const storage = getBrowserWorkspaceStorageForOwner(owner);
  const durable = storage
    ? loadWorkspaceStateFromStorage(storage).state
    : createEmptyWorkspaceState();
  volatileWorkspaceStates.set(workspaceKey(owner), {
    base: durable,
    desired: state,
  });
  renderWorkspaceStateWithoutPersist(state);
  return state;
}

/**
 * Switch the rendered owner without reading or mutating that owner's durable
 * workspace. Auth transitions use this while the guest claim lock is pending,
 * so account data disappears immediately without racing another browser tab.
 */
export function activateVolatileToolWorkspaceOwnerWithoutStorage(
  owner: WorkspaceOwner,
  input: unknown,
) {
  const state = normalizeWorkspaceState(input);
  setActiveWorkspaceOwner(owner);
  volatileWorkspaceStates.set(workspaceKey(owner), {
    base: createEmptyWorkspaceState(),
    desired: state,
  });
  renderWorkspaceStateWithoutPersist(state);
  return state;
}

export function activateToolWorkspaceOwner(
  owner: WorkspaceOwner,
  input?: unknown,
) {
  setActiveWorkspaceOwner(owner);
  if (input !== undefined) {
    const result = commitCanonicalToolWorkspaceState(input);
    return { state: result.state, persisted: result.persisted };
  }
  const state = getToolWorkspaceStateForOwner(owner);
  renderWorkspaceStateWithoutPersist(state);
  return {
    state,
    persisted: !volatileWorkspaceStates.has(workspaceKey(owner)),
  };
}
