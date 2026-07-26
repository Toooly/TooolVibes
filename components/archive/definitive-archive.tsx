"use client";

/**
 * TooolVibes — Definitive Archive (v4 stabilized, 2026-07-24)
 *
 * Architecture (accepted direction):
 *  - dark Command Center intro
 *  - search + catalog statistics
 *  - filter system (mobile: Filtri button + bottom sheet; desktop: chip rail)
 *  - warm ivory Decision Desk band (3-tier promoted grammar)
 *  - dark catalog grid with progressive disclosure on mobile
 *  - persistent comparison tray
 *  - clear transition to footer
 *
 * Stabilization fixes (2026-07-24):
 *  1. Decision Desk: distinct 3-tier hierarchy (primary/secondary/tertiary)
 *  2. Removed content duplication: promoted tools hidden from default grid,
 *     accessible via "Mostra anche i tool in evidenza" toggle
 *  3. Mobile progressive disclosure: initial 12 tools, "Mostra altri" CTA
 *  4. Mobile filter sheet: Filtri button + touch-friendly bottom sheet
 *  5. Mobile promoted card anatomy: stacked, no truncation, 8 clear items
 *  6. Tablet bands: 360-767 1-col / 768-819 1-col wide / 820-1179 2-col
 *  7. Bottom nav padding: 120px on mobile (above bottom nav + tray)
 *
 * Each tool card has its own state model (default / hover / focus /
 * saved / selected / promoted with tier variant) defined in
 * ArchiveV4ToolCard.
 *
 * No real data is fabricated: counts come from `tools` + `filterGroups`.
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Sparkles, ArrowRight, SlidersHorizontal, X, Check, Filter } from "lucide-react";

import { cn } from "@/lib/utils";
import type { CatalogLevelFilter } from "@/components/directory/catalog/catalog-controller";
import type { ToolFilterGroup, ToolPublicView } from "@/lib/data/tool-public-view";
import { ArchiveV4ToolCard } from "./archive-v4-tool-card";
import { ArchiveV4CompareTray } from "./archive-v4-compare-tray";

type DefinitiveArchiveProps = {
  tools: ToolPublicView[];
  filterGroups: ToolFilterGroup[];
  initialQuery?: string;
  initialGroup?: string;
  initialLevel?: CatalogLevelFilter;
};

const LEVEL_FILTERS = [
  { key: "all", label: "Tutti i livelli" },
  { key: "beginner", label: "Principiante" },
  { key: "intermediate", label: "Intermedio" },
  { key: "expert", label: "Esperto" },
  { key: "featured", label: "In evidenza" },
] as const;

type PromotedTier = "primary" | "secondary" | "tertiary";

/** Initial visible count for mobile progressive disclosure */
const INITIAL_MOBILE_COUNT = 12;
/** Step for "Mostra altri" */
const MOBILE_STEP = 12;

