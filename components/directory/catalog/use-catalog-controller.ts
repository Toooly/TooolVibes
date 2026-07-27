"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { ToolPublicView } from "@/lib/data/tool-public-view";
import { resolveToolSearchEngine } from "@/lib/search/tool-search-adapter";
import {
  buildCatalogGroupUrl,
  CATALOG_ALL_TOOLS_URL,
  createCatalogSearchIndex,
  filterCatalogTools,
  parseCatalogLevelParam,
  resolveActiveGroupLabel,
  resolveCatalogGroupParam,
  resolveFeaturedTools,
  resolveInitialActiveGroup,
  resolveInitialCatalogView,
  serializeCatalogUrl,
  summarizeCatalogCategories,
  type CatalogCategorySummary,
  type CatalogLevelFilter,
  type CatalogUrlState,
  type CatalogView,
} from "./catalog-controller";

/* ═══════════════════════════════════════════════════════════════
   useCatalogController — query/filter/URL state controller hook.
   Owns view/group/search/level/panel state, router pushes and the
   derived collections. Behavior-preserving extraction (B25).

   B31 (IA-504): with `unifiedSearchEnabled` (release flag
   TOOOLVIBES_UNIFIED_SEARCH_ENABLED, default ON) the URL becomes the
   source of truth for q/group/tag/level: typing serializes into the
   URL (replace), category/back navigate (push) and back/forward or
   deep links restore the controller state via useSearchParams. With
   the flag OFF the hook behaves exactly as the pre-B31 extraction
   (legacy Fuse engine, no URL sync).
   ═══════════════════════════════════════════════════════════════ */

export type CatalogPanel = "search" | "filters";

