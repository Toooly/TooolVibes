"use client";

import Link from "next/link";
import { startTransition, useDeferredValue, useEffect, useMemo, useState } from "react";

import type { ToolCategory, ToolRecord } from "@/lib/types/tool";
import { marketingStrings } from "@/lib/config/strings";
import { markCategoryExplored } from "@/lib/discovery/local-storage";
import {
  filterTools,
  getTaskMeta,
  matchesToolTask,
  sortToolsBy,
  taskShortcutOptions,
  type ToolTaskKey,
  type ToolSortKey,
} from "@/lib/tools/discovery";

import { ShortlistLink } from "@/components/tools/shortlist-link";
import { ToolGrid } from "@/components/tools/tool-grid";

type ToolFiltersProps = {
  tools: ToolRecord[];
  categories: ToolCategory[];
  initialQuery?: string;
  initialTag?: string;
};

const sortLabels: Record<ToolSortKey, string> = {
  recent: "Più recenti",
  featured: "Prima in evidenza",
  name: "Ordine alfabetico",
  updated: "Aggiornati da poco",
};

function getTaskLabel(task: ToolTaskKey) {
  if (task === "all") {
    return "Tutti i task";
  }

  return getTaskMeta(task).label;
}

export function ToolFilters({
  tools,
  categories,
  initialQuery = "",
  initialTag = "",
}: ToolFiltersProps) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState("all");
  const [task, setTask] = useState<ToolTaskKey>("all");
  const [sortKey, setSortKey] = useState<ToolSortKey>("recent");
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = deferredQuery.trim().toLowerCase();

  const taskCounts = useMemo(() => {
    const entries = taskShortcutOptions.map((item) => {
      const count = tools.filter((tool) => matchesToolTask(tool, item)).length;
      return [item, count] as const;
    });

    return Object.fromEntries(entries) as Record<ToolTaskKey, number>;
  }, [tools]);

  const filteredTools = useMemo(() => {
    const visibleTools = filterTools(tools, {
      query: normalizedQuery,
      category: category as ToolCategory | "all",
      tag: initialTag || null,
      shortcut: "all",
      task,
    });

    return sortToolsBy(visibleTools, sortKey);
  }, [category, initialTag, normalizedQuery, sortKey, task, tools]);

  const hasActiveQuery = normalizedQuery.length > 0;
  const hasActiveCategory = category !== "all";
  const hasActiveTask = task !== "all";
  const hasActiveSort = sortKey !== "recent";
  const isFiltering = query !== deferredQuery;
  const hasIncomingTag = initialTag.length > 0;
  const hasActiveFilterSet =
    hasActiveQuery || hasActiveCategory || hasActiveTask || hasActiveSort || hasIncomingTag;

  useEffect(() => {
    if (category !== "all") {
      markCategoryExplored(category);
    }
  }, [category]);

  return (
    <div className="editorial-grid items-start gap-y-6">
      <div className="col-span-12 xl:col-span-4">
        <div className="space-y-5 xl:sticky xl:top-28">
          <div className="brand-panel panel-lift space-y-5 rounded-[32px] p-5 sm:p-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="pill">Filtri archivio</p>
                <h3 className="mt-4 max-w-[20rem] text-[1.42rem] leading-[1.1] sm:max-w-[22rem] sm:text-[1.82rem] sm:text-balance">
                  Parti da ricerca o task. Il resto serve solo a chiudere il campo.
                </h3>
              </div>
              <div
                className="stat-block rounded-[24px] border px-4 py-3.5 sm:min-w-[11rem]"
                style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.62)" }}
              >
                <p className="editorial-label">Candidati</p>
                <p className="mt-2 text-3xl leading-none">{filteredTools.length}</p>
                <p className="mt-3 text-[0.72rem] uppercase tracking-[0.16em]" style={{ color: "var(--muted)" }}>
                  {tools.length} profili nell&apos;archivio
                </p>
              </div>
            </div>

            <div className="grid gap-4">
              <label className="block">
                <span className="mb-2 block editorial-label">
                  {marketingStrings.archive.searchLabel}
                </span>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={marketingStrings.archive.searchPlaceholder}
                  className={`filter-control w-full rounded-[22px] border px-4 py-3 outline-none ${
                    hasActiveQuery ? "filter-control-active" : ""
                  }`}
                  style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.88)" }}
                />
              </label>

              <label className="block">
                <span className="mb-2 block editorial-label">
                  {marketingStrings.archive.categoryLabel}
                </span>
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className={`filter-control w-full rounded-[22px] border px-4 py-3 outline-none ${
                    hasActiveCategory ? "filter-control-active" : ""
                  }`}
                  style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.88)" }}
                >
                  <option value="all">{marketingStrings.archive.allCategories}</option>
                  {categories.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block editorial-label">
                  {marketingStrings.archive.sortLabel}
                </span>
                <select
                  value={sortKey}
                  onChange={(event) => setSortKey(event.target.value as ToolSortKey)}
                  className={`filter-control w-full rounded-[22px] border px-4 py-3 outline-none ${
                    hasActiveSort ? "filter-control-active" : ""
                  }`}
                  style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.88)" }}
                >
                  {Object.entries(sortLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="col-span-12 space-y-5 xl:col-span-8">
        <div className="brand-panel panel-lift rounded-[30px] px-4 py-4 sm:px-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="editorial-label">Risultati</span>
              <span className="selection-status">{filteredTools.length} risultati</span>
            </div>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
              {hasIncomingTag ? (
                <Link
                  href="/archivio"
                  className="section-quiet-link text-[0.84rem] font-semibold"
                  style={{ color: "var(--muted)" }}
                >
                  Rimuovi tag
                </Link>
              ) : hasActiveFilterSet ? (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setCategory("all");
                    setTask("all");
                    setSortKey("recent");
                  }}
                  className="section-quiet-link text-[0.84rem] font-semibold"
                  style={{ color: "var(--muted)" }}
                >
                  Reset filtri
                </button>
              ) : (
              <span className="text-[0.74rem] uppercase tracking-[0.16em]" style={{ color: "var(--muted)" }}>
                  {hasIncomingTag ? `Tag attivo: #${initialTag}` : "Apri i profili che reggono davvero"}
                </span>
              )}
              <ShortlistLink label="Workspace" variant="subtle" />
            </div>
          </div>

          <div className="tool-rail mt-3 -mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1">
            {taskShortcutOptions.map((item) => {
              const active = task === item;

              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    startTransition(() => setTask(item));
                  }}
                  className={`quick-filter-chip selection-chip text-ui-strong inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.16em] ${
                    active ? "is-active" : ""
                  }`}
                >
                  <span>{getTaskLabel(item)}</span>
                  <span className="quick-filter-count">{taskCounts[item]}</span>
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <span className="text-[0.74rem] uppercase tracking-[0.16em]" style={{ color: "var(--muted)" }}>
              Ordinamento: {sortLabels[sortKey]}
            </span>
            <span className="text-[0.74rem] uppercase tracking-[0.16em]" style={{ color: "var(--muted)" }}>
              {hasIncomingTag ? `Ricerca, task, categoria + #${initialTag}` : "Ricerca, task, categoria"}
            </span>
          </div>
        </div>

        {filteredTools.length > 0 ? (
          <div className={`space-y-5 transition-opacity duration-200 ${isFiltering ? "opacity-70" : ""}`}>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="brand-kicker">Vista archivio</p>
                <h3 className="mt-2 max-w-[40rem] text-[1.7rem] leading-[1.1] sm:text-[2.02rem] sm:text-balance">
                  {hasActiveTask
                    ? `${getTaskLabel(task)} con il taglio TooolVibes.`
                    : "Tool pronti da scremare in modo più disciplinato."}
                </h3>
              </div>
              <p className="max-w-xl text-sm leading-7 xl:text-right" style={{ color: "var(--muted)" }}>
                Qui conta solo capire quali profili meritano un click serio.
              </p>
            </div>
            <ToolGrid
              tools={filteredTools}
              contextLabel="Archivio curato"
              variant="compact"
              mobileSwipe
            />
          </div>
        ) : (
          <div
            className="rounded-[var(--radius-lg)] border px-6 py-10 text-center"
            style={{
              borderColor: "var(--line)",
              background: "linear-gradient(180deg, rgba(255,255,255,0.78), rgba(243,237,255,0.7))",
            }}
          >
            <p className="pill mx-auto">Archivio filtrato</p>
            <h3 className="mt-4 text-2xl">Nessun profilo regge questo taglio</h3>
            <p className="mt-3 text-sm leading-7" style={{ color: "var(--muted)" }}>
              Allarga i filtri, cambia task oppure riapri la vista completa.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setCategory("all");
                  setTask("all");
                  setSortKey("recent");
                }}
                className="button-shell button-primary text-ui-strong inline-flex rounded-full px-5 py-3 text-sm font-semibold text-white"
              >
                Resetta i filtri
              </button>
              <ShortlistLink label="Workspace" variant="button" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
