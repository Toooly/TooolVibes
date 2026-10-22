"use client";

import { LocalizedText, LocalizedAttributes } from "@/components/i18n/localized-text";
import { useLocale } from "@/components/i18n/locale-provider";
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

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ChartNoAxesColumn, Eye, List, Radar, RefreshCw, Search, Sparkles, X } from "lucide-react";
import { InstrumentJourney } from "@/components/ui/instrument-journey";
import { centerInspection } from "@/lib/motion/center-inspection";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { RadarSignalNavigation, RadarSnapshotPanel } from "@/components/radar/radar-snapshot-panel";

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
  const { locale } = useLocale();
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
  const [browseMode, setBrowseMode] = useState<"atlas" | "list">("atlas");
  const [selectionOrigin, setSelectionOrigin] = useState<"atlas" | "list">("atlas");
  const explorerRef = useRef<HTMLDivElement | null>(null);
  const [sort, setSort] = useState<"attention" | "recent">("attention");
  const sortedTools = useMemo(() => [...filteredTools].sort((a, b) =>
    sort === "recent" ? (a.ageHours ?? Infinity) - (b.ageHours ?? Infinity) || b.attention - a.attention : b.attention - a.attention || a.rank - b.rank,
  ), [filteredTools, sort]);
  const [microStackId, setMicroStackId] = useState<string | null>(null);
  const [microPage, setMicroPage] = useState(0);
  useLayoutEffect(() => {
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
  useLayoutEffect(() => {
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
  const overviewRenderIds = useMemo(() => {
    if (!mobileAtlas) return baseRenderIds;
    if (microPositions) return new Set(microPositions.keys());
    if (mobilePlan) return mobilePlan.visibleIds;
    const candidates = layout.points.filter(point => baseRenderIds.has(point.id)).map(point => ({ ...point, attention: view.tools.find(tool => tool.id === point.id)!.attention }));
    return atlasMobileGlobalIds(candidates, atlasMapWidth);
  }, [mobileAtlas, baseRenderIds, microPositions, mobilePlan, layout.points, view.tools, atlasMapWidth]);
  // Inspection can originate from any page of the signal browser. Keep that
  // real point visible even when the overview only shows area representatives.
  const renderIds = useMemo(() => selectedTool
    ? new Set([...overviewRenderIds, selectedTool.id])
    : overviewRenderIds, [overviewRenderIds, selectedTool]);
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
    (toolId: string, origin: "atlas" | "list" = "atlas") => {
      setSelectionOrigin(origin);
      if (microPositions && !microPositions.has(toolId)) {
        setMicroStackId(null);
        setMicroPage(0);
      }
      if (!urlState.tool) selectionFocusRef.current = document.activeElement as HTMLElement | null;
      if (origin === "list") {
        inspectionScrollRef.current = null;
      } else if (!urlState.tool) {
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
    [setUrlState, urlState.tool, microPositions],
  );

  const dismissPreview = useCallback((restoreContext: boolean) => {
    setUrlState({ tool: null });
    setHighlightedId(null);
    setAmbiguous([]);
    setChooserGroup(null);
    if (restoreContext) {
      const target = selectionFocusRef.current;
      if (target?.closest("[hidden]")) requestAnimationFrame(() => target.focus({ preventScroll: true }));
      else target?.focus?.({ preventScroll: true });
    }
    selectionFocusRef.current = null;
    const position = inspectionScrollRef.current;
    inspectionScrollRef.current = null;
    if (restoreContext && position && typeof requestAnimationFrame === "function") {
      requestAnimationFrame(() => {
        position.shell?.scrollTo?.({ top: position.top, behavior: "instant" });
        window.scrollTo?.({ top: position.windowY, behavior: "instant" });
      });
    }
  }, [setUrlState]);

  const handleClosePreview = useCallback(() => dismissPreview(true), [dismissPreview]);

  useEffect(() => {
    if (!selectedTool) return;
    const dismiss = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      // The map owns signal/area/empty taps. Scrolling never emits a click.
      if (event.target.closest(".tv-rx-preview, .tv-rx-map__svg, .tv-rx-row, .tv-rx-rail__signal")) return;
      dismissPreview(false);
    };
    document.addEventListener("click", dismiss, true);
    return () => document.removeEventListener("click", dismiss, true);
  }, [selectedTool, dismissPreview]);

  const handleListSelect = useCallback((toolId: string) => {
    if (urlState.tool === toolId && selectionOrigin === "list") handleClosePreview();
    else handleSelect(toolId, "list");
  }, [urlState.tool, selectionOrigin, handleClosePreview, handleSelect]);

  const changeBrowseMode = useCallback((mode: "atlas" | "list") => {
    setBrowseMode(mode);
    setUrlState({ tool: null });
    setHighlightedId(null);
    setAmbiguous([]);
    setChooserGroup(null);
    inspectionScrollRef.current = null;
    selectionFocusRef.current = null;
    // Both views share this anchor: no jump to a distant section of the page.
    requestAnimationFrame(() => {
      const anchor = explorerRef.current;
      if (anchor && anchor.getBoundingClientRect().bottom < 0) anchor.scrollIntoView({ block: "start", behavior: "instant" });
    });
  }, [setUrlState]);

  useEffect(() => {
    if (!selectedTool) return;
    // Pointer selection starts on pointerdown. Wait until native mouse focus
    // settles before announcing the inspection, without triggering a scroll.
    const frame = requestAnimationFrame(() => {
      const focusTarget = document.querySelector<HTMLElement>(selectionOrigin === "list" ? ".tv-rx-preview__close" : ".tv-rx-preview__title");
      focusTarget?.focus({ preventScroll: true });
    });
    if (selectionOrigin === "list") return () => cancelAnimationFrame(frame);
    const scrollBehavior = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth";
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
          centerInspection(preview);
        } else if (top < inset || mapBottom > (previewRect?.top ?? window.innerHeight)) {
          shell.scrollTo({ top: shell.scrollTop + top - inset, left: 0, behavior: scrollBehavior });
        }
      }
    }
    return () => cancelAnimationFrame(frame);
  }, [selectedTool, selectionOrigin]);

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
      data-browse={urlState.tab === "panoramica" ? browseMode : "atlas"}
      data-inspecting={selectedTool ? "true" : "false"}
      data-focus={focusedClusterId ? "local" : "global"} data-atlas-mobile={mobileAtlas ? "true" : undefined} data-atlas-stage={microStack ? "micro" : focusedClusterId ? "local" : "global"}
      data-qa-radar-auth={account.status}
      data-qa-radar-mode={urlState.tab}
      data-qa-radar-ready={!isLoading && uiModel.items.length > 0 ? "true" : "false"}
    >
      <div className="tv-rx-intro">
      <header className="tv-rx__header">
        <p className="tv-rx__eyebrow"><Radar size={14} aria-hidden="true" /><LocalizedText>{" Radar / Intelligence"}</LocalizedText></p>
        <h1 className="tv-rx__title"><LocalizedText>{"Cosa sta emergendo adesso"}</LocalizedText></h1>
        <p className="tv-rx__lede"><LocalizedText>{"Lanci reali. Segnali da leggere. Scelte da seguire. "}</LocalizedText></p>
      </header>

      {/* §4 compact telemetry strip — real timestamps only (spec §22). */}
      <div className="tv-rx-telemetry" aria-live="polite">
        <span className="tv-rx-telemetry__identity">
        <span className="tv-rx-telemetry__dot" data-state={uiModel.state} aria-hidden="true" />
        <span className="tv-rx-telemetry__source"><LocalizedText>{view.snapshot.sourceLabel}</LocalizedText></span>
        <span className="tv-rx-telemetry__sep" aria-hidden="true"><LocalizedText>{"· "}</LocalizedText></span>
        <span className="tv-rx-telemetry__state"><LocalizedText>{uiModel.statusLabel}</LocalizedText></span>
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
        <LocalizedAttributes><span className="tv-rx-telemetry__time" title={`Aggiornato ${uiModel.updatedAtLabel}`}>
          <span className="tv-rx-telemetry__time-full"><LocalizedText>{"Aggiornato "}</LocalizedText><LocalizedText>{uiModel.updatedAtLabel}</LocalizedText></span>
          <span className="tv-rx-telemetry__time-short" aria-hidden="true"><LocalizedText>{uiModel.updatedAtLabel.split(" · ").at(-1)}</LocalizedText></span>
        </span></LocalizedAttributes>
        <LocalizedAttributes><button
          type="button"
          className="tv-rx-telemetry__refresh"
          onClick={() => refetch()}
          disabled={isFetching}
          aria-label={isFetching ? "Aggiornamento in corso" : "Aggiorna i dati"}
          title={isFetching ? "Aggiornamento in corso" : "Aggiorna i dati"}
        >
          <RefreshCw size={13} aria-hidden="true" />
        </button></LocalizedAttributes>
      </div>

      </div>

      {/* Mode tabs (spec §8) */}
      <div className="tv-rx-commands">
      <SegmentedControl
        tabs id="tv-rx" label="Modalità Radar"
        className="tv-rx__tabs" optionClassName="tv-rx__tab"
        options={RADAR_TABS.map((tab) => ({ value: tab, label: RADAR_TAB_LABEL[tab], icon: tab === "panoramica" ? <Radar size={15} /> : tab === "trend" ? <ChartNoAxesColumn size={15} /> : tab === "per-te" ? <Sparkles size={15} /> : <Eye size={15} /> }))}
        value={urlState.tab} onValueChange={(tab) => setUrlState({ tab })}
      />

      {urlState.tab === "panoramica" && <div className="tv-rx-explorer__head">
        <SegmentedControl
          id="tv-rx-view" label="Visualizzazione dei segnali" className="tv-rx-view"
          options={[{ value: "atlas", label: "Mappa", icon: <Radar size={16} /> }, { value: "list", label: "Elenco", icon: <List size={16} /> }]}
          value={browseMode} onValueChange={changeBrowseMode}
        />
        <span className="tv-rx-explorer__results" role="status">{isLoading ? "—" : filteredTools.length} <LocalizedText>{"segnali"}</LocalizedText></span>
      </div>}
      </div>

      {urlState.tab === "panoramica" ? (
        <div
          id="tv-rx-panel-panoramica"
          role="tabpanel"
          aria-labelledby="tv-rx-tab-panoramica"
          className="tv-rx__panel"
        >
          <div className="tv-rx-explorer" ref={explorerRef}>
            <RadarToolbar
              categories={view.clusters} activeCategory={urlState.category}
              onCategory={(category) => setUrlState({ category })}
              query={urlState.query} onQuery={(q) => setUrlState({ query: q })}
            />
          </div>
          <div className="tv-rx__stage">
            <div className="tv-rx__main">
              <LocalizedAttributes><section ref={atlasInstrumentRef} className="tv-rx-instrument" data-instrument-stage aria-label={focusedCluster ? `Radar locale: ${focusedCluster.label}` : "Radar globale"}>
                <header className="tv-rx-instrument__head">
                  <span className="tv-rx-instrument__level"><LocalizedText>{focusedCluster ? "02 / Locale" : "01 / Mercato"}</LocalizedText></span>
                  <strong><LocalizedText>{focusedCluster?.label ?? "Panoramica globale"}</LocalizedText></strong>
                  <span className="tv-rx-instrument__count"><LocalizedText>{isLoading ? "—" : filteredTools.length}</LocalizedText><LocalizedText>{" segnali"}</LocalizedText></span>
                </header>
                <div className="tv-rx-mobile-navigation" data-micro-focus={microStack ? "true" : undefined}>
                  {focusedClusterId && <button type="button" onClick={() => {
                    if (microStack) leaveMicroFocus();
                    else setUrlState({ category: null, query: null });
                  }}><ArrowLeft size={16} aria-hidden="true" /><LocalizedText>{microStack ? focusedCluster?.label : "Mercato"}</LocalizedText></button>}
                  <span className="tv-rx-mobile-navigation__context"><LocalizedText>{microStack ? `${microStack.ageLabel} · ${microStack.memberIds.length} segnali` : focusedCluster ? `${focusedCluster.label} · ${filteredTools.length}` : "Scegli un’area"}</LocalizedText></span>
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
                    onEmptyTap={selectedTool ? () => dismissPreview(false) : undefined}
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
                {microStack && microStack.memberIds.length > ATLAS_MICRO_PAGE_SIZE && <LocalizedAttributes><nav className="tv-rx-micro-pages" aria-label="Altri segnali del gruppo">
                  <button type="button" disabled={microPage === 0} onClick={() => setMicroPage(p => p - 1)}><LocalizedText>{"Precedenti"}</LocalizedText></button>
                  <span>{microPage + 1} / {Math.ceil(microStack.memberIds.length / ATLAS_MICRO_PAGE_SIZE)}</span>
                  <button type="button" disabled={(microPage + 1) * ATLAS_MICRO_PAGE_SIZE >= microStack.memberIds.length} onClick={() => setMicroPage(p => p + 1)}><LocalizedText>{"Successivi"}</LocalizedText></button>
                </nav></LocalizedAttributes>}
                {filteredTools.length > 0 && <p className="tv-rx-instrument__guide"><LocalizedText>{focusedCluster ? "Seleziona un segnale per approfondire. Ogni cerchio è un tool." : locale === "en" ? "Choose an area to explore, or open a tool from the signal panel." : "Scegli un’area per esplorarla, oppure apri un tool dal pannello dei segnali."}</LocalizedText></p>}
                {!isLoading && filteredTools.length > 0 && <InstrumentJourney label="Esplora i segnali del Radar" className="tv-rx-instrument__journey" steps={[
                  { id: "read", label: "Approfondisci", detail: "Tutti i segnali", tone: "cyan", icon: <Search size={16} />, onClick: () => {
                    changeBrowseMode("list");
                    requestAnimationFrame(() => document.getElementById("tv-rx-list-title")?.focus({ preventScroll: true }));
                  } },
                ]} />}
              </section></LocalizedAttributes>
              {!isLoading && filteredTools.length > 0 && <div className="tv-rx-map-key">
                <RadarLegend />
                {microStack && <p>{locale === "en"
                  ? "In group view, tools are arranged for easy tapping. Each detail panel shows the signal’s actual age."
                  : "Nella vista del gruppo i tool sono disposti per facilitare i tap. Ogni scheda indica l’età reale del segnale."}</p>}
              </div>}

              {browseMode === "list" ? (
                <section className="tv-rx-section" aria-labelledby="tv-rx-list-title" aria-busy={isLoading}>
                  <header className="tv-rx-section__head">
                    <div className="tv-rx-section__heading">
                      <h2 id="tv-rx-list-title" tabIndex={-1} className="tv-rx-section__title"><LocalizedText>{"Tool nel Radar "}</LocalizedText></h2>
                      <p className="tv-rx-section__desc">
                        {isLoading ? "Caricamento…" : <>{filteredTools.length}<LocalizedText>{" "}</LocalizedText>
                          <LocalizedText>{filteredTools.length === 1 ? "segnale" : "segnali"}</LocalizedText>
                          <LocalizedText>{urlState.category ? " nella categoria selezionata" : " nel periodo"}</LocalizedText></>}
                      </p>
                    </div>
                    <label className="tv-rx-sort">
                      <span className="tv-rx-sr-only"><LocalizedText>{"Ordina i segnali"}</LocalizedText></span>
                      <select value={sort} onChange={event => setSort(event.target.value as "attention" | "recent")}>
                        <option value="attention"><LocalizedText>{"Più attenzione"}</LocalizedText></option>
                        <option value="recent"><LocalizedText>{"Più recenti"}</LocalizedText></option>
                      </select>
                    </label>
                  </header>
                  {isLoading || filteredTools.length === 0 ? (
                    isLoading ? <p className="tv-rx-state" role="status"><LocalizedText>{"Caricamento dei segnali…"}</LocalizedText></p> :
                      <RadarEmptyState state={uiModel.state} hasQuery={Boolean(query || focusedClusterId)} onClear={() => setUrlState({ category: null, query: null })} />
                  ) : null}
                  <ol className="tv-rx-list">
                    {sortedTools.map((tool, index) => (
                      <RadarToolRow
                        key={tool.id}
                        tool={tool}
                        index={index}
                        selected={urlState.tool === tool.id}
                        onSelect={handleListSelect}
                        watched={watchKeys.has(watchKeyFor(tool))}
                        onToggleWatch={handleToggleWatch}
                      >
                        {urlState.tool === tool.id && selectionOrigin === "list" && <RadarQuickPreview
                          key={tool.id} inline tool={tool} historyAvailable={view.snapshot.historyAvailable}
                          watched={watchKeys.has(watchKeyFor(tool))} onToggleWatch={() => handleToggleWatch(tool)} onClose={handleClosePreview}
                        />}
                      </RadarToolRow>
                    ))}
                  </ol>
                </section>
              ) : null}
            </div>

            {/* Desktop intelligence rail; mobile inspection follows the map
                in the document so short viewports never lose signal access. */}
            {browseMode === "atlas" && (isLoading || filteredTools.length > 0) && <LocalizedAttributes><aside className="tv-rx__rail" aria-label="Pannello intelligenza">
              <div hidden={Boolean(selectedTool && selectionOrigin !== "list" && ambiguous.length === 0)}>
                <RadarSnapshotPanel
                  key={`${urlState.range}:${urlState.category ?? ""}:${query}`}
                  view={view}
                  tools={sortedTools}
                  clusterId={focusedClusterId}
                  loading={isLoading}
                  onSelect={handleSelect}
                  onBrowse={() => changeBrowseMode("list")}
                />
              </div>
              {selectedTool && selectionOrigin !== "list" && ambiguous.length === 0 && (
                <RadarQuickPreview
                  navigation={<RadarSignalNavigation tools={sortedTools} selectedId={selectedTool.id} onSelect={handleSelect} />}
                  key={selectedTool.id}
                  tool={selectedTool}
                  historyAvailable={view.snapshot.historyAvailable}
                  watched={watchKeys.has(watchKeyFor(selectedTool))}
                  onToggleWatch={() => handleToggleWatch(selectedTool)}
                  onClose={handleClosePreview}
                />
              )}
            </aside></LocalizedAttributes>}
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
        <summary><LocalizedText>{"Informazioni sui dati"}</LocalizedText></summary>
        <p><LocalizedText>{"I segnali del Radar arrivano da "}</LocalizedText><strong><LocalizedText>{"Product Hunt"}</LocalizedText></strong><LocalizedText>{": lanci reali ordinati per voti nel periodo selezionato. TooolVibes non misura l'intero mercato AI in autonomia. "}</LocalizedText></p>
        <p><LocalizedText>{"Timestamp di origine: "}</LocalizedText><LocalizedText>{uiModel.updatedAtLabel}</LocalizedText><LocalizedText>{". Le aree Radar derivano dai topic della fonte. Il collegamento al Catalogo è indicato solo quando il tool è riconosciuto. "}</LocalizedText></p>
        <a
          href="https://www.producthunt.com/"
          target="_blank"
          rel="noopener noreferrer"
        ><LocalizedText>{"Visita Product Hunt "}</LocalizedText></a>
      </details>

      {/* Screen-reader alternate semantic list (spec §42). */}
      <LocalizedAttributes><section className="tv-rx-sr-list" aria-label="Elenco testuale dei segnali" role="region">
        <h2><LocalizedText>{"Elenco dei segnali"}</LocalizedText></h2>
        <ol>
          {filteredTools.map((tool) => (
            <li key={tool.id}>
              {tool.name}<LocalizedText>{" — "}</LocalizedText><LocalizedText>{tool.topicCluster.label}</LocalizedText>,<LocalizedText>{" "}</LocalizedText>
              {tool.votesCount}<LocalizedText>{" voti, "}</LocalizedText>{tool.commentsCount}<LocalizedText>{" commenti, posizione"}</LocalizedText><LocalizedText>{" "}</LocalizedText>
              {tool.rank}.
            </li>
          ))}
        </ol>
      </section></LocalizedAttributes>
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
      <label className="tv-rx-area-select">
        <span className="tv-rx-sr-only"><LocalizedText>{"Filtra per categoria"}</LocalizedText></span>
        <select value={activeCategory ?? ""} onChange={event => onCategory(event.target.value || null)}>
          <option value=""><LocalizedText>{"Tutte le aree"}</LocalizedText></option>
          {categories.map(category => <option key={category.id} value={category.id}><LocalizedText>{category.label}</LocalizedText> · {category.count}</option>)}
        </select>
      </label>
      <div className="tv-rx-chips-wrap">
      <LocalizedAttributes><ul className="tv-rx-chips" ref={chipsRef} aria-label="Filtra per categoria">
        <li>
          <button
            type="button"
            className="tv-rx-chip"
            data-active={activeCategory === null ? "true" : undefined}
            aria-pressed={activeCategory === null}
            onClick={() => onCategory(null)}
          ><LocalizedText>{"Tutti "}</LocalizedText></button>
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
              <LocalizedText>{category.label}</LocalizedText><span className="tv-rx-chip__count">{category.count}</span>
            </button>
          </li>
        ))}
      </ul></LocalizedAttributes>
      </div>

      <div className="tv-rx-search">
        <label htmlFor="tv-rx-search-input" className="tv-rx-sr-only"><LocalizedText>{"Cerca un tool nel Radar"}</LocalizedText></label>
        <Search size={13} aria-hidden="true" />
        <LocalizedAttributes><input
          id="tv-rx-search-input"
          type="search"
          value={query ?? ""}
          onChange={(event) => onQuery(event.target.value || null)}
          placeholder="Cerca nel Radar"
        /></LocalizedAttributes>
        {query && <LocalizedAttributes><button type="button" className="tv-rx-search__clear" aria-label="Cancella ricerca" onClick={() => onQuery(null)}><X size={16} aria-hidden="true" /></button></LocalizedAttributes>}
      </div>
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
    <LocalizedAttributes><div
      ref={panelRef}
      className="tv-rx-chooser"
      role="dialog"
      aria-modal="true"
      aria-label={`${entries.length} segnali in questo punto`}
    >
      <p className="tv-rx-chooser__title">
        {entries.length}<LocalizedText>{" segnali in questo punto "}</LocalizedText></p>
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
                  <LocalizedText>{tool?.topicCluster.label ?? "—"}</LocalizedText>
                  <LocalizedText>{ageHours !== null ? ` · ${formatChooserAge(ageHours)}` : ""}</LocalizedText>
                  <LocalizedText>{tool ? ` · ${tool.votesCount}v ${tool.commentsCount}c` : ""}</LocalizedText>
                  <LocalizedText>{tool?.catalogStatus === "linked" ? " · catalogo" : ""}</LocalizedText>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <button type="button" className="tv-rx-chooser__dismiss" onClick={onDismiss}><LocalizedText>{"Annulla "}</LocalizedText></button>
    </div></LocalizedAttributes>
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
    <LocalizedAttributes><div className="tv-rx-map tv-rx-map--skeleton" aria-busy="true" aria-label="Caricamento della mappa">
      <div className="tv-rx-map__rings" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
    </div></LocalizedAttributes>
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
        <h2><LocalizedText>{"Segnali non disponibili"}</LocalizedText></h2>
        <p><LocalizedText>{"La fonte non risponde in questo momento. Nessun dato simulato: riprova più tardi o esplora il Catalogo. "}</LocalizedText></p>
        <a href="/archivio"><LocalizedText>{"Vai al Catalogo"}</LocalizedText></a>
      </div>
    );
  }
  if (state === "empty") {
    return (
      <div className="tv-rx-state" role="status">
        <h2><LocalizedText>{"Nessun segnale nel periodo"}</LocalizedText></h2>
        <p><LocalizedText>{"Prova un periodo più ampio oppure esplora il Catalogo."}</LocalizedText></p>
        <a href="/archivio"><LocalizedText>{"Vai al Catalogo"}</LocalizedText></a>
      </div>
    );
  }
  return (
    <div className="tv-rx-state" role="status">
      <h2><LocalizedText>{"Nessun risultato"}</LocalizedText></h2>
      <p>
        <LocalizedText>{hasQuery
          ? "Nessun tool del Radar corrisponde alla ricerca."
          : "Nessun tool in questa categoria."}</LocalizedText>
      </p>
      <button type="button" onClick={onClear}><LocalizedText>{"Azzera filtri "}</LocalizedText></button>
    </div>
  );
}
