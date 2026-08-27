"use client";

import { useEffect, useMemo, useState, type ComponentType } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Bookmark,
  House,
  Layers,
  Radar,
  Search,
  Settings,
  Table2,
} from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { serializeCatalogUrl } from "@/components/directory/catalog/catalog-controller";
import { WorkspaceCatalogMark } from "@/components/account/workspace/workspace-tool-mark";
import {
  salvatiHref,
  workspaceFocusHref,
  workspaceViewHref,
} from "@/components/account/workspace/workspace-model";
import { playTooolvibesSound } from "@/lib/config/sound";
import { usePublicToolCatalog } from "@/lib/data/public-tool-catalog-context";
import {
  activePersonalStacks,
  deriveResurfaceSignals,
} from "@/lib/account/workspace-pipeline";
import { getActiveWorkspaceOwner } from "@/lib/discovery/workspace-owner-storage";
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
   GlobalCommandPalette (B31 / IA-504 / WAVE 12) — Trova / Vai / Fai.
   La ricerca tool usa lo stesso search service canonico dell'archivio:
   stessa query → stessi tool, e ogni query è raggiungibile anche come
   URL (/archivio?q=...) condivisibile e ripristinabile.
   Reversibilità: unifiedSearchEnabled=false riporta i risultati al
   motore legacy Fuse pre-B31 (adapter lib/search/tool-search-adapter).
   ═══════════════════════════════════════════════════════════════ */

const SEARCH_RESULTS_LIMIT = 8;
const EMPTY_PERSONAL_LIMIT = 3;
const QUERY_PERSONAL_LIMIT = 6;

type LucideIcon = ComponentType<{ className?: string }>;

type PaletteItem = {
  key: string;
  value: string;
  label: string;
  href: string;
  sound: "nav" | "detail";
  icon?: LucideIcon;
  markSlug?: string;
  meta?: string;
  trailingArrow?: boolean;
};

function matchesQuery(value: string, query: string) {
  return value.toLowerCase().includes(query.toLowerCase());
}

function matchesKeyword(query: string, keywords: readonly string[]) {
  const normalized = query.toLowerCase();
  return keywords.some((keyword) => normalized.includes(keyword));
}

