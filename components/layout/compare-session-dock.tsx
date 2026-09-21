"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronUp, X } from "lucide-react";

import { directoryTools } from "@/lib/data/tooolvibes-directory";
import { MAX_COMPARE_TOOLS } from "@/lib/discovery/workspace-constants";
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
  const [expanded, setExpanded] = useState(false);
  const dockRef = useRef<HTMLDivElement | null>(null);
  const guideRoute = isGuidePath(pathname);
  const hidden = slugs.length < 1 || pathname === "/compare";
  const collapsed = hidden || guideRoute || !expanded;

  useEffect(() => {
    if (guideRoute) setExpanded(false);
  }, [guideRoute]);

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
  }, [hidden, collapsed]);

  if (hidden) return null;

  const ready = slugs.length >= 2;
  const listMounted = !collapsed;

  const dock = (
    <div
      ref={dockRef}
      className="tv-compare-dock"
      data-compare-dock=""
      data-compare-dock-collapsed={collapsed ? "" : undefined}
      data-ready={ready ? "" : undefined}
      data-count={String(slugs.length)}
      role="region"
      aria-label="Confronto in corso"
      aria-live="polite"
    >
      <div className="tv-compare-dock__inner">
        {!guideRoute ? (
          <button
            type="button"
            className="tv-compare-dock__toggle"
            aria-expanded={!collapsed}
            aria-controls={listMounted ? "tv-compare-dock-list" : undefined}
            aria-label={
              collapsed
                ? "Mostra i tool in confronto"
                : "Nascondi i tool in confronto"
            }
            onClick={() => setExpanded((value) => !value)}
          >
            <ChevronUp size={16} aria-hidden="true" />
          </button>
        ) : null}
        <p className="tv-compare-dock__count">
          {slugs.length}/{MAX_COMPARE_TOOLS}
        </p>
        {listMounted ? (
          <ul id="tv-compare-dock-list" className="tv-compare-dock__list">
            {slugs.map((slug) => (
              <li key={slug}>
                <span>{toolName(slug)}</span>
                <button
                  type="button"
                  aria-label={`Togli ${toolName(slug)} dal confronto`}
                  onClick={() => toggleCompare(slug)}
                >
                  <X size={14} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        <Link
          href={ready ? "/compare" : "/archivio"}
          prefetch={false}
          className="tv-compare-dock__cta"
        >
          {ready ? "Confronta" : "Aggiungi un altro"}
        </Link>
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(dock, document.body);
}
