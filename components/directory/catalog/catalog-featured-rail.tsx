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
   ═══════════════════════════════════════════════════════════════ */

type CatalogFeaturedRailProps = {
  tools: ToolPublicView[];
  onSelectAll: () => void;
};

export function CatalogFeaturedRail({ tools, onSelectAll }: CatalogFeaturedRailProps) {
  if (!tools.length) return null;

  return (
    <section className="catalog-featured-rail" aria-label="Tool consigliati">
      <div className="catalog-featured-rail__header">
        <div>
          <span>Scelte consigliate</span>
          <h2>Tool pronti da valutare</h2>
        </div>
        <button type="button" onClick={onSelectAll} className="catalog-featured-rail__cta">
          Vedi tutti
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
