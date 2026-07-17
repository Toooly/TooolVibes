"use client";

import { AnimatePresence, motion } from "motion/react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import type { ReactNode } from "react";
import type { CatalogPanel } from "./use-catalog-controller";

/* ═══════════════════════════════════════════════════════════════
   CatalogCommandPanel — overlay panel for search / filters.
   Presentational extraction from MobileCatalogView (B25).
   ═══════════════════════════════════════════════════════════════ */

type CatalogCommandPanelProps = {
  panel: CatalogPanel | null;
  filterGroups: { key: string; label: string }[];
  activeGroup: string | null;
  onClose: () => void;
  onSelectGroup: (groupKey: string) => void;
  searchControl: ReactNode;
  levelControls: ReactNode;
};

export function CatalogCommandPanel({
  panel,
  filterGroups,
  activeGroup,
  onClose,
  onSelectGroup,
  searchControl,
  levelControls,
}: CatalogCommandPanelProps) {
  return (
    <AnimatePresence>
      {panel && (
        <motion.section
          key="catalog-panel"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22 }}
          className="mobile-catalog-command-panel"
          data-catalog-panel
          aria-label={panel === "search" ? "Ricerca catalogo" : "Filtri catalogo"}
        >
          <div className="mobile-catalog-command-panel__header">
            <span className="mobile-catalog-command-panel__icon">
              {panel === "search" ? (
                <Search size={16} aria-hidden="true" />
              ) : (
                <SlidersHorizontal size={16} aria-hidden="true" />
              )}
            </span>
            <strong>{panel === "search" ? "Affina" : "Filtri"}</strong>
            <button
              type="button"
              onClick={onClose}
              className="mobile-catalog-command-panel__close"
              aria-label="Chiudi pannello"
            >
              <X size={15} aria-hidden="true" />
            </button>
          </div>

          {panel === "search" ? (
            <div className="mobile-catalog-command-panel__search">{searchControl}</div>
          ) : (
            <div className="mobile-catalog-command-panel__filters">
              <div className="mobile-catalog-command-panel__group">
                <span>Categoria</span>
                <div className="mobile-catalog-command-panel__category-list">
                  {filterGroups.map((group) => {
                    const isActive =
                      group.key === "all" ? !activeGroup : activeGroup === group.key;
                    return (
                      <button
                        key={group.key}
                        type="button"
                        onClick={() => onSelectGroup(group.key)}
                        className={`mobile-catalog-command-panel__category${isActive ? " is-active" : ""}`}
                      >
                        {group.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="mobile-catalog-command-panel__group">
                <span>Livello</span>
                {levelControls}
              </div>
            </div>
          )}
        </motion.section>
      )}
    </AnimatePresence>
  );
}
