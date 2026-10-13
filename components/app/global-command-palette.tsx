"use client";

import { useLocale } from "@/components/i18n/locale-provider";
import { LocalizedText, LocalizedAttributes } from "@/components/i18n/localized-text";
import { useEffect, useMemo, useState, type ComponentType } from "react";
import { useRouter } from "next/navigation";
import { navigateSite } from "@/lib/shell/document-navigation";
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
import { activePersonalStacks } from "@/lib/account/workspace-pipeline";
import { getActiveWorkspaceOwner } from "@/lib/discovery/workspace-owner-storage";
import { isSafeReturnTo } from "@/lib/auth/pending-auth-intent";
import {
  parsePersonalSearchQuery,
  personalSearchEmptyMessage,
} from "@/lib/search/personal-search-query";
import {
  searchPersonal,
  buildWorkspaceSearchIndex,
} from "@/lib/search/personal-search";
import { queueSearchPersonalGate } from "@/lib/search/personal-search-gate";
import {
  subscribePersonalSearchResume,
  takePersonalSearchResume,
} from "@/lib/search/personal-search-resume";
import {
  resolveToolSearchEngine,
  searchToolsWithEngine,
} from "@/lib/search/tool-search-adapter";
import {
  getCanonicalToolWorkspaceState,
  useToolWorkspaceStore,
} from "@/lib/stores/tool-workspace-store";

const SEARCH_RESULTS_LIMIT = 8;
const EMPTY_PERSONAL_LIMIT = 3;

type LucideIcon = ComponentType<{ className?: string }>;

type PaletteItem = {
  key: string;
  value: string;
  label: string;
  href?: string;
  fillQuery?: string;
  gateQuery?: string;
  sound: "nav" | "detail";
  icon?: LucideIcon;
  markSlug?: string;
  meta?: string;
  trailingArrow?: boolean;
};

