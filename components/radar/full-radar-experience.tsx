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
import { CatalogoFacetHead } from "@/components/archive/catalogo-facet-head";
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
import { buildRadarView, UNCATEGORIZED_CATEGORY_ID } from "@/lib/radar/radar-domain";
import { layoutRadarPoints } from "@/lib/radar/radar-geometry";
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

  const layout = useMemo(() => layoutRadarPoints(view.tools), [view.tools]);

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
      tools = tools.filter((tool) => {
        if (urlState.category === UNCATEGORIZED_CATEGORY_ID) {
          return tool.category === null || tool.category.id === UNCATEGORIZED_CATEGORY_ID;
        }
        return tool.category?.id === urlState.category;
      });
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
      categories: view.categories.length,
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

  // Keyboard: Escape closes the quick preview.
  useEffect(() => {
    if (!urlState.tool) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleClosePreview();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [urlState.tool, handleClosePreview]);

  const radiusBasis = layout.radiusBasis;
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
        <CatalogoFacetHead active="radar" />
      </header>

      {/* Freshness (spec §22) — real timestamps only. */}
      <p className="tv-rx__freshness" aria-live="polite">
        <span className="tv-rx__freshness-dot" data-state={uiModel.state} aria-hidden="true" />
        <span>
          Fonte: {view.snapshot.sourceLabel} &middot; {rangeLabel} &middot;{" "}
          {uiModel.statusLabel}
        </span>
        <span className="tv-rx__freshness-time">
          Aggiornato {uiModel.updatedAtLabel}
        </span>
        <button
          type="button"
          className="tv-rx__refresh"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw size={12} aria-hidden="true" />
          {isFetching ? "Aggiornamento in corso…" : "Aggiorna i dati"}
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
          <RadarToolbar
            categories={view.categories}
            activeCategory={urlState.category}
            onCategory={(category) => setUrlState({ category })}
            query={urlState.query}
            onQuery={(q) => setUrlState({ query: q })}
          />

          {isLoading ? (
            <RadarMapSkeleton />
          ) : filteredTools.length === 0 ? (
            <RadarEmptyState
              state={uiModel.state}
              hasQuery={Boolean(query)}
              onClear={() => setUrlState({ category: null, query: null })}
            />
          ) : (
            <>
              <RadarMap
                tools={filteredTools}
                categories={view.categories}
                selectedId={urlState.tool}
                highlightedId={highlightedId}
                onSelect={handleSelect}
              />
              <RadarLegend radiusBasis={radiusBasis} />
            </>
          )}

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
                  {filteredTools.length} {filteredTools.length === 1 ? "segnale" : "segnali"}
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
                  />
                ))}
              </ol>
            </section>
          ) : null}
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
            categories={view.categories}
            onToggleTool={toggleRadarWatchSlug}
            onToggleCategory={toggleRadarWatchCategory}
            onClear={clearRadarWatch}
          />
        </div>
      ) : null}

      {selectedTool ? (
        <RadarQuickPreview
          tool={selectedTool}
          historyAvailable={view.snapshot.historyAvailable}
          onClose={handleClosePreview}
        />
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
        <dt>Categorie attive</dt>
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