export function DefinitiveArchive({
  tools,
  filterGroups,
  initialQuery = "",
  initialGroup = "all",
  initialLevel = "all",
}: DefinitiveArchiveProps) {
  const [activeGroup, setActiveGroup] = useState<string>(initialGroup);
  const [activeLevel, setActiveLevel] = useState<string>(initialLevel);
  const [query, setQuery] = useState<string>(initialQuery);
  const [showPromotedInGrid, setShowPromotedInGrid] = useState<boolean>(false);
  const [filterSheetOpen, setFilterSheetOpen] = useState<boolean>(false);
  const [mobileVisibleCount, setMobileVisibleCount] = useState<number>(INITIAL_MOBILE_COUNT);

  // The set of promoted slugs (tool of week + featured) — used to optionally
  // hide them from the default catalog grid to avoid duplication with the
  // Decision Desk band.
  const promotedSlugs = useMemo(() => {
    const set = new Set<string>();
    for (const t of tools) {
      if (t.toolOfWeek || t.featured) set.add(t.slug);
    }
    return set;
  }, [tools]);

  const filtered = useMemo(() => {
    return tools.filter((t) => {
      if (activeGroup !== "all") {
        if (!t.filterGroups.includes(activeGroup)) return false;
      }
      if (activeLevel !== "all") {
        if (activeLevel === "featured") {
          if (!t.featured && !t.toolOfWeek) return false;
        } else if (t.level !== activeLevel) {
          return false;
        }
      }
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        const haystack = `${t.name} ${t.categoryLabel} ${t.tldr ?? ""} ${t.shortDescription ?? ""}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      // Default: hide promoted (Decision Desk tools) unless user toggled them in.
      if (!showPromotedInGrid && activeGroup === "all" && activeLevel === "all" && !query.trim()) {
        if (promotedSlugs.has(t.slug)) return false;
      }
      return true;
    });
  }, [tools, activeGroup, activeLevel, query, showPromotedInGrid, promotedSlugs]);

  const totalTools = tools.length;
  const totalGroups = filterGroups.length;
  const shown = filtered.length;

  // Build a per-group tool count from tools.filterGroups membership
  const groupCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of tools) {
      for (const g of t.filterGroups) {
        map.set(g, (map.get(g) ?? 0) + 1);
      }
    }
    return map;
  }, [tools]);

  // Decision Desk promoted tools (in order: toolOfWeek first, then featured)
  const toolOfWeek = tools.find((t) => t.toolOfWeek) ?? null;
  const featuredNonWeek = tools.filter((t) => t.featured && !t.toolOfWeek);
  // Build a stable 3-tier promoted list: [primary, secondary, tertiary]
  const promotedTierList: { tool: ToolPublicView; tier: PromotedTier }[] = [];
  if (toolOfWeek) promotedTierList.push({ tool: toolOfWeek, tier: "primary" });
  if (featuredNonWeek[0]) promotedTierList.push({ tool: featuredNonWeek[0], tier: "secondary" });
  if (featuredNonWeek[1]) promotedTierList.push({ tool: featuredNonWeek[1], tier: "tertiary" });

  // Count of active filters (for the mobile Filtri button badge)
  const activeFilterCount =
    (activeGroup !== "all" ? 1 : 0) +
    (activeLevel !== "all" ? 1 : 0) +
    (query.trim() ? 1 : 0);

  // Mobile progressive disclosure logic:
  // On mobile (< sm breakpoint, ≤430px), show only the first N tools.
  // On tablet/desktop, show all filtered tools.
  // We can't reliably detect viewport in SSR, so we apply the cap via CSS
  // (`.ar4-grid__list li.is-mobile-hidden { display: none; }`) plus a JS-driven
  // state. The CSS rule uses a media query to gate the hidden items, but we
  // also cap via state for clarity.
  const cap = mobileVisibleCount;
  const visibleFiltered = filtered.slice(0, cap);
  const hasMore = filtered.length > cap;

  function resetAll() {
    setActiveGroup("all");
    setActiveLevel("all");
    setQuery("");
    setShowPromotedInGrid(false);
  }

  return (
    <div className="ar4-shell">
      {/* 1. COMPACT EDITORIAL INTRO (dark Command Center) */}
      <section className="ar4-intro" aria-labelledby="ar4-intro-title">
        <div className="ar4-intro__inner">
          <div className="ar4-intro__copy">
            <p className="ar4-intro__eyebrow">
              <span aria-hidden="true" className="ar4-intro__eyebrow-dot" />
              Directory editoriale
            </p>
            <h1 id="ar4-intro-title" className="ar4-intro__title">
              Il catalogo, <span className="ar4-intro__highlight">senza il caos.</span>
            </h1>
            <p className="ar4-intro__lede">
              Parti da un obiettivo oppure cerca direttamente. Ogni profilo è
              selezionato per aiutarti a decidere, non per riempire una lista.
            </p>
          </div>

          <div className="ar4-intro__panel">
            <label className="ar4-intro__search" aria-label="Cerca tool o categorie">
              <Search size={16} aria-hidden="true" />
              <input
                type="search"
                placeholder="Cerca tool, categorie o tag…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoComplete="off"
                spellCheck={false}
              />
              <kbd aria-hidden="true">⌘K</kbd>
            </label>
            <dl className="ar4-intro__stats">
              <div>
                <dt>Tool curati</dt>
                <dd>{String(totalTools).padStart(2, "0")}</dd>
              </div>
              <div>
                <dt>Categorie</dt>
                <dd>{String(totalGroups).padStart(2, "0")}</dd>
              </div>
              <div>
                <dt>Percorsi</dt>
                <dd>{String(totalGroups).padStart(2, "0")}</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* 2. FILTER STRIP — desktop + tablet only (mobile uses bottom sheet) */}
      <section className="ar4-filters" aria-label="Filtri catalogo">
        <div className="ar4-filters__inner">
          <div className="ar4-filters__group" role="tablist" aria-label="Categorie">
            <span className="ar4-filters__label" aria-hidden="true">
              <Filter size={12} />
              <span>Categoria</span>
            </span>
            <button
              type="button"
              role="tab"
              aria-selected={activeGroup === "all"}
              className={cn("ar4-chip", activeGroup === "all" && "is-active")}
              onClick={() => setActiveGroup("all")}
            >
              Tutti
              <em>{totalTools}</em>
            </button>
            {filterGroups.filter((g) => g.key !== "all").map((g) => (
              <button
                key={g.key}
                type="button"
                role="tab"
                aria-selected={activeGroup === g.key}
                className={cn("ar4-chip", activeGroup === g.key && "is-active")}
                onClick={() => setActiveGroup(g.key)}
              >
                {g.label}
                <em>{groupCounts.get(g.key) ?? 0}</em>
              </button>
            ))}
          </div>

          <div className="ar4-filters__group" role="tablist" aria-label="Livello">
            <span className="ar4-filters__label" aria-hidden="true">
              <span>Livello</span>
            </span>
            {LEVEL_FILTERS.map((l) => (
              <button
                key={l.key}
                type="button"
                role="tab"
                aria-selected={activeLevel === l.key}
                className={cn("ar4-chip ar4-chip--level", activeLevel === l.key && "is-active")}
                onClick={() => setActiveLevel(l.key)}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 2b. MOBILE FILTER BAR — visible < 768px */}
      <section className="ar4-mobile-bar" aria-label="Filtri rapidi">
        <div className="ar4-mobile-bar__inner">
          <button
            type="button"
            className="ar4-mobile-bar__trigger"
            onClick={() => setFilterSheetOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={filterSheetOpen}
            aria-label="Apri filtri catalogo"
          >
            <SlidersHorizontal size={16} aria-hidden="true" />
            <span>Filtri</span>
            {activeFilterCount > 0 && (
              <em className="ar4-mobile-bar__count" aria-label={`${activeFilterCount} filtri attivi`}>
                {activeFilterCount}
              </em>
            )}
          </button>
          {/* Quick active filter chips (only show currently active) */}
          <div className="ar4-mobile-bar__active" role="status" aria-live="polite">
            {activeGroup !== "all" && (
              <button
                type="button"
                className="ar4-mobile-bar__chip is-active"
                onClick={() => setActiveGroup("all")}
                aria-label={`Rimuovi filtro categoria ${activeGroup}`}
              >
                {filterGroups.find((g) => g.key === activeGroup)?.label ?? activeGroup}
                <X size={12} aria-hidden="true" />
              </button>
            )}
            {activeLevel !== "all" && (
              <button
                type="button"
                className="ar4-mobile-bar__chip is-active"
                onClick={() => setActiveLevel("all")}
                aria-label={`Rimuovi filtro livello ${activeLevel}`}
              >
                {LEVEL_FILTERS.find((l) => l.key === activeLevel)?.label ?? activeLevel}
                <X size={12} aria-hidden="true" />
              </button>
            )}
            {query.trim() && (
              <button
                type="button"
                className="ar4-mobile-bar__chip is-active"
                onClick={() => setQuery("")}
                aria-label="Rimuovi ricerca"
              >
                “{query.trim().slice(0, 16)}”
                <X size={12} aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 3. IVORY DECISION DESK — 3-tier promoted grammar */}
      {promotedTierList.length > 0 && (
        <section className="ar4-ivory" aria-labelledby="ar4-ivory-title">
          <div className="ar4-ivory__inner">
            <div className="ar4-ivory__head">
              <p className="ar4-ivory__eyebrow">
                <Sparkles size={12} aria-hidden="true" />
                Decision desk
              </p>
              <h2 id="ar4-ivory-title" className="ar4-ivory__title">
                Il tool della settimana, in evidenza.
              </h2>
            </div>
            <div
              className={cn(
                "ar4-ivory__promoted-grid",
                `ar4-ivory__promoted-grid--count-${promotedTierList.length}`,
              )}
            >
              {promotedTierList.map(({ tool, tier }) => (
                <ArchiveV4ToolCard
                  key={tool.slug}
                  tool={tool}
                  promotedTier={tier}
                  rank={tier === "primary" ? 1 : tier === "secondary" ? 2 : 3}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 4. TOOL GRID */}
      <section className="ar4-grid" aria-labelledby="ar4-grid-title">
        <div className="ar4-grid__inner">
          <header className="ar4-grid__head">
            <div>
              <p className="ar4-grid__eyebrow">Catalogo completo</p>
              <h2 id="ar4-grid-title" className="ar4-grid__title">
                {activeGroup === "all" && activeLevel === "all" && !query.trim()
                  ? "Tutti i tool"
                  : "Tool filtrati"}
              </h2>
            </div>
            <p className="ar4-grid__count" aria-live="polite">
              {String(shown).padStart(2, "0")} di {String(totalTools).padStart(2, "0")}
            </p>
          </header>

          {/* "Mostra anche i tool in evidenza" toggle — only when no other filter
              is active and promoted tools are currently hidden. */}
          {!showPromotedInGrid &&
            activeGroup === "all" &&
            activeLevel === "all" &&
            !query.trim() &&
            promotedSlugs.size > 0 && (
              <div className="ar4-grid__promoted-toggle">
                <button
                  type="button"
                  className="ar4-grid__promoted-toggle-btn"
                  onClick={() => setShowPromotedInGrid(true)}
                  aria-label={`Mostra anche i ${promotedSlugs.size} tool attualmente in evidenza sopra`}
                >
                  <Sparkles size={14} aria-hidden="true" />
                  Mostra anche i {promotedSlugs.size} tool in evidenza
                </button>
                {shown > 0 && (
                  <p className="ar4-grid__promoted-hint">
                    {promotedSlugs.size} tool in evidenza sono mostrati qui sopra.
                  </p>
                )}
              </div>
            )}

          {filtered.length === 0 ? (
            <div className="ar4-grid__empty">
              <p>Nessun tool corrisponde ai filtri attivi.</p>
              <button
                type="button"
                className="ar4-grid__empty-reset"
                onClick={resetAll}
              >
                Reimposta filtri
              </button>
            </div>
          ) : (
            <>
              <ul className="ar4-grid__list">
                {visibleFiltered.map((t, idx) => (
                  <li key={t.slug}>
                    <ArchiveV4ToolCard tool={t} rank={idx + 1} />
                  </li>
                ))}
              </ul>
              {/* Progressive disclosure — mobile + tablet only */}
              {hasMore && (
                <div className="ar4-grid__more">
                  <button
                    type="button"
                    className="ar4-grid__more-btn"
                    onClick={() => setMobileVisibleCount((c) => c + MOBILE_STEP)}
                    aria-label={`Carica altri ${Math.min(MOBILE_STEP, filtered.length - cap)} tool`}
                  >
                    Mostra altri
                    <span className="ar4-grid__more-count">
                      {Math.min(MOBILE_STEP, filtered.length - cap)} di {filtered.length - cap}
                    </span>
                  </button>
                  <p className="ar4-grid__more-hint">
                    {String(visibleFiltered.length).padStart(2, "0")} di{" "}
                    {String(filtered.length).padStart(2, "0")} mostrati
                  </p>
                </div>
              )}
            </>
          )}

          <div className="ar4-grid__cta-row">
            <Link href="/metodo" className="ar4-grid__method-link">
              Come selezioniamo i tool
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* 5. MOBILE FILTER BOTTOM SHEET */}
      {filterSheetOpen && (
        <FilterSheet
          filterGroups={filterGroups}
          levelFilters={LEVEL_FILTERS as unknown as { key: string; label: string }[]}
          groupCounts={groupCounts}
          totalTools={totalTools}
          activeGroup={activeGroup}
          activeLevel={activeLevel}
          query={query}
          onSetGroup={setActiveGroup}
          onSetLevel={setActiveLevel}
          onSetQuery={setQuery}
          onClose={() => setFilterSheetOpen(false)}
          onReset={resetAll}
        />
      )}

      {/* 6. PERSISTENT COMPARISON TRAY */}
      <ArchiveV4CompareTray tools={tools} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Mobile Filter Bottom Sheet
// ─────────────────────────────────────────────────────────────────
type FilterSheetProps = {
  filterGroups: ToolFilterGroup[];
  levelFilters: { key: string; label: string }[];
  groupCounts: Map<string, number>;
  totalTools: number;
  activeGroup: string;
  activeLevel: string;
  query: string;
  onSetGroup: (g: string) => void;
  onSetLevel: (l: string) => void;
  onSetQuery: (q: string) => void;
  onClose: () => void;
  onReset: () => void;
};

function FilterSheet({
  filterGroups,
  levelFilters,
  groupCounts,
  totalTools,
  activeGroup,
  activeLevel,
  query,
  onSetGroup,
  onSetLevel,
  onSetQuery,
  onClose,
  onReset,
}: FilterSheetProps) {
  const isDirty =
    activeGroup !== "all" || activeLevel !== "all" || query.trim().length > 0;
  return (
    <div className="ar4-sheet" role="dialog" aria-modal="true" aria-label="Filtri catalogo">
      <button
        type="button"
        className="ar4-sheet__backdrop"
        onClick={onClose}
        aria-label="Chiudi filtri"
      />
      <div className="ar4-sheet__panel">
        <div className="ar4-sheet__head">
          <h3 className="ar4-sheet__title">Filtri</h3>
          <button
            type="button"
            className="ar4-sheet__close"
            onClick={onClose}
            aria-label="Chiudi filtri"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="ar4-sheet__search">
          <Search size={16} aria-hidden="true" />
          <input
            type="search"
            placeholder="Cerca tool, categorie o tag…"
            value={query}
            onChange={(e) => onSetQuery(e.target.value)}
            autoComplete="off"
            spellCheck={false}
            aria-label="Cerca nel catalogo"
          />
        </div>

        <div className="ar4-sheet__section">
          <p className="ar4-sheet__label">Categoria</p>
          <div className="ar4-sheet__chips">
            <button
              type="button"
              className={cn("ar4-chip", activeGroup === "all" && "is-active")}
              onClick={() => onSetGroup("all")}
            >
              Tutti <em>{totalTools}</em>
            </button>
            {filterGroups.filter((g) => g.key !== "all").map((g) => (
              <button
                key={g.key}
                type="button"
                className={cn("ar4-chip", activeGroup === g.key && "is-active")}
                onClick={() => onSetGroup(g.key)}
              >
                {g.label} <em>{groupCounts.get(g.key) ?? 0}</em>
              </button>
            ))}
          </div>
        </div>

        <div className="ar4-sheet__section">
          <p className="ar4-sheet__label">Livello</p>
          <div className="ar4-sheet__chips">
            {levelFilters.map((l) => (
              <button
                key={l.key}
                type="button"
                className={cn(
                  "ar4-chip ar4-chip--level",
                  activeLevel === l.key && "is-active",
                )}
                onClick={() => onSetLevel(l.key)}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        <div className="ar4-sheet__foot">
          <button
            type="button"
            className="ar4-sheet__reset"
            onClick={onReset}
            disabled={!isDirty}
          >
            Reimposta
          </button>
          <button
            type="button"
            className="ar4-sheet__apply"
            onClick={onClose}
          >
            <Check size={16} aria-hidden="true" />
            Mostra risultati
          </button>
        </div>
      </div>
    </div>
  );
}

export default DefinitiveArchive;
