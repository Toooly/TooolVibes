"use client";

import { type CSSProperties, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Bookmark,
  Check,
  GitCompare,
  Layers3,
  Search,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";

import { DirectoryToolGlyph } from "@/components/directory/directory-tool-glyph";
import {
  directoryFilterGroups,
  directoryLevelFilters,
  levelRank,
  type DirectoryFilterGroup,
  type DirectoryTool,
  type DirectoryToolLevel,
} from "@/lib/data/tooolvibes-directory";
import { playTooolvibesSound } from "@/lib/config/sound";
import { MAX_COMPARE_TOOLS, useToolWorkspaceStore } from "@/lib/stores/tool-workspace-store";

type DesktopVibeArchiveProps = {
  tools: DirectoryTool[];
  initialQuery?: string;
  initialTag?: string;
  initialGroup?: DirectoryFilterGroup;
};

function matchesQuery(tool: DirectoryTool, query: string) {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return true;
  }

  return [
    tool.name,
    tool.categoryLabel,
    tool.shortDescription,
    tool.longDescription,
    ...tool.tags,
    ...tool.highlights,
  ]
    .join(" ")
    .toLowerCase()
    .includes(normalized);
}

export function DesktopVibeArchive({
  tools,
  initialQuery = "",
  initialTag = "",
  initialGroup = "all",
}: DesktopVibeArchiveProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get("q") ?? initialQuery);
  const [activeGroup, setActiveGroup] = useState<DirectoryFilterGroup>(
    (searchParams.get("group") as DirectoryFilterGroup) ?? initialGroup,
  );
  const [activeLevel, setActiveLevel] = useState<DirectoryToolLevel | "all">(
    (searchParams.get("level") as DirectoryToolLevel | "all") ?? "all",
  );
  const [activeTag, setActiveTag] = useState(searchParams.get("tag") ?? initialTag);
  const [displayCount, setDisplayCount] = useState(18);
  const savedSlugs = useToolWorkspaceStore((state) => state.savedSlugs);
  const compareSlugs = useToolWorkspaceStore((state) => state.compareSlugs);
  const stackSlugs = useToolWorkspaceStore((state) => state.stackSlugs);
  const toggleSaved = useToolWorkspaceStore((state) => state.toggleSaved);
  const toggleCompare = useToolWorkspaceStore((state) => state.toggleCompare);
  const addToStack = useToolWorkspaceStore((state) => state.addToStack);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    setActiveGroup(initialGroup);
  }, [initialGroup]);

  useEffect(() => {
    setActiveTag(initialTag);
  }, [initialTag]);

  useEffect(() => {
    setDisplayCount(18);
  }, [activeGroup, activeLevel, activeTag, query]);

  // Sync filters to URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (activeGroup !== "all") params.set("group", activeGroup);
    if (activeLevel !== "all") params.set("level", activeLevel);
    if (activeTag) params.set("tag", activeTag);
    const url = params.toString() ? `/archivio?${params.toString()}` : "/archivio";
    router.replace(url, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, activeGroup, activeLevel, activeTag]);

  const visibleTools = useMemo(() => {
    return tools
      .filter((tool) => {
        const groupMatch = activeGroup === "all" || tool.segments.includes(activeGroup);
        const levelMatch = activeLevel === "all" || tool.level === activeLevel;
        const tagMatch = !activeTag || tool.tags.includes(activeTag);

        return groupMatch && levelMatch && tagMatch && matchesQuery(tool, query);
      })
      .sort((left, right) => {
        return (
          Number(right.toolOfWeek) - Number(left.toolOfWeek) ||
          Number(right.featured) - Number(left.featured) ||
          levelRank[left.level] - levelRank[right.level] ||
          left.name.localeCompare(right.name, "it")
        );
      });
  }, [activeGroup, activeLevel, activeTag, query, tools]);

  const tags = useMemo(() => {
    const counts = tools.reduce<Record<string, number>>((accumulator, tool) => {
      tool.tags.forEach((tag) => {
        accumulator[tag] = (accumulator[tag] ?? 0) + 1;
      });
      return accumulator;
    }, {});

    return Object.entries(counts)
      .sort((left, right) => right[1] - left[1])
      .slice(0, 10)
      .map(([tag]) => tag);
  }, [tools]);

  const focusTools = visibleTools.slice(0, 3);

  function handleSaved(slug: string) {
    toggleSaved(slug);
    playTooolvibesSound("save");
  }

  function handleCompare(slug: string) {
    const result = toggleCompare(slug);
    playTooolvibesSound(result.limited ? "warning" : "compare");
  }

  function handleStack(slug: string) {
    addToStack(slug);
    playTooolvibesSound("stack");
  }

  return (
    <div className="desktop-vibe desktop-vibe-archive hidden lg:block">
      <section className="desktop-vibe-section desktop-vibe-archive-hero">
        <div>
          <p className="desktop-vibe-eyebrow">Catalogo 3D</p>
          <h1>Cerca, filtra e attraversa i tool come livelli.</h1>
          <p>
            Il catalogo desktop diventa una console: ricerca davanti, categorie in
            prospettiva, schede tool su piani diversi e salvati sempre a portata.
          </p>
        </div>
        <div className="desktop-vibe-archive-stats" aria-label="Statistiche catalogo">
          <span>
            <strong>{tools.length}</strong>
            tool verificati
          </span>
          <span>
            <strong>{savedSlugs.length}</strong>
            salvati
          </span>
          <span>
            <strong>{compareSlugs.length}/{MAX_COMPARE_TOOLS}</strong>
            in confronto
          </span>
        </div>
      </section>

      <section className="desktop-vibe-section desktop-vibe-archive-console">
        <aside className="desktop-vibe-filter-deck">
          <label className="desktop-vibe-search">
            <Search aria-hidden="true" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cerca tool, caso d'uso o categoria"
            />
          </label>

          <div className="desktop-vibe-filter-group">
            <p>
              <SlidersHorizontal aria-hidden="true" />
              Categorie
            </p>
            <div>
              {directoryFilterGroups.map((group) => (
                <button
                  key={group.key}
                  type="button"
                  className={activeGroup === group.key ? "is-active" : ""}
                  onClick={() => {
                    setActiveGroup(group.key);
                    playTooolvibesSound("filter");
                  }}
                >
                  {group.label}
                </button>
              ))}
            </div>
          </div>

          <div className="desktop-vibe-filter-group">
            <p>
              <Layers3 aria-hidden="true" />
              Profondità
            </p>
            <div>
              {directoryLevelFilters.map((level) => (
                <button
                  key={level.key}
                  type="button"
                  className={activeLevel === level.key ? "is-active" : ""}
                  onClick={() => {
                    setActiveLevel(level.key);
                    playTooolvibesSound("tab");
                  }}
                >
                  {level.label}
                </button>
              ))}
            </div>
          </div>

          <div className="desktop-vibe-filter-group">
            <p>
              <Sparkles aria-hidden="true" />
              Tag rapidi
            </p>
            <div>
              <button
                type="button"
                className={!activeTag ? "is-active" : ""}
                onClick={() => setActiveTag("")}
              >
                Tutti
              </button>
              {tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className={activeTag === tag ? "is-active" : ""}
                  onClick={() => {
                    setActiveTag(tag);
                    playTooolvibesSound("filter");
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <div className="desktop-vibe-tool-space">
          <div className="desktop-vibe-tool-space__header">
            <span>{visibleTools.length} risultati in vista</span>
            <Link href="/shortlist#wishlist">Manca un tool?</Link>
          </div>

          <div className="desktop-vibe-focus-lane" aria-label="Tool in primo piano">
            {focusTools.map((tool, index) => (
              <Link
                key={tool.slug}
                href={`/toools/${tool.slug}`}
                className="desktop-vibe-focus-card"
                style={
                  {
                    "--focus-index": index,
                    "--focus-tilt": `${-5 + index * 5}deg`,
                    "--focus-depth": `${1.6 + index * 0.85}rem`,
                    "--tool-from": tool.accentFrom,
                    "--tool-to": tool.accentTo,
                  } as CSSProperties
                }
              >
                <DirectoryToolGlyph tool={tool} size="lg" />
                <span>{tool.levelLabel}</span>
                <strong>{tool.name}</strong>
                <p>{tool.shortDescription}</p>
              </Link>
            ))}
          </div>

          {visibleTools.length === 0 ? (
            <div className="desktop-vibe-archive-empty">
              <Search className="size-8 text-[var(--accent-strong)]" aria-hidden="true" />
              <h3>Nessun tool trovato</h3>
              <p>Prova a modificare i filtri o la ricerca.</p>
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setActiveGroup("all");
                  setActiveLevel("all");
                  setActiveTag("");
                  setDisplayCount(18);
                }}
                className="premium-button premium-button-secondary min-h-10 rounded-full px-5 text-sm font-semibold"
              >
                Resetta filtri
              </button>
            </div>
          ) : (
            <>
              <div className="desktop-vibe-archive-grid">
                {visibleTools.slice(0, displayCount).map((tool, index) => {
              const isSaved = savedSlugs.includes(tool.slug);
              const isCompared = compareSlugs.includes(tool.slug);
              const isStacked = stackSlugs.includes(tool.slug);

              return (
                <article
                  key={tool.slug}
                  className="desktop-vibe-tool-card"
                  style={
                    {
                      "--tool-index": index,
                      "--tool-depth": `${(index % 4) * 0.42}rem`,
                      "--tool-tilt": `${1.3 + (index % 2) * 0.7}deg`,
                      "--tool-from": tool.accentFrom,
                      "--tool-to": tool.accentTo,
                    } as CSSProperties
                  }
                >
                  <Link href={`/toools/${tool.slug}`} className="desktop-vibe-tool-card__main">
                    <DirectoryToolGlyph tool={tool} size="md" />
                    <span>{tool.categoryLabel}</span>
                    <h2>{tool.name}</h2>
                    <p>{tool.shortDescription}</p>
                  </Link>
                  <div className="desktop-vibe-tool-card__actions">
                    <button
                      type="button"
                      className={isSaved ? "is-active" : ""}
                      onClick={() => handleSaved(tool.slug)}
                      aria-label={`${isSaved ? "Rimuovi" : "Salva"} ${tool.name}`}
                    >
                      {isSaved ? <Check aria-hidden="true" /> : <Bookmark aria-hidden="true" />}
                    </button>
                    <button
                      type="button"
                      className={isCompared ? "is-active" : ""}
                      onClick={() => handleCompare(tool.slug)}
                      aria-label={`Confronta ${tool.name}`}
                    >
                      <GitCompare aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className={isStacked ? "is-active" : ""}
                      onClick={() => handleStack(tool.slug)}
                      aria-label={`Aggiungi ${tool.name} alla lista`}
                    >
                      <Layers3 aria-hidden="true" />
                    </button>
                  </div>
                </article>
              );
            })}
              </div>

              {visibleTools.length > displayCount && (
                <div className="desktop-vibe-archive-load">
                  <button
                    type="button"
                    onClick={() => setDisplayCount((c) => c + 18)}
                    className="premium-button premium-button-secondary min-h-11 rounded-full px-6 text-sm font-semibold"
                  >
                    Carica altri ({visibleTools.length - displayCount} rimasti)
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
