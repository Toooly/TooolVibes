"use client";

import { create } from "zustand";
import { persist, type PersistStorage } from "zustand/middleware";

import { MAX_COMPARE_TOOLS } from "@/lib/discovery/workspace-constants";
import { adaptLegacyToolWorkspaceState } from "@/lib/discovery/workspace-legacy-adapters";
import { reduceWorkspaceState } from "@/lib/discovery/workspace-state";
import {
  getBrowserWorkspaceStorage,
  loadWorkspaceStateFromStorage,
  persistWorkspaceStateToStorage,
  updateWorkspaceCollections,
} from "@/lib/discovery/workspace-storage";
import { WORKSPACE_STORAGE_KEY } from "@/lib/discovery/workspace-storage-keys";
import type { WorkspaceAction, WorkspaceStateV1 } from "@/lib/discovery/types";

export { MAX_COMPARE_TOOLS } from "@/lib/discovery/workspace-constants";

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

function resolveCanonicalWorkspaceState(state: ToolWorkspaceCollections) {
  const storage = getBrowserWorkspaceStorage();

  if (!storage) {
    return selectCanonicalWorkspaceState(state);
  }

  return loadWorkspaceStateFromStorage(storage).state;
}

function persistCanonicalWorkspaceState(state: WorkspaceStateV1) {
  const storage = getBrowserWorkspaceStorage();

  if (!storage) {
    return;
  }

  persistWorkspaceStateToStorage(storage, state);
}

function reduceCollections(
  state: ToolWorkspaceCollections,
  action: WorkspaceAction,
) {
  const current = resolveCanonicalWorkspaceState(state);
  const next = reduceWorkspaceState(current, action);

  if (!canonicalStatesMatch(current, next)) {
    persistCanonicalWorkspaceState(next);
  }

  return next;
}

export const canonicalToolWorkspacePersistStorage: PersistStorage<ToolWorkspaceCollections> = {
  getItem: () => {
    const storage = getBrowserWorkspaceStorage();

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
    const storage = getBrowserWorkspaceStorage();

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
      persistWorkspaceStateToStorage(storage, next);
    }
  },
  removeItem: () => {
    const storage = getBrowserWorkspaceStorage();

    if (!storage) {
      return;
    }

    const current = loadWorkspaceStateFromStorage(storage).state;
    const cleared = reduceWorkspaceState(current, {
      type: "workspace/clear",
      at: nowIso(),
    });

    persistWorkspaceStateToStorage(storage, cleared);
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
    },
  ),
);
