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
import { directoryTools } from "@/lib/data/tooolvibes-directory";
import { MAX_COMPARE_TOOLS, useToolWorkspaceStore } from "@/lib/stores/tool-workspace-store";

export function GlobalCommandPalette() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const isOpen = useToolWorkspaceStore((state) => state.isCommandOpen);
  const setCommandOpen = useToolWorkspaceStore((state) => state.setCommandOpen);
  const setSelectedSlug = useToolWorkspaceStore((state) => state.setSelectedSlug);
  const toggleSaved = useToolWorkspaceStore((state) => state.toggleSaved);
  const toggleCompare = useToolWorkspaceStore((state) => state.toggleCompare);
  const addToStack = useToolWorkspaceStore((state) => state.addToStack);

  const featuredTools = useMemo(
    () => directoryTools.filter((tool) => tool.featured || tool.toolOfWeek).slice(0, 8),
    [],
  );

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
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
        <CommandEmpty>Nessun risultato. Prova con categoria, nome o use case.</CommandEmpty>
        <CommandGroup heading="Navigazione">
          <CommandItem
            onSelect={() => {
              router.push("/archivio");
              close();
            }}
          >
            <Search className="size-4" />
            Apri catalogo tool
          </CommandItem>
          <CommandItem
            onSelect={() => {
              router.push("/shortlist");
              close();
            }}
          >
            <Star className="size-4" />
            Vai ai tool salvati
          </CommandItem>
          <CommandItem
            onSelect={() => {
              router.push("/compare");
              close();
            }}
          >
            <Table2 className="size-4" />
            Apri confronto
          </CommandItem>
          <CommandItem
            onSelect={() => {
              router.push("/archivio#stack-builder");
              close();
            }}
          >
            <Workflow className="size-4" />
            Apri il tuo stack
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
          {directoryTools.slice(0, 6).map((tool) => (
            <CommandItem
              key={`save-${tool.slug}`}
              value={`salva ${tool.name}`}
              onSelect={() => {
                const saved = toggleSaved(tool.slug);
                toast.success(saved ? `${tool.name} salvato` : `${tool.name} rimosso`);
                close();
              }}
            >
              Salva {tool.name}
            </CommandItem>
          ))}
          {directoryTools.slice(0, 4).map((tool) => (
            <CommandItem
              key={`compare-${tool.slug}`}
              value={`compare ${tool.name}`}
              onSelect={() => {
                const result = toggleCompare(tool.slug);
                if (result.limited) {
                  toast.warning(`Puoi confrontare fino a ${MAX_COMPARE_TOOLS} tool alla volta.`);
                } else {
                  toast.success(
                    result.added
                      ? `${tool.name} aggiunto al confronto`
                      : `${tool.name} rimosso dal confronto`,
                  );
                }
                close();
              }}
            >
              Aggiungi {tool.name} al confronto
            </CommandItem>
          ))}
          {directoryTools.slice(0, 4).map((tool) => (
            <CommandItem
              key={`stack-${tool.slug}`}
              value={`stack ${tool.name}`}
              onSelect={() => {
                const added = addToStack(tool.slug);
                toast.success(added ? `${tool.name} aggiunto allo stack` : "Già nello stack");
                close();
              }}
            >
              Inserisci {tool.name} nello stack
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
