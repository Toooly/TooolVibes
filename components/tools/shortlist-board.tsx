"use client";

import { useDeferredValue, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { useDiscoverySnapshot } from "@/lib/discovery/client-store";
import { MIN_COMPARE_TOOLS, useToolWorkspaceStore } from "@/lib/stores/tool-workspace-store";
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
  { value: "workspace", label: "Salvati: preferiti e prime scelte" },
  { value: "recent", label: "Più recenti" },
  { value: "featured", label: "Prima gli evidenziati" },
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
  const savedSlugs = useToolWorkspaceStore((state) => state.savedSlugs);
  const compareSlugs = useToolWorkspaceStore((state) => state.compareSlugs);
  const [query, setQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<StageFilter>("all");
  const [sortKey, setSortKey] = useState<ShortlistSortKey>("workspace");
  const deferredQuery = useDeferredValue(query);
  const shortlistSlugs = savedSlugs;
  const shortlistStages = discovery.shortlistStages;
  const decisionMemories = discovery.decisionMemories;

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
          background: "var(--tv-surface-elevated)",
        }}
      >
        <p className="pill mx-auto">Salvati personali</p>
        <h2 className="text-display-card mx-auto mt-4 max-w-none text-[1.72rem] sm:max-w-[16ch] sm:text-[2.08rem] sm:text-balance">
          I salvati partono dal primo tool che vuoi tenere a portata di mano.
        </h2>
        <p className="text-body-soft mx-auto mt-3 max-w-[34rem] text-[0.93rem]" style={{ color: "var(--muted)" }}>
          Salva un tool dal catalogo o da una raccolta. Poi torna qui per ricordarti in fretta
          perché vale tenerlo d&apos;occhio e quando ha senso confrontarlo.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-[24px] border p-4" style={{ borderColor: "var(--line)", background: "var(--tv-surface-elevated)" }}>
            <p className="editorial-label">1. Salva</p>
            <p className="mt-2 text-[0.92rem] leading-6" style={{ color: "var(--muted-strong)" }}>
              Parti da un profilo forte o da una raccolta che ha già il taglio giusto.
            </p>
          </div>
          <div className="rounded-[24px] border p-4" style={{ borderColor: "var(--line)", background: "var(--tv-surface-elevated)" }}>
            <p className="editorial-label">2. Annota</p>
            <p className="mt-2 text-[0.92rem] leading-6" style={{ color: "var(--muted-strong)" }}>
              Segna il motivo rapido o una nota breve per non ripartire da zero.
            </p>
          </div>
          <div className="rounded-[24px] border p-4" style={{ borderColor: "var(--line)", background: "var(--tv-surface-elevated)" }}>
            <p className="editorial-label">3. Confronta</p>
            <p className="mt-2 text-[0.92rem] leading-6" style={{ color: "var(--muted-strong)" }}>
              Quando restano 2 o 3 candidati veri, il passaggio naturale è il confronto.
            </p>
          </div>
        </div>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/archivio"
            className="button-shell button-primary text-ui-strong inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white"
          >
            Apri l&apos;archivio
            <ArrowRight aria-hidden="true" className="button-arrow size-4" />
          </Link>
          <Link
            href="/collections"
            className="button-shell button-secondary text-ui-strong inline-flex rounded-full px-5 py-3 text-sm font-semibold"
          >
            Apri raccolte
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="tone-workspace space-y-4">
      <div className="panel-lift rounded-[28px] border px-4 py-3.5 sm:px-5" style={{ borderColor: "var(--line)", background: "var(--tv-surface-elevated)" }}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="editorial-label">Salvati personali</span>
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
              className="selection-chip text-ui-strong inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em]"
              style={{
                borderColor: compareCount > 1 ? "rgba(112,82,255,0.24)" : "var(--line)",
                background:
                  compareCount > 1
                    ? "linear-gradient(180deg, rgba(239,232,255,0.96), rgba(230,221,255,0.88))"
                    : "var(--tv-surface-elevated)",
                color: compareCount > 1 ? "var(--accent-strong)" : "var(--muted-strong)",
              }}
            >
              {compareCount > 1 ? `Apri confronto (${compareCount})` : `Servono ${MIN_COMPARE_TOOLS} tool per confrontare`}
            </Link>
          </div>
        </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,0.85fr)]">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cerca nei tuoi salvati"
            data-sonic-action="search"
            className="filter-control w-full rounded-[22px] border px-4 py-3 outline-none"
            style={{ borderColor: "var(--line)", background: "var(--tv-surface-elevated)" }}
          />
          <select
            value={sortKey}
            onChange={(event) => setSortKey(event.target.value as ShortlistSortKey)}
            data-sonic-action="tab"
            className="filter-control w-full rounded-[22px] border px-4 py-3 outline-none"
            style={{ borderColor: "var(--line)", background: "var(--tv-surface-elevated)" }}
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
            <p className="editorial-label">Filtro per stato</p>
            {activeWorkspaceFilters > 0 ? (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setStageFilter("all");
                  setSortKey("workspace");
                }}
                data-sonic-action="update"
                className="section-quiet-link text-[0.8rem] font-semibold"
                style={{ color: "var(--muted)" }}
                >
                Resetta vista
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
                  data-sonic-action="tab"
                  className={`quick-filter-chip selection-chip text-ui-strong inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.16em] ${
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
          <div className={`shortlist-mobile-rail tool-rail -mx-2 flex snap-x gap-3 overflow-x-auto px-2 pb-2 md:hidden ${isSearching ? "opacity-70 transition-opacity duration-200" : "transition-opacity duration-200"}`}>
            {filteredTools.map((tool, index) => (
              <div key={tool.id} className="shortlist-mobile-card-shell grid w-[min(18.75rem,calc(100vw-1.5rem))] shrink-0 snap-start gap-2.5">
                <ToolCard tool={tool} variant="compact" index={index} contextLabel="Salvati personali" />
                <ToolWorkspacePanel tool={tool} />
              </div>
            ))}
          </div>

          <div className={`hidden gap-5 md:grid md:grid-cols-2 xl:grid-cols-3 ${isSearching ? "opacity-70 transition-opacity duration-200" : "transition-opacity duration-200"}`}>
            {filteredTools.map((tool, index) => (
              <div key={tool.id} className="grid gap-3">
                <ToolCard tool={tool} variant="standard" index={index} contextLabel="Salvati personali" />
                <ToolWorkspacePanel tool={tool} />
              </div>
            ))}
          </div>
        </>
      ) : (
        <div
          className="rounded-[32px] border px-6 py-8 text-center sm:py-9"
          style={{ borderColor: "var(--line)", background: "var(--tv-surface-elevated)" }}
        >
          <p className="pill mx-auto">Salvati filtrati</p>
          <h3 className="text-display-card mt-4 text-[1.8rem]">Nessun tool corrisponde a questa vista personale.</h3>
          <p className="mt-3 text-sm leading-7" style={{ color: "var(--muted)" }}>
            Prova ad allargare stato, nota o categoria. Qui restano solo i profili che hanno ancora un ruolo chiaro nella tua selezione.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setStageFilter("all");
                  setSortKey("workspace");
                }}
                data-sonic-action="update"
                className="button-shell button-secondary text-ui-strong inline-flex rounded-full px-5 py-3 text-sm font-semibold"
              >
              Resetta la vista
            </button>
            <Link
              href={compareCount > 1 ? "/compare" : "/archivio"}
              className="button-shell button-primary text-ui-strong inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white"
            >
              {compareCount > 1 ? "Apri il confronto" : "Torna al catalogo"}
              <ArrowRight aria-hidden="true" className="button-arrow size-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