export type CatalogControllerInput = {
  tools: ToolPublicView[];
  filterGroups: { key: string; label: string }[];
  initialQuery?: string;
  initialGroup?: string;
  initialTag?: string;
  initialLevel?: CatalogLevelFilter;
  unifiedSearchEnabled?: boolean;
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

const URL_KEY_SEPARATOR = "";

function buildUrlKey(state: {
  group: string;
  query: string;
  tag: string;
  level: CatalogLevelFilter;
}): string {
  return [
    state.group,
    state.query,
    state.tag,
    state.level,
  ].join(URL_KEY_SEPARATOR);
}

export function useCatalogController({
  tools,
  filterGroups,
  initialQuery = "",
  initialGroup = "all",
  initialTag = "",
  initialLevel = "all",
  unifiedSearchEnabled = true,
}: CatalogControllerInput): CatalogController {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchEngine = resolveToolSearchEngine(unifiedSearchEnabled);

  const [view, setView] = useState<CatalogView>(() =>
    resolveInitialCatalogView(initialGroup, initialQuery),
  );
  const [activeGroup, setActiveGroup] = useState<string | null>(() =>
    resolveInitialActiveGroup(initialGroup),
  );
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [activeTag, setActiveTag] = useState(initialTag);
  const [activeLevel, setActiveLevel] = useState<CatalogLevelFilter>(initialLevel);
  const [openPanel, setOpenPanel] = useState<CatalogPanel | null>(null);

  /* URL → state sync (B31). lastAppliedUrlKeyRef skips the mount run
     (server props already match the URL); lastWrittenUrlKeyRef marks
     our own writes so their echo cannot overwrite newer keystrokes
     while a navigation is in flight. */
  const urlGroup = searchParams?.get("group") ?? "all";
  const urlQuery = searchParams?.get("q") ?? "";
  const urlTag = searchParams?.get("tag") ?? "";
  const urlLevel = parseCatalogLevelParam(searchParams?.get("level"));
  const urlKey = buildUrlKey({
    group: urlGroup,
    query: urlQuery,
    tag: urlTag,
    level: urlLevel,
  });
  const lastAppliedUrlKeyRef = useRef(urlKey);
  const lastWrittenUrlKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!unifiedSearchEnabled) return;
    if (urlKey === lastAppliedUrlKeyRef.current) return;
    lastAppliedUrlKeyRef.current = urlKey;
    if (urlKey === lastWrittenUrlKeyRef.current) return;
    lastWrittenUrlKeyRef.current = null;
    const group = resolveCatalogGroupParam(filterGroups, urlGroup);
    setSearchQuery(urlQuery);
    setActiveGroup(resolveInitialActiveGroup(group));
    setActiveTag(urlTag);
    setActiveLevel(urlLevel);
    setView(resolveInitialCatalogView(group, urlQuery));
  }, [
    unifiedSearchEnabled,
    urlKey,
    urlGroup,
    urlQuery,
    urlTag,
    urlLevel,
    filterGroups,
  ]);

  const writeUrl = useCallback(
    (next: CatalogUrlState, mode: "push" | "replace") => {
      const trimmedQuery = next.query?.trim() ?? "";
      lastWrittenUrlKeyRef.current = buildUrlKey({
        group:
          next.group && next.group !== "all"
            ? next.group
            : "all",
        query: trimmedQuery,
        tag: next.tag ?? "",
        level: next.level ?? "all",
      });
      const url = serializeCatalogUrl(next);
      if (mode === "push") {
        router.push(url, { scroll: false });
      } else {
        router.replace(url, { scroll: false });
      }
    },
    [router],
  );

  const searchIndex = useMemo(
    () =>
      searchEngine === "legacy-fuse" ? createCatalogSearchIndex(tools) : null,
    [tools, searchEngine],
  );

  const effectiveTag = unifiedSearchEnabled ? activeTag : initialTag;

  const filteredTools = useMemo(
    () =>
      filterCatalogTools({
        tools,
        searchIndex,
        activeGroup,
        tag: effectiveTag,
        searchQuery,
        activeLevel,
        searchEngine,
      }),
    [
      tools,
      activeGroup,
      effectiveTag,
      searchQuery,
      searchIndex,
      activeLevel,
      searchEngine,
    ],
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
      if (unifiedSearchEnabled) {
        writeUrl(
          {
            query: searchQuery,
            group: groupKey,
            tag: activeTag,
            level: activeLevel,
          },
          "push",
        );
      } else {
        router.push(buildCatalogGroupUrl(groupKey), { scroll: false });
      }
    },
    [
      router,
      unifiedSearchEnabled,
      writeUrl,
      searchQuery,
      activeTag,
      activeLevel,
    ],
  );

  const handleBack = useCallback(() => {
    setView("categories");
    setActiveGroup(null);
    setSearchQuery("");
    if (unifiedSearchEnabled) {
      writeUrl(
        { query: "", group: null, tag: activeTag, level: activeLevel },
        "push",
      );
    } else {
      router.push(CATALOG_ALL_TOOLS_URL, { scroll: false });
    }
  }, [router, unifiedSearchEnabled, writeUrl, activeTag, activeLevel]);

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchQuery(value);
      if (value.trim() && view === "categories") {
        setView("tools");
      }
      if (unifiedSearchEnabled) {
        writeUrl(
          { query: value, group: activeGroup, tag: activeTag, level: activeLevel },
          "replace",
        );
      }
    },
    [view, unifiedSearchEnabled, writeUrl, activeGroup, activeTag, activeLevel],
  );

  const handleLevelSelect = useCallback(
    (level: CatalogLevelFilter) => {
      setActiveLevel(level);
      if (unifiedSearchEnabled) {
        writeUrl(
          { query: searchQuery, group: activeGroup, tag: activeTag, level },
          "replace",
        );
      }
    },
    [unifiedSearchEnabled, writeUrl, searchQuery, activeGroup, activeTag],
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
    setActiveLevel: handleLevelSelect,
    filteredTools,
    activeGroupLabel,
    categories,
    featuredTools,
    handleCategorySelect,
    handleBack,
    handleSearchChange,
  };
}
