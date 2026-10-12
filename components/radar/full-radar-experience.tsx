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
import { ArrowLeft, ChartNoAxesColumn, Eye, Radar, RefreshCw, Search, Sparkles } from "lucide-react";
import { MetricStrip } from "@/components/ui/metric-strip";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { RadarSnapshotPanel } from "@/components/radar/radar-snapshot-panel";

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
import type { RadarPoint2 } from "@/lib/radar/radar-projection";
import type { RadarLocalFocusSignal } from "@/lib/radar/radar-local-focus";
import { planRadarAtlasConstellation } from "@/lib/radar/radar-atlas-constellation";
import { ATLAS_MICRO_PAGE_SIZE, atlasMobileGlobalIds, atlasMobileRadii, planAtlasMicroFocus, planAtlasMobile, type AtlasMobileSignal } from "@/lib/radar/radar-atlas-mobile";
import {
  planRadarOverview,
  type RadarLodInput,
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
} from "@/lib/radar/radar-domain";
import {
  RADAR_TABS,
  RADAR_TAB_LABEL,
  type RadarUrlState,
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
  const { state: urlState, setState: patchUrlState } = useRadarUrlState();
  const setUrlState = useCallback((patch: Partial<RadarUrlState>) => {
    const contextChanged = (["range", "category", "query", "tab"] as const)
      .some(key => patch[key] !== undefined && patch[key] !== urlState[key]);
    patchUrlState(contextChanged && patch.tool === undefined ? { ...patch, tool: null } : patch);
  }, [patchUrlState, urlState]);
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
    () =>
      buildRadarView({ ...snapshotMeta, items: [...uiModel.items] }, catalog, {
        now: Date.parse(snapshotMeta.updatedAt) || undefined,
      }),
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
  useEffect(() => {
    if (!urlState.tool) setHighlightedId(null);
  }, [urlState.tool]);
  // §1 — a genuinely ambiguous tap opens a chooser instead of guessing.
  const [ambiguous, setAmbiguous] = useState<readonly RadarTapCandidate[]>([]);
  // Closure §4 — a collision group too large to fan out safely presents as the
  // fallback bottom sheet instead of spiderfying.
  const [chooserGroup, setChooserGroup] = useState<RadarSpiderGroup | null>(null);
  const atlasInstrumentRef = useRef<HTMLElement | null>(null);
  const [atlasMapWidth, setAtlasMapWidth] = useState(256);
  const [mobileAtlas, setMobileAtlas] = useState(false);
  const [microStackId, setMicroStackId] = useState<string | null>(null);
  const [microPage, setMicroPage] = useState(0);
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const media = window.matchMedia("(max-width: 1023px)");
    const sync = () => setMobileAtlas(media.matches);
    sync();
    media.addEventListener?.("change", sync);
    return () => media.removeEventListener?.("change", sync);
  }, []);
  useEffect(() => {
    setMicroStackId(null);
    setMicroPage(0);
  }, [urlState.category, urlState.range, urlState.query, urlState.tab]);
  useEffect(() => {
    const instrument = atlasInstrumentRef.current;
    if (!instrument) return;
    const sync = () => {
      const width = instrument.querySelector(".tv-rx-map")?.getBoundingClientRect().width;
      if (width && width > 0) setAtlasMapWidth(width);
    };
    sync();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(sync);
    observer.observe(instrument);
    return () => observer.disconnect();
  }, [isLoading, urlState.tab]);

  const chooserRef = useRef<HTMLDivElement | null>(null);
  const mapFocusRef = useRef<HTMLElement | null>(null);
  const selectionFocusRef = useRef<HTMLElement | null>(null);
  const inspectionScrollRef = useRef<{ shell: HTMLElement | null; top: number; windowY: number } | null>(null);

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

  // Atlas Global: one real lead per active territory. The existing lead pass
  // fills this budget exactly, so catalog extras stay available in Local/list.
  const overviewPlan = useMemo(
    () => planRadarOverview(lodInputs, { budget: new Set(lodInputs.map(item => item.clusterId)).size }),
    [lodInputs],
  );

  // §4 — `urlState.category` IS the canonical cluster focus state. Tapping a
  // chip and tapping a sector rim are exactly the same mode.
  const focusedClusterId = urlState.category;

  // §2/§3 — LOCAL CLUSTER MODE: when a cluster is focused, render ONLY its
  // real signals (no non-focused Tool ghosts). Every focused signal is
  // interactive.
  const localSignalIds = useMemo(() => {
    if (!focusedClusterId) return null;
    return new Set(
      layout.points
        .filter((point) => point.clusterId === focusedClusterId)
        .map((point) => point.id),
    );
  }, [focusedClusterId, layout.points]);

  const baseRenderIds = useMemo(
    () => query ? new Set(filteredTools.map(tool => tool.id)) : localSignalIds ?? overviewPlan.representativeIds,
    [query, filteredTools, localSignalIds, overviewPlan.representativeIds],
  );

  // §3 — hidden counts only exist in the Overview representation.
  const hiddenCounts = useMemo(
    () => (focusedClusterId || query ? null : overviewPlan.hiddenCounts),
    [focusedClusterId, query, overviewPlan.hiddenCounts],
  );

  // §6 — only the focused cluster is interactive while it is focused.
  const baseInteractiveIds = useMemo(() => query ? baseRenderIds : localSignalIds, [query, baseRenderIds, localSignalIds]);

  // §2 — LOCAL CLUSTER PLANNER. All real signals of the focused cluster are
  // laid out by the deterministic Atlas angular planner. Semantic
  // coordinates are never recomputed; only display angles move. The planner
  // output feeds the canonical display-override channel used for BOTH painting
  // and hit-testing.
  const pointById = useMemo(
    () => new Map(layout.points.map((point) => [point.id, point])),
    [layout.points],
  );

  const localSignals = useMemo<RadarLocalFocusSignal[]>(() => {
    if (!focusedClusterId) return [];
    return layout.points
      .filter((point) => point.clusterId === focusedClusterId)
      .map((point) => ({
        id: point.id,
        semanticAngle: point.semanticAngleDeg,
        radiusRatio: point.radiusRatio,
        radius: point.size,
      }));
  }, [focusedClusterId, layout.points]);

  const mobileSignals = useMemo<AtlasMobileSignal[]>(() => localSignals.map(signal => {
    const tool = view.tools.find(tool => tool.id === signal.id)!;
    return { ...signal, attention: tool.attention, ageHours: tool.ageHours };
  }).filter(signal => !query || filteredTools.some(tool => tool.id === signal.id)), [localSignals, view.tools, query, filteredTools]);
  const mobilePlan = useMemo(() => mobileAtlas && focusedClusterId ? planAtlasMobile(mobileSignals, atlasMapWidth) : null, [mobileAtlas, focusedClusterId, mobileSignals, atlasMapWidth]);
  const microStack = mobilePlan?.stacks.find(stack => stack.id === microStackId) ?? null;
  const leaveMicroFocus = useCallback(() => {
    const stackId = microStackId;
    setMicroStackId(null);
    setMicroPage(0);
    requestAnimationFrame(() => {
      const stack = Array.from(atlasInstrumentRef.current?.querySelectorAll<SVGElement>("[data-atlas-stack]") ?? []).find(node => node.dataset.atlasStack === stackId);
      stack?.focus({ preventScroll: true });
    });
  }, [microStackId]);
  const microPositions = useMemo(() => microStack ? planAtlasMicroFocus(microStack.memberIds, microPage) : null, [microStack, microPage]);
  const renderIds = useMemo(() => {
    if (!mobileAtlas) return baseRenderIds;
    if (microPositions) return new Set(microPositions.keys());
    if (mobilePlan) return mobilePlan.visibleIds;
    const candidates = layout.points.filter(point => baseRenderIds.has(point.id)).map(point => ({ ...point, attention: view.tools.find(tool => tool.id === point.id)!.attention }));
    return atlasMobileGlobalIds(candidates, atlasMapWidth);
  }, [mobileAtlas, baseRenderIds, microPositions, mobilePlan, layout.points, view.tools, atlasMapWidth]);
  const interactiveIds = mobileAtlas ? renderIds : baseInteractiveIds;
  const mobileRadii = useMemo(() => {
    if (!mobileAtlas) return null;
    if (microPositions) return atlasMobileRadii(mobileSignals.filter(s => microPositions.has(s.id)), atlasMapWidth);
    if (mobilePlan) return mobilePlan.radii;
    return atlasMobileRadii(layout.points.map(p => ({...p, semanticAngle:p.semanticAngleDeg, radius:p.size, attention:view.tools.find(t=>t.id===p.id)!.attention})), atlasMapWidth, false);
  }, [mobileAtlas, microPositions, mobileSignals, mobilePlan, atlasMapWidth, layout.points, view.tools]);

  const localPlan = useMemo(() => {
    if (mobileAtlas || !focusedClusterId || localSignals.length === 0) return null;
    return planRadarAtlasConstellation(localSignals, { rect: { left: 0, top: 0, width: atlasMapWidth, height: atlasMapWidth } });
  }, [mobileAtlas, focusedClusterId, localSignals, atlasMapWidth]);

  // §14 — residual collision: the existing spiderfy/chooser fallback handles
  // physically impossible packings; the angular planner reports them explicitly.
  const spider = useMemo(() => {
    if (!localPlan || localPlan.layoutStatus !== "residual-collision") return null;
    const nodes = localPlan.nodes.map((node) => ({
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
  }, [localPlan, pointById]);

  // Spec §1/§3 — ONE display map for painting AND hit-testing.
  const displayOverrides = useMemo<Map<string, RadarPoint2>>(() => {
    if (mobileAtlas) return microPositions ?? mobilePlan?.positions ?? new Map<string, RadarPoint2>();
    const map = new Map<string, RadarPoint2>();
    for (const node of localPlan?.nodes ?? []) {
      map.set(node.id, { x: node.displayX, y: node.displayY });
    }
    for (const group of spider?.groups ?? []) {
      for (const leg of group.legs) {
        map.set(leg.id, { x: leg.displayX, y: leg.displayY });
      }
    }
    return map;
  }, [mobileAtlas, microPositions, mobilePlan, localPlan, spider]);

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
    if (isLoading || !focusedClusterId) return;
    const stillPresent = view.tools.some(
      (tool) => tool.topicCluster.id === focusedClusterId,
    );
    if (!stillPresent) setUrlState({ category: null });
  }, [isLoading, focusedClusterId, setUrlState, view.tools]);
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
      selectionFocusRef.current = document.activeElement as HTMLElement | null;
      if (!urlState.tool) {
        const shell = document.querySelector<HTMLElement>(".marketing-shell");
        inspectionScrollRef.current = { shell, top: shell?.scrollTop ?? 0, windowY: window.scrollY };
      }
      // Closure §6 — close the collision presentation, then open the preview.
      setAmbiguous([]);
      setChooserGroup(null);
      setSpiderCollapsed(true);
      setUrlState({ tool: toolId, tab: "panoramica" });
      setHighlightedId(toolId);
    },
    [setUrlState, urlState.tool],
  );

  const handleClosePreview = useCallback(() => {
    setUrlState({ tool: null });
    setHighlightedId(null);
    setAmbiguous([]);
    setChooserGroup(null);
    selectionFocusRef.current?.focus?.({ preventScroll: true });
    selectionFocusRef.current = null;
    const position = inspectionScrollRef.current;
    inspectionScrollRef.current = null;
    if (position && typeof requestAnimationFrame === "function") {
      requestAnimationFrame(() => {
        position.shell?.scrollTo?.({ top: position.top, behavior: "instant" });
        window.scrollTo?.({ top: position.windowY, behavior: "instant" });
      });
    }
  }, [setUrlState]);

  useEffect(() => {
    if (!selectedTool) return;
    const close = document.querySelector<HTMLButtonElement>(".tv-rx-preview__close");
    close?.focus({ preventScroll: true });
    if (window.matchMedia?.("(max-width: 63.999rem)").matches) {
      const instrument = atlasInstrumentRef.current;
      const shell = document.querySelector<HTMLElement>(".marketing-shell");
      if (instrument && shell) {
        const inset = parseFloat(getComputedStyle(shell).scrollPaddingTop) || 0;
        const top = instrument.getBoundingClientRect().top - shell.getBoundingClientRect().top;
        const mapBottom = instrument.querySelector(".tv-rx-map")?.getBoundingClientRect().bottom ?? 0;
        const preview = document.querySelector<HTMLElement>(".tv-rx-preview");
        const previewRect = preview?.getBoundingClientRect();
        if (preview && previewRect && getComputedStyle(preview).position === "static") {
          const bottomInset = parseFloat(getComputedStyle(shell).scrollPaddingBottom) || 0;
          const visibleBottom = shell.getBoundingClientRect().bottom - bottomInset;
          if (previewRect.bottom > visibleBottom) shell.scrollTo({ top: shell.scrollTop + previewRect.bottom - visibleBottom, left: 0, behavior: "instant" });
        } else if (top < inset || mapBottom > (previewRect?.top ?? window.innerHeight)) {
          shell.scrollTo({ top: shell.scrollTop + top - inset, left: 0, behavior: "instant" });
        }
      }
    }
  }, [selectedTool]);

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
    if (!urlState.tool && !microStackId) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !urlState.tool && microStackId) { leaveMicroFocus(); return; }
      if (event.key === "Escape" && chooserGroup === null && ambiguous.length === 0) {
        handleClosePreview();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [urlState.tool, handleClosePreview, chooserGroup, ambiguous.length, microStackId, leaveMicroFocus]);

  const focusedCluster = view.clusters.find((cluster) => cluster.id === focusedClusterId);
  const rangeLabel =
    RADAR_RANGE_OPTIONS.find((option) => option.key === urlState.range)?.label ??
    "Oggi";

  return (
    <div
      className="tv-rx"
      data-state={uiModel.state}
      data-tab={urlState.tab}
      data-focus={focusedClusterId ? "local" : "global"} data-atlas-mobile={mobileAtlas ? "true" : undefined} data-atlas-stage={microStack ? "micro" : focusedClusterId ? "local" : "global"}
      data-qa-radar-auth={account.status}
      data-qa-radar-mode={urlState.tab}
      data-qa-radar-ready={!isLoading && uiModel.items.length > 0 ? "true" : "false"}
    >
      <header className="tv-rx__header">
        <p className="tv-rx__eyebrow"><Radar size={14} aria-hidden="true" /> Radar / Intelligence</p>
        <h1 className="tv-rx__title">Cosa sta emergendo adesso</h1>
        <p className="tv-rx__lede">
          Lanci reali. Segnali da leggere. Scelte da seguire.
        </p>
      </header>

      {/* §4 compact telemetry strip — real timestamps only (spec §22). */}
      <div className="tv-rx-telemetry" aria-live="polite">
        <span className="tv-rx-telemetry__identity">
        <span className="tv-rx-telemetry__dot" data-state={uiModel.state} aria-hidden="true" />
        <span className="tv-rx-telemetry__source">{view.snapshot.sourceLabel}</span>
        <span className="tv-rx-telemetry__sep" aria-hidden="true">
          &middot;
        </span>
        <span className="tv-rx-telemetry__state">{uiModel.statusLabel}</span>
        </span>
        <SegmentedControl
          className="tv-rx-range"
          optionClassName="tv-rx-range__option"
          id="tv-rx-range"
          label="Intervallo temporale"
          options={RADAR_RANGE_OPTIONS.map((option) => ({ value: option.key, label: option.label }))}
          value={urlState.range}
          onValueChange={(range) => setUrlState({ range })}
        />
        <span className="tv-rx-telemetry__time" title={`Aggiornato ${uiModel.updatedAtLabel}`}>
          <span className="tv-rx-telemetry__time-full">Aggiornato {uiModel.updatedAtLabel}</span>
          <span className="tv-rx-telemetry__time-short" aria-hidden="true">{uiModel.updatedAtLabel.split(" · ").at(-1)}</span>
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
      </div>

      {/* Mode tabs (spec §8) */}
      <SegmentedControl
        tabs id="tv-rx" label="Modalità Radar"
        className="tv-rx__tabs" optionClassName="tv-rx__tab"
        options={RADAR_TABS.map((tab) => ({ value: tab, label: RADAR_TAB_LABEL[tab], icon: tab === "panoramica" ? <Radar size={15} /> : tab === "trend" ? <ChartNoAxesColumn size={15} /> : tab === "per-te" ? <Sparkles size={15} /> : <Eye size={15} /> }))}
        value={urlState.tab} onValueChange={(tab) => setUrlState({ tab })}
      />

      {urlState.tab === "panoramica" ? (
        <div
          id="tv-rx-panel-panoramica"
          role="tabpanel"
          aria-labelledby="tv-rx-tab-panoramica"
          className="tv-rx__panel"
        >
          <div className="tv-rx__stage">
            <div className="tv-rx__main">
              <section ref={atlasInstrumentRef} className="tv-rx-instrument" aria-label={focusedCluster ? `Radar locale: ${focusedCluster.label}` : "Radar globale"}>
                <header className="tv-rx-instrument__head">
                  <span className="tv-rx-instrument__level">{focusedCluster ? "02 / Locale" : "01 / Mercato"}</span>
                  <strong>{focusedCluster?.label ?? "Panoramica globale"}</strong>
                  <span className="tv-rx-instrument__count">{isLoading ? "—" : filteredTools.length} segnali</span>
                </header>
                <div className="tv-rx-mobile-navigation" data-micro-focus={microStack ? "true" : undefined}>
                  {focusedClusterId && <button type="button" onClick={() => {
                    if (microStack) leaveMicroFocus();
                    else setUrlState({ category: null, query: null });
                  }}><ArrowLeft size={16} aria-hidden="true" />{microStack ? focusedCluster?.label : "Mercato"}</button>}
                  <span className="tv-rx-mobile-navigation__context">{microStack ? `${microStack.ageLabel} · ${microStack.memberIds.length} segnali` : focusedCluster ? `${focusedCluster.label} · ${filteredTools.length}` : "Scegli un’area"}</span>
                  <button type="button" aria-controls="tv-rx-list-title" disabled={isLoading || filteredTools.length === 0} onClick={() => {
                    const list = document.querySelector<HTMLElement>(".tv-rx-section");
                    const shell = document.querySelector<HTMLElement>(".marketing-shell");
                    if (list && shell) {
                      const inset = parseFloat(getComputedStyle(shell).scrollPaddingTop) || 0;
                      shell.scrollTo({ top: shell.scrollTop + list.getBoundingClientRect().top - shell.getBoundingClientRect().top - inset, left: 0, behavior: "instant" });
                    }
                  }}>Elenco</button>
                </div>
              {/* §2/§5 — geometry and the map interaction contract are frozen. */}
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
                    mobileAtlas={mobileAtlas}
                    mapWidth={atlasMapWidth}
                    radiusOverrides={mobileRadii}
                    atlasStacks={microStack ? [] : mobilePlan?.stacks}
                    microAnchor={microStack}
                    onSelectStack={id => { setMicroStackId(id); setMicroPage(0); }}
                    visibleIds={renderIds}
                    interactiveIds={interactiveIds}
                    hiddenCounts={hiddenCounts}
                    camera={camera}
                    displayOverrides={displayOverrides}
                    spider={activeSpider}
                    onSelectSector={handleSelectSector}
                    onCollapseSpider={handleCollapseSpider}
                    focusedClusterId={focusedClusterId}
                    visualMode={focusedClusterId ? "local" : "global"}
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
                {microStack && microStack.memberIds.length > ATLAS_MICRO_PAGE_SIZE && <nav className="tv-rx-micro-pages" aria-label="Altri segnali del gruppo">
                  <button type="button" disabled={microPage === 0} onClick={() => setMicroPage(p => p - 1)}>Precedenti</button>
                  <span>{microPage + 1} / {Math.ceil(microStack.memberIds.length / ATLAS_MICRO_PAGE_SIZE)}</span>
                  <button type="button" disabled={(microPage + 1) * ATLAS_MICRO_PAGE_SIZE >= microStack.memberIds.length} onClick={() => setMicroPage(p => p + 1)}>Successivi</button>
                </nav>}
                {mobileAtlas ? (
<details className="tv-rx-instrument__help"><summary>Come leggere</summary><p className="tv-rx-instrument__hint"><span>Al centro i più recenti, verso il bordo i più vecchi.</span><span>Colore: area · Dimensione: attenzione.</span><span>Micro Focus apre un gruppo: la disposizione dei tool facilita i tap; il periodo del gruppo e l’età di ogni segnale restano indicati.</span></p></details>
                ) : <p className="tv-rx-instrument__hint"><span>Al centro i più recenti, verso il bordo i più vecchi.</span><span>Colore: area · Dimensione: attenzione.</span></p>}
              </section>
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
                      {localSignals.length} {localSignals.length === 1 ? "segnale" : "segnali"}
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
              <MetricStrip label="Metriche del mercato" className="tv-rx-metrics" items={[
                { label: "Tool nel Radar", value: isLoading ? "—" : summary.total },
                { label: "Nuovi nelle 24h", value: isLoading ? "—" : summary.newInWindow },
                { label: "Aree attive", value: isLoading ? "—" : summary.categories },
              ]} />

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

            {/* Desktop intelligence rail; mobile inspection follows the map
                in the document so short viewports never lose signal access. */}
            <aside className="tv-rx__rail" aria-label="Pannello intelligenza">
              {selectedTool && ambiguous.length === 0 ? (
                <RadarQuickPreview
                  key={selectedTool.id}
                  tool={selectedTool}
                  historyAvailable={view.snapshot.historyAvailable}
                  watched={watchKeys.has(watchKeyFor(selectedTool))}
                  onToggleWatch={() => handleToggleWatch(selectedTool)}
                  onClose={handleClosePreview}
                />
              ) : (
                <RadarSnapshotPanel
                  view={view}
                  tools={filteredTools}
                  clusterId={focusedClusterId}
                  loading={isLoading}
                  onSelect={handleSelect}
                  onCluster={(category) => setUrlState({ category })}
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
            rangeLabel={uiModel.rangeLabel}
            onExploreRadar={() => setUrlState({ tab: "panoramica" })}
            onSelect={handleSelect}
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
          Timestamp di origine: {uiModel.updatedAtLabel}. Le aree Radar derivano
          dai topic della fonte. Il collegamento al Catalogo è indicato solo
          quando il tool è riconosciuto.
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
              {tool.name} &mdash; {tool.topicCluster.label},{" "}
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
    if (!active || typeof list.scrollTo !== "function") return;
    const reduce =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const chipBounds = active.getBoundingClientRect();
    const listBounds = list.getBoundingClientRect();
    list.scrollTo({
      left: list.scrollLeft + chipBounds.left - listBounds.left - (list.clientWidth - chipBounds.width) / 2,
      behavior: reduce ? "auto" : "smooth",
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
