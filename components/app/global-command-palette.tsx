"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Sparkles, Star, Table2, Workflow } from "lucide-react";
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
import { playTooolvibesSound } from "@/lib/config/sound";
import { usePublicToolCatalog } from "@/lib/data/public-tool-catalog-context";
import { MAX_COMPARE_TOOLS, useToolWorkspaceStore } from "@/lib/stores/tool-workspace-store";

export function GlobalCommandPalette() {
  const router = useRouter();
  const tools = usePublicToolCatalog();
  const [mounted, setMounted] = useState(false);
  const isOpen = useToolWorkspaceStore((state) => state.isCommandOpen);
  const setCommandOpen = useToolWorkspaceStore((state) => state.setCommandOpen);
  const setSelectedSlug = useToolWorkspaceStore((state) => state.setSelectedSlug);
  const toggleSaved = useToolWorkspaceStore((state) => state.toggleSaved);
  const toggleCompare = useToolWorkspaceStore((state) => state.toggleCompare);
  const addToStack = useToolWorkspaceStore((state) => state.addToStack);

  const featuredTools = useMemo(
    () => tools.filter((tool) => tool.featured || tool.toolOfWeek).slice(0, 8),
    [tools],
  );

  useEffect(() => setMounted(true), []);

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

  return (
    <CommandDialog open={isOpen} onOpenChange={setCommandOpen}>
      <CommandInput placeholder="Cerca tool, azioni o sezioni..." />
      <CommandList>
        <CommandEmpty>Nessun risultato. Prova con categoria, nome o caso d’uso.</CommandEmpty>
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
              value={`${tool.name} ${tool.categoryLabel} ${tool.tags.join(" ")}`}
              onSelect={() => {
                setSelectedSlug(tool.slug);
                playTooolvibesSound("detail");
                router.push(`/archivio?tool=${tool.slug}`);
                close();
              }}
            >
              <Sparkles className="size-4" />
              <span>{tool.name}</span>
              <span className="ml-auto text-xs text-[var(--muted)]">{tool.levelLabel}</span>
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
      </CommandList>
    </CommandDialog>
  );
}
