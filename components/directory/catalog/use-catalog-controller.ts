"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ToolPublicView } from "@/lib/data/tool-public-view";
import {
  buildCatalogGroupUrl,
  CATALOG_ALL_TOOLS_URL,
  createCatalogSearchIndex,
  filterCatalogTools,
  resolveActiveGroupLabel,
  resolveFeaturedTools,
  resolveInitialActiveGroup,
  resolveInitialCatalogView,
  summarizeCatalogCategories,
  type CatalogCategorySummary,
  type CatalogLevelFilter,
  type CatalogView,
} from "./catalog-controller";

/* ═══════════════════════════════════════════════════════════════
   useCatalogController — query/filter/URL state controller hook.
   Owns view/group/search/level/panel state, router pushes and the
   derived collections. Behavior-preserving extraction (B25).
   ═══════════════════════════════════════════════════════════════ */

export type CatalogPanel = "search" | "filters";

export type CatalogControllerInput = {
  tools: ToolPublicView[];
  filterGroups: { key: string; label: string }[];
  initialQuery?: string;
  initialGroup?: string;
  initialTag?: string;
};

export type CatalogController = {
  view: CatalogView;
  activeGroup: string | null;
  searchQuery: string;
  activeLevel: CatalogLevelFilter;
  openPanel: CatalogPanel | null;
  setOpenPanel: (panel: CatalogPanel | null) => void;
  setActiveLevel: (level: CatalogLevelFilter) => void;
  filteredTools: ToolPublicView[];
  activeGroupLabel: string;
  categories: CatalogCategorySummary[];
  featuredTools: ToolPublicView[];
  handleCategorySelect: (groupKey: string) => void;
  handleBack: () => void;
  handleSearchChange: (value: string) => void;
};

export function useCatalogController({
  tools,
  filterGroups,
  initialQuery = "",
  initialGroup = "all",
  initialTag = "",
}: CatalogControllerInput): CatalogController {
  const router = useRouter();

  const [view, setView] = useState<CatalogView>(() =>
    resolveInitialCatalogView(initialGroup, initialQuery),
  );
  const [activeGroup, setActiveGroup] = useState<string | null>(() =>
    resolveInitialActiveGroup(initialGroup),
  );
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [activeLevel, setActiveLevel] = useState<CatalogLevelFilter>("all");
  const [openPanel, setOpenPanel] = useState<CatalogPanel | null>(null);

  const searchIndex = useMemo(() => createCatalogSearchIndex(tools), [tools]);

  const filteredTools = useMemo(
    () =>
      filterCatalogTools({
        tools,
        searchIndex,
        activeGroup,
        tag: initialTag,
        searchQuery,
        activeLevel,
      }),
    [tools, activeGroup, initialTag, searchQuery, searchIndex, activeLevel],
  );

  const activeGroupLabel = useMemo(
    () => resolveActiveGroupLabel(filterGroups, activeGroup),
    [filterGroups, activeGroup],
  );

  const categories = useMemo(
    () => summarizeCatalogCategories(filterGroups, tools),
    [filterGroups, tools],
  );

  const featuredTools = useMemo(() => resolveFeaturedTools(tools), [tools]);

  const handleCategorySelect = useCallback(
    (groupKey: string) => {
      if (groupKey === "all") {
        setActiveGroup(null);
      } else {
        setActiveGroup(groupKey);
      }
      setView("tools");
      router.push(buildCatalogGroupUrl(groupKey), { scroll: false });
    },
    [router],
  );

  const handleBack = useCallback(() => {
    setView("categories");
    setActiveGroup(null);
    setSearchQuery("");
    router.push(CATALOG_ALL_TOOLS_URL, { scroll: false });
  }, [router]);

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchQuery(value);
      if (value.trim() && view === "categories") {
        setView("tools");
      }
    },
    [view],
  );

  useEffect(() => {
    const handleCatalogPanel = (event: Event) => {
      const panel = (event as CustomEvent<"search" | "filters">).detail;
      if (panel !== "search" && panel !== "filters") return;
      setOpenPanel(panel);
      window.setTimeout(() => {
        document
          .querySelector<HTMLElement>("[data-catalog-panel]")
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
        if (panel === "search") {
          document
            .querySelector<HTMLInputElement>("[data-catalog-search]")
            ?.focus({ preventScroll: true });
        }
      }, 80);
    };

    window.addEventListener("tooolvibes:catalog-panel", handleCatalogPanel as EventListener);
    return () =>
      window.removeEventListener("tooolvibes:catalog-panel", handleCatalogPanel as EventListener);
  }, []);

  return {
    view,
    activeGroup,
    searchQuery,
    activeLevel,
    openPanel,
    setOpenPanel,
    setActiveLevel,
    filteredTools,
    activeGroupLabel,
    categories,
    featuredTools,
    handleCategorySelect,
    handleBack,
    handleSearchChange,
  };
}
