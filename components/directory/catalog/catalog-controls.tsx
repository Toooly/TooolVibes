"use client";

import { Search, X } from "lucide-react";
import {
  CATALOG_LEVEL_CHIPS,
  type CatalogLevelFilter,
  type CatalogView,
} from "./catalog-controller";

/* ═══════════════════════════════════════════════════════════════
   Catalog controls — search input and level filter chips.
   Presentational extraction from MobileCatalogView (B25).
   ═══════════════════════════════════════════════════════════════ */

type CatalogSearchControlProps = {
  value: string;
  view: CatalogView;
  onChange: (value: string) => void;
};

export function CatalogSearchControl({ value, view, onChange }: CatalogSearchControlProps) {
  return (
    <div className="mobile-catalog-view__search">
      <Search size={16} className="shrink-0 text-[#6a3cff]" />
      <input
        data-catalog-search
        /* B39/MOB-703: zoom guard iOS (>=16px su touch) anti auto-zoom. */
        className="tv-kbd-input"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={
          view === "categories" ? "Cerca categorie o tool..." : "Filtra i tool visibili..."
        }
        aria-label={
          view === "categories"
            ? "Cerca categorie o tool nel catalogo"
            : "Affina i tool visibili"
        }
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="shrink-0 rounded-full p-1 transition-colors hover:bg-[rgba(106,60,255,0.08)]"
          aria-label="Cancella ricerca"
        >
          <X size={14} className="text-[#4f4970]" />
        </button>
      )}
    </div>
  );
}

type CatalogLevelChipsProps = {
  activeLevel: CatalogLevelFilter;
  onSelect: (level: CatalogLevelFilter) => void;
};

export function CatalogLevelChips({ activeLevel, onSelect }: CatalogLevelChipsProps) {
  return (
    <div className="mobile-catalog-view__chips" data-catalog-filters>
      {CATALOG_LEVEL_CHIPS.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={() => onSelect(chip.key)}
          className={`mobile-catalog-view__chip${activeLevel === chip.key ? " is-active" : ""}`}
        >
          {chip.label}
        </button>
      ))}
    </div>
  );
}