function matchesDestQuery(query: string, matchValues: readonly string[]) {
  return matchValues.some((value) => matchesQuery(value, query));
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

function vaiDestinations(authenticated: boolean) {
  return [
    {
      id: "home",
      label: "Home",
      href: workspaceViewHref("riprendi"),
      icon: House,
      matchValues: ["home", "riprendi"],
      authOnly: true,
    },
    {
      id: "salvati",
      label: "Salvati",
      href: salvatiHref(authenticated),
      icon: Bookmark,
      matchValues: ["salvati"],
      authOnly: false,
    },
    {
      id: "stack",
      label: "Stack",
      href: workspaceViewHref("stack"),
      icon: Layers,
      matchValues: ["stack"],
      authOnly: true,
    },
    {
      id: "catalogo",
      label: "Catalogo",
      href: "/archivio",
      icon: Search,
      matchValues: ["catalogo", "archivio"],
      authOnly: false,
    },
    {
      id: "radar",
      label: "Catalogo · Radar",
      href: "/radar",
      icon: Radar,
      matchValues: ["radar"],
      authOnly: false,
    },
    {
      id: "impostazioni",
      label: "Impostazioni",
      href: "/account/settings",
      icon: Settings,
      matchValues: ["impostazioni", "settings"],
      authOnly: true,
    },
  ].filter((dest) => authenticated || !dest.authOnly);
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
  const compareSlugs = useToolWorkspaceStore((state) => state.compareSlugs);
  const setCommandOpen = useToolWorkspaceStore((state) => state.setCommandOpen);
  const workspace = getCanonicalToolWorkspaceState();
  const authenticated = getActiveWorkspaceOwner().kind === "account";

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

  const personalAliasItems = useMemo(() => {
    if (!trimmedQuery) return [];

    const items: PaletteItem[] = [];
    const seen = new Set<string>();

    const pushGroup = (
      id: string,
      heading: string,
      slugs: string[],
      hrefFor: (slug: string) => string,
    ) => {
      for (const slug of slugs.slice(0, QUERY_PERSONAL_LIMIT)) {
        const key = `personal:${id}:${slug}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const href = hrefFor(slug);
        items.push({
          key,
          value: key,
          label: catalogToolName(tools, slug),
          href,
          sound: href.startsWith("/toools/") ? "detail" : "nav",
          icon: Bookmark,
          meta: heading,
        });
      }
    };

    if (matchesKeyword(trimmedQuery, ["da riprendere", "riprendi"])) {
      pushGroup(
        "deferred_due",
        "Da riprendere",
        deferredDueSlugs(workspace),
        (slug) => workspaceFocusHref("salvati", slug),
      );
    }
    if (matchesKeyword(trimmedQuery, ["rimandati", "rimanda"])) {
      pushGroup(
        "deferred",
        "Rimandati",
        outcomeSlugs(workspace, "deferred"),
        (slug) => workspaceFocusHref("salvati", slug),
      );
    }
    if (matchesKeyword(trimmedQuery, ["scartati", "scarto"])) {
      pushGroup(
        "rejected",
        "Scartati",
        outcomeSlugs(workspace, "rejected"),
        (slug) => workspaceFocusHref("salvati", slug),
      );
    }
    if (matchesKeyword(trimmedQuery, ["in uso", "usando"])) {
      pushGroup("using", "In uso", usingSlugs(workspace), (slug) => `/toools/${slug}`);
    }
    if (matchesKeyword(trimmedQuery, ["scelti"])) {
      pushGroup(
        "selected",
        "Scelti",
        outcomeSlugs(workspace, "selected"),
        (slug) => workspaceFocusHref("salvati", slug),
      );
    }

    return items;
  }, [tools, trimmedQuery, workspace]);

  const emptyTrovaItems = useMemo(() => {
    if (trimmedQuery) return [];
    const seen = new Set<string>();
    const items: PaletteItem[] = [];

    const push = (item: PaletteItem) => {
      const slug = item.markSlug ?? item.key;
      if (seen.has(slug)) return;
      seen.add(slug);
      items.push(item);
    };

    for (const slug of deferredDueSlugs(workspace).slice(0, EMPTY_PERSONAL_LIMIT)) {
      push({
        key: `empty:due:${slug}`,
        value: `empty:due:${slug}`,
        label: catalogToolName(tools, slug),
        href: workspaceFocusHref("salvati", slug),
        sound: "nav",
        icon: Bookmark,
        markSlug: slug,
        meta: "Da riprendere",
      });
    }
    for (const slug of usingSlugs(workspace).slice(0, EMPTY_PERSONAL_LIMIT)) {
      push({
        key: `empty:using:${slug}`,
        value: `empty:using:${slug}`,
        label: catalogToolName(tools, slug),
        href: `/toools/${slug}`,
        sound: "detail",
        icon: Bookmark,
        markSlug: slug,
        meta: "In uso",
      });
    }
    for (const tool of featuredTools) {
      push({
        key: `featured:${tool.slug}`,
        value: `featured:${tool.slug}`,
        label: tool.name,
        href: `/toools/${tool.slug}`,
        sound: "detail",
        markSlug: tool.slug,
        meta: tool.levelLabel ?? undefined,
      });
    }
    return items;
  }, [featuredTools, tools, trimmedQuery, workspace]);

  const vaiItems = useMemo(() => {
    const dests = vaiDestinations(authenticated);
    const visible = trimmedQuery
      ? dests.filter((dest) => matchesDestQuery(trimmedQuery, dest.matchValues))
      : dests;
    return visible.map((dest) => ({
      key: `vai:${dest.id}`,
      value: `vai:${dest.id}`,
      label: dest.label,
      href: dest.href,
      sound: "nav" as const,
      icon: dest.icon,
    }));
  }, [authenticated, trimmedQuery]);

  const faiItems = useMemo(() => {
    if (compareSlugs.length < 1) return [];
    const item: PaletteItem = {
      key: "fai:confronta",
      value: "fai:confronta",
      label: "Apri confronto",
      href: "/compare",
      sound: "nav",
      icon: Table2,
    };
    if (!trimmedQuery) return [item];
    return matchesDestQuery(trimmedQuery, ["confronto", "confronta", "compare"])
      ? [item]
      : [];
  }, [compareSlugs.length, trimmedQuery]);

  const queryTrovaItems = useMemo(() => {
    if (!trimmedQuery) return [];
    const items: PaletteItem[] = [...personalAliasItems];

    for (const tool of savedMatches) {
      items.push({
        key: `saved:${tool.slug}`,
        value: `saved:${tool.slug}`,
        label: tool.name,
        href: `/toools/${tool.slug}`,
        sound: "detail",
        markSlug: tool.slug,
        meta: tool.levelLabel ?? undefined,
      });
    }
    for (const stack of stackMatches) {
      items.push({
        key: `stack:${stack.id}`,
        value: `stack:${stack.id}`,
        label: stack.name,
        href: workspaceViewHref("stack", { stack: stack.id }),
        sound: "nav",
        icon: Layers,
      });
    }
    for (const tool of searchResults) {
      items.push({
        key: `tool:${tool.slug}`,
        value: `tool:${tool.slug}`,
        label: tool.name,
        href: `/toools/${tool.slug}`,
        sound: "detail",
        markSlug: tool.slug,
        meta: tool.levelLabel ?? undefined,
      });
    }
    if (searchResults.length > 0) {
      items.push({
        key: "archive:query",
        value: "archive:query",
        label: `Cerca “${trimmedQuery}” nell’archivio`,
        href: serializeCatalogUrl({ query: trimmedQuery }),
        sound: "nav",
        icon: Search,
        trailingArrow: true,
      });
    }
    return items;
  }, [
    personalAliasItems,
    savedMatches,
    searchResults,
    stackMatches,
    trimmedQuery,
  ]);

  const trovaItems = trimmedQuery ? queryTrovaItems : emptyTrovaItems;

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

  function renderItems(items: PaletteItem[]) {
    return items.map((item) => {
      const Icon = item.icon;
      return (
        <CommandItem
          key={item.key}
          value={item.value}
          onSelect={() => openPath(item.href, item.sound)}
        >
          {item.markSlug ? (
            <WorkspaceCatalogMark catalog={tools} slug={item.markSlug} size="xs" />
          ) : Icon ? (
            <Icon className="size-4" />
          ) : null}
          <span>{item.label}</span>
          {item.meta ? (
            <span className="ml-auto text-xs text-[var(--muted)]">{item.meta}</span>
          ) : item.trailingArrow ? (
            <ArrowRight className="ml-auto size-3.5 text-[var(--muted)]" />
          ) : null}
        </CommandItem>
      );
    });
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
        {trovaItems.length > 0 ? (
          <CommandGroup heading="Trova">{renderItems(trovaItems)}</CommandGroup>
        ) : null}
        {vaiItems.length > 0 ? (
          <CommandGroup heading="Vai">{renderItems(vaiItems)}</CommandGroup>
        ) : null}
        {faiItems.length > 0 ? (
          <CommandGroup heading="Fai">{renderItems(faiItems)}</CommandGroup>
        ) : null}
      </CommandList>
    </CommandDialog>
  );
}
