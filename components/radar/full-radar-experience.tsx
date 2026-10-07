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

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, RefreshCw, Search } from "lucide-react";

import { TinyAdzInlineSlot } from "@/components/ads/tinyadz-inline-slot";
import { useAccount } from "@/components/account/account-provider";
import { RadarLegend } from "@/components/radar/radar-legend";
import { RadarMap, type RadarTapCandidate } from "@/components/radar/radar-map";
import {
  layoutRadarPoints,
  RADAR_RANGE_HOURS,
} from "@/lib/radar/radar-geometry";
import {
  RADAR_ZOOM_DEFAULT_MAP_PX,
  RADAR_ZOOM_TARGET_GAP_PX,
} from "@/lib/radar/radar-camera";
import { planRadarSpiderfy, type RadarSpiderGroup } from "@/lib/radar/radar-spiderfy";
import {
  planRadarSectorLens,
  type RadarLensItem,
  type RadarLensPlan,
} from "@/lib/radar/radar-lens";
import type { RadarPoint2 } from "@/lib/radar/radar-projection";
import {
  planRadarClusterFocus,
  planRadarOverview,
  RADAR_OVERVIEW_BUDGET_MOBILE,
  RADAR_OVERVIEW_BUDGET_DESKTOP,
  type RadarLodInput,
  type RadarLodPlan,
} from "@/lib/radar/radar-lod";
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
  // §1 — a genuinely ambiguous tap opens a chooser instead of guessing.
  const [ambiguous, setAmbiguous] = useState<readonly RadarTapCandidate[]>([]);
  // Closure §4 — a collision group too large to fan out safely presents as the
  // fallback bottom sheet instead of spiderfying.
  const [chooserGroup, setChooserGroup] = useState<RadarSpiderGroup | null>(null);
  const chooserRef = useRef<HTMLDivElement | null>(null);
  const mapFocusRef = useRef<HTMLElement | null>(null);

  // §10 — geometry is ALWAYS computed from the full dataset. LOD and cluster
  // focus only decide what is painted, never where anything sits.
  const rangeHours = RADAR_RANGE_HOURS[urlState.range] ?? RADAR_RANGE_HOURS.day;
  const layout = useMemo(
    () => layoutRadarPoints(view.tools, { rangeHours }),
    [view.tools, rangeHours],
  );

  const lodInputs = useMemo<RadarLodInput[]>(() => {
    const byId = new Map(layout.points.map((point) => [point.id, point]));
    return view.tools.map((tool) => {
      const point = byId.get(tool.id);
      return {
        id: tool.id,
        clusterId: tool.topicCluster.id,
        attention: tool.attention,
        ageHours: tool.ageHours,
        catalogStatus: tool.catalogStatus,
        semanticAngleDeg: point?.semanticAngleDeg ?? 0,
        radiusRatio: point?.radiusRatio ?? 0,
      };
    });
  }, [layout.points, view.tools]);

  // §3 — Level-0 OVERVIEW is CLUSTER-FIRST: one lead real signal per active
  // cluster plus catalog-linked exceptions. Free-standing +N stacks are no
  // longer spatial objects; the hidden count rides on the cluster chip and a
  // small "+N" badge on the representative node. Target 6-9 nodes on mobile.
  const overviewBudget = useIsWideViewport()
    ? RADAR_OVERVIEW_BUDGET_DESKTOP
    : RADAR_OVERVIEW_BUDGET_MOBILE;

  const overviewPlan = useMemo(
    () => planRadarOverview(lodInputs, { budget: overviewBudget }),
    [lodInputs, overviewBudget],
  );

  // §4 — `urlState.category` IS the canonical cluster focus state. Tapping a
  // chip and tapping a sector rim are exactly the same mode.
  const focusedClusterId = urlState.category;

  // §7 — Cluster Focus shows EVERY real signal of the cluster and keeps one
  // dimmed, non-interactive contextual representative per other cluster. The
  // cluster-first Overview supplies those representatives (no free stacks).
  const focusOverview = useMemo<RadarLodPlan>(
    () => ({
      individualIds: overviewPlan.representativeIds,
      aggregates: [],
      budget: overviewPlan.budget,
      perClusterCap: 1,
      algorithm: overviewPlan.algorithm,
    }),
    [overviewPlan],
  );

  const focusPlan = useMemo(
    () =>
      focusedClusterId
        ? planRadarClusterFocus(lodInputs, focusedClusterId, focusOverview)
        : null,
    [focusedClusterId, lodInputs, focusOverview],
  );

  const renderIds = useMemo(
    () => (focusPlan ? focusPlan.visibleIds : overviewPlan.representativeIds),
    [focusPlan, overviewPlan.representativeIds],
  );

  // §3 — hidden counts only exist in the Overview representation.
  const hiddenCounts = useMemo(
    () => (focusPlan ? null : overviewPlan.hiddenCounts),
    [focusPlan, overviewPlan.hiddenCounts],
  );

  // §6 — only the focused cluster is interactive while it is focused.
  const interactiveIds = useMemo(
    () => (focusPlan ? focusPlan.interactiveIds : null),
    [focusPlan],
  );

  // Spec §4-§8 — the SECTOR LENS. A display-only angular magnification of the
  // focused cluster's permanent 45 degree semantic sector into 120-220 degrees
  // of display space. The semantic coordinates are never recomputed and RADIUS
  // still encodes age (spec §5). The smallest lens width that yields a 12px
  // marker gap wins (spec §7); residuals get a bounded local display relaxation
  // (spec §9).
  const pointById = useMemo(
    () => new Map(layout.points.map((point) => [point.id, point])),
    [layout.points],
  );

  const lensItems = useMemo<RadarLensItem[]>(() => {
    if (!focusedClusterId) return [];
    return layout.points
      .filter((point) => point.clusterId === focusedClusterId)
      .map((point) => ({
        id: point.id,
        clusterId: point.clusterId,
        semanticAngleDeg: point.semanticAngleDeg,
        radiusRatio: point.radiusRatio,
        radius: point.size,
      }));
  }, [focusedClusterId, layout.points]);

  const lensPlan = useMemo<RadarLensPlan | null>(() => {
    if (!focusedClusterId || lensItems.length === 0) return null;
    return planRadarSectorLens(lensItems, {
      clusterId: focusedClusterId,
      rect: {
        left: 0,
        top: 0,
        width: RADAR_ZOOM_DEFAULT_MAP_PX,
        height: RADAR_ZOOM_DEFAULT_MAP_PX,
      },
      outerRadius: 42,
      center: { x: 50, y: 50 },
    });
  }, [focusedClusterId, lensItems]);

  // Spec §10 — spiderfy is LAST RESORT: only the anchors the lens and its
  // relaxation could not separate.
  const spider = useMemo(() => {
    if (!lensPlan || lensPlan.residualCollisionIds.length < 2) return null;
    const residual = new Set(lensPlan.residualCollisionIds);
    const nodes = lensPlan.nodes
      .filter((node) => residual.has(node.id))
      .map((node) => ({
        id: node.id,
        x: node.displayX,
        y: node.displayY,
        radius: pointById.get(node.id)?.size ?? 1.5,
      }));
    if (nodes.length < 2) return null;
    const plan = planRadarSpiderfy(nodes, {
      joinGap: (RADAR_ZOOM_TARGET_GAP_PX * 100) / RADAR_ZOOM_DEFAULT_MAP_PX,
    });
    return plan.groups.length > 0 || plan.chooserGroups.length > 0 ? plan : null;
  }, [lensPlan, pointById]);

  // Spec §1/§3 — ONE display map for painting AND hit-testing.
  const displayOverrides = useMemo<Map<string, RadarPoint2>>(() => {
    const map = new Map<string, RadarPoint2>();
    for (const node of lensPlan?.nodes ?? []) {
      map.set(node.id, { x: node.displayX, y: node.displayY });
    }
    for (const group of spider?.groups ?? []) {
      for (const leg of group.legs) {
        map.set(leg.id, { x: leg.displayX, y: leg.displayY });
      }
    }
    return map;
  }, [lensPlan, spider]);

  // Spec §4 — the Sector Lens replaces the old camera zoom as the separation
  // mechanism, so there is exactly one transform at a time.
  const camera = null;

  const [spiderCollapsed, setSpiderCollapsed] = useState(false);
  useEffect(() => {
    setSpiderCollapsed(false);
  }, [focusedClusterId, urlState.range]);

  // §18 — if the focused cluster has no signals in the newly selected range,
  // return to Overview instead of leaving the camera pointing at nothing.
  useEffect(() => {
    if (!focusedClusterId) return;
    const stillPresent = view.tools.some(
      (tool) => tool.topicCluster.id === focusedClusterId,
    );
    if (!stillPresent) setUrlState({ category: null });
  }, [focusedClusterId, setUrlState, view.tools]);
  // Closure §6 — exclusive overlay: spiderfy, chooser and Tool preview never
  // appear together. Choosing a Tool closes the collision presentation first.
  const collisionOverlayOpen = chooserGroup !== null || ambiguous.length >= 2;
  const activeSpider =
    spiderCollapsed || collisionOverlayOpen || Boolean(urlState.tool) ? null : spider;

  const handleSelectSector = useCallback(
    (clusterId: string) => {
      setUrlState({ category: clusterId === urlState.category ? null : clusterId });
    },
    [setUrlState, urlState.category],
  );

  const handleCollapseSpider = useCallback(() => {
    setSpiderCollapsed(true);
  }, []);

  const handleSelectChooserGroup = useCallback(
    (groupKey: string) => {
      const group = spider?.chooserGroups.find((entry) => entry.key === groupKey);
      if (!group) return;
      // Closure §6 — opening the sheet dismisses any Tool preview and spider.
      mapFocusRef.current =
        (document.activeElement as HTMLElement | null) ?? null;
      setAmbiguous([]);
      setUrlState({ tool: null });
      setChooserGroup(group);
    },
    [setUrlState, spider],
  );

  const handleAmbiguous = useCallback((candidates: readonly RadarTapCandidate[]) => {
    // Closure §6 — a genuine ambiguity supersedes a fanned group and any
    // preview; the sheet is the single visible overlay.
    mapFocusRef.current =
      (document.activeElement as HTMLElement | null) ?? null;
    setChooserGroup(null);
    setSpiderCollapsed(true);
    setUrlState({ tool: null });
    setAmbiguous(candidates);
  }, [setUrlState]);

  const handleChooseAmbiguous = useCallback(
    (toolId: string) => {
      setAmbiguous([]);
      setChooserGroup(null);
      setUrlState({ tool: toolId, tab: "panoramica" });
      setHighlightedId(toolId);
    },
    [setUrlState],
  );

  const handleDismissChooser = useCallback(() => {
    setAmbiguous([]);
    setChooserGroup(null);
    // Closure §7 — focus returns to the originating Radar context.
    const target = mapFocusRef.current ?? document.querySelector<HTMLElement>(".tv-rx-map__svg");
    target?.focus?.();
    mapFocusRef.current = null;
  }, []);

  const handleSelect = useCallback(
    (toolId: string) => {
      // Closure §6 — close the collision presentation, then open the preview.
      setAmbiguous([]);
      setChooserGroup(null);
      setSpiderCollapsed(true);
      setUrlState({ tool: toolId, tab: "panoramica" });
      setHighlightedId(toolId);
    },
    [setUrlState],
  );

  const handleClosePreview = useCallback(() => {
    setUrlState({ tool: null });
    setHighlightedId(null);
    setAmbiguous([]);
    setChooserGroup(null);
  }, [setUrlState]);

  // Closure §7 — the fallback sheet takes focus while open, Escape closes it,
  // and focus returns to the Radar when it goes away.
  useEffect(() => {
    const open = chooserGroup !== null || ambiguous.length >= 2;
    if (!open) return;
    chooserRef.current?.querySelector<HTMLElement>("button")?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      handleDismissChooser();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [chooserGroup, ambiguous.length, handleDismissChooser]);

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
      if (event.key === "Escape" && chooserGroup === null && ambiguous.length === 0) {
        handleClosePreview();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [urlState.tool, handleClosePreview, chooserGroup, ambiguous.length]);

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
        <span
          className="tv-rx-range"
          role="group"
          aria-label="Intervallo temporale"
        >
          {RADAR_RANGE_OPTIONS.map((option) => (
            <button
              key={option.key}
              type="button"
              className="tv-rx-range__option"
              data-active={option.key === urlState.range ? "true" : undefined}
              aria-pressed={option.key === urlState.range}
              onClick={() => setUrlState({ range: option.key })}
            >
              {option.label}
            </button>
          ))}
        </span>
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
                <>
                  <RadarMap
                    layoutTools={view.tools}
                    visibleIds={renderIds}
                    interactiveIds={interactiveIds}
                    hiddenCounts={hiddenCounts}
                    camera={camera}
                    displayOverrides={displayOverrides}
                    spider={activeSpider}
                    onSelectSector={handleSelectSector}
                    onCollapseSpider={handleCollapseSpider}
                    focusedClusterId={focusedClusterId}
                    clusters={view.clusters}
                    range={urlState.range}
                    selectedId={urlState.tool}
                    highlightedId={highlightedId}
                    onSelect={handleSelect}
                    onAmbiguous={handleAmbiguous}
                    onSelectChooserGroup={handleSelectChooserGroup}
                  />
                  <RadarAmbiguityChooser
                    panelRef={chooserRef}
                    tools={view.tools}
                    entries={
                      chooserGroup
                        ? chooserGroup.memberIds.map((id) => ({ id, ageHours: null }))
                        : ambiguous.map((candidate) => ({
                            id: candidate.point.id,
                            ageHours: candidate.point.ageHours,
                          }))
                    }
                    onChoose={handleChooseAmbiguous}
                    onDismiss={handleDismissChooser}
                  />
                </>
              )}

              {/* Spec §19 — a compact contextual indicator, integrated with
                  the existing controls rather than another large card. */}
              {focusedClusterId ? (
                <div className="tv-rx-focusbar">
                  <p className="tv-rx-focusbar__label">
                    <span
                      className="tv-rx-chip__swatch"
                      data-color-index={
                        view.clusters.find((c) => c.id === focusedClusterId)
                          ?.colorIndex ?? 0
                      }
                      aria-hidden="true"
                    />
                    <span>
                      {view.clusters.find((c) => c.id === focusedClusterId)
                        ?.label ?? focusedClusterId}
                      {" · "}
                      {lensItems.length} {lensItems.length === 1 ? "segnale" : "segnali"}
                    </span>
                  </p>
                  <button
                    type="button"
                    className="tv-rx-focusbar__back"
                    onClick={() => setUrlState({ category: null })}
                  >
                    <ArrowLeft size={13} aria-hidden="true" />
                    Panoramica
                  </button>
                </div>
              ) : null}

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
              {selectedTool && ambiguous.length === 0 ? (
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
/**
 * §3/§24 — the overview display budget is a viewport budget: mobile shows a
 * calmer instrument, desktop a larger one, and neither shows every signal.
 */
const RADAR_WIDE_VIEWPORT_QUERY = "(min-width: 64rem)";

function useIsWideViewport(): boolean {
  const [wide, setWide] = useState(false);
  useEffect(() => {
    // Guarded: `matchMedia` is absent during SSR and in some test runtimes.
    // Falling back to the mobile budget is the safe default.
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }
    const media = window.matchMedia(RADAR_WIDE_VIEWPORT_QUERY);
    const sync = () => setWide(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);
  return wide;
}

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
  categories: readonly {
    id: string;
    label: string;
    count: number;
    colorIndex?: number;
  }[];
  activeCategory: string | null;
  onCategory: (category: string | null) => void;
  query: string | null;
  onQuery: (query: string | null) => void;
}) {
  const chipsRef = useRef<HTMLUListElement | null>(null);

  // §15 — bring the active chip into the horizontal centre (smooth unless the
  // user prefers reduced motion).
  useEffect(() => {
    const list = chipsRef.current;
    if (!list || activeCategory === null) return;
    const active = list.querySelector<HTMLElement>('[data-active="true"]');
    if (!active || typeof active.scrollIntoView !== "function") return;
    const reduce =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    active.scrollIntoView({
      behavior: reduce ? "auto" : "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [activeCategory]);

  return (
    <div className="tv-rx-toolbar">
      <div className="tv-rx-chips-wrap">
      <ul className="tv-rx-chips" ref={chipsRef} aria-label="Filtra per categoria">
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
              {/* §15 — a small cluster-colour swatch ties the chip to its
                  sector and blips. Never a full bright fill. */}
              <span
                className="tv-rx-chip__swatch"
                data-color-index={category.colorIndex ?? 0}
                aria-hidden="true"
              />
              {category.label} {category.count}
            </button>
          </li>
        ))}
      </ul>
      </div>

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

/**
 * §1 — ambiguity chooser. Appears only when two hit targets are genuinely
 * indistinguishable at the tapped pixel. Never guesses, never hides options.
 */
/**
 * Closure §4/§5 — the FALLBACK bottom sheet. It is no longer the primary
 * dense-point interaction (that is spiderfy); it is used for a collision group
 * larger than RADAR_SPIDER_MAX_GROUP and for genuinely indistinguishable taps.
 *
 * §5 touch quality: every option is a real <button>, at least 52px tall, and
 * carries Tool name, Radar area, age and attention. Text selection is disabled
 * on these interactive controls only — never globally.
 */
function RadarAmbiguityChooser({
  entries,
  tools,
  onChoose,
  onDismiss,
  panelRef,
}: {
  entries: readonly { id: string; ageHours: number | null }[];
  tools: readonly RadarTool[];
  onChoose: (toolId: string) => void;
  onDismiss: () => void;
  panelRef?: React.RefObject<HTMLDivElement | null>;
}) {
  if (entries.length < 2) return null;
  const toolById = new Map(tools.map((tool) => [tool.id, tool]));
  return (
    <div
      ref={panelRef}
      className="tv-rx-chooser"
      role="dialog"
      aria-modal="true"
      aria-label={`${entries.length} segnali in questo punto`}
    >
      <p className="tv-rx-chooser__title">
        {entries.length} segnali in questo punto
      </p>
      <ul className="tv-rx-chooser__list">
        {entries.map((entry) => {
          const tool = toolById.get(entry.id);
          const ageHours = entry.ageHours ?? tool?.ageHours ?? null;
          return (
            <li key={entry.id}>
              <button
                type="button"
                className="tv-rx-chooser__option"
                onClick={() => onChoose(entry.id)}
              >
                <span className="tv-rx-chooser__name">
                  {tool?.name ?? entry.id}
                </span>
                {/* Closure §5 — compact context only: area, age, attention,
                    with the entity type shown subtly when useful. */}
                <span className="tv-rx-chooser__meta">
                  {tool?.topicCluster.label ?? "—"}
                  {ageHours !== null ? ` · ${formatChooserAge(ageHours)}` : ""}
                  {tool ? ` · ${tool.votesCount}v ${tool.commentsCount}c` : ""}
                  {tool?.catalogStatus === "linked" ? " · catalogo" : ""}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <button type="button" className="tv-rx-chooser__dismiss" onClick={onDismiss}>
        Annulla
      </button>
    </div>
  );
}

function formatChooserAge(ageHours: number | null): string {
  if (ageHours === null || !Number.isFinite(ageHours)) return "età ignota";
  if (ageHours < 1) return "<1h";
  if (ageHours < 48) return `${Math.round(ageHours)}h`;
  return `${Math.round(ageHours / 24)}g`;
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
