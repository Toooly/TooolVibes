"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import { MAX_COMPARE_TOOLS } from "@/lib/discovery/workspace-constants";
import { adaptLegacyToolWorkspaceState } from "@/lib/discovery/workspace-legacy-adapters";
import { reduceWorkspaceState } from "@/lib/discovery/workspace-state";
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

function reduceCollections(
  state: ToolWorkspaceCollections,
  action: WorkspaceAction,
) {
  return projectWorkspaceCollections(
    reduceWorkspaceState(selectCanonicalWorkspaceState(state), action),
  );
}

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
        const current = selectCanonicalWorkspaceState(get());
        const next = reduceWorkspaceState(current, {
          type: "saved/toggle",
          slug,
          at: nowIso(),
        });
        set(projectWorkspaceCollections(next));
        return next.saved.slugs.includes(slug);
      },
      toggleCompare: (slug) => {
        const current = selectCanonicalWorkspaceState(get());
        const alreadyAdded = current.compare.slugs.includes(slug);
        const next = reduceWorkspaceState(current, {
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
        const current = selectCanonicalWorkspaceState(get());

        if (current.stack.slugs.includes(slug)) {
          return false;
        }

        const next = reduceWorkspaceState(current, {
          type: "stack/add",
          slug,
          at: nowIso(),
        });
        set(projectWorkspaceCollections(next));
        return next.stack.slugs.includes(slug);
      },
      removeFromStack: (slug) => {
        set(
          reduceCollections(get(), {
            type: "stack/remove",
            slug,
            at: nowIso(),
          }),
        );
      },
      reorderStack: (slugs) => {
        set(
          reduceCollections(get(), {
            type: "stack/reorder",
            slugs,
            at: nowIso(),
          }),
        );
      },
      clearCompare: () => {
        set(
          reduceCollections(get(), {
            type: "compare/clear",
            at: nowIso(),
          }),
        );
      },
      clearWorkspace: () => {
        const next = reduceCollections(get(), {
          type: "workspace/clear",
          at: nowIso(),
        });
        set({
          ...next,
          selectedSlug: null,
        });
      },
    }),
    {
      name: "tooolvibes-tool-workspace",
      partialize: (state) => ({
        savedSlugs: state.savedSlugs,
        compareSlugs: state.compareSlugs,
        stackSlugs: state.stackSlugs,
      }),
    },
  ),
);
