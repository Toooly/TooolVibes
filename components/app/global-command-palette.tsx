"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Search, Sparkles, Star, Table2, Workflow } from "lucide-react";
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
import { playTooolvibesSound } from "@/lib/config/sound";
import { usePublicToolCatalog } from "@/lib/data/public-tool-catalog-context";
import {
  resolveToolSearchEngine,
  searchToolsWithEngine,
} from "@/lib/search/tool-search-adapter";
import { MAX_COMPARE_TOOLS, useToolWorkspaceStore } from "@/lib/stores/tool-workspace-store";

/* ═══════════════════════════════════════════════════════════════
   GlobalCommandPalette (B31 / IA-504) — la ricerca tool usa lo
   stesso search service canonico dell'archivio: stessa query →
   stessi tool, e ogni query è raggiungibile anche come URL
   (/archivio?q=...) condivisibile e ripristinabile.
   Reversibilità: unifiedSearchEnabled=false riporta i risultati al
   motore legacy Fuse pre-B31 (adapter lib/search/tool-search-adapter).
   ═══════════════════════════════════════════════════════════════ */

const SEARCH_RESULTS_LIMIT = 8;

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
  const setCommandOpen = useToolWorkspaceStore((state) => state.setCommandOpen);
  const toggleSaved = useToolWorkspaceStore((state) => state.toggleSaved);
  const toggleCompare = useToolWorkspaceStore((state) => state.toggleCompare);
  const addToStack = useToolWorkspaceStore((state) => state.addToStack);

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

  function openTool(slug: string) {
    playTooolvibesSound("detail");
    router.push(`/toools/${slug}`);
    close();
  }

  function openArchiveSearch() {
    playTooolvibesSound("nav");
    router.push(serializeCatalogUrl({ query: trimmedQuery }));
    close();
  }

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
          searchResults.length > 0 ? (
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
          ) : null
        ) : (
          <>
            <CommandGroup heading="Navigazione">
              <CommandItem
                onSelect={() => {
                  playTooolvibesSound("nav");
                  router.push("/archivio");
                  close();
                }}
              >
                <Search className="size-4" />
                Apri catalogo tool
              </CommandItem>
              <CommandItem
                onSelect={() => {
                  playTooolvibesSound("nav");
                  router.push("/shortlist");
                  close();
                }}
              >
                <Star className="size-4" />
                Vai ai tool salvati
              </CommandItem>
              <CommandItem
                onSelect={() => {
                  playTooolvibesSound("nav");
                  router.push("/compare");
                  close();
                }}
              >
                <Table2 className="size-4" />
                Apri confronto
              </CommandItem>
              <CommandItem
                onSelect={() => {
                  playTooolvibesSound("nav");
                  router.push("/archivio#stack-builder");
                  close();
                }}
              >
                <Workflow className="size-4" />
                Apri la tua lista
              </CommandItem>
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
