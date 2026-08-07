"use client";

/**
 * TooolVibes — Definitive Archive (CATALOG V2, 2026-08-03)
 *
 * Final copy contract for /archivio. Sections in order:
 *  1. Hero (eyebrow split desktop/mobile + H1 + lede + search + data synth)
 *  2. Categorie (chip rail with expand/collapse)
 *  3. Filtri + Ordinamento (desktop chip rail + sort dropdown, mobile bottom sheet)
 *  4. Griglia (dynamic H2, aria-live, cards, empty state, paginazione progressiva)
 *
 * V2 contract rules:
 *  - Hide Decision Desk band (catalog = pure search/filter/grid)
 *  - Stato A/B logic NOT applied on the catalog (only on home)
 *  - Generic pills (Base, Segnalato, In vetrina, In evidenza) removed
 *  - Editorial badge "Selezione della redazione" only when toolOfWeek
 *  - Sponsored badge "Contenuto sponsorizzato" + disclosure only when affiliateUrl
 *  - ⌘K not rendered in search field (no global shortcut wired to catalog)
 *  - Sponsor module hidden when partner is demo/fixture/development/placeholder
 */

import { Fragment, useMemo, useState, type ReactNode } from "react";
import {
  Search,
  SlidersHorizontal,
  X,
  Check,
  ChevronDown,
  ChevronUp,
  ArrowRight,
} from "lucide-react";

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
  /**
   * Partner Experience insert, rendered INSIDE the discovery flow after
   * the first meaningful group of organic cards. Purely render-level:
   * the organic array, its order and its ranks are never touched.
   */
  partnerInsert?: ReactNode;
};

type SortKey = "name-asc" | "name-desc" | "recent";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "name-asc", label: "Nome: A–Z" },
  { key: "name-desc", label: "Nome: Z–A" },
  { key: "recent", label: "Più recenti" },
];

const LEVEL_FILTERS = [
  { key: "all", label: "Tutti i livelli" },
  { key: "beginner", label: "Principiante" },
  { key: "intermediate", label: "Intermedio" },
  { key: "expert", label: "Avanzato" },
] as const;

/** Initial visible count for mobile progressive disclosure */
const INITIAL_MOBILE_COUNT = 16;
/** Step for "Mostra altri" */
const MOBILE_STEP = 12;

/** Number of category chips to show before the expand/collapse toggle */
const VISIBLE_CATEGORY_CHIPS = 8;

/**
 * Partner Experience insertion point inside the discovery flow: the insert
 * renders after this many organic cards (between position 6 and 7), only in
 * the unfiltered discovery view. Organic position N stays organic position N.
 * 6 divides both the 2-column and 3-column grids, so the full-row insert
 * never leaves an orphan organic card on the preceding row.
 */
const PARTNER_INSERT_AFTER = 6;

