"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  Bookmark,
  History,
  House,
  Layers,
  Radar,
  Search,
  Settings,
  Sparkles,
  Star,
  Table2,
  Workflow,
} from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { serializeCatalogUrl } from "@/components/directory/catalog/catalog-controller";
import { WorkspaceCatalogMark } from "@/components/account/workspace/workspace-tool-mark";
import {
  WORKSPACE_VIEW_LABELS,
  workspaceFocusHref,
  workspaceViewHref,
} from "@/components/account/workspace/workspace-model";
import { playTooolvibesSound } from "@/lib/config/sound";
import { useSignalProgressUiEnabled } from "@/lib/signal-progression/release-context";
import { usePublicToolCatalog } from "@/lib/data/public-tool-catalog-context";
import {
  activePersonalStacks,
  deriveResurfaceSignals,
} from "@/lib/account/workspace-pipeline";
import type { WorkspaceStateV1 } from "@/lib/discovery/types";
import {
  resolveToolSearchEngine,
  searchToolsWithEngine,
} from "@/lib/search/tool-search-adapter";
import {
  getCanonicalToolWorkspaceState,
  useToolWorkspaceStore,
} from "@/lib/stores/tool-workspace-store";

/* ═══════════════════════════════════════════════════════════════
   GlobalCommandPalette (B31 / IA-504) — la ricerca tool usa lo
   stesso search service canonico dell'archivio: stessa query →
   stessi tool, e ogni query è raggiungibile anche come URL
   (/archivio?q=...) condivisibile e ripristinabile.
   Reversibilità: unifiedSearchEnabled=false riporta i risultati al
   motore legacy Fuse pre-B31 (adapter lib/search/tool-search-adapter).
   ═══════════════════════════════════════════════════════════════ */

const SEARCH_RESULTS_LIMIT = 8;

const WORKSPACE_DESTINATIONS: Array<{
  href: string;
  label: string;
  icon: typeof House;
}> = [
  { href: workspaceViewHref("riprendi"), label: WORKSPACE_VIEW_LABELS.riprendi, icon: House },
  { href: workspaceViewHref("biblioteca"), label: WORKSPACE_VIEW_LABELS.biblioteca, icon: Bookmark },
  { href: workspaceViewHref("stack"), label: WORKSPACE_VIEW_LABELS.stack, icon: Layers },
  { href: workspaceViewHref("decisioni"), label: WORKSPACE_VIEW_LABELS.decisioni, icon: BookOpen },
  { href: workspaceViewHref("recenti"), label: WORKSPACE_VIEW_LABELS.recenti, icon: History },
  { href: workspaceViewHref("segnale"), label: WORKSPACE_VIEW_LABELS.segnale, icon: Sparkles },
  { href: "/radar", label: "Radar", icon: Radar },
  { href: "/account/settings", label: "Impostazioni", icon: Settings },
];

const EMPTY_PERSONAL_LIMIT = 3;
const QUERY_PERSONAL_LIMIT = 6;

function matchesQuery(value: string, query: string) {
  return value.toLowerCase().includes(query.toLowerCase());
}

function matchesKeyword(query: string, keywords: readonly string[]) {
  const normalized = query.toLowerCase();
  return keywords.some((keyword) => normalized.includes(keyword));
}

function catalogToolName(
  tools: readonly { slug: string; name: string }[],
  slug: string,
) {
  return tools.find((tool) => tool.slug === slug)?.name ?? slug;
}

function deferredDueSlugs(state: WorkspaceStateV1) {
  const slugs: string[] = [];
  const seen = new Set<string>();
  for (const signal of deriveResurfaceSignals(state)) {
    if (signal.kind !== "deferred_due" || !signal.slug || seen.has(signal.slug)) {
      continue;
    }
    seen.add(signal.slug);
    slugs.push(signal.slug);
  }
  return slugs;
}

