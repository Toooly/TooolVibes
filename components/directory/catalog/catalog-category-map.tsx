"use client";

import { motion } from "motion/react";
import { ChevronDown } from "lucide-react";
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

function CategoryGuide() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.4 }}
      className="mobile-category-map__guide"
    >
      <span className="mobile-category-map__guide-text">
        Scegli una categoria per iniziare
      </span>
      <motion.span
        className="mobile-category-map__guide-arrow"
        animate={{ y: [0, 5, 0] }}
        transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
      >
        <ChevronDown size={16} />
      </motion.span>
    </motion.div>
  );
}

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
    <section className="mobile-category-map" aria-label="Esplora per categoria">
      <div
        className="mobile-category-map__stats"
        aria-label="Statistiche catalogo"
        data-catalog-filters
        style={{ background: "transparent", borderColor: "transparent", boxShadow: "none" }}
      >
        <span>
          <strong>{categories.find((cat) => cat.key === "all")?.count ?? 0}</strong>
          tool
        </span>
        <span>
          <strong>{Math.max(categories.length - 1, 0)}</strong>
          categorie
        </span>
      </div>

      <CategoryGuide />

      <div className="mobile-category-map__grid" data-catalog-categories>
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
              className="mobile-category-map__blob"
              aria-label={`${cat.label}. ${cat.count} tool`}
              data-category-key={cat.key}
              style={{ "--cat-color": cat.color } as CSSProperties}
              whileTap={{ scale: 0.96 }}
            >
              <span className="mobile-category-map__halo" aria-hidden="true" />
              <span className="mobile-category-map__orbit" aria-hidden="true" />
              <span className="mobile-category-map__body">
                <Icon size={28} aria-hidden="true" />
              </span>
              <span className="mobile-category-map__label">
                <strong>{cat.label}</strong>
                <small>{cat.count} tool</small>
              </span>
            </motion.button>
          );
        })}
      </div>
      <CatalogFeaturedRail tools={featuredTools} onSelectAll={() => onSelect("all")} />
    </section>
  );
}
