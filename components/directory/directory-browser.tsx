"use client";

import { useMemo, useState } from "react";

import { DirectoryToolCard } from "@/components/directory/directory-tool-card";
import { PremiumBadge, PremiumButton, PremiumLink, PremiumPanel } from "@/components/ui/premium";
import {
  directoryFilterGroups,
  directoryLevelFilters,
  levelRank,
  type DirectoryFilterGroup,
  type DirectoryTool,
  type DirectoryToolLevel,
} from "@/lib/data/tooolvibes-directory";
import { cn } from "@/lib/utils";

type DirectoryBrowserProps = {
  tools: DirectoryTool[];
  title: string;
  description: string;
  eyebrow: string;
  initialQuery?: string;
  initialTag?: string;
  initialGroup?: DirectoryFilterGroup;
  className?: string;
};

type SortMode = "recommended" | "name" | "level" | "category";

function matchesTool(tool: DirectoryTool, query: string) {
  if (!query.trim()) {
    return true;
  }

  const normalizedQuery = query.trim().toLowerCase();
  const haystack = [
    tool.name,
    tool.category,
    tool.categoryLabel,
    tool.levelLabel,
    tool.description,
    tool.longDescription,
    tool.whyItMatters,
    ...tool.tags,
    ...tool.useCases,
    ...tool.highlights,
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(normalizedQuery);
}

export function DirectoryBrowser({
  tools,
  title,
  description,
  eyebrow,
  initialQuery = "",
  initialTag = "",
  initialGroup = "all",
  className,
}: DirectoryBrowserProps) {
  const [query, setQuery] = useState(initialQuery);
  const [activeGroup, setActiveGroup] = useState<DirectoryFilterGroup>(initialGroup);
  const [activeLevel, setActiveLevel] = useState<DirectoryToolLevel | "all">("all");
  const [activeTag, setActiveTag] = useState(initialTag);
  const [sortMode, setSortMode] = useState<SortMode>("recommended");

  const sortedTags = useMemo(() => {
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

  const filteredTools = useMemo(() => {
    const filtered = tools.filter((tool) => {
      const matchesGroup =
        activeGroup === "all" || tool.segments.includes(activeGroup);
      const matchesLevel = activeLevel === "all" || tool.level === activeLevel;
      const matchesTag = !activeTag || tool.tags.includes(activeTag);

      return matchesGroup && matchesLevel && matchesTag && matchesTool(tool, query);
    });

    return [...filtered].sort((left, right) => {
      if (sortMode === "name") {
        return left.name.localeCompare(right.name, "it");
      }

      if (sortMode === "level") {
        return (
          levelRank[left.level] - levelRank[right.level] ||
          left.name.localeCompare(right.name, "it")
        );
      }

      if (sortMode === "category") {
        return (
          left.categoryLabel.localeCompare(right.categoryLabel, "it") ||
          left.name.localeCompare(right.name, "it")
        );
      }

      return (
        Number(right.toolOfWeek) - Number(left.toolOfWeek) ||
        Number(right.featured) - Number(left.featured) ||
        levelRank[left.level] - levelRank[right.level] ||
        left.name.localeCompare(right.name, "it")
      );
    });
  }, [activeGroup, activeLevel, activeTag, query, sortMode, tools]);

  const groupCounts = useMemo(() => {
    return Object.fromEntries(
      directoryFilterGroups.map((group) => [
        group.key,
        group.key === "all"
          ? tools.length
          : tools.filter((tool) => tool.segments.includes(group.key)).length,
      ]),
    ) as Record<DirectoryFilterGroup, number>;
  }, [tools]);

  const levelCounts = useMemo(() => {
    return Object.fromEntries(
      directoryLevelFilters.map((level) => [
        level.key,
        level.key === "all"
          ? tools.length
          : tools.filter((tool) => tool.level === level.key).length,
      ]),
    ) as Record<DirectoryToolLevel | "all", number>;
  }, [tools]);

  return (
    <section className={cn("space-y-6", className)}>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-[46rem]">
          <PremiumBadge tone="accent">{eyebrow}</PremiumBadge>
          <h2 className="text-display-card mt-4 text-[2.1rem] text-[var(--foreground)] sm:text-[2.85rem]">
            {title}
          </h2>
          <p className="mt-4 max-w-[40rem] text-[1rem] leading-7 text-[var(--muted-strong)]">
            {description}
          </p>
        </div>

        <div className="premium-card px-5 py-4">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
            Risultati visibili
          </p>
          <p className="mt-2 text-[2rem] font-semibold leading-none text-[var(--foreground)]">
            {filteredTools.length}
          </p>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            {tools.length} tool curati, livelli chiari e CTA pronte.
          </p>
        </div>
      </div>

      <PremiumPanel tone="subtle" className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)] lg:items-start">
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_12rem]">
            <label className="block">
              <span className="sr-only">Cerca tool, categoria o tag</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cerca per nome, categoria, tag o descrizione"
                className="premium-input px-4 py-3 text-[0.98rem] placeholder:text-[var(--muted)]"
                aria-label="Cerca nei Toools"
              />
            </label>

            <label className="block">
              <span className="sr-only">Ordina risultati</span>
              <select
                value={sortMode}
                onChange={(event) => setSortMode(event.target.value as SortMode)}
                className="premium-input h-full px-4 py-3 text-[0.9rem] font-semibold"
                aria-label="Ordina risultati"
              >
                <option value="recommended">Consigliati</option>
                <option value="name">Nome A-Z</option>
                <option value="level">Livello</option>
                <option value="category">Categoria</option>
              </select>
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            {directoryFilterGroups.map((group) => {
              const isActive = activeGroup === group.key;

              return (
                <button
                  key={group.key}
                  type="button"
                  onClick={() => setActiveGroup(group.key)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-[0.74rem] font-semibold uppercase tracking-[0.16em] transition-all duration-200",
                    isActive
                      ? "border-[rgba(108,76,255,0.3)] bg-[rgba(109,59,255,0.1)] text-[var(--accent-strong)]"
                      : "border-[rgba(76,55,166,0.12)] bg-white text-[var(--muted-strong)] hover:border-[rgba(108,76,255,0.2)]",
                  )}
                >
                  <span>{group.label}</span>
                  <span className="rounded-full bg-white/80 px-2 py-0.5 text-[0.66rem] text-[var(--muted)]">
                    {groupCounts[group.key]}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-2 border-t border-[rgba(76,55,166,0.08)] pt-4">
            {directoryLevelFilters.map((level) => {
              const isActive = activeLevel === level.key;

              return (
                <button
                  key={level.key}
                  type="button"
                  onClick={() => setActiveLevel(level.key)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-[0.74rem] font-semibold uppercase tracking-[0.16em] transition-all duration-200",
                    isActive
                      ? "border-[rgba(108,76,255,0.3)] bg-[rgba(31,19,93,0.92)] text-white"
                      : "border-[rgba(76,55,166,0.12)] bg-white text-[var(--muted-strong)] hover:border-[rgba(108,76,255,0.2)]",
                  )}
                >
                  <span>{level.label}</span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[0.66rem]",
                      isActive
                        ? "bg-white/14 text-white/76"
                        : "bg-[rgba(246,244,255,0.92)] text-[var(--muted)]",
                    )}
                  >
                    {levelCounts[level.key]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
            Tag rapidi
          </p>
          <div className="flex flex-wrap gap-2 lg:justify-end">
            {sortedTags.map((tag) => {
              const isActive = activeTag === tag;

              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setActiveTag((current) => (current === tag ? "" : tag))}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-[0.72rem] font-medium transition-all duration-200",
                    isActive
                      ? "border-[rgba(108,76,255,0.28)] bg-[rgba(109,59,255,0.1)] text-[var(--accent-strong)]"
                      : "border-[rgba(76,55,166,0.12)] bg-[rgba(246,244,255,0.86)] text-[var(--muted-strong)] hover:border-[rgba(108,76,255,0.2)]",
                  )}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>
      </PremiumPanel>

      {filteredTools.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredTools.map((tool) => (
            <DirectoryToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
      ) : (
        <div className="rounded-[30px] border border-[rgba(76,55,166,0.12)] bg-white/86 px-6 py-12 text-center shadow-[0_18px_48px_rgba(31,19,93,0.06)]">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[var(--accent-strong)]">
            Nessun match utile
          </p>
          <h3 className="mt-4 text-[1.75rem] leading-[1.02] text-[var(--foreground)]">
            Nessun tool corrisponde a questa combinazione.
          </h3>
          <p className="mx-auto mt-3 max-w-[34rem] text-[0.98rem] leading-7 text-[var(--muted-strong)]">
            Prova a cambiare filtro, rimuovere un tag o usare una ricerca pi&ugrave;
            ampia. L&apos;idea &egrave; aiutarti a stringere il campo, non a bloccarti.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <PremiumButton
              type="button"
              onClick={() => {
                setQuery("");
                setActiveGroup("all");
                setActiveLevel("all");
                setActiveTag("");
              }}
              tone="secondary"
            >
              Reset filtri
            </PremiumButton>
            <PremiumLink href="/wishlist">
              Suggerisci un Toool
            </PremiumLink>
          </div>
        </div>
      )}
    </section>
  );
}
