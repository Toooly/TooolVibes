"use client";

/**
 * Compact Radar tool row (spec §33) — deliberately NOT a Catalog card.
 * One key signal + score-free canonical metadata + Save / Compare.
 */

import Link from "next/link";

import { CompareToggle } from "@/components/tools/compare-toggle";
import { ShortlistToggle } from "@/components/tools/shortlist-toggle";
import type { RadarTool } from "@/lib/radar/radar-domain";

export function RadarToolRow({
  tool,
  index,
  selected,
  onSelect,
}: {
  tool: RadarTool;
  index: number;
  selected: boolean;
  onSelect: (toolId: string) => void;
}) {
  const keySignal = `${tool.votesCount} voti · ${tool.commentsCount} commenti`;

  return (
    <li className="tv-rx-row" data-selected={selected ? "true" : undefined}>
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
            {tool.category?.label ?? "Altri segnali"} · {keySignal}
          </span>
        </span>
      </button>
      <span className="tv-rx-row__actions">
        {tool.catalogSlug ? (
          <>
            <ShortlistToggle slug={tool.catalogSlug} mode="icon" toolName={tool.name} />
            <CompareToggle slug={tool.catalogSlug} mode="icon" toolName={tool.name} />
            <Link
              className="tv-rx-row__open"
              href={`/toools/${tool.catalogSlug}`}
              aria-label={`Apri la scheda di ${tool.name}`}
            >
              Scheda
            </Link>
          </>
        ) : (
          <a
            className="tv-rx-row__open"
            href={tool.productHuntUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Fonte
          </a>
        )}
      </span>
    </li>
  );
}
