"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  Bookmark,
  Clock3,
  Compass,
  House,
  Layers,
  Search,
  Settings,
  Sparkles,
  Star,
  Table2,
  Workflow,
} from "lucide-react";
import { toast } from "sonner";

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
import {
  WORKSPACE_VIEW_LABELS,
  workspaceViewHref,
} from "@/components/account/workspace/workspace-model";
import { playTooolvibesSound } from "@/lib/config/sound";
import { usePublicToolCatalog } from "@/lib/data/public-tool-catalog-context";
import { activePersonalStacks } from "@/lib/account/workspace-pipeline";
import {
  resolveToolSearchEngine,
  searchToolsWithEngine,
} from "@/lib/search/tool-search-adapter";
import {
  MAX_COMPARE_TOOLS,
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
  { href: workspaceViewHref("recenti"), label: WORKSPACE_VIEW_LABELS.recenti, icon: Clock3 },
  { href: workspaceViewHref("segnale"), label: WORKSPACE_VIEW_LABELS.segnale, icon: Compass },
  { href: "/account/settings", label: "Impostazioni", icon: Settings },
];

function matchesQuery(value: string, query: string) {
  return value.toLowerCase().includes(query.toLowerCase());
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
  const toggleSaved = useToolWorkspaceStore((state) => state.toggleSaved);
  const toggleCompare = useToolWorkspaceStore((state) => state.toggleCompare);
  const addToStack = useToolWorkspaceStore((state) => state.addToStack);
  const workspace = getCanonicalToolWorkspaceState();

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
              {savedMatches.length > 0 ? (
                <CommandGroup heading="Salvati">
                  {savedMatches.map((tool) => (
                    <CommandItem
                      key={`saved:${tool.slug}`}
                      value={`saved:${tool.slug}`}
                      onSelect={() => openTool(tool.slug)}
                    >
                      <Star className="size-4" />
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
                      onSelect={() => openPath(workspaceViewHref("stack"))}
                    >
                      <Layers className="size-4" />
                      <span>{stack.name}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ) : null}
              {searchResults.length > 0 ? (
                <CommandGroup heading={`Tool per “${trimmedQuery}”`}>
                  {searchResults.map((tool) => (
                    <CommandItem
                      key={tool.slug}
                      value={`tool:${tool.slug}`}
                      onSelect={() => openTool(tool.slug)}
                    >
                      <Sparkles className="size-4" />
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
            <CommandGroup heading="Navigazione">
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
                  openPath("/archivio#stack-builder");
                }}
              >
                <Workflow className="size-4" />
                Apri la tua lista
              </CommandItem>
              {WORKSPACE_DESTINATIONS.map((item) => {
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
            <CommandSeparator />
            <CommandGroup heading="Tool">
              {featuredTools.map((tool) => (
                <CommandItem
                  key={tool.slug}
                  value={`featured:${tool.slug}`}
                  onSelect={() => openTool(tool.slug)}
                >
                  <Sparkles className="size-4" />
                  <span>{tool.name}</span>
                  <span className="ml-auto text-xs text-[var(--muted)]">
                    {tool.levelLabel}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Azioni rapide">
              {tools.slice(0, 6).map((tool) => (
                <CommandItem
                  key={`save-${tool.slug}`}
                  value={`salva ${tool.name}`}
                  onSelect={() => {
                    const saved = toggleSaved(tool.slug);
                    toast.success(saved ? `${tool.name} salvato` : `${tool.name} rimosso`);
                    playTooolvibesSound(saved ? "success" : "update");
                    close();
                  }}
                >
                  Salva {tool.name}
                </CommandItem>
              ))}
              {tools.slice(0, 4).map((tool) => (
                <CommandItem
                  key={`compare-${tool.slug}`}
                  value={`compare ${tool.name}`}
                  onSelect={() => {
                    const result = toggleCompare(tool.slug);
                    if (result.limited) {
                      toast.warning(`Puoi confrontare fino a ${MAX_COMPARE_TOOLS} tool alla volta.`);
                      playTooolvibesSound("warning");
                    } else {
                      toast.success(
                        result.added
                          ? `${tool.name} aggiunto al confronto`
                          : `${tool.name} rimosso dal confronto`,
                      );
                      playTooolvibesSound(result.added ? "success" : "update");
                    }
                    close();
                  }}
                >
                  Aggiungi {tool.name} al confronto
                </CommandItem>
              ))}
              {tools.slice(0, 4).map((tool) => (
                <CommandItem
                  key={`stack-${tool.slug}`}
                  value={`lista ${tool.name}`}
                  onSelect={() => {
                    const added = addToStack(tool.slug);
                    toast.success(added ? `${tool.name} aggiunto alla lista` : "Già nella lista");
                    playTooolvibesSound(added ? "success" : "update");
                    close();
                  }}
                >
                  Inserisci {tool.name} nella lista
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
