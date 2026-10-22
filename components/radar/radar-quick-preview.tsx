"use client";

import { LocalizedText, LocalizedAttributes } from "@/components/i18n/localized-text";
/**
 * Tool quick preview (spec §2-§4, §8, §16).
 *
 * Premium compact panel in Radar visual language. Shows ONLY canonical data —
 * no invented score.
 *
 * CTA MATRIX (spec §26):
 *   CATALOG-LINKED  → Apri scheda (`/toools/[slug]` ONLY) + Save + Compare + Watch
 *   EXTERNAL        → NO catalog navigation, NO Save, NO Compare.
 *                     Badge "Segnale esterno", primary VISITA IL SITO (only when
 *                     the source provides a verified website) else APRI LA FONTE,
 *                     secondary PRODUCT HUNT, internal SEGUI NEL RADAR (Watch).
 *
 * Save/Compare stay Catalog concepts. External signals use Watch, so canonical
 * workspace semantics are never corrupted.
 */

import Link from "@/components/ui/app-link";
import { useId, useState } from "react";
import { ArrowUpRight, ChevronDown, ChevronUp, Eye, X } from "lucide-react";

import { CompareToggle } from "@/components/tools/compare-toggle";
import { ShortlistToggle } from "@/components/tools/shortlist-toggle";
import { MetricStrip } from "@/components/ui/metric-strip";
import { formatAge } from "@/lib/radar/radar-trend";
import type { RadarTool } from "@/lib/radar/radar-domain";

export type RadarQuickPreviewProps = {
  tool: RadarTool;
  onClose: () => void;
  /** True while a historical delta would be needed (never fabricated). */
  historyAvailable: boolean;
  /** Watch state for this signal (the internal Radar action). */
  watched: boolean;
  onToggleWatch: () => void;
  /** List inspection stays at the selected row and opens its reading details. */
  inline?: boolean;
};

