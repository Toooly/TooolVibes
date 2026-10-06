"use client";

/**
 * FULL Radar — logged-only AI discovery & intelligence surface.
 *
 * Four product modes (spec §8): Panoramica / Trend / Per te / Watchlist.
 * Consumes ONLY normalized Radar view models (`lib/radar/radar-domain` and
 * friends). Never Product Hunt response shapes. Never fabricated history,
 * momentum or scores.
 *
 * `HomeRadarPreview` lives in `components/radar/home-radar-preview.tsx` and is
 * frozen (Home is a frozen system).
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw, Search } from "lucide-react";

import { TinyAdzInlineSlot } from "@/components/ads/tinyadz-inline-slot";
import { useAccount } from "@/components/account/account-provider";
import { RadarLegend } from "@/components/radar/radar-legend";
import { RadarMap } from "@/components/radar/radar-map";
import {
  RadarInsightStrip,
  RadarPerTePanel,
  RadarTrendPanel,
  RadarWatchPanel,
} from "@/components/radar/radar-panels";
import { RadarQuickPreview } from "@/components/radar/radar-quick-preview";
import { RadarToolRow } from "@/components/radar/radar-tool-row";
import { usePublicToolCatalog } from "@/lib/data/public-tool-catalog-context";
import { useDiscoverySnapshot } from "@/lib/discovery/client-store";
import type { WorkspaceStateV1 } from "@/lib/discovery/types";
import { RADAR_RANGE_OPTIONS, resolveRadarUiModel } from "@/lib/radar/radar-ui-model";
import {
  buildRadarView,
  type RadarTool,
  type RadarView,
} from "@/lib/radar/radar-domain";
import {
  RADAR_TABS,
  RADAR_TAB_LABEL,
  type RadarTab,
} from "@/lib/radar/radar-url-state";
import { useRadarUrlState } from "@/lib/radar/use-radar-url-state";
import { useProductHuntRadar } from "@/lib/radar/use-product-hunt-radar";
import {
  getCanonicalToolWorkspaceState,
  useToolWorkspaceStore,
} from "@/lib/stores/tool-workspace-store";

type CatalogHint = { slug: string; name: string; categoryLabel: string };

export function RadarExperience() {
  const account = useAccount();
  const { state: urlState, setState: setUrlState } = useRadarUrlState();
  const { payload, isLoading, isFetching, refetch } = useProductHuntRadar(urlState.range);
  const catalogRaw = usePublicToolCatalog();
  const snapshot = useDiscoverySnapshot();

  const catalog = useMemo<CatalogHint[]>(
    () =>
      (catalogRaw ?? []).map((tool) => ({
        slug: tool.slug,
        name: tool.name,
        categoryLabel: tool.categoryLabel,
      })),
    [catalogRaw],
  );

  const uiModel = useMemo(
    () => resolveRadarUiModel(payload, urlState.range),
    [payload, urlState.range],
  );

  const snapshotMeta = useMemo(
    () => ({
      status: payload?.status ?? ("ok" as const),
      source: payload?.source ?? ("none" as const),
      stale: payload?.stale ?? false,
      range: payload?.range ?? urlState.range,
      updatedAt: payload?.updatedAt ?? new Date(0).toISOString(),
    }),
    [payload, urlState.range],
  );

  const view = useMemo(
    () => buildRadarView({ ...snapshotMeta, items: [...uiModel.items] }, catalog),
    [snapshotMeta, uiModel.items, catalog],
  );

  const radarWatchSlugs = useToolWorkspaceStore((s) => s.radarWatchSlugs);
  const radarWatchCategories = useToolWorkspaceStore((s) => s.radarWatchCategories);
  const toggleRadarWatchSlug = useToolWorkspaceStore((s) => s.toggleRadarWatchSlug);
  const toggleRadarWatchCategory = useToolWorkspaceStore((s) => s.toggleRadarWatchCategory);
  const clearRadarWatch = useToolWorkspaceStore((s) => s.clearRadarWatch);

  // `snapshot` is the canonical workspace-change signal. `getCanonical*` reads
  // the store imperatively, so the watch projections are the visible slice that
  // must also invalidate this memo.
  const workspace = useMemo<WorkspaceStateV1>(() => {
    void snapshot;
    void radarWatchSlugs;
    void radarWatchCategories;
    return getCanonicalToolWorkspaceState();
  }, [snapshot, radarWatchSlugs, radarWatchCategories]);

  const watch: WorkspaceStateV1["radarWatch"] = useMemo(
    () => ({
      slugs: radarWatchSlugs,
      categories: radarWatchCategories,
      updatedAt: workspace.radarWatch.updatedAt,
    }),
    [radarWatchSlugs, radarWatchCategories, workspace.radarWatch.updatedAt],
  );

  // ---- filtering -----------------------------------------------------------
  const query = urlState.query?.trim().toLowerCase() ?? "";
  const filteredTools = useMemo(() => {
    let tools = view.tools;
    if (urlState.category) {
      // §19 — the filter chips are RadarTopicCluster ids (the Radar taxonomy),
      // NOT Catalog category ids. Matching against `tool.category` silently
      // dropped every external signal and rendered an empty map.
      tools = tools.filter((tool) => tool.topicCluster.id === urlState.category);
    }
    if (query) {
      tools = tools.filter(
        (tool) =>
          tool.name.toLowerCase().includes(query) ||
          tool.tagline.toLowerCase().includes(query),
      );
    }
    return tools;
  }, [view.tools, urlState.category, query]);

  const selectedTool = useMemo(
    () => filteredTools.find((tool) => tool.id === urlState.tool) ?? null,
    [filteredTools, urlState.tool],
  );

  const summary = useMemo(() => {
    const newCount = view.tools.filter(
      (tool) => tool.ageHours !== null && tool.ageHours <= 24,
    ).length;
    return {
      total: view.tools.length,
      newInWindow: newCount,
      categories: view.clusters.length,
    };
  }, [view]);

  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const handleSelect = useCallback(
    (toolId: string) => {
      setUrlState({ tool: toolId, tab: "panoramica" });
      setHighlightedId(toolId);
    },
    [setUrlState],
  );

  const handleClosePreview = useCallback(() => {
    setUrlState({ tool: null });
    setHighlightedId(null);
  }, [setUrlState]);

  // §21 — Watch is the internal Radar action and works for BOTH signal types.
  // The key is the canonical Catalog slug when the signal is linked, otherwise
  // the source item id. No fake Catalog Tool is ever created.
  const watchKeys = useMemo(() => new Set(radarWatchSlugs), [radarWatchSlugs]);

  const handleToggleWatch = useCallback(
    (tool: RadarTool) => {
      toggleRadarWatchSlug(watchKeyFor(tool));
    },
    [toggleRadarWatchSlug],
  );

  // Keyboard: Escape closes the quick preview.
  useEffect(() => {
    if (!urlState.tool) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleClosePreview();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [urlState.tool, handleClosePreview]);

  const rangeLabel =
    RADAR_RANGE_OPTIONS.find((option) => option.key === urlState.range)?.label ??
    "Oggi";

  return (
    <div
      className="tv-rx"
      data-state={uiModel.state}
      data-tab={urlState.tab}
      data-qa-radar-auth={account.status}
      data-qa-radar-mode={urlState.tab}
      data-qa-radar-ready={!isLoading && uiModel.items.length > 0 ? "true" : "false"}
    >
      <header className="tv-rx__header">
        <p className="tv-rx__eyebrow">Radar</p>
        <h1 className="tv-rx__title">Cosa sta emergendo adesso</h1>
        <p className="tv-rx__lede">
          La tua mappa AI personale: esplora trend, scopri opportunit&agrave; e
          costruisci il tuo vantaggio con l&apos;AI.
        </p>
      </header>

      {/* §4 compact telemetry strip — real timestamps only (spec §22). */}
      <p className="tv-rx-telemetry" aria-live="polite">
        <span className="tv-rx-telemetry__dot" data-state={uiModel.state} aria-hidden="true" />
        <span className="tv-rx-telemetry__source">{view.snapshot.sourceLabel}</span>
        <span className="tv-rx-telemetry__sep" aria-hidden="true">
          &middot;
        </span>
        <span className="tv-rx-telemetry__state">{uiModel.statusLabel}</span>
        <span className="tv-rx-telemetry__sep" aria-hidden="true">
          &middot;
        </span>
        <span className="tv-rx-telemetry__range">{rangeLabel}</span>
        <span className="tv-rx-telemetry__time">
          Aggiornato {uiModel.updatedAtLabel}
        </span>
        <button
          type="button"
          className="tv-rx-telemetry__refresh"
          onClick={() => refetch()}
          disabled={isFetching}
          aria-label={isFetching ? "Aggiornamento in corso" : "Aggiorna i dati"}
          title={isFetching ? "Aggiornamento in corso" : "Aggiorna i dati"}
        >
          <RefreshCw size={13} aria-hidden="true" />
        </button>
      </p>

      {/* Mode tabs (spec §8) */}
      <div className="tv-rx__tabs" role="tablist" aria-label="Modalità Radar">
        {RADAR_TABS.map((tab: RadarTab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            id={`tv-rx-tab-${tab}`}
            aria-selected={urlState.tab === tab}
            aria-controls={`tv-rx-panel-${tab}`}
            className="tv-rx__tab"
            data-active={urlState.tab === tab ? "true" : undefined}
            onClick={() => setUrlState({ tab })}
          >
            {RADAR_TAB_LABEL[tab]}
          </button>
        ))}
      </div>

      {urlState.tab === "panoramica" ? (
        <div
          id="tv-rx-panel-panoramica"
          role="tabpanel"
          aria-labelledby="tv-rx-tab-panoramica"
          className="tv-rx__panel"
        >
          <div className="tv-rx__stage">
            <div className="tv-rx__main">
              {/* §2/§5 — the Radar is the hero: it renders before any control. */}
              {isLoading ? (
                <RadarMapSkeleton />
              ) : filteredTools.length === 0 ? (
                <RadarEmptyState
                  state={uiModel.state}
                  hasQuery={Boolean(query)}
                  onClear={() => setUrlState({ category: null, query: null })}
                />
              ) : (
                <RadarMap
                  tools={filteredTools}
                  clusters={view.clusters}
                  range={urlState.range}
                  selectedId={urlState.tool}
                  highlightedId={highlightedId}
                  onSelect={handleSelect}
                />
              )}

              {/* §8/§16 — one contextual filter system, below the map. */}
              <RadarToolbar
                categories={view.clusters}
                activeCategory={urlState.category}
                onCategory={(category) => setUrlState({ category })}
                query={urlState.query}
                onQuery={(q) => setUrlState({ query: q })}
              />

              {!isLoading && filteredTools.length > 0 ? <RadarLegend /> : null}

              {/* §12 — compact metrics rail, never competing with the map. */}
              <RadarSummaryMetrics
                total={summary.total}
                newInWindow={summary.newInWindow}
                categories={summary.categories}
              />

              <RadarInsightStrip view={view} />

              {filteredTools.length > 0 ? (
                <section className="tv-rx-section" aria-labelledby="tv-rx-list-title">
                  <header className="tv-rx-section__head">
                    <h2 id="tv-rx-list-title" className="tv-rx-section__title">
                      Tool nel Radar
                    </h2>
                    <p className="tv-rx-section__desc">
                      {filteredTools.length}{" "}
                      {filteredTools.length === 1 ? "segnale" : "segnali"}
                      {urlState.category ? " nella categoria selezionata" : " nel periodo"}
                    </p>
                  </header>
                  <ol className="tv-rx-list">
                    {filteredTools.map((tool, index) => (
                      <RadarToolRow
                        key={tool.id}
                        tool={tool}
                        index={index}
                        selected={urlState.tool === tool.id}
                        onSelect={handleSelect}
                        watched={watchKeys.has(watchKeyFor(tool))}
                        onToggleWatch={handleToggleWatch}
                      />
                    ))}
                  </ol>
                </section>
              ) : null}
            </div>

            {/* §19 — desktop intelligence rail: selected Tool preview when
                one is chosen, otherwise meaningful Overview intelligence.
                On mobile this stays the sticky quick-preview sheet. */}
            <aside className="tv-rx__rail" aria-label="Pannello intelligenza">
              {selectedTool ? (
                <RadarQuickPreview
                  tool={selectedTool}
                  historyAvailable={view.snapshot.historyAvailable}
                  watched={watchKeys.has(watchKeyFor(selectedTool))}
                  onToggleWatch={() => handleToggleWatch(selectedTool)}
                  onClose={handleClosePreview}
                />
              ) : (
                <RadarRailOverview
                  view={view}
                  tools={filteredTools}
                  rangeLabel={rangeLabel}
                  statusLabel={uiModel.statusLabel}
                  updatedAtLabel={uiModel.updatedAtLabel}
                  onSelect={handleSelect}
                />
              )}
            </aside>
          </div>
        </div>
      ) : null}

      {urlState.tab === "trend" ? (
        <div
          id="tv-rx-panel-trend"
          role="tabpanel"
          aria-labelledby="tv-rx-tab-trend"
          className="tv-rx__panel"
        >
          <RadarTrendPanel
            tools={view.tools}
            historyAvailable={view.snapshot.historyAvailable}
            rangeLabel={rangeLabel}
            onSelect={handleSelect}
          />
        </div>
      ) : null}

      {urlState.tab === "per-te" ? (
        <div
          id="tv-rx-panel-per-te"
          role="tabpanel"
          aria-labelledby="tv-rx-tab-per-te"
          className="tv-rx__panel"
        >
          <RadarPerTePanel
            tools={view.tools}
            workspace={workspace}
            catalog={catalogRaw ?? []}
            onSelect={handleSelect}
            onExploreTrend={() => setUrlState({ tab: "trend" })}
          />
        </div>
      ) : null}

      {urlState.tab === "watchlist" ? (
        <div
          id="tv-rx-panel-watchlist"
          role="tabpanel"
          aria-labelledby="tv-rx-tab-watchlist"
          className="tv-rx__panel"
        >
          <RadarWatchPanel
            tools={view.tools}
            watch={watch}
            categories={view.clusters}
            onToggleTool={toggleRadarWatchSlug}
            onToggleCategory={toggleRadarWatchCategory}
            onClear={clearRadarWatch}
          />
        </div>
      ) : null}

      <TinyAdzInlineSlot placement="radar-feed" />

      <details className="tv-rx-provenance">
        <summary>Informazioni sui dati</summary>
        <p>
          I segnali del Radar arrivano da <strong>Product Hunt</strong>: lanci
          reali ordinati per voti nel periodo selezionato. TooolVibes non misura
          l&apos;intero mercato AI in autonomia.
        </p>
        <p>
          Timestamp di origine: {uiModel.updatedAtLabel}. Le categorie derivano
          dal catalogo TooolVibes quando il tool è riconosciuto; altrimenti il
          segnale resta in &laquo;Altri segnali&raquo;.
        </p>
        <a
          href="https://www.producthunt.com/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Visita Product Hunt
        </a>
      </details>

      {/* Screen-reader alternate semantic list (spec §42). */}
      <section className="tv-rx-sr-list" aria-label="Elenco testuale dei segnali" role="region">
        <h2>Elenco dei segnali</h2>
        <ol>
          {filteredTools.map((tool) => (
            <li key={tool.id}>
              {tool.name} &mdash; {tool.category?.label ?? "Altri segnali"},{" "}
              {tool.votesCount} voti, {tool.commentsCount} commenti, posizione{" "}
              {tool.rank}.
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

/**
 * §19 — desktop intelligence rail when no Tool is selected.
 * Real current-snapshot signals only: never invented history or momentum.
 */
function RadarRailOverview({
  view,
  tools,
  rangeLabel,
  statusLabel,
  updatedAtLabel,
  onSelect,
}: {
  view: RadarView;
  tools: readonly RadarTool[];
  rangeLabel: string;
  statusLabel: string;
  updatedAtLabel: string;
  onSelect: (toolId: string) => void;
}) {
  const top = tools.slice(0, 4);
  return (
    <div className="tv-rx-rail">
      <section className="tv-rx-rail__block" aria-labelledby="tv-rx-rail-fresh">
        <h3 id="tv-rx-rail-fresh" className="tv-rx-rail__title">
          Fonte e freschezza
        </h3>
        <dl className="tv-rx-rail__dl">
          <div>
            <dt>Fonte</dt>
            <dd>{view.snapshot.sourceLabel}</dd>
          </div>
          <div>
            <dt>Stato</dt>
            <dd>{statusLabel}</dd>
          </div>
          <div>
            <dt>Aggiornato</dt>
            <dd>{updatedAtLabel}</dd>
          </div>
          <div>
            <dt>Finestra</dt>
            <dd>{rangeLabel}</dd>
          </div>
        </dl>
      </section>

      <section className="tv-rx-rail__block" aria-labelledby="tv-rx-rail-signals">
        <h3 id="tv-rx-rail-signals" className="tv-rx-rail__title">
          Segnali in evidenza
        </h3>
        {top.length === 0 ? (
          <p className="tv-rx-honest" role="status">
            Nessun segnale nel periodo selezionato.
          </p>
        ) : (
          <ol className="tv-rx-rail__list">
            {top.map((tool, index) => (
              <li key={tool.id}>
                <button
                  type="button"
                  className="tv-rx-rail__signal"
                  onClick={() => onSelect(tool.id)}
                >
                  <span className="tv-rx-rail__rank" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span>
                    <strong>{tool.name}</strong>
                    <span className="tv-rx-rail__meta">
                      {tool.category?.label ?? "Altri segnali"}
                    </span>
                  </span>
                  <span className="tv-rx-rail__signal-value">
                    {tool.votesCount} voti
                  </span>
                </button>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="tv-rx-rail__block" aria-labelledby="tv-rx-rail-cats">
        <h3 id="tv-rx-rail-cats" className="tv-rx-rail__title">
          Aree Radar attive
        </h3>
        <ul className="tv-rx-rail__cats">
          {view.clusters.map((category) => (
            <li key={category.id}>
              <span
                className="tv-rx-rail__swatch"
                data-color-index={category.colorIndex}
                aria-hidden="true"
              />
              {category.label}
              <span className="tv-rx-rail__count">{category.count}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

/**
 * Watch key for any signal type: the canonical Catalog slug when the signal is
 * catalog-linked, otherwise the real source item id. Never invents a Catalog
 * entity for an external signal (spec §21).
 */
function watchKeyFor(tool: RadarTool): string {
  return tool.catalogSlug ?? tool.id;
}

function RadarToolbar({
  categories,
  activeCategory,
  onCategory,
  query,
  onQuery,
}: {
  categories: readonly { id: string; label: string; count: number }[];
  activeCategory: string | null;
  onCategory: (category: string | null) => void;
  query: string | null;
  onQuery: (query: string | null) => void;
}) {
  return (
    <div className="tv-rx-toolbar">
      <ul className="tv-rx-chips" aria-label="Filtra per categoria">
        <li>
          <button
            type="button"
            className="tv-rx-chip"
            data-active={activeCategory === null ? "true" : undefined}
            aria-pressed={activeCategory === null}
            onClick={() => onCategory(null)}
          >
            Tutti
          </button>
        </li>
        {categories.map((category) => (
          <li key={category.id}>
            <button
              type="button"
              className="tv-rx-chip"
              data-active={activeCategory === category.id ? "true" : undefined}
              aria-pressed={activeCategory === category.id}
              onClick={() => onCategory(category.id)}
            >
              {category.label} {category.count}
            </button>
          </li>
        ))}
      </ul>

      <label className="tv-rx-search">
        <span className="tv-rx-sr-only">Cerca un tool nel Radar</span>
        <Search size={13} aria-hidden="true" />
        <input
          type="search"
          value={query ?? ""}
          onChange={(event) => onQuery(event.target.value || null)}
          placeholder="Cerca nel Radar"
        />
      </label>
    </div>
  );
}

function RadarSummaryMetrics({
  total,
  newInWindow,
  categories,
}: {
  total: number;
  newInWindow: number;
  categories: number;
}) {
  return (
    <dl className="tv-rx-metrics">
      <div>
        <dt>Tool nel Radar</dt>
        <dd>{total}</dd>
      </div>
      <div>
        <dt>Nuovi nelle 24h</dt>
        <dd>{newInWindow}</dd>
      </div>
      <div>
        <dt>Aree attive</dt>
        <dd>{categories}</dd>
      </div>
    </dl>
  );
}

function RadarMapSkeleton() {
  return (
    <div className="tv-rx-map tv-rx-map--skeleton" aria-busy="true" aria-label="Caricamento della mappa">
      <div className="tv-rx-map__rings" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}

function RadarEmptyState({
  state,
  hasQuery,
  onClear,
}: {
  state: string;
  hasQuery: boolean;
  onClear: () => void;
}) {
  if (state === "error" || state === "missing-token") {
    return (
      <div className="tv-rx-state" role="status">
        <h2>Segnali non disponibili</h2>
        <p>
          La fonte non risponde in questo momento. Nessun dato simulato: riprova
          più tardi o esplora il Catalogo.
        </p>
        <a href="/archivio">Vai al Catalogo</a>
      </div>
    );
  }
  if (state === "empty") {
    return (
      <div className="tv-rx-state" role="status">
        <h2>Nessun segnale nel periodo</h2>
        <p>Prova un periodo più ampio oppure esplora il Catalogo.</p>
        <a href="/archivio">Vai al Catalogo</a>
      </div>
    );
  }
  return (
    <div className="tv-rx-state" role="status">
      <h2>Nessun risultato</h2>
      <p>
        {hasQuery
          ? "Nessun tool del Radar corrisponde alla ricerca."
          : "Nessun tool in questa categoria."}
      </p>
      <button type="button" onClick={onClear}>
        Azzera filtri
      </button>
    </div>
  );
}
