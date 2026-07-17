"use client";

import { useMemo } from "react";

import { usePublicToolCatalog } from "@/lib/data/public-tool-catalog-context";
import { useDiscoverySnapshot } from "@/lib/discovery/client-store";

import {
  readWorkspaceSnapshot,
  type SavedToolCardView,
} from "./account-panel-model";

/* ═══════════════════════════════════════════════════════════════
   useAccountWorkspaceSummary (B27) — riepilogo workspace.
   Deriva conteggi, card dei tool salvati (max 4) e consigliati
   (max 3, stessa categoria dei salvati) dal discovery snapshot e
   dal catalogo pubblico. Derivazioni invariate dal monolite.
   ═══════════════════════════════════════════════════════════════ */

export function useAccountWorkspaceSummary() {
  const toolCatalog = usePublicToolCatalog();
  const discovery = useDiscoverySnapshot();

  const workspace = useMemo(() => readWorkspaceSnapshot(discovery), [discovery]);

  const savedToolCards = useMemo<SavedToolCardView[]>(() => {
    return discovery.shortlist
      .map((slug) => {
        const tool = toolCatalog.find((item) => item.slug === slug);
        const memory = discovery.decisionMemories[slug];

        return {
          slug,
          name: tool?.name ?? slug,
          category: tool?.categoryLabel ?? "Tool",
          description: tool?.shortDescription ?? "Tool salvato nella tua selezione.",
          stage: discovery.shortlistStages[slug] ?? "saved",
          pinned: Boolean(memory?.is_pinned),
          note: memory?.note ?? "",
        };
      })
      .slice(0, 4);
  }, [discovery.decisionMemories, discovery.shortlist, discovery.shortlistStages, toolCatalog]);

  const recommendedTools = useMemo(() => {
    const savedSlugs = new Set(discovery.shortlist);
    const savedCategories = new Set(
      savedToolCards.map((tool) => tool.category).filter(Boolean),
    );

    return toolCatalog
      .filter((tool) => !savedSlugs.has(tool.slug))
      .filter((tool) => savedCategories.size === 0 || savedCategories.has(tool.categoryLabel))
      .slice(0, 3);
  }, [discovery.shortlist, savedToolCards, toolCatalog]);

  return { workspace, savedToolCards, recommendedTools };
}
