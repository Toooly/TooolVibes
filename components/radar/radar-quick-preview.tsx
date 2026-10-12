"use client";

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

import Link from "next/link";
import { useState } from "react";
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
  const [expanded, setExpanded] = useState(inline);
  const [thumbnailFailed, setThumbnailFailed] = useState(false);
  const isExternal = tool.catalogStatus === "external";
  const externalLinkProps = {
    target: "_blank" as const,
    rel: "noopener noreferrer",
  };

  return (
    <div
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
        aria-controls="tv-rx-preview-details"
        onClick={() => setExpanded((value) => !value)}
      >
        <span className="tv-rx-preview__handle" aria-hidden="true" />
        <span>{expanded ? "Riduci dettagli" : "Dettagli completi"}</span>
        {expanded ? <ChevronDown size={16} aria-hidden="true" /> : <ChevronUp size={16} aria-hidden="true" />}
      </button>
      <p className="tv-rx__eyebrow">03 / Segnale selezionato</p>
      <header className="tv-rx-preview__header">
        {tool.thumbnailUrl && !thumbnailFailed ? (
          // eslint-disable-next-line @next/next/no-img-element -- source thumbnails are remote PH assets with no stable width/height
          <img
            src={tool.thumbnailUrl}
            onError={() => setThumbnailFailed(true)}
            alt=""
            className="tv-rx-preview__logo"
            width={40}
            height={40}
          />
        ) : (
          <span className="tv-rx-preview__logo tv-rx-preview__logo--fallback" aria-hidden="true">
            {tool.name.slice(0, 2).toUpperCase()}
          </span>
        )}
        <div className="tv-rx-preview__title-block">
          <h2 className="tv-rx-preview__title">{tool.name}</h2>
          <p className="tv-rx-preview__category">{tool.topicCluster.label}</p>
        </div>
        <button
          type="button"
          className="tv-rx-preview__close"
          onClick={onClose}
          aria-label="Chiudi anteprima"
        >
          <X size={16} aria-hidden="true" />
        </button>
      </header>

      <p className="tv-rx-preview__badge" data-catalog-status={tool.catalogStatus}>
        {isExternal ? "Segnale esterno · Product Hunt" : "Nel Catalogo TooolVibes"}
      </p>

      {/* §16 — explainable position: why this signal sits where it sits. */}
      <MetricStrip label="Attenzione nello snapshot" className="tv-rx-preview__metrics" items={[
        { label: "Voti", value: tool.votesCount },
        { label: "Commenti", value: tool.commentsCount },
        { label: "Posizione", value: `#${tool.rank}` },
      ]} />
      <p className="tv-rx-preview__age">Emerso {formatAge(tool.ageHours)} · #{tool.rank} nel periodo</p>
      <p className="tv-rx-sr-only">{tool.votesCount} voti · {tool.commentsCount} commenti</p>

      <div id="tv-rx-preview-details" className="tv-rx-preview__details">
        <p className="tv-rx-preview__tagline">{tool.tagline}</p>
        <p className="tv-rx-preview__delta" data-history={historyAvailable ? "true" : "false"}>
          {historyAvailable
            ? "Variazione disponibile."
            : "Dati storici in raccolta: variazione e trend non ancora disponibili."}
        </p>

        {/* §8 — source transparency: the derived classification is explainable. */}
        <dl className="tv-rx-preview__source-list">
          <div>
            <dt>Area</dt>
            <dd>{tool.topicCluster.label}</dd>
          </div>
          <div>
            <dt>Fonte</dt>
            <dd>Product Hunt</dd>
          </div>
          <div>
            <dt>Topics</dt>
            <dd>{tool.topics.length > 0 ? tool.topics.slice(0, 4).join(" · ") : "—"}</dd>
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
              {tool.websiteUrl ? "Visita il sito" : "Apri la fonte"}
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
              {watched ? "Seguito" : "Segui nel Radar"}
            </button>
            {tool.websiteUrl ? (
              <a className="tv-rx-preview__source" href={tool.sourceUrl} {...externalLinkProps}>
                Product Hunt
                <ArrowUpRight size={12} aria-hidden="true" />
              </a>
            ) : null}
          </>
        ) : (
          <>
            <Link
              className="tv-rx-preview__primary"
              href={`/toools/${tool.catalogSlug}`}
            >
              Apri scheda
              <ArrowUpRight size={14} aria-hidden="true" />
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
              {watched ? "Seguito" : "Segui nel Radar"}
            </button>
            <a className="tv-rx-preview__source" href={tool.sourceUrl} {...externalLinkProps}>
              Product Hunt
              <ArrowUpRight size={12} aria-hidden="true" />
            </a>
          </>
        )}
      </div>
    </div>
  );
}
