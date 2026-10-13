"use client";

import { LocalizedText, LocalizedAttributes } from "@/components/i18n/localized-text";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "@/components/ui/app-link";
import { usePathname } from "next/navigation";
import { ChevronUp, Columns2, X } from "lucide-react";

import { directoryTools } from "@/lib/data/tooolvibes-directory";
import { MAX_COMPARE_TOOLS } from "@/lib/discovery/workspace-constants";
import {
  COMPARE_LOCK_MS,
  comparePrefersCompact,
  initialCompareChrome,
  reduceCompareScroll,
  type CompareGesture,
} from "@/lib/shell/compare-chrome";
import { readLiveScrollTop } from "@/lib/shell/scroll-port";
import { useToolWorkspaceStore } from "@/lib/stores/tool-workspace-store";

function toolName(slug: string): string {
  return directoryTools.find((tool) => tool.slug === slug)?.name ?? slug;
}

function isGuidePath(pathname: string | null): boolean {
  return pathname === "/posts" || Boolean(pathname?.startsWith("/posts/"));
}

export function CompareSessionDock() {
  const pathname = usePathname();
  const slugs = useToolWorkspaceStore((state) => state.compareSlugs);
  const toggleCompare = useToolWorkspaceStore((state) => state.toggleCompare);
  const guideRoute = isGuidePath(pathname);
  const [radarMobile, setRadarMobile] = useState(false);
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const media = window.matchMedia("(max-width: 1023px)");
    const sync = () => setRadarMobile(pathname === "/radar" && media.matches);
    sync();
    media.addEventListener?.("change", sync);
    return () => media.removeEventListener?.("change", sync);
  }, [pathname]);
  const hidden = slugs.length < 1 || pathname === "/compare";
  const prefersCompact = radarMobile || guideRoute || comparePrefersCompact(pathname);
  const [expanded, setExpanded] = useState(() => !prefersCompact);
  const dockRef = useRef<HTMLDivElement | null>(null);
  const expandedRef = useRef(expanded);
  const gestureRef = useRef<CompareGesture>(initialCompareChrome(pathname));
  const lockUntilRef = useRef(0);
  expandedRef.current = expanded;

  const closeInspection = useCallback(() => {
    gestureRef.current = { chrome: "compact", down: 0, up: 0 };
    lockUntilRef.current = performance.now() + COMPARE_LOCK_MS;
    setExpanded(false);
  }, []);

  useEffect(() => {
    if (hidden || !expanded) return;
    const dismiss = (event: PointerEvent) => {
      if (event.target instanceof Node && !dockRef.current?.contains(event.target)) closeInspection();
    };
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [hidden, expanded, closeInspection]);

  useEffect(() => {
    const next = !prefersCompact;
    gestureRef.current = initialCompareChrome(pathname);
    lockUntilRef.current = 0;
    setExpanded(next);
  }, [pathname, prefersCompact]);

  useEffect(() => {
    if (hidden || guideRoute || radarMobile) return;
    let prevY = readLiveScrollTop();
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const y = readLiveScrollTop();
        if (performance.now() < lockUntilRef.current) {
          prevY = y;
          return;
        }
        const next = reduceCompareScroll(gestureRef.current, {
          y,
          prevY,
          prefersCompact,
        });
        gestureRef.current = next;
        prevY = y;
        const shouldExpand = next.chrome === "expanded";
        if (shouldExpand !== expandedRef.current) {
          lockUntilRef.current = performance.now() + COMPARE_LOCK_MS;
          setExpanded(shouldExpand);
        }
      });
    };
    document.addEventListener("scroll", onScroll, { capture: true, passive: true });
    return () => {
      document.removeEventListener("scroll", onScroll, { capture: true });
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [hidden, guideRoute, radarMobile, pathname, prefersCompact]);

  useEffect(() => {
    const root = document.documentElement;
    if (hidden) {
      root.style.setProperty("--tv-tray-height", "0px");
      return () => {
        root.style.setProperty("--tv-tray-height", "0px");
      };
    }

    const publish = () => {
      const height = dockRef.current?.getBoundingClientRect().height ?? 0;
      root.style.setProperty("--tv-tray-height", `${height}px`);
    };

    publish();
    const observer =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(publish);
    if (dockRef.current && observer) observer.observe(dockRef.current);

    return () => {
      observer?.disconnect();
      root.style.setProperty("--tv-tray-height", "0px");
    };
  }, [hidden, expanded]);

  if (hidden) return null;

  const ready = slugs.length >= 2;
  const collapsed = !expanded;
  const listMounted = !collapsed;

  const toggle = () => {
    lockUntilRef.current = performance.now() + COMPARE_LOCK_MS;
    gestureRef.current = {
      chrome: expandedRef.current ? "compact" : "expanded",
      down: 0,
      up: 0,
    };
    setExpanded((value) => !value);
  };

  const dock = (
    <LocalizedAttributes><div
      ref={dockRef}
      className="tv-compare-dock"
      data-compare-dock=""
      data-compare-chrome={collapsed ? "compact" : "expanded"}
      data-compare-context={prefersCompact ? "compact-first" : "comparison"}
      data-compare-dock-collapsed={collapsed ? "" : undefined}
      data-ready={ready ? "" : undefined}
      data-count={String(slugs.length)}
      role="region"
      aria-label="Confronto in corso"
      aria-live="polite"
      onKeyDown={(event) => {
        if (event.key !== "Escape" || !expanded) return;
        event.preventDefault();
        event.stopPropagation();
        closeInspection();
        dockRef.current?.querySelector<HTMLButtonElement>(".tv-compare-dock__toggle")?.focus();
      }}
    >
      <div className="tv-compare-dock__inner">
          <LocalizedAttributes><button
            type="button"
            className="tv-compare-dock__toggle"
            aria-expanded={!collapsed}
            aria-controls={listMounted ? "tv-compare-dock-list" : undefined}
            aria-label={
              collapsed
                ? "Mostra i tool in confronto"
                : "Nascondi i tool in confronto"
            }
            onClick={toggle}
          >
            <ChevronUp size={16} aria-hidden="true" />
          </button></LocalizedAttributes>
        <p className="tv-compare-dock__count" style={{ whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
          {slugs.length}/{MAX_COMPARE_TOOLS}
        </p>
        <ul
          id="tv-compare-dock-list"
          className="tv-compare-dock__list"
          hidden={!listMounted}
        >
          {slugs.map((slug) => (
            <li key={slug}>
              <span><LocalizedText>{toolName(slug)}</LocalizedText></span>
              <LocalizedAttributes><button
                type="button"
                aria-label={`Togli ${toolName(slug)} dal confronto`}
                onClick={() => toggleCompare(slug)}
              >
                <X size={14} aria-hidden="true" />
              </button></LocalizedAttributes>
            </li>
          ))}
        </ul>
        <Link
          href={ready ? "/compare" : "/archivio"}
          prefetch={false}
          className="tv-compare-dock__cta"
        >
          <Columns2 size={15} aria-hidden="true" />
          <LocalizedText>{ready ? "Confronta" : "Aggiungi tool"}</LocalizedText>
        </Link>
      </div>
    </div></LocalizedAttributes>
  );

  if (typeof document === "undefined") return null;
  return createPortal(dock, document.body);
}
