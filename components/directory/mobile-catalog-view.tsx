"use client";

import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { ArrowLeft, Search } from "lucide-react";
import type { ToolPublicView } from "@/lib/data/tool-public-view";
import { useCatalogController } from "./catalog/use-catalog-controller";
import type { CatalogLevelFilter } from "./catalog/catalog-controller";
import { CatalogSearchControl, CatalogLevelChips } from "./catalog/catalog-controls";
import { CatalogCommandPanel } from "./catalog/catalog-command-panel";
import { CatalogCategoryMap } from "./catalog/catalog-category-map";
import { CatalogResultList } from "./catalog/catalog-result-list";

/* ═══════════════════════════════════════════════════════════════
   MobileCatalogView — facade compositivo.
   B25: query/filter/URL state vive in useCatalogController
   (components/directory/catalog); result list, sponsor/featured slot,
   category map e command panel sono componenti isolati.
   La route continua a montare questo export: comportamento invariato.
   ═══════════════════════════════════════════════════════════════ */

interface MobileCatalogViewProps {
  tools: ToolPublicView[];
  filterGroups: { key: string; label: string }[];
  initialQuery?: string;
  initialGroup?: string;
  initialTag?: string;
  initialLevel?: CatalogLevelFilter;
  unifiedSearchEnabled?: boolean;
  showIntro?: boolean;
}

export function MobileCatalogView({
  tools,
  filterGroups,
  initialQuery = "",
  initialGroup = "all",
  initialTag = "",
  initialLevel = "all",
  unifiedSearchEnabled = true,
  showIntro = true,
}: MobileCatalogViewProps) {
  const controller = useCatalogController({
    tools,
    filterGroups,
    initialQuery,
    initialGroup,
    initialTag,
    initialLevel,
    unifiedSearchEnabled,
  });

  const {
    view,
    activeGroup,
    searchQuery,
    activeLevel,
    openPanel,
    setOpenPanel,
    setActiveLevel,
    filteredTools,
    activeGroupLabel,
    categories,
    featuredTools,
    handleCategorySelect,
    handleBack,
    handleSearchChange,
  } = controller;

  const searchControl = (
    <CatalogSearchControl value={searchQuery} view={view} onChange={handleSearchChange} />
  );

  const levelControls = (
    <CatalogLevelChips activeLevel={activeLevel} onSelect={setActiveLevel} />
  );

  return (
    <MotionConfig reducedMotion="user">
      <div className="catalog-page mobile-catalog-view relative min-h-screen pb-24">
      <CatalogCommandPanel
        panel={openPanel}
        filterGroups={filterGroups}
        activeGroup={activeGroup}
        onClose={() => setOpenPanel(null)}
        onSelectGroup={handleCategorySelect}
        searchControl={searchControl}
        levelControls={levelControls}
      />
      {showIntro && (
        <section
          className={`catalog-discovery${view === "tools" ? " is-results" : ""}`}
          aria-labelledby="catalog-title"
        >
          <div className="catalog-discovery__copy">
            <p className="catalog-discovery__eyebrow">Directory editoriale</p>
            <h1 id="catalog-title">Il catalogo, senza il caos.</h1>
            <p>
              Parti da un obiettivo oppure cerca direttamente. Ogni profilo è
              selezionato per aiutarti a decidere, non per riempire una lista.
            </p>
          </div>
          {view === "categories" && (
            <div className="catalog-discovery__search">
              {searchControl}
              <div className="catalog-discovery__metrics" aria-label="Statistiche catalogo">
                <span><strong>{tools.length}</strong> tool curati</span>
                <span><strong>{Math.max(categories.length - 1, 0)}</strong> categorie</span>
              </div>
            </div>
          )}
        </section>
      )}
      {/* Content */}
      <AnimatePresence mode="wait">
        {view === "categories" ? (
          <motion.div
            key="categories"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
          >
            <CatalogCategoryMap
              categories={categories}
              onSelect={handleCategorySelect}
              featuredTools={featuredTools}
            />
          </motion.div>
        ) : (
          <motion.div
            key="tools"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
          >
            <div className="mobile-catalog-view__tools-controls">
              <motion.button
                key="back"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
                onClick={handleBack}
                className="mobile-catalog-view__back"
                aria-label="Torna alle categorie"
              >
                <ArrowLeft size={18} />
                <span>Categorie</span>
              </motion.button>
              {searchControl}
              {levelControls}
            </div>
            <CatalogResultList
              tools={filteredTools}
              groupLabel={activeGroupLabel}
              searchQuery={searchQuery}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      <AnimatePresence>
        {view === "tools" && filteredTools.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mobile-catalog-view__empty"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            <div className="mobile-catalog-view__empty-icon">
              <Search size={24} className="text-[#6a3cff]" />
            </div>
            <h3>Nessun tool in questa vista</h3>
            <p>Prova a togliere un filtro o ad ampliare il testo di affinamento.</p>
            <button onClick={handleBack} className="mobile-catalog-view__empty-cta">
              Torna alle categorie
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </MotionConfig>
  );
}