function matchesQuery(value: string, query: string) {
  return value.toLowerCase().includes(query.toLowerCase());
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

function currentSafePath() {
  if (typeof window === "undefined") return "/";
  const path = window.location.pathname || "/";
  return isSafeReturnTo(path) ? path : "/";
}

const SUGGESTIONS: { label: string; query: string }[] = [
  { label: "I miei tool in uso", query: "usage:using" },
  { label: "Da rivedere", query: "revisit:due" },
  { label: "Con note", query: "note:yes" },
  { label: "Scartati", query: "status:scartati" },
];

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
  const parsedQuery = useMemo(
    () => parsePersonalSearchQuery(trimmedQuery),
    [trimmedQuery],
  );
  const { t, locale } = useLocale();
  const searchDocuments = useMemo(() => locale === "en" ? tools.map((tool) => ({ ...tool, categoryLabel: `${tool.categoryLabel} ${t(tool.categoryLabel)}`, shortDescription: `${tool.shortDescription} ${t(tool.shortDescription)}`, tags: [...tool.tags, ...tool.tags.map(t)] })) : tools, [tools, t, locale]);
  const searchEngine = resolveToolSearchEngine(unifiedSearchEnabled);
  const catalogQuery = parsedQuery.personal ? parsedQuery.text : trimmedQuery;
  const searchResults = useMemo(
    () =>
      catalogQuery
        ? searchToolsWithEngine(searchDocuments, catalogQuery, searchEngine, {
            limit: SEARCH_RESULTS_LIMIT,
          }).map((result) => tools.find((tool) => tool.slug === result.slug) ?? result)
        : [],
    [tools, searchDocuments, catalogQuery, searchEngine],
  );

  const featuredTools = useMemo(
    () => tools.filter((tool) => tool.featured || tool.toolOfWeek).slice(0, 8),
    [tools],
  );

  const savedMatches = useMemo(() => {
    if (!trimmedQuery || parsedQuery.personal) return [];
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
  }, [parsedQuery.personal, savedSlugs, tools, trimmedQuery]);

  const stackMatches = useMemo(() => {
    if (!trimmedQuery || parsedQuery.personal) return [];
    if (!authenticated) return [];
    return activePersonalStacks(workspace)
      .filter((stack) => matchesQuery(stack.name, trimmedQuery))
      .slice(0, SEARCH_RESULTS_LIMIT);
  }, [authenticated, parsedQuery.personal, trimmedQuery, workspace]);

  const personalHits = useMemo(() => {
    if (!trimmedQuery || !parsedQuery.personal || !authenticated) return [];
    const index = buildWorkspaceSearchIndex(workspace);
    return searchPersonal({
      query: parsedQuery,
      catalog: tools,
      state: workspace,
      index,
      limit: SEARCH_RESULTS_LIMIT,
    });
  }, [authenticated, parsedQuery, tools, trimmedQuery, workspace]);

  const suggestionItems = useMemo(() => {
    if (trimmedQuery || !authenticated) return [];
    return SUGGESTIONS.map((item) => ({
      key: `suggest:${item.query}`,
      value: `suggest:${item.query}`,
      label: item.label,
      fillQuery: item.query,
      sound: "nav" as const,
      icon: Search,
    }));
  }, [authenticated, trimmedQuery]);

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

    if (authenticated) {
      const index = buildWorkspaceSearchIndex(workspace);
      for (const slug of [...index.reviewDueSet].slice(0, EMPTY_PERSONAL_LIMIT)) {
        push({
          key: `empty:due:${slug}`,
          value: `empty:due:${slug}`,
          label: catalogToolName(tools, slug),
          href: workspaceFocusHref("salvati", slug),
          sound: "nav",
          icon: Bookmark,
          markSlug: slug,
          meta: "Da rivedere",
        });
      }
      const using = [...index.usageBySlug.entries()]
        .filter(([, usage]) => usage === "using")
        .map(([slug]) => slug)
        .slice(0, EMPTY_PERSONAL_LIMIT);
      for (const slug of using) {
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
  }, [authenticated, featuredTools, tools, trimmedQuery, workspace]);

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

  const personalItems = useMemo(() => {
    return personalHits.map((hit) => ({
      key: `personal:${hit.slug}`,
      value: `personal:${hit.slug}`,
      label: catalogToolName(tools, hit.slug),
      href: `/toools/${hit.slug}`,
      sound: "detail" as const,
      markSlug: hit.slug,
      meta: hit.reasons[0],
    }));
  }, [personalHits, tools]);

  const guestGateItems = useMemo(() => {
    if (!trimmedQuery || !parsedQuery.personal || authenticated) return [];
    return [
      {
        key: "gate:search.personal",
        value: "gate:search.personal",
        label: "Cerca nel tuo spazio",
        gateQuery: trimmedQuery,
        sound: "nav" as const,
        icon: Search,
        meta: "Account",
      },
    ];
  }, [authenticated, parsedQuery.personal, trimmedQuery]);

  const queryTrovaItems = useMemo(() => {
    if (!trimmedQuery) return [];
    const items: PaletteItem[] = [];

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
    if (searchResults.length > 0 && catalogQuery) {
      items.push({
        key: "archive:query",
        value: "archive:query",
        label: `Cerca “${catalogQuery}” nell’archivio`,
        href: serializeCatalogUrl({ query: catalogQuery }),
        sound: "nav",
        icon: Search,
        trailingArrow: true,
      });
    }
    return items;
  }, [
    catalogQuery,
    savedMatches,
    searchResults,
    stackMatches,
    trimmedQuery,
  ]);

  const trovaItems = trimmedQuery ? queryTrovaItems : emptyTrovaItems;
  const emptyMessage =
    parsedQuery.personal && authenticated && trimmedQuery && personalHits.length === 0
      ? personalSearchEmptyMessage(parsedQuery)
      : "Nessun risultato. Prova con categoria, nome o caso d’uso.";

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
    }
  }, [isOpen]);

  useEffect(() => {
    return subscribePersonalSearchResume(() => {
      const next = takePersonalSearchResume();
      if (!next) return;
      setQuery(next);
      setCommandOpen(true);
    });
  }, [setCommandOpen]);

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
    navigateSite(href, router);
    close();
  }

  function selectItem(item: PaletteItem) {
    if (item.fillQuery) {
      setQuery(item.fillQuery);
      return;
    }
    if (item.gateQuery) {
      queueSearchPersonalGate({
        query: item.gateQuery,
        origin: "command-palette",
        returnTo: currentSafePath(),
      });
      close();
      return;
    }
    if (item.href) {
      openPath(item.href, item.sound);
    }
  }

  function renderItems(items: PaletteItem[]) {
    return items.map((item) => {
      const Icon = item.icon;
      return (
        <CommandItem
          key={item.key}
          value={item.value}
          onSelect={() => selectItem(item)}
        >
          {item.markSlug ? (
            <WorkspaceCatalogMark catalog={tools} slug={item.markSlug} size="xs" />
          ) : Icon ? (
            <Icon className="size-4" />
          ) : null}
          <span><LocalizedText>{item.label}</LocalizedText></span>
          {item.meta ? (
            <span className="ml-auto text-xs text-[var(--muted)]"><LocalizedText>{item.meta}</LocalizedText></span>
          ) : item.trailingArrow ? (
            <ArrowRight className="ml-auto size-3.5 text-[var(--muted)]" />
          ) : null}
        </CommandItem>
      );
    });
  }

  return (
    <CommandDialog open={isOpen} onOpenChange={setCommandOpen} shouldFilter={false}>
      <LocalizedAttributes><CommandInput
        placeholder="Cerca tool, azioni o sezioni..."
        value={query}
        onValueChange={setQuery}
        aria-label="Cerca"
      /></LocalizedAttributes>
      <CommandList>
        <CommandEmpty><LocalizedText>{emptyMessage}</LocalizedText></CommandEmpty>
        {suggestionItems.length > 0 ? (
          <CommandGroup heading="Ricerche personali">
            {renderItems(suggestionItems)}
          </CommandGroup>
        ) : null}
        {guestGateItems.length > 0 ? (
          <CommandGroup heading="Spazio personale">
            {renderItems(guestGateItems)}
          </CommandGroup>
        ) : null}
        {parsedQuery.personal && personalItems.length > 0 ? (
          <CommandGroup heading="Nel tuo spazio">{renderItems(personalItems)}</CommandGroup>
        ) : null}
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
