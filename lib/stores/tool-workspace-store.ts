"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { ToolDecisionMemory } from "@/lib/types/tool";

type ToolWorkspaceState = {
  savedSlugs: string[];
  compareSlugs: string[];
  stackSlugs: string[];
  selectedSlug: string | null;
  isCommandOpen: boolean;
  decisionMemories: Record<string, ToolDecisionMemory>;
  setSelectedSlug: (slug: string | null) => void;
  setCommandOpen: (open: boolean) => void;
  toggleSaved: (slug: string) => boolean;
  toggleCompare: (slug: string) => { added: boolean; limited: boolean };
  addToStack: (slug: string) => boolean;
  removeFromStack: (slug: string) => void;
  reorderStack: (slugs: string[]) => void;
  updateDecisionMemory: (slug: string, patch: Partial<ToolDecisionMemory>) => void;
  clearCompare: () => void;
  clearWorkspace: () => void;
};

export const MAX_COMPARE_TOOLS = 5;

function toggleItem(items: string[], slug: string) {
  return items.includes(slug)
    ? items.filter((item) => item !== slug)
    : [...items, slug];
}

export const useToolWorkspaceStore = create<ToolWorkspaceState>()(
  persist(
    (set, get) => ({
      savedSlugs: [],
      compareSlugs: [],
      stackSlugs: [],
      selectedSlug: null,
      isCommandOpen: false,
      decisionMemories: {},
      setSelectedSlug: (slug) => set({ selectedSlug: slug }),
      setCommandOpen: (open) => set({ isCommandOpen: open }),
      toggleSaved: (slug) => {
        const willSave = !get().savedSlugs.includes(slug);
        set((state) => ({ savedSlugs: toggleItem(state.savedSlugs, slug) }));
        return willSave;
      },
      toggleCompare: (slug) => {
        const compareSlugs = get().compareSlugs;
        const alreadyAdded = compareSlugs.includes(slug);

        if (!alreadyAdded && compareSlugs.length >= MAX_COMPARE_TOOLS) {
          return { added: false, limited: true };
        }

        set((state) => ({ compareSlugs: toggleItem(state.compareSlugs, slug) }));
        return { added: !alreadyAdded, limited: false };
      },
      addToStack: (slug) => {
        if (get().stackSlugs.includes(slug)) {
          return false;
        }

        set((state) => ({ stackSlugs: [...state.stackSlugs, slug] }));
        return true;
      },
      removeFromStack: (slug) => {
        set((state) => ({
          stackSlugs: state.stackSlugs.filter((item) => item !== slug),
        }));
      },
      reorderStack: (slugs) => set({ stackSlugs: slugs }),
      updateDecisionMemory: (slug, patch) =>
        set((state) => ({
          decisionMemories: {
            ...state.decisionMemories,
            [slug]: {
              ...(state.decisionMemories[slug] ?? {}),
              ...patch,
              updated_at: new Date().toISOString(),
            },
          },
        })),
      clearCompare: () => set({ compareSlugs: [] }),
      clearWorkspace: () =>
        set({
          savedSlugs: [],
          compareSlugs: [],
          stackSlugs: [],
          selectedSlug: null,
          decisionMemories: {},
        }),
    }),
    {
      name: "tooolvibes-tool-workspace",
      partialize: (state) => ({
        savedSlugs: state.savedSlugs,
        compareSlugs: state.compareSlugs,
        stackSlugs: state.stackSlugs,
        decisionMemories: state.decisionMemories,
      }),
    },
  ),
);