export function DefinitiveArchive({
  tools,
  filterGroups,
  initialQuery = "",
  initialGroup = "all",
  initialLevel = "all",
  partnerInsert = null,
}: DefinitiveArchiveProps) {
  const [activeGroup, setActiveGroup] = useState<string>(initialGroup);
  const [activeLevel, setActiveLevel] = useState<string>(initialLevel);
  const [query, setQuery] = useState<string>(initialQuery);
  const [sortKey, setSortKey] = useState<SortKey>("name-asc");
  const [showAllCategories, setShowAllCategories] = useState<boolean>(false);
  const [filterSheetOpen, setFilterSheetOpen] = useState<boolean>(false);
  const [showAdvancedSheetFilters, setShowAdvancedSheetFilters] = useState<boolean>(false);
  const [mobileVisibleCount, setMobileVisibleCount] = useState<number>(INITIAL_MOBILE_COUNT);

  const totalTools = tools.length;
  const totalGroups = filterGroups.length;

  // Per-category tool counts (used by both desktop chip rail and mobile sheet)
  const groupCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of tools) {
      for (const g of t.filterGroups) {
        map.set(g, (map.get(g) ?? 0) + 1);
      }
    }
    return map;
  }, [tools]);

  // Category chips: "Tutti" first, then visible subset, then advanced disclosure
  const realGroups = useMemo(
    () => filterGroups.filter((g) => g.key !== "all"),
    [filterGroups],
  );
  const visibleCategoryGroups = useMemo(
    () => realGroups.slice(0, VISIBLE_CATEGORY_CHIPS),
    [realGroups],
  );
  const hiddenCategoryGroups = useMemo(
    () => realGroups.slice(VISIBLE_CATEGORY_CHIPS),
    [realGroups],
  );

  // Filter (no sort, no slice — used to drive counts in the H2)
  const filtered = useMemo(() => {
    return tools.filter((t) => {
      if (activeGroup !== "all") {
        if (!t.filterGroups.includes(activeGroup)) return false;
      }
      if (activeLevel !== "all") {
        if (t.level !== activeLevel) return false;
      }
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        const haystack = `${t.name} ${t.categoryLabel} ${t.tldr ?? ""} ${t.shortDescription ?? ""}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [tools, activeGroup, activeLevel, query]);

  // Apply sort
  const sortedFiltered = useMemo(() => {
    const arr = [...filtered];
    if (sortKey === "name-asc") {
      arr.sort((a, b) => a.name.localeCompare(b.name, "it"));
    } else if (sortKey === "name-desc") {
      arr.sort((a, b) => b.name.localeCompare(a.name, "it"));
    } else if (sortKey === "recent") {
      arr.sort((a, b) => {
        const ad = a.publishedAt ? Date.parse(a.publishedAt) : 0;
        const bd = b.publishedAt ? Date.parse(b.publishedAt) : 0;
        return bd - ad;
      });
    }
    return arr;
  }, [filtered, sortKey]);

  // Count of active filters (for the mobile Filtri button badge)
  const activeFilterCount =
    (activeGroup !== "all" ? 1 : 0) +
    (activeLevel !== "all" ? 1 : 0) +
    (query.trim() ? 1 : 0);

  // Mobile progressive disclosure
  const cap = mobileVisibleCount;
  const visibleFiltered = sortedFiltered.slice(0, cap);
  const hasMore = sortedFiltered.length > cap;
  const nextBatchCount = Math.min(MOBILE_STEP, Math.max(sortedFiltered.length - cap, 0));

  // H2 copy variants
  const hasActiveFilter = activeGroup !== "all" || activeLevel !== "all" || query.trim().length > 0;
  const gridH2 = !hasActiveFilter
    ? "Tutti i tool"
    : sortedFiltered.length === 0
      ? "Nessun tool trovato"
      : sortedFiltered.length === 1
        ? "1 tool trovato"
        : `${sortedFiltered.length} tool trovati`;

  const gridSupporting = !hasActiveFilter
    ? `${totalTools === 1 ? "1 tool" : `${totalTools} tool`} nel catalogo`
    : `${sortedFiltered.length} risultati su ${totalTools}`;

  function resetAll() {
    setActiveGroup("all");
    setActiveLevel("all");
    setQuery("");
  }

  return (
    <div className="ar4-shell">
      {/* ═══ 1. HERO — eyebrow split + H1 + lede + search + data synth ═══ */}
      <section className="ar4-intro" aria-labelledby="ar4-intro-title">
        <div className="ar4-intro__inner">
          <div className="ar4-intro__copy">
            <p className="ar4-intro__eyebrow">
              <span aria-hidden="true" className="ar4-intro__eyebrow-dot" />
              <span className="ar4-intro__eyebrow-desktop">
                Catalogo · {totalTools} tool in {totalGroups} categorie
              </span>
              <span className="ar4-intro__eyebrow-mobile">
                {totalTools} tool · {totalGroups} categorie
              </span>
            </p>
            <h1 id="ar4-intro-title" className="ar4-intro__title">
              Riduci le alternative. Trova i tool da valutare.
            </h1>
            <p className="ar4-intro__lede">
              Cerca per nome o categoria, applica i filtri e restringi la selezione.
              Apri le schede, salva i candidati e confronta quelli più adatti al tuo
              caso d&apos;uso.
            </p>
          </div>

          <div className="ar4-intro__panel">
            <label className="ar4-intro__search" aria-label="Cerca nel catalogo">
              <Search size={16} aria-hidden="true" />
              <input
                type="search"
                placeholder="Cerca per nome o categoria…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoComplete="off"
                spellCheck={false}
              />
              {query.trim().length > 0 ? (
                <button
                  type="button"
                  className="ar4-intro__search-clear"
                  onClick={() => setQuery("")}
                  aria-label="Cancella il termine di ricerca"
                >
                  <X size={14} aria-hidden="true" />
                </button>
              ) : null}
            </label>
            {query.trim().length > 0 ? (
              <p className="ar4-intro__search-helper" role="status" aria-live="polite">
                Risultati per &ldquo;{query.trim()}&rdquo;
              </p>
            ) : null}

            {/* Dati sintetici — Tool nel catalogo / Categorie / mobile compact */}
            <ul className="ar4-intro__data" aria-label="Dati catalogo">
              <li>
                <span className="ar4-intro__data-desktop">
                  <strong>{String(totalTools).padStart(2, "0")}</strong>
                  <em>{totalTools === 1 ? "Tool nel catalogo" : "Tool nel catalogo"}</em>
                </span>
                <span className="ar4-intro__data-mobile">
                  <strong>{totalTools}</strong>
                  <em>tool</em>
                </span>
              </li>
              <li>
                <span className="ar4-intro__data-desktop">
                  <strong>{String(totalGroups).padStart(2, "0")}</strong>
                  <em>Categorie</em>
                </span>
                <span className="ar4-intro__data-mobile">
                  <strong>{totalGroups}</strong>
                  <em>categorie</em>
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ═══ 2. CATEGORIE — chip rail con expand/collapse ═══ */}
      <section className="ar4-categories" aria-labelledby="ar4-categories-title">
        <div className="ar4-categories__inner">
          <div className="ar4-categories__head">
            <p className="ar4-categories__eyebrow">Categorie</p>
            <h2 id="ar4-categories-title" className="ar4-categories__title">
              Esplora per categoria
            </h2>
            <p className="ar4-categories__body">
              Scegli un&apos;area per restringere subito il catalogo.
            </p>
          </div>

          <div className="ar4-categories__chips" role="group" aria-label="Categorie del catalogo">
            <button
              type="button"
              className={cn("ar4-chip", activeGroup === "all" && "is-active")}
              onClick={() => setActiveGroup("all")}
              aria-pressed={activeGroup === "all"}
              aria-label="Mostra i tool di tutte le categorie"
            >
              Tutti <em>{totalTools}</em>
            </button>
            {visibleCategoryGroups.map((g) => (
              <button
                key={g.key}
                type="button"
                className={cn("ar4-chip", activeGroup === g.key && "is-active")}
                onClick={() => setActiveGroup(g.key)}
                aria-pressed={activeGroup === g.key}
                aria-label={`Mostra i tool della categoria ${g.label}`}
              >
                {g.label} <em>{groupCounts.get(g.key) ?? 0}</em>
              </button>
            ))}
            {showAllCategories
              ? hiddenCategoryGroups.map((g) => (
                  <button
                    key={g.key}
                    type="button"
                    className={cn("ar4-chip", activeGroup === g.key && "is-active")}
                    onClick={() => setActiveGroup(g.key)}
                    aria-pressed={activeGroup === g.key}
                    aria-label={`Mostra i tool della categoria ${g.label}`}
                  >
                    {g.label} <em>{groupCounts.get(g.key) ?? 0}</em>
                  </button>
                ))
              : null}
          </div>

          {hiddenCategoryGroups.length > 0 ? (
            <button
              type="button"
              className="ar4-categories__disclosure"
              onClick={() => setShowAllCategories((v) => !v)}
              aria-expanded={showAllCategories}
            >
              {showAllCategories ? <ChevronUp size={14} aria-hidden="true" /> : <ChevronDown size={14} aria-hidden="true" />}
              <span>{showAllCategories ? "Mostra meno categorie" : "Mostra tutte le categorie"}</span>
            </button>
          ) : null}
        </div>
      </section>

      {/* ═══ 3a. DESKTOP FILTRI + ORDINAMENTO (>= 768px) ═══ */}
      <section className="ar4-filters" aria-label="Filtri catalogo">
        <div className="ar4-filters__inner">
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

          <div className="ar4-filters__group ar4-filters__group--sort">
            <label className="ar4-filters__label" htmlFor="ar4-sort">
              Ordina per
            </label>
            <select
              id="ar4-sort"
              className="ar4-filters__sort"
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.key} value={o.key}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* ═══ 3b. MOBILE FILTER BAR (< 768px) ═══ */}
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
            <span>{activeFilterCount > 0 ? `Filtri · ${activeFilterCount}` : "Filtri"}</span>
          </button>
          <label className="ar4-mobile-bar__sort">
            <span className="sr-only">Ordina per</span>
            <select
              className="ar4-mobile-bar__sort-select"
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              aria-label="Ordina per"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.key} value={o.key}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {/* ═══ 4. GRIGLIA — H2 dinamico + supporting + cards ═══ */}
      <section className="ar4-grid" aria-labelledby="ar4-grid-title">
        <div className="ar4-grid__inner">
          <header className="ar4-grid__head">
            <div>
              <p className="ar4-grid__eyebrow">Catalogo</p>
              <h2 id="ar4-grid-title" className="ar4-grid__title">
                {gridH2}
              </h2>
              <p className="ar4-grid__supporting" aria-live="polite" aria-atomic="true">
                {gridSupporting}
              </p>
            </div>
          </header>

          {sortedFiltered.length === 0 ? (
            <div className="ar4-grid__empty" role="status">
              {query.trim().length > 0 ? (
                <>
                  <p className="ar4-grid__empty-title">
                    Nessun risultato per &ldquo;{query.trim()}&rdquo;
                  </p>
                  <p className="ar4-grid__empty-body">
                    Prova con un termine più ampio oppure rimuovi uno dei filtri attivi.
                  </p>
                </>
              ) : (
                <>
                  <p className="ar4-grid__empty-title">
                    Nessun tool corrisponde ai filtri selezionati.
                  </p>
                  <p className="ar4-grid__empty-body">
                    Prova a rimuovere un filtro o a esplorare tutte le categorie.
                  </p>
                </>
              )}
              <div className="ar4-grid__empty-actions">
                <button
                  type="button"
                  className="ar4-grid__empty-cta ar4-grid__empty-cta--primary"
                  onClick={resetAll}
                >
                  Reimposta i filtri
                </button>
                {query.trim().length > 0 ? (
                  <button
                    type="button"
                    className="ar4-grid__empty-cta ar4-grid__empty-cta--secondary"
                    onClick={() => {
                      setQuery("");
                      setActiveGroup("all");
                      setActiveLevel("all");
                    }}
                  >
                    Mostra tutti i tool
                  </button>
                ) : (
                  <button
                    type="button"
                    className="ar4-grid__empty-cta ar4-grid__empty-cta--secondary"
                    onClick={() => setActiveGroup("all")}
                  >
                    Mostra tutti i tool
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              <ul
                key={`${activeGroup}|${activeLevel}|${query}|${sortKey}`}
                className="ar4-grid__list ar4-grid__list--motion"
              >
                {visibleFiltered.map((tool, idx) => (
                  <Fragment key={tool.slug}>
                    <li>
                      <ArchiveV4ToolCard tool={tool} rank={idx + 1} />
                    </li>
                    {partnerInsert &&
                    !hasActiveFilter &&
                    idx === PARTNER_INSERT_AFTER - 1 ? (
                      <li
                        key="partner-experience-insert"
                        className="ar4-grid__item--partner"
                      >
                        {partnerInsert}
                      </li>
                    ) : null}
                  </Fragment>
                ))}
              </ul>

              {/* Paginazione progressiva — mobile + tablet */}
              {hasMore ? (
                <div className="ar4-grid__more">
                  <button
                    type="button"
                    className="ar4-grid__more-btn"
                    onClick={() => setMobileVisibleCount((c) => c + MOBILE_STEP)}
                    aria-label="Mostra altri tool del Catalogo"
                  >
                    {nextBatchCount === 1 ? "Mostra un altro tool" : `Mostra altri ${nextBatchCount} tool`}
                    <ArrowRight size={14} aria-hidden="true" />
                  </button>
                  <p className="ar4-grid__more-hint" aria-live="polite" aria-atomic="true">
                    {visibleFiltered.length} di {sortedFiltered.length}{" "}
                    {visibleFiltered.length === 1 ? "tool mostrato" : "tool mostrati"}
                  </p>
                </div>
              ) : null}
            </>
          )}
        </div>
      </section>

      {/* ═══ 5. MOBILE FILTER BOTTOM SHEET ═══ */}
      {filterSheetOpen ? (
        <FilterSheet
          levelFilters={LEVEL_FILTERS as unknown as { key: string; label: string }[]}
          activeGroup={activeGroup}
          activeLevel={activeLevel}
          query={query}
          showAdvanced={showAdvancedSheetFilters}
          visibleCategoryGroups={visibleCategoryGroups}
          hiddenCategoryGroups={hiddenCategoryGroups}
          groupCounts={groupCounts}
          totalTools={totalTools}
          filteredCount={sortedFiltered.length}
          onSetGroup={setActiveGroup}
          onSetLevel={setActiveLevel}
          onSetQuery={setQuery}
          onToggleAdvanced={() => setShowAdvancedSheetFilters((v) => !v)}
          onClose={() => setFilterSheetOpen(false)}
          onReset={resetAll}
        />
      ) : null}

      {/* ═══ 6. PERSISTENT COMPARISON TRAY ═══ */}
      <ArchiveV4CompareTray tools={tools} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Mobile Filter Bottom Sheet
// ─────────────────────────────────────────────────────────────────
type FilterSheetProps = {
  levelFilters: { key: string; label: string }[];
  activeGroup: string;
  activeLevel: string;
  query: string;
  showAdvanced: boolean;
  visibleCategoryGroups: ToolFilterGroup[];
  hiddenCategoryGroups: ToolFilterGroup[];
  groupCounts: Map<string, number>;
  totalTools: number;
  filteredCount: number;
  onSetGroup: (g: string) => void;
  onSetLevel: (l: string) => void;
  onSetQuery: (q: string) => void;
  onToggleAdvanced: () => void;
  onClose: () => void;
  onReset: () => void;
};

function FilterSheet({
  levelFilters,
  activeGroup,
  activeLevel,
  query,
  showAdvanced,
  visibleCategoryGroups,
  hiddenCategoryGroups,
  groupCounts,
  totalTools,
  filteredCount,
  onSetGroup,
  onSetLevel,
  onSetQuery,
  onToggleAdvanced,
  onClose,
  onReset,
}: FilterSheetProps) {
  const isDirty = activeGroup !== "all" || activeLevel !== "all" || query.trim().length > 0;
  return (
    <div
      className="ar4-sheet"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ar4-sheet-title"
    >
      <button
        type="button"
        className="ar4-sheet__backdrop"
        onClick={onClose}
        aria-label="Chiudi i filtri"
      />
      <div className="ar4-sheet__panel">
        <div className="ar4-sheet__head">
          <h3 id="ar4-sheet-title" className="ar4-sheet__title">
            Filtra il catalogo
          </h3>
          <p className="ar4-sheet__desc">
            Restringi i risultati senza perdere la selezione corrente.
          </p>
          <button
            type="button"
            className="ar4-sheet__close"
            onClick={onClose}
            aria-label="Chiudi i filtri"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="ar4-sheet__search">
          <Search size={16} aria-hidden="true" />
          <input
            type="search"
            placeholder="Cerca per nome o categoria…"
            value={query}
            onChange={(e) => onSetQuery(e.target.value)}
            autoComplete="off"
            spellCheck={false}
            aria-label="Cerca nel catalogo"
          />
          {query.trim().length > 0 ? (
            <button
              type="button"
              className="ar4-sheet__search-clear"
              onClick={() => onSetQuery("")}
              aria-label="Cancella il termine di ricerca"
            >
              <X size={14} aria-hidden="true" />
            </button>
          ) : null}
        </div>

        <div className="ar4-sheet__section">
          <p className="ar4-sheet__label">Categoria</p>
          <div className="ar4-sheet__chips">
            <button
              type="button"
              className={cn("ar4-chip", activeGroup === "all" && "is-active")}
              onClick={() => onSetGroup("all")}
              aria-pressed={activeGroup === "all"}
            >
              Tutti <em>{totalTools}</em>
            </button>
            {visibleCategoryGroups.map((g) => (
              <button
                key={g.key}
                type="button"
                className={cn("ar4-chip", activeGroup === g.key && "is-active")}
                onClick={() => onSetGroup(g.key)}
                aria-pressed={activeGroup === g.key}
              >
                {g.label} <em>{groupCounts.get(g.key) ?? 0}</em>
              </button>
            ))}
          </div>

          {hiddenCategoryGroups.length > 0 ? (
            <button
              type="button"
              className="ar4-sheet__disclosure"
              onClick={onToggleAdvanced}
              aria-expanded={showAdvanced}
            >
              {showAdvanced ? <ChevronUp size={14} aria-hidden="true" /> : <ChevronDown size={14} aria-hidden="true" />}
              <span>{showAdvanced ? "Nascondi i filtri" : "Altri filtri"}</span>
            </button>
          ) : null}
        </div>

        {showAdvanced && hiddenCategoryGroups.length > 0 ? (
          <div className="ar4-sheet__section">
            <p className="ar4-sheet__label">Altre categorie</p>
            <div className="ar4-sheet__chips">
              {hiddenCategoryGroups.map((g) => (
                <button
                  key={g.key}
                  type="button"
                  className={cn("ar4-chip", activeGroup === g.key && "is-active")}
                  onClick={() => onSetGroup(g.key)}
                  aria-pressed={activeGroup === g.key}
                >
                  {g.label} <em>{groupCounts.get(g.key) ?? 0}</em>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {showAdvanced ? (
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
        ) : null}

        <div className="ar4-sheet__foot">
          <button
            type="button"
            className="ar4-sheet__reset"
            onClick={onReset}
            disabled={!isDirty}
          >
            Reimposta i filtri
          </button>
          <button
            type="button"
            className="ar4-sheet__apply"
            onClick={onClose}
          >
            <Check size={16} aria-hidden="true" />
            {filteredCount === 0
              ? "Mostra 0 risultati"
              : filteredCount === 1
                ? "Mostra 1 risultato"
                : `Mostra ${filteredCount} risultati`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DefinitiveArchive;
