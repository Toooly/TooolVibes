"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { CSSProperties } from "react";
import type { ToolPublicView } from "@/lib/data/tool-public-view";
import { extractDomain } from "./catalog-controller";

/* ═══════════════════════════════════════════════════════════════
   CatalogFeaturedRail — sponsor/featured slot ("Scelte consigliate").
   Isolated promotion placement extracted from MobileCatalogView (B25).
   Sponsor policy unchanged: same selection, same markup, same links.

   B38 / MOB-702 — disclosure esplicita "Promosso" accanto
   all'eyebrow (sponsor disclosure chiara) e aria-label dichiarata;
   la rail resta DOPO il primo valore organico utile (in
   CatalogCategoryMap segue la griglia categorie).
   ═══════════════════════════════════════════════════════════════ */

type CatalogFeaturedRailProps = {
  tools: ToolPublicView[];
  onSelectAll: () => void;
};

export function CatalogFeaturedRail({ tools, onSelectAll }: CatalogFeaturedRailProps) {
  if (!tools.length) return null;

  return (
    <section
      className="catalog-featured-rail"
      aria-label="Tool consigliati, contenuto promosso"
      data-sponsor-slot="catalog-featured"
    >
      <div className="catalog-featured-rail__header">
        <div>
          <span>Scelte consigliate</span>
          <span
            className="catalog-featured-rail__disclosure ml-2 inline-flex items-center rounded-full border border-[var(--tv-border-subtle)] px-2 py-0.5 align-middle text-[length:var(--tv-text-xs)] font-semibold uppercase tracking-[var(--tv-tracking-label)] text-[var(--tv-ink-muted-aa)]"
          >
            Promosso
          </span>
          <h2>Tool pronti da valutare</h2>
        </div>
        <button type="button" onClick={onSelectAll} className="catalog-featured-rail__cta">
          Esplora archivio
          <ArrowRight size={14} aria-hidden="true" />
        </button>
      </div>
      <div className="catalog-featured-rail__list">
        {tools.map((tool) => {
          const domain = extractDomain(tool.url);
          const iconUrl = domain
            ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`
            : undefined;

          return (
            <Link key={tool.slug} href={`/toools/${tool.slug}`} className="catalog-featured-card">
              <span
                className="catalog-featured-card__icon"
                style={iconUrl ? { "--featured-icon": `url("${iconUrl}")` } as CSSProperties : undefined}
              >
                {iconUrl ? (
                  <span className="catalog-featured-card__icon-image" aria-hidden="true" />
                ) : (
                  <strong>{tool.name.slice(0, 2).toUpperCase()}</strong>
                )}
              </span>
              <span className="catalog-featured-card__meta">
                <strong>{tool.name}</strong>
                <small>{tool.categoryLabel}</small>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