export function RadarQuickPreview({
  tool,
  onClose,
  historyAvailable,
  watched,
  onToggleWatch,
  inline = false,
}: RadarQuickPreviewProps) {
  const detailsId = useId();
  const [expanded, setExpanded] = useState(inline);
  const [thumbnailFailed, setThumbnailFailed] = useState(false);
  const isExternal = tool.catalogStatus === "external";
  const externalLinkProps = {
    target: "_blank" as const,
    rel: "noopener noreferrer",
  };

  return (
    <LocalizedAttributes><div
      className="tv-rx-preview"
      role="dialog"
      aria-modal="false"
      aria-label={`Anteprima di ${tool.name}`}
      data-catalog-status={tool.catalogStatus}
      data-inspection={expanded ? "expanded" : "compact"}
      data-placement={inline ? "inline" : "atlas"}
    >
      <button
        type="button"
        className="tv-rx-preview__snap"
        aria-expanded={expanded}
        aria-controls={detailsId}
        onClick={() => setExpanded((value) => !value)}
      >
        <span className="tv-rx-preview__handle" aria-hidden="true" />
        <span><LocalizedText>{expanded ? "Riduci dettagli" : "Dettagli completi"}</LocalizedText></span>
        {expanded ? <ChevronDown size={16} aria-hidden="true" /> : <ChevronUp size={16} aria-hidden="true" />}
      </button>
      <p className="tv-rx__eyebrow"><LocalizedText>{"03 / Segnale selezionato"}</LocalizedText></p>
      <header className="tv-rx-preview__header">
        {tool.thumbnailUrl && !thumbnailFailed ? (
          // eslint-disable-next-line @next/next/no-img-element -- source thumbnails are remote PH assets with no stable width/height
          <LocalizedAttributes><img
            src={tool.thumbnailUrl}
            onError={() => setThumbnailFailed(true)}
            alt=""
            className="tv-rx-preview__logo"
            width={40}
            height={40}
          /></LocalizedAttributes>
        ) : (
          <span className="tv-rx-preview__logo tv-rx-preview__logo--fallback" aria-hidden="true">
            {tool.name.slice(0, 2).toUpperCase()}
          </span>
        )}
        <div className="tv-rx-preview__title-block">
          <h2 className="tv-rx-preview__title" tabIndex={-1}>{tool.name}</h2>
          <p className="tv-rx-preview__category"><LocalizedText>{tool.topicCluster.label}</LocalizedText></p>
        </div>
        <LocalizedAttributes><button
          type="button"
          className="tv-rx-preview__close"
          onClick={onClose}
          aria-label="Chiudi anteprima"
        >
          <X size={16} aria-hidden="true" />
        </button></LocalizedAttributes>
      </header>

      <p className="tv-rx-preview__badge" data-catalog-status={tool.catalogStatus}>
        <LocalizedText>{isExternal ? "Segnale esterno · Product Hunt" : "Nel Catalogo TooolVibes"}</LocalizedText>
      </p>

      <p className="tv-rx-preview__tagline"><LocalizedText>{tool.tagline}</LocalizedText></p>
      <p className="tv-rx-preview__age"><LocalizedText>Emerso</LocalizedText>{" "}<LocalizedText>{formatAge(tool.ageHours)}</LocalizedText>{" · #"}{tool.rank}{" "}<LocalizedText>nel periodo</LocalizedText></p>
      <p className="tv-rx-sr-only"><LocalizedText>{`${tool.votesCount} voti · ${tool.commentsCount} commenti`}</LocalizedText></p>
      <div id={detailsId} className="tv-rx-preview__details">
        {/* §16 — explainable position: why this signal sits where it sits. */}
        <MetricStrip label="Attenzione nello snapshot" className="tv-rx-preview__metrics" items={[
          { label: "Voti", value: tool.votesCount },
          { label: "Commenti", value: tool.commentsCount },
          { label: "Posizione", value: `#${tool.rank}` },
        ]} />
        <p className="tv-rx-preview__delta" data-history={historyAvailable ? "true" : "false"}>
          <LocalizedText>{historyAvailable
            ? "Variazione disponibile."
            : "Dati storici in raccolta: variazione e trend non ancora disponibili."}</LocalizedText>
        </p>

        {/* §8 — source transparency: the derived classification is explainable. */}
        <dl className="tv-rx-preview__source-list">
          <div>
            <dt><LocalizedText>{"Area"}</LocalizedText></dt>
            <dd><LocalizedText>{tool.topicCluster.label}</LocalizedText></dd>
          </div>
          <div>
            <dt><LocalizedText>{"Fonte"}</LocalizedText></dt>
            <dd><LocalizedText>{"Product Hunt"}</LocalizedText></dd>
          </div>
          <div>
            <dt><LocalizedText>{"Topics"}</LocalizedText></dt>
            <dd><LocalizedText>{tool.topics.length > 0 ? tool.topics.slice(0, 4).join(" · ") : "—"}</LocalizedText></dd>
          </div>
        </dl>
      </div>

      <div className="tv-rx-preview__actions">
        {isExternal ? (
          <>
            <a
              className="tv-rx-preview__primary"
              href={tool.websiteUrl ?? tool.sourceUrl}
              {...externalLinkProps}
            >
              <LocalizedText>{tool.websiteUrl ? "Visita il sito" : "Apri la fonte"}</LocalizedText>
              <ArrowUpRight size={14} aria-hidden="true" />
            </a>
            <button
              type="button"
              className="tv-rx-preview__watch"
              data-watched={watched ? "true" : "false"}
              aria-pressed={watched}
              onClick={onToggleWatch}
            >
              <Eye size={14} aria-hidden="true" />
              <LocalizedText>{watched ? "Seguito" : "Segui nel Radar"}</LocalizedText>
            </button>
            {tool.websiteUrl ? (
              <a className="tv-rx-preview__source" href={tool.sourceUrl} {...externalLinkProps}><LocalizedText>{"Product Hunt "}</LocalizedText><ArrowUpRight size={12} aria-hidden="true" />
              </a>
            ) : null}
          </>
        ) : (
          <>
            <Link
              className="tv-rx-preview__primary"
              href={`/toools/${tool.catalogSlug}`}
            ><LocalizedText>{"Apri scheda "}</LocalizedText><ArrowUpRight size={14} aria-hidden="true" />
            </Link>
            <ShortlistToggle
              slug={tool.catalogSlug ?? tool.id}
              mode="icon"
              toolName={tool.name}
            />
            <CompareToggle
              slug={tool.catalogSlug ?? tool.id}
              mode="icon"
              toolName={tool.name}
            />
            <button
              type="button"
              className="tv-rx-preview__watch"
              data-watched={watched ? "true" : "false"}
              aria-pressed={watched}
              onClick={onToggleWatch}
            >
              <Eye size={14} aria-hidden="true" />
              <LocalizedText>{watched ? "Seguito" : "Segui nel Radar"}</LocalizedText>
            </button>
            <a className="tv-rx-preview__source" href={tool.sourceUrl} {...externalLinkProps}><LocalizedText>{"Product Hunt "}</LocalizedText><ArrowUpRight size={12} aria-hidden="true" />
            </a>
          </>
        )}
      </div>
    </div></LocalizedAttributes>
  );
}
