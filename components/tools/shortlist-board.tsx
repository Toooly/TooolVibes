"use client";

import { useDeferredValue, useState } from "react";
import Link from "next/link";

import { useDiscoverySnapshot } from "@/lib/discovery/client-store";
import type {
  ShortlistStage,
  ToolDecisionMemory,
  ToolRecord,
} from "@/lib/types/tool";
import {
  filterTools,
  getShortlistStageMeta,
  sortToolsBy,
  sortToolsForWorkspace,
  type ToolSortKey,
} from "@/lib/tools/discovery";

import { ToolCard } from "@/components/tools/tool-card";
import { ToolWorkspacePanel } from "@/components/tools/tool-workspace-panel";

type ShortlistBoardProps = {
  tools: ToolRecord[];
};

type ShortlistSortKey = ToolSortKey | "workspace";
type StageFilter = ShortlistStage | "all";

const sortOptions: { value: ShortlistSortKey; label: string }[] = [
  { value: "workspace", label: "Workspace: pinned e top prima" },
  { value: "recent", label: "Pi? recenti" },
  { value: "featured", label: "Prima gli evidenza" },
  { value: "name", label: "Ordine alfabetico" },
  { value: "updated", label: "Aggiornati da poco" },
];

function sortShortlistedTools(
  items: ToolRecord[],
  sortKey: ShortlistSortKey,
  shortlistStages: Record<string, ShortlistStage>,
  decisionMemories: Record<string, ToolDecisionMemory>,
) {
  if (sortKey === "workspace") {
    return sortToolsForWorkspace(items, shortlistStages, decisionMemories);
  }

  return sortToolsBy(items, sortKey);
}

