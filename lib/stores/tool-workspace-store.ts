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
import {
  reduceAddToWorkingPersonalStack,
  reduceRemoveFromWorkingPersonalStack,
  reduceReorderWorkingPersonalStack,
  workingPersonalStackSlugs,
} from "@/lib/account/workspace-stack-target";

export { MAX_COMPARE_TOOLS } from "@/lib/discovery/workspace-constants";
export { MIN_COMPARE_TOOLS } from "@/lib/discovery/workspace-constants";

export type ToolWorkspaceState = {
  savedSlugs: string[];
  compareSlugs: string[];
  stackSlugs: string[];
  workingStackSlugs: string[];
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

function projectWorkingStackView(state: WorkspaceStateV1) {
  return {
    ...projectWorkspaceCollections(state),
    workingStackSlugs: workingPersonalStackSlugs(state),
  };
}

function renderWorkspaceStateWithoutPersist(state: WorkspaceStateV1) {
  suppressPersistWrite = true;
  try {
    useToolWorkspaceStore.setState(projectWorkingStackView(state));
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
      useCase: null,
      alternatives: [],
      revisitAt: null,
      usage: null,
      replacedBy: null,
      compareObjective: null,
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
      useCase: changed("useCase") ? desiredState.useCase : remote.useCase,
      alternatives: changed("alternatives")
        ? desiredState.alternatives
        : remote.alternatives,
      revisitAt: changed("revisitAt")
        ? desiredState.revisitAt
        : remote.revisitAt,
      usage: changed("usage") ? desiredState.usage : remote.usage,
      replacedBy: changed("replacedBy")
        ? desiredState.replacedBy
        : remote.replacedBy,
      compareObjective: changed("compareObjective")
        ? desiredState.compareObjective
        : remote.compareObjective,
      updatedAt: latestTimestamp(desiredState.updatedAt, remote.updatedAt),
    };
  }

  const rebaseStacks = () => {
    if (JSON.stringify(base.personalStacks) === JSON.stringify(desired.personalStacks)) {
      return durable.personalStacks;
    }

    const byId = new Map(
      durable.personalStacks.map((stack) => [stack.id, stack]),
    );
    const baseIds = new Set(base.personalStacks.map((stack) => stack.id));
    const desiredIds = new Set(desired.personalStacks.map((stack) => stack.id));

    for (const id of baseIds) {
      if (desiredIds.has(id)) {
        continue;
      }

      const durableStack = byId.get(id);
      const durableTime = timestamp(durableStack?.updatedAt ?? null);
      if (localClearTime === null || durableTime === null || durableTime <= localClearTime) {
        byId.delete(id);
      }
    }

    for (const stack of desired.personalStacks) {
      const baseline = base.personalStacks.find((item) => item.id === stack.id);
      if (JSON.stringify(baseline) === JSON.stringify(stack)) {
        continue;
      }

      const desiredTime = timestamp(stack.updatedAt);
      if (remoteClearTime !== null && (desiredTime === null || desiredTime <= remoteClearTime)) {
        continue;
      }

      const durableStack = byId.get(stack.id);
      const durableTime = timestamp(durableStack?.updatedAt ?? null);
      if (durableStack && durableTime !== null && desiredTime !== null && durableTime > desiredTime) {
        continue;
      }

      byId.set(stack.id, stack);
    }

    const ordered: typeof durable.personalStacks = [];
    for (const stack of desired.personalStacks) {
      const next = byId.get(stack.id);
      if (next) {
        ordered.push(next);
        byId.delete(stack.id);
      }
    }
    ordered.push(...byId.values());
    return ordered;
  };

  const rebaseEvents = () => {
    if (JSON.stringify(base.events) === JSON.stringify(desired.events)) {
      return durable.events;
    }
    const byId = new Map(durable.events.map((event) => [event.id, event]));
    for (const event of desired.events) {
      if (!byId.has(event.id)) {
        byId.set(event.id, event);
      }
    }
    return [...byId.values()];
  };

  return normalizeWorkspaceState({
    ...durable,
    clearedAt: localClearChanged
      ? latestTimestamp(desired.clearedAt, durable.clearedAt)
      : durable.clearedAt,
    saved: rebaseList(base.saved, desired.saved, durable.saved),
    compare: rebaseList(base.compare, desired.compare, durable.compare),
    stack: rebaseList(base.stack, desired.stack, durable.stack, true),
    personalStacks: rebaseStacks(),
    toolStates,
    events: rebaseEvents(),
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
      workingStackSlugs: [],
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
        if (workingPersonalStackSlugs(current).includes(slug)) {
          return false;
        }

        const next = reduceAddToWorkingPersonalStack(current, slug, nowIso());
        if (!canonicalStatesMatch(current, next)) {
          persistCanonicalWorkspaceState(next);
          dispatchWorkspaceChange({ source: "local", scope: "workspace" });
        }
        set(projectWorkingStackView(next));
        return workingPersonalStackSlugs(next).includes(slug);
      },
      removeFromStack: (slug) => {
        const current = resolveCanonicalWorkspaceState(get());
        const next = reduceRemoveFromWorkingPersonalStack(current, slug, nowIso());
        if (!canonicalStatesMatch(current, next)) {
          persistCanonicalWorkspaceState(next);
          dispatchWorkspaceChange({ source: "local", scope: "workspace" });
        }
        set(projectWorkingStackView(next));
      },
      reorderStack: (slugs) => {
        const current = resolveCanonicalWorkspaceState(get());
        const next = reduceReorderWorkingPersonalStack(current, slugs, nowIso());
        if (!canonicalStatesMatch(current, next)) {
          persistCanonicalWorkspaceState(next);
          dispatchWorkspaceChange({ source: "local", scope: "workspace" });
        }
        set(projectWorkingStackView(next));
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
