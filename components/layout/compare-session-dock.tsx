"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";

import { directoryTools } from "@/lib/data/tooolvibes-directory";
import { MAX_COMPARE_TOOLS } from "@/lib/discovery/workspace-constants";
import { useToolWorkspaceStore } from "@/lib/stores/tool-workspace-store";

function toolName(slug: string): string {
  return directoryTools.find((tool) => tool.slug === slug)?.name ?? slug;
}

export function CompareSessionDock() {
  const pathname = usePathname();
  const slugs = useToolWorkspaceStore((state) => state.compareSlugs);
  const toggleCompare = useToolWorkspaceStore((state) => state.toggleCompare);

  if (slugs.length < 1) return null;
  if (pathname === "/compare") return null;

  const ready = slugs.length >= 2;

  return (
    <div
      className="tv-compare-dock"
      data-compare-dock=""
      data-ready={ready ? "" : undefined}
      data-count={String(slugs.length)}
      role="region"
      aria-label="Confronto in corso"
      aria-live="polite"
    >
      <div className="tv-compare-dock__inner">
        <p className="tv-compare-dock__count">
          {slugs.length}/{MAX_COMPARE_TOOLS}
        </p>
        <ul className="tv-compare-dock__list">
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
}
