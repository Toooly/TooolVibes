"use client";

import { LocalizedText, LocalizedAttributes } from "@/components/i18n/localized-text";
/**
 * Compact Radar tool row (spec §6, §33) — deliberately NOT a Catalog card.
 *
 * LIST ROW PARITY (spec §26):
 *   CATALOG-LINKED  → Scheda / Save / Compare
 *   EXTERNAL        → Fonte ↗ / Segui
 * The row and the quick preview can never disagree about what a signal is.
 */

import Link from "@/components/ui/app-link";
import { useId, useState, type ReactNode } from "react";
import { ArrowUpRight, ChevronDown, Eye } from "lucide-react";

import { CompareToggle } from "@/components/tools/compare-toggle";
import { ShortlistToggle } from "@/components/tools/shortlist-toggle";
import type { RadarTool } from "@/lib/radar/radar-domain";
import { formatAge } from "@/lib/radar/radar-trend";

export function RadarToolRow({
  tool,
  index,
  selected,
  onSelect,
  watched,
  onToggleWatch,
  children,
}: {
  tool: RadarTool;
  index: number;
  selected: boolean;
  onSelect: (toolId: string) => void;
  watched: boolean;
  onToggleWatch: (tool: RadarTool) => void;
  children?: ReactNode;
}) {
  const keySignal = `${tool.votesCount} voti · ${tool.commentsCount} commenti`;
  const isExternal = tool.catalogStatus === "external";
  const detailsId = useId();
  const [thumbnailFailed, setThumbnailFailed] = useState(false);
  const expanded = Boolean(children);

  return (
    <li
      className="tv-rx-row"
      data-selected={selected ? "true" : undefined}
      data-catalog-status={tool.catalogStatus}
      data-expanded={expanded ? "true" : undefined}
    >
      <LocalizedAttributes><button
        type="button"
        className="tv-rx-row__main"
        onClick={event => {
          event.currentTarget.focus({ preventScroll: true });
          onSelect(tool.id);
        }}
        aria-expanded={expanded}
        aria-controls={expanded ? detailsId : undefined}
        aria-label={`${expanded ? "Chiudi" : "Apri"} dettagli di ${tool.name}`}
      >
        <span className="tv-rx-row__rank" aria-hidden="true">
          <LocalizedText>{String(index + 1).padStart(2, "0")}</LocalizedText>
        </span>
        <span className="tv-rx-row__identity" aria-hidden="true">
          {tool.thumbnailUrl && !thumbnailFailed ? (
            // eslint-disable-next-line @next/next/no-img-element -- factual source thumbnail; no invented catalog identity
            <LocalizedAttributes><img src={tool.thumbnailUrl} width={40} height={40} alt="" loading="lazy" decoding="async" onError={() => setThumbnailFailed(true)} /></LocalizedAttributes>
          ) : tool.name.slice(0, 1).toLocaleUpperCase("it-IT")}
        </span>
        <span className="tv-rx-row__body">
          <strong className="tv-rx-row__name">{tool.name}</strong>
          <span className="tv-rx-row__tagline"><LocalizedText>{tool.tagline}</LocalizedText></span>
          <span className="tv-rx-row__meta">
            <span><LocalizedText>{tool.topicCluster.label}</LocalizedText></span><span><LocalizedText>{formatAge(tool.ageHours)}</LocalizedText></span>
            <span className="tv-rx-sr-only"><LocalizedText>{keySignal}</LocalizedText></span>
          </span>
        </span>
        <ChevronDown className="tv-rx-row__chevron" size={16} aria-hidden="true" />
      </button></LocalizedAttributes>
      <span className="tv-rx-row__actions">
        {isExternal ? (
          <>
            <LocalizedAttributes><button
              type="button"
              className="tv-rx-row__watch"
              data-watched={watched ? "true" : "false"}
              aria-pressed={watched}
              aria-label={`${watched ? "Smetti di seguire" : "Segui"} ${tool.name} nel Radar`}
              onClick={() => onToggleWatch(tool)}
            >
              <Eye size={13} aria-hidden="true" />
            </button></LocalizedAttributes>
            <a
              className="tv-rx-row__open"
              href={tool.websiteUrl ?? tool.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
            ><LocalizedText>{"Fonte "}</LocalizedText><ArrowUpRight size={12} aria-hidden="true" />
            </a>
          </>
        ) : (
          <>
            <ShortlistToggle slug={tool.catalogSlug ?? tool.id} mode="icon" toolName={tool.name} />
            <CompareToggle slug={tool.catalogSlug ?? tool.id} mode="icon" toolName={tool.name} />
            <LocalizedAttributes><Link
              className="tv-rx-row__open"
              href={`/toools/${tool.catalogSlug ?? ""}`}
              aria-label={`Apri la scheda di ${tool.name}`}
            ><LocalizedText>{"Scheda "}</LocalizedText></Link></LocalizedAttributes>
          </>
        )}
      </span>
      {children && <div id={detailsId} className="tv-rx-row__details">{children}</div>}
    </li>
  );
}