function outcomeSlugs(
  state: WorkspaceStateV1,
  outcome: "selected" | "rejected" | "deferred",
) {
  return state.saved.slugs.filter(
    (slug) => state.toolStates[slug]?.decision?.outcome === outcome,
  );
}

function usingSlugs(state: WorkspaceStateV1) {
  return Object.entries(state.toolStates)
    .filter(([, tool]) => tool.usage === "using")
    .sort((left, right) =>
      (right[1].updatedAt ?? "").localeCompare(left[1].updatedAt ?? ""),
    )
    .map(([slug]) => slug);
}

export function GlobalCommandPalette({
  unifiedSearchEnabled = true,
}: {
  unifiedSearchEnabled?: boolean;
}) {
  const router = useRouter();
  const tools = usePublicToolCatalog();
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  const isOpen = useToolWorkspaceStore((state) => state.isCommandOpen);
  const savedSlugs = useToolWorkspaceStore((state) => state.savedSlugs);
  const setCommandOpen = useToolWorkspaceStore((state) => state.setCommandOpen);
  const workspace = getCanonicalToolWorkspaceState();
  const signalUi = useSignalProgressUiEnabled();
  const workspaceDestinations = useMemo(
    () =>
      WORKSPACE_DESTINATIONS.filter(
        (item) => item.href !== workspaceViewHref("segnale") || signalUi,
      ),
    [signalUi],
  );

  const trimmedQuery = query.trim();
  const searchEngine = resolveToolSearchEngine(unifiedSearchEnabled);
  const searchResults = useMemo(
    () =>
      searchToolsWithEngine(tools, trimmedQuery, searchEngine, {
        limit: SEARCH_RESULTS_LIMIT,
      }),
    [tools, trimmedQuery, searchEngine],
  );

  const featuredTools = useMemo(
    () => tools.filter((tool) => tool.featured || tool.toolOfWeek).slice(0, 8),
    [tools],
  );

  const savedMatches = useMemo(() => {
    if (!trimmedQuery) return [];
    const bySlug = new Map(tools.map((tool) => [tool.slug, tool]));
    return savedSlugs
      .map((slug) => {
        const tool = bySlug.get(slug);
        return {
          slug,
          name: tool?.name ?? slug,
          levelLabel: tool?.levelLabel ?? null,
        };
      })
      .filter(
        (item) =>
          matchesQuery(item.name, trimmedQuery) ||
          matchesQuery(item.slug, trimmedQuery),
      )
      .slice(0, SEARCH_RESULTS_LIMIT);
  }, [savedSlugs, tools, trimmedQuery]);

  const stackMatches = useMemo(() => {
    if (!trimmedQuery) return [];
    return activePersonalStacks(workspace)
      .filter((stack) => matchesQuery(stack.name, trimmedQuery))
      .slice(0, SEARCH_RESULTS_LIMIT);
  }, [trimmedQuery, workspace]);

  const personalAliasGroups = useMemo(() => {
    if (!trimmedQuery) return [];

    const groups: Array<{
      id: string;
      heading: string;
      items: Array<{ slug: string; name: string; href: string }>;
    }> = [];

    const pushGroup = (
      id: string,
      heading: string,
      slugs: string[],
      hrefFor: (slug: string) => string,
    ) => {
      const items = slugs.slice(0, QUERY_PERSONAL_LIMIT).map((slug) => ({
        slug,
        name: catalogToolName(tools, slug),
        href: hrefFor(slug),
      }));
      if (items.length === 0) return;
      groups.push({ id, heading, items });
    };

    if (matchesKeyword(trimmedQuery, ["da riprendere", "riprendi"])) {
      pushGroup(
        "deferred_due",
        "Da riprendere",
        deferredDueSlugs(workspace),
        (slug) => workspaceFocusHref("decisioni", slug),
      );
    }
    if (matchesKeyword(trimmedQuery, ["rimandati", "rimanda"])) {
      pushGroup(
        "deferred",
        "Rimandati",
        outcomeSlugs(workspace, "deferred"),
        (slug) => workspaceFocusHref("decisioni", slug),
      );
    }
    if (matchesKeyword(trimmedQuery, ["scartati", "scarto"])) {
      pushGroup(
        "rejected",
        "Scartati",
        outcomeSlugs(workspace, "rejected"),
        (slug) => workspaceFocusHref("decisioni", slug),
      );
    }
    if (matchesKeyword(trimmedQuery, ["in uso", "usando"])) {
      pushGroup(
        "using",
        "In uso",
        usingSlugs(workspace),
        (slug) => `/toools/${slug}`,
      );
    }
    if (matchesKeyword(trimmedQuery, ["scelti"])) {
      pushGroup(
        "selected",
        "Scelti",
        outcomeSlugs(workspace, "selected"),
        (slug) => workspaceFocusHref("decisioni", slug),
      );
    }

    return groups;
  }, [tools, trimmedQuery, workspace]);

  const emptyPersonalItems = useMemo(() => {
    if (trimmedQuery) return [];
    const due = deferredDueSlugs(workspace)
      .slice(0, EMPTY_PERSONAL_LIMIT)
      .map((slug) => ({
        key: `empty:due:${slug}`,
        slug,
        name: catalogToolName(tools, slug),
        href: workspaceFocusHref("decisioni", slug),
        meta: "Da riprendere",
        sound: "nav" as const,
      }));
    const using = usingSlugs(workspace)
      .slice(0, EMPTY_PERSONAL_LIMIT)
      .map((slug) => ({
        key: `empty:using:${slug}`,
        slug,
        name: catalogToolName(tools, slug),
        href: `/toools/${slug}`,
        meta: "In uso",
        sound: "detail" as const,
      }));
    return [...due, ...using];
  }, [tools, trimmedQuery, workspace]);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
    }
  }, [isOpen]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        playTooolvibesSound(isOpen ? "close" : "search");
        setCommandOpen(!isOpen);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, setCommandOpen]);

  if (!mounted) {
    return null;
  }

  function close() {
    setCommandOpen(false);
  }

  function openPath(href: string, sound: "nav" | "detail" = "nav") {
    playTooolvibesSound(sound);
    router.push(href);
    close();
  }

  function openTool(slug: string) {
    openPath(`/toools/${slug}`, "detail");
  }

  function openArchiveSearch() {
    openPath(serializeCatalogUrl({ query: trimmedQuery }));
  }

  const hasQueryResults =
    savedMatches.length > 0 ||
    stackMatches.length > 0 ||
    personalAliasGroups.length > 0 ||
    searchResults.length > 0;

  return (
    <CommandDialog open={isOpen} onOpenChange={setCommandOpen} shouldFilter={false}>
      <CommandInput
        placeholder="Cerca tool, azioni o sezioni..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>Nessun risultato. Prova con categoria, nome o caso d’uso.</CommandEmpty>
        {trimmedQuery ? (
          hasQueryResults ? (
            <>
              {personalAliasGroups.map((group) => (
                <CommandGroup key={`personal:${group.id}`} heading={group.heading}>
                  {group.items.map((item) => (
                    <CommandItem
                      key={`${group.id}:${item.slug}`}
                      value={`personal:${group.id}:${item.slug}`}
                      onSelect={() =>
                        openPath(
                          item.href,
                          item.href.startsWith("/toools/") ? "detail" : "nav",
                        )
                      }
                    >
                      <Bookmark className="size-4" />
                      <span>{item.name}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
              {savedMatches.length > 0 ? (
                <CommandGroup heading="Salvati">
                  {savedMatches.map((tool) => (
                    <CommandItem
                      key={`saved:${tool.slug}`}
                      value={`saved:${tool.slug}`}
                      onSelect={() => openTool(tool.slug)}
                    >
                      <WorkspaceCatalogMark catalog={tools} slug={tool.slug} size="xs" />
                      <span>{tool.name}</span>
                      {tool.levelLabel ? (
                        <span className="ml-auto text-xs text-[var(--muted)]">
                          {tool.levelLabel}
                        </span>
                      ) : null}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ) : null}
              {stackMatches.length > 0 ? (
                <CommandGroup heading="Stack">
                  {stackMatches.map((stack) => (
                    <CommandItem
                      key={`stack:${stack.id}`}
                      value={`stack:${stack.id}`}
                      onSelect={() => openPath(workspaceViewHref("stack", { stack: stack.id }))}
                    >
                      <Layers className="size-4" />
                      <span>{stack.name}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ) : null}
              {searchResults.length > 0 ? (
                <CommandGroup heading="Catalogo">
                  {searchResults.map((tool) => (
                    <CommandItem
                      key={tool.slug}
                      value={`tool:${tool.slug}`}
                      onSelect={() => openTool(tool.slug)}
                    >
                      <WorkspaceCatalogMark catalog={tools} slug={tool.slug} size="xs" />
                      <span>{tool.name}</span>
                      <span className="ml-auto text-xs text-[var(--muted)]">
                        {tool.levelLabel}
                      </span>
                    </CommandItem>
                  ))}
                  <CommandItem value="archive:query" onSelect={openArchiveSearch}>
                    <Search className="size-4" />
                    <span>Cerca “{trimmedQuery}” nell’archivio</span>
                    <ArrowRight className="ml-auto size-3.5 text-[var(--muted)]" />
                  </CommandItem>
                </CommandGroup>
              ) : null}
            </>
          ) : null
        ) : (
          <>
            <CommandGroup heading="Il tuo Tooolbox">
              <CommandItem
                onSelect={() => {
                  openPath("/archivio");
                }}
              >
                <Search className="size-4" />
                Apri catalogo tool
              </CommandItem>
              <CommandItem
                onSelect={() => {
                  openPath(workspaceViewHref("biblioteca"));
                }}
              >
                <Star className="size-4" />
                Vai ai tool salvati
              </CommandItem>
              <CommandItem
                onSelect={() => {
                  openPath("/compare");
                }}
              >
                <Table2 className="size-4" />
                Apri confronto
              </CommandItem>
              <CommandItem
                onSelect={() => {
                  openPath(workspaceViewHref("stack"));
                }}
              >
                <Workflow className="size-4" />
                Apri i tuoi stack
              </CommandItem>
              {workspaceDestinations.map((item) => {
                const Icon = item.icon;
                return (
                  <CommandItem
                    key={item.href}
                    value={`workspace:${item.href}`}
                    onSelect={() => openPath(item.href)}
                  >
                    <Icon className="size-4" />
                    {item.label}
                  </CommandItem>
                );
              })}
            </CommandGroup>
            {emptyPersonalItems.length > 0 ? (
              <>
                <CommandSeparator />
                <CommandGroup heading="Decisioni / Da riprendere">
                  {emptyPersonalItems.map((item) => (
                    <CommandItem
                      key={item.key}
                      value={item.key}
                      onSelect={() => openPath(item.href, item.sound)}
                    >
                      <Bookmark className="size-4" />
                      <span>{item.name}</span>
                      <span className="ml-auto text-xs text-[var(--muted)]">
                        {item.meta}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            ) : null}
            <CommandSeparator />
            <CommandGroup heading="Catalogo">
              {featuredTools.map((tool) => (
                <CommandItem
                  key={tool.slug}
                  value={`featured:${tool.slug}`}
                  onSelect={() => openTool(tool.slug)}
                >
                  <WorkspaceCatalogMark catalog={tools} slug={tool.slug} size="xs" />
                  <span>{tool.name}</span>
                  <span className="ml-auto text-xs text-[var(--muted)]">
                    {tool.levelLabel}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
