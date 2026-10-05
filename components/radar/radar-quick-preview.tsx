"use client";

/**
 * Tool quick preview (spec §10-11, §39).
 *
 * Premium compact panel in Radar visual language. Shows ONLY canonical data —
 * no invented score. Reuses the canonical Save (gold) and Compare (cyan)
 * systems. Tool Detail is the canonical `/toools/[slug]` — never a second page.
 */

import Link from "next/link";
import { ArrowUpRight, MessageCircle, X } from "lucide-react";

import { CompareToggle } from "@/components/tools/compare-toggle";
import { ShortlistToggle } from "@/components/tools/shortlist-toggle";
import { formatAge } from "@/lib/radar/radar-trend";
import type { RadarTool } from "@/lib/radar/radar-domain";

export type RadarQuickPreviewProps = {
  tool: RadarTool;
  onClose: () => void;
  /** True while a historical delta would be needed (never fabricated). */
  historyAvailable: boolean;
};

export function RadarQuickPreview({
  tool,
  onClose,
  historyAvailable,
}: RadarQuickPreviewProps) {
  return (
    <aside
      className="tv-rx-preview"
      role="dialog"
      aria-modal="false"
      aria-label={`Anteprima di ${tool.name}`}
    >
      <header className="tv-rx-preview__header">
        {tool.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- source thumbnails are remote PH assets with no stable width/height
          <img
            src={tool.thumbnailUrl}
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
          <h3 className="tv-rx-preview__title">{tool.name}</h3>
          <p className="tv-rx-preview__category">
            {tool.category?.label ?? "Altri segnali"}
          </p>
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

      <p className="tv-rx-preview__tagline">{tool.tagline}</p>

      <dl className="tv-rx-preview__metrics">
        <div>
          <dt>Posizione</dt>
          <dd>#{tool.rank} nel periodo</dd>
        </div>
        <div>
          <dt>Voti</dt>
          <dd>{tool.votesCount}</dd>
        </div>
        <div>
          <dt>Commenti</dt>
          <dd>
            <MessageCircle size={11} aria-hidden="true" /> {tool.commentsCount}
          </dd>
        </div>
        <div>
          <dt>Lancio</dt>
          <dd>{formatAge(tool.ageHours)}</dd>
        </div>
      </dl>

      <p className="tv-rx-preview__delta" data-history={historyAvailable ? "true" : "false"}>
        {historyAvailable
          ? "Variazione disponibile."
          : "Dati storici in raccolta: variazione e trend non ancora disponibili."}
      </p>

      {tool.topics.length > 0 ? (
        <ul className="tv-rx-preview__tags" aria-label="Topic della fonte">
          {tool.topics.slice(0, 4).map((topic) => (
            <li key={topic}>{topic}</li>
          ))}
        </ul>
      ) : null}

      <div className="tv-rx-preview__actions">
        {tool.catalogSlug ? (
          <>
            <ShortlistToggle
              slug={tool.catalogSlug}
              mode="icon"
              toolName={tool.name}
            />
            <CompareToggle
              slug={tool.catalogSlug}
              mode="icon"
              toolName={tool.name}
            />
            <Link
              className="tv-rx-preview__detail"
              href={`/toools/${tool.catalogSlug}`}
            >
              Apri dettaglio
              <ArrowUpRight size={14} aria-hidden="true" />
            </Link>
          </>
        ) : (
          <Link className="tv-rx-preview__detail" href="/archivio">
            Vedi nel Catalogo
            <ArrowUpRight size={14} aria-hidden="true" />
          </Link>
        )}
      </div>

      <a
        className="tv-rx-preview__source"
        href={tool.productHuntUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        Fonte: Product Hunt
        <ArrowUpRight size={12} aria-hidden="true" />
      </a>
    </aside>
  );
}