export function ShortlistBoard({ tools }: ShortlistBoardProps) {
  const discovery = useDiscoverySnapshot();
  const [query, setQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<StageFilter>("all");
  const [sortKey, setSortKey] = useState<ShortlistSortKey>("workspace");
  const deferredQuery = useDeferredValue(query);
  const shortlistSlugs = discovery.shortlist;
  const shortlistStages = discovery.shortlistStages;
  const decisionMemories = discovery.decisionMemories;
  const compareSlugs = discovery.compare;

  const shortlistedTools = tools.filter((tool) => shortlistSlugs.includes(tool.slug));
  const workspaceFilteredTools = shortlistedTools.filter((tool) => {
    const stageMatches = stageFilter === "all" ? true : (shortlistStages[tool.slug] ?? "saved") === stageFilter;

    return stageMatches;
  });

  const filteredTools = sortShortlistedTools(
    filterTools(workspaceFilteredTools, {
      query: deferredQuery,
    }),
    sortKey,
    shortlistStages,
    decisionMemories,
  );

  const compareCount = compareSlugs.length;
  const isSearching = query !== deferredQuery;
  const activeWorkspaceFilters = Number(stageFilter !== "all") + Number(Boolean(deferredQuery.trim()));
  if (shortlistedTools.length === 0) {
    return (
      <div
        className="rounded-[32px] border px-6 py-8 text-center sm:px-8 sm:py-9"
        style={{
          borderColor: "var(--line)",
          background: "linear-gradient(180deg, rgba(255,255,255,0.84), rgba(243,237,255,0.74))",
        }}
      >
        <p className="pill mx-auto">Workspace personale</p>
        <h2 className="text-display-card mx-auto mt-4 max-w-none text-[1.72rem] sm:max-w-[16ch] sm:text-[2.08rem] sm:text-balance">
          La shortlist parte dal primo tool che vuoi tenere vivo.
        </h2>
        <p className="text-body-soft mx-auto mt-3 max-w-[34rem] text-[0.93rem]" style={{ color: "var(--muted)" }}>
          Salva un tool dall&apos;archivio o da una collection. Poi torna qui per ricordarti in fretta
          perche&apos; vale restare nel radar e quando ha senso confrontarlo.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="stat-block rounded-[24px] border p-4" style={{ borderColor: "var(--line)", background: "linear-gradient(180deg, rgba(255,255,255,0.82), rgba(243,237,255,0.74))" }}>
            <p className="editorial-label">1. Salva</p>
            <p className="mt-2 text-[0.92rem] leading-6" style={{ color: "var(--muted-strong)" }}>
              Parti da un profilo forte o da una collection che ha gi? il taglio giusto.
            </p>
          </div>
          <div className="stat-block rounded-[24px] border p-4" style={{ borderColor: "var(--line)", background: "linear-gradient(180deg, rgba(255,255,255,0.82), rgba(243,237,255,0.74))" }}>
            <p className="editorial-label">2. Annota</p>
            <p className="mt-2 text-[0.92rem] leading-6" style={{ color: "var(--muted-strong)" }}>
              Segna il motivo rapido o una nota breve per non ripartire da zero.
            </p>
          </div>
          <div className="stat-block rounded-[24px] border p-4" style={{ borderColor: "var(--line)", background: "linear-gradient(180deg, rgba(255,255,255,0.82), rgba(243,237,255,0.74))" }}>
            <p className="editorial-label">3. Confronta</p>
            <p className="mt-2 text-[0.92rem] leading-6" style={{ color: "var(--muted-strong)" }}>
              Quando restano 2 o 3 candidati veri, il passaggio naturale ? compare.
            </p>
          </div>
        </div>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/archivio"
            className="button-shell button-primary text-ui-strong inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white"
          >
            Apri l&apos;archivio
            <span aria-hidden="true" className="button-arrow">
              →
            </span>
          </Link>
          <Link
            href="/collections"
            className="button-shell button-secondary text-ui-strong inline-flex rounded-full px-5 py-3 text-sm font-semibold"
          >
            Apri collections
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="tone-workspace space-y-4">
      <div className="brand-panel panel-lift rounded-[28px] px-4 py-3.5 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="editorial-label">Workspace shortlist</span>
              <span className="selection-status">{shortlistedTools.length} candidati salvati</span>
            </div>
            <p className="text-body-soft mt-2 text-[0.92rem]" style={{ color: "var(--muted)" }}>
              Qui restano solo i candidati che meritano ancora un passaggio prima del confronto.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <Link href="/archivio" className="section-quiet-link text-sm font-semibold" style={{ color: "var(--accent-strong)" }}>
              Torna all&apos;archivio
            </Link>
            <Link
              href="/compare"
              className="selection-chip text-ui-strong inline-flex items-center rounded-full border px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.16em]"
              style={{
                borderColor: compareCount > 1 ? "rgba(112,82,255,0.24)" : "var(--line)",
                background:
                  compareCount > 1
                    ? "linear-gradient(180deg, rgba(239,232,255,0.96), rgba(230,221,255,0.88))"
                    : "rgba(255,255,255,0.76)",
                color: compareCount > 1 ? "var(--accent-strong)" : "var(--muted-strong)",
              }}
            >
              {compareCount > 1 ? `Apri compare (${compareCount})` : "Servono 2 tool per compare"}
            </Link>
          </div>
        </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,0.85fr)]">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cerca nella tua workspace"
            className="filter-control w-full rounded-[22px] border px-4 py-3 outline-none"
            style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.88)" }}
          />
          <select
            value={sortKey}
            onChange={(event) => setSortKey(event.target.value as ShortlistSortKey)}
            className="filter-control w-full rounded-[22px] border px-4 py-3 outline-none"
            style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.88)" }}
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="editorial-label">Filtro per stage</p>
            {activeWorkspaceFilters > 0 ? (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setStageFilter("all");
                  setSortKey("workspace");
                }}
                className="section-quiet-link text-[0.8rem] font-semibold"
                style={{ color: "var(--muted)" }}
                >
                Reset workspace
              </button>
            ) : null}
          </div>
          <div className="tool-rail -mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1">
            {(["all", "top", "review", "saved"] as StageFilter[]).map((item) => {
              const meta = item === "all" ? null : getShortlistStageMeta(item);
              const count =
                item === "all"
                  ? shortlistedTools.length
                  : shortlistedTools.filter((tool) => (shortlistStages[tool.slug] ?? "saved") === item).length;

              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setStageFilter(item)}
                  className={`quick-filter-chip selection-chip text-ui-strong inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.16em] ${
                    stageFilter === item ? "is-active" : ""
                  }`}
                  style={
                    meta && stageFilter === item
                      ? { background: meta.background, color: meta.tone }
                      : undefined
                  }
                >
                  <span>{item === "all" ? "Tutti gli stati" : meta?.label}</span>
                  <span className="quick-filter-count">{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {filteredTools.length > 0 ? (
        <>
          <div className={`tool-rail -mx-1.5 flex snap-x gap-4 overflow-x-auto px-1.5 pb-2 md:hidden ${isSearching ? "opacity-70 transition-opacity duration-200" : "transition-opacity duration-200"}`}>
            {filteredTools.map((tool, index) => (
              <div key={tool.id} className="w-[min(19.75rem,calc(100vw-2.75rem))] shrink-0 snap-start space-y-3">
                <ToolCard tool={tool} variant="compact" index={index} contextLabel="Workspace shortlist" />
                <ToolWorkspacePanel tool={tool} />
              </div>
            ))}
          </div>

          <div className={`hidden gap-5 md:grid md:grid-cols-2 xl:grid-cols-3 ${isSearching ? "opacity-70 transition-opacity duration-200" : "transition-opacity duration-200"}`}>
            {filteredTools.map((tool, index) => (
              <div key={tool.id} className="space-y-3">
                <ToolCard tool={tool} variant="standard" index={index} contextLabel="Workspace shortlist" />
                <ToolWorkspacePanel tool={tool} />
              </div>
            ))}
          </div>
        </>
      ) : (
        <div
          className="rounded-[32px] border px-6 py-8 text-center sm:py-9"
          style={{ borderColor: "var(--line)", background: "linear-gradient(180deg, rgba(255,255,255,0.78), rgba(243,237,255,0.7))" }}
        >
          <p className="pill mx-auto">Workspace filtrata</p>
          <h3 className="text-display-card mt-4 text-[1.8rem]">Nessun tool corrisponde a questa vista personale.</h3>
          <p className="mt-3 text-sm leading-7" style={{ color: "var(--muted)" }}>
            Prova a riaprire stage, memoria o categoria. Qui restano solo i profili che hanno ancora un ruolo chiaro nella tua selezione.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setStageFilter("all");
                  setSortKey("workspace");
                }}
                className="button-shell button-secondary text-ui-strong inline-flex rounded-full px-5 py-3 text-sm font-semibold"
              >
              Resetta la workspace
            </button>
            <Link
              href={compareCount > 1 ? "/compare" : "/archivio"}
              className="button-shell button-primary text-ui-strong inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white"
            >
              {compareCount > 1 ? "Apri il compare" : "Torna all'archivio"}
              <span aria-hidden="true" className="button-arrow">
                →
              </span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
