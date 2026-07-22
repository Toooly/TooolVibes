"use client";

import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import type { CSSProperties } from "react";
import type { ToolPublicView } from "@/lib/data/tool-public-view";
import {
  CATEGORY_ICON_MAP,
  type CatalogCategorySummary,
} from "./catalog-controller";
import { CatalogFeaturedRail } from "./catalog-featured-rail";

/* ═══════════════════════════════════════════════════════════════
   CatalogCategoryMap — categories view (blob grid + featured rail).
   Presentational extraction from MobileCatalogView (B25).
   ═══════════════════════════════════════════════════════════════ */

type CatalogCategoryMapProps = {
  categories: CatalogCategorySummary[];
  onSelect: (key: string) => void;
  featuredTools: ToolPublicView[];
};

export function CatalogCategoryMap({
  categories,
  onSelect,
  featuredTools,
}: CatalogCategoryMapProps) {
  return (
    <section className="catalog-category-map" aria-labelledby="catalog-category-title">
      <span className="sr-only">Scegli una categoria per iniziare</span>
      <div className="catalog-category-map__header">
        <div>
          <p>Esplora per obiettivo</p>
          <h2 id="catalog-category-title">Scegli il territorio da esplorare.</h2>
        </div>
        <span>{categories.length} percorsi</span>
      </div>

      <div className="catalog-category-map__grid" data-catalog-categories>
        {categories.map((cat, index) => {
          const Icon = CATEGORY_ICON_MAP[cat.iconName];
          return (
            <motion.button
              key={cat.key}
              type="button"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35, delay: index * 0.04 }}
              onClick={() => onSelect(cat.key)}
              className="catalog-category-map__card"
              aria-label={`${cat.label}. ${cat.count} tool`}
              data-category-key={cat.key}
              style={{ "--cat-color": cat.color } as CSSProperties}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.96 }}
            >
              <span className="catalog-category-map__icon">
                <Icon size={28} aria-hidden="true" />
              </span>
              <span className="catalog-category-map__label">
                <strong>{cat.label}</strong>
                <small>{cat.count} tool</small>
              </span>
              <ArrowRight className="catalog-category-map__arrow" size={18} aria-hidden="true" />
            </motion.button>
          );
        })}
      </div>
      <CatalogFeaturedRail tools={featuredTools} onSelectAll={() => onSelect("all")} />
    </section>
  );
}
