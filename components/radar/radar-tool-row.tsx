"use client";

/**
 * Compact Radar tool row (spec §6, §33) — deliberately NOT a Catalog card.
 *
 * LIST ROW PARITY (spec §26):
 *   CATALOG-LINKED  → Scheda / Save / Compare
 *   EXTERNAL        → Fonte ↗ / Segui
 * The row and the quick preview can never disagree about what a signal is.
 */

import Link from "next/link";
import { ArrowUpRight, Eye } from "lucide-react";

import { CompareToggle } from "@/components/tools/compare-toggle";
import { ShortlistToggle } from "@/components/tools/shortlist-toggle";
import type { RadarTool } from "@/lib/radar/radar-domain";

export function RadarToolRow({
  tool,
  index,
  selected,
  onSelect,
  watched,
  onToggleWatch,
}: {
  tool: RadarTool;
  index: number;
  selected: boolean;
  onSelect: (toolId: string) => void;
  watched: boolean;
  onToggleWatch: (tool: RadarTool) => void;
}) {
  const keySignal = `${tool.votesCount} voti · ${tool.commentsCount} commenti`;
  const isExternal = tool.catalogStatus === "external";

  return (
    <li
      className="tv-rx-row"
      data-selected={selected ? "true" : undefined}
      data-catalog-status={tool.catalogStatus}
    >
      <button
        type="button"
        className="tv-rx-row__main"
        onClick={() => onSelect(tool.id)}
        aria-expanded={selected}
      >
        <span className="tv-rx-row__rank" aria-hidden="true">
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className="tv-rx-row__body">
          <strong className="tv-rx-row__name">{tool.name}</strong>
          <span className="tv-rx-row__meta">
            {tool.topicCluster.label} · {keySignal}
          </span>
        </span>
      </button>
      <span className="tv-rx-row__actions">
        {isExternal ? (
          <>
            <button
              type="button"
              className="tv-rx-row__watch"
              data-watched={watched ? "true" : "false"}
              aria-pressed={watched}
              aria-label={`${watched ? "Smetti di seguire" : "Segui"} ${tool.name} nel Radar`}
              onClick={() => onToggleWatch(tool)}
            >
              <Eye size={13} aria-hidden="true" />
            </button>
            <a
              className="tv-rx-row__open"
              href={tool.websiteUrl ?? tool.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Fonte
              <ArrowUpRight size={12} aria-hidden="true" />
            </a>
          </>
        ) : (
          <>
            <ShortlistToggle slug={tool.catalogSlug ?? tool.id} mode="icon" toolName={tool.name} />
            <CompareToggle slug={tool.catalogSlug ?? tool.id} mode="icon" toolName={tool.name} />
            <Link
              className="tv-rx-row__open"
              href={`/toools/${tool.catalogSlug ?? ""}`}
              aria-label={`Apri la scheda di ${tool.name}`}
            >
              Scheda
            </Link>
          </>
        )}
      </span>
    </li>
  );
}
