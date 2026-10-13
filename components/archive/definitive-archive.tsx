"use client";

import { useLocale } from "@/components/i18n/locale-provider";
import { LocalizedText, LocalizedAttributes } from "@/components/i18n/localized-text";
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

import { Fragment, useCallback, useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";

import { useAccount } from "@/components/account/account-provider";
import { createPortal } from "react-dom";
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
import {
  parseCatalogLevelParam,
  resolveCatalogGroupParam,
  serializeCatalogUrl,
  type CatalogLevelFilter,
} from "@/components/directory/catalog/catalog-controller";
import { DISCOVERY_INTENTS } from "@/lib/product/discovery-intents";
import type { ToolFilterGroup, ToolPublicView } from "@/lib/data/tool-public-view";
import { ArchiveV4ToolCard } from "./archive-v4-tool-card";

import { resolvePodiumTiers } from "@/lib/data/podium-tiers";
import { CatalogoFacetHead } from "./catalogo-facet-head";

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
  initialDensity?: "compact" | "enriched";
  partnerInsert?: ReactNode;
  /**
   * TinyAdz inline insert, rendered after the twelfth organic card —
   * always a different insertion index than the Partner Insert and never
   * adjacent to it. Mounted only in the pristine discovery view (no
   * filter, default sort): the programmatic creative cannot reliably
   * refill a remounted container, so it never enters a keyed remount.
   */
  adInsert?: ReactNode;
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
const INITIAL_MOBILE_COUNT = 24;
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
export const PARTNER_INSERT_AFTER = 6;

/**
 * TinyAdz insertion point: after this many organic cards. 18 divides both
 * the 2-column and 3-column grids and leaves twelve organic cards (two full
 * 3-col / three full 2-col row groups) between the Partner Insert (6) and
 * the ad — enough natural edge-to-edge separation to clear the desktop
 * density target without artificial empty spacing. Contract: the two
 * insertion indexes must never be equal (see duplication tests).
 */
export const TINYADZ_INSERT_AFTER = 18;


function applyDiscoveryIntent(
  intent: (typeof DISCOVERY_INTENTS)[number],
  onSetGroup: (g: string) => void,
  onSetQuery: (q: string) => void,
) {
  if (intent.group) {
    onSetGroup(intent.group);
    onSetQuery("");
  } else if (intent.query) {
    onSetQuery(intent.query);
    onSetGroup("all");
  }
}

export function DefinitiveArchive({
  tools,
  filterGroups,
  initialQuery = "",
  initialGroup = "all",
  initialLevel = "all",
  initialDensity = "compact",
  partnerInsert = null,
  adInsert = null,
}: DefinitiveArchiveProps) {
  const [activeGroup, setActiveGroup] = useState<string>(initialGroup);
  const [activeLevel, setActiveLevel] = useState<string>(initialLevel);
  const [query, setQuery] = useState<string>(initialQuery);
  const [urlReady, setUrlReady] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("name-asc");
  const [showAllCategories, setShowAllCategories] = useState<boolean>(false);
  const [filterSheetOpen, setFilterSheetOpen] = useState<boolean>(false);
  const [mobileVisibleCount, setMobileVisibleCount] = useState<number>(INITIAL_MOBILE_COUNT);
  const filterTriggerRef = useRef<HTMLButtonElement>(null);
  const chipsRef = useRef<HTMLDivElement>(null);
  const closeFilterSheet = useCallback(() => setFilterSheetOpen(false), []);

  const totalTools = tools.length;
  const totalGroups = filterGroups.filter((group) => group.key !== "all").length;

  // Podium metallic tiers — derived from canonical ranking order (same source
  // as Home podium). No tool identity is special; tiers follow position.
  const podiumTiers = useMemo(() => resolvePodiumTiers(tools), [tools]);

  // Public HTML starts compact; the real account session selects enriched
  // density on hydration and keeps login/logout/cross-tab changes in sync.
  // Enriched shows only public Tool metadata (levelLabel, readingTime, tags).
  const account = useAccount();
  const [cardDensity, setCardDensity] = useState<"compact" | "enriched">(initialDensity);
  useEffect(() => {
    if (account.status === "authenticated" && cardDensity !== "enriched") {
      setCardDensity("enriched");
    } else if (account.status === "guest" && cardDensity !== "compact") {
      setCardDensity("compact");
    }
  }, [account.status, cardDensity]);

  useEffect(() => {
    function onPopState() {
      const params = new URLSearchParams(window.location.search);
      const parsedLevel = parseCatalogLevelParam(params.get("level"));
      setQuery((params.get("q") ?? "").trim());
      setActiveGroup(resolveCatalogGroupParam(filterGroups, params.get("group")));
      setActiveLevel(
        parsedLevel === "beginner" || parsedLevel === "intermediate" || parsedLevel === "expert"
          ? parsedLevel
          : "all",
      );
    }
    if (window.location.pathname === "/archivio") onPopState();
    setUrlReady(true);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [filterGroups]);

  useEffect(() => {
    // Restore deep-link filters before writing state into the URL.
    if (!urlReady) return;
    const next = serializeCatalogUrl({
      query,
      group: activeGroup === "all" ? null : activeGroup,
      level: (activeLevel as CatalogLevelFilter) || "all",
    });
    const current = `${window.location.pathname}${window.location.search}`;
    if (current !== next) {
      window.history.replaceState(null, "", next);
    }
  }, [query, activeGroup, activeLevel, urlReady]);


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
  const { t: translate } = useLocale();
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
        const localized = [t.categoryLabel, t.tldr ?? "", t.shortDescription ?? "", ...(t.useCases ?? []), ...(t.tags ?? []), t.idealUseCase ?? ""].map(translate).join(" ");
        const haystack = `${localized} ${t.name} ${t.categoryLabel} ${t.tldr ?? ""} ${t.shortDescription ?? ""} ${(t.useCases ?? []).join(" ")} ${(t.tags ?? []).join(" ")} ${t.idealUseCase ?? ""}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [tools, activeGroup, activeLevel, query, translate]);

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

  const gridSupporting = hasActiveFilter
    ? `${sortedFiltered.length} risultati su ${totalTools}`
    : null;

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
              <span className="ar4-intro__eyebrow-copy">
                <span className="ar4-intro__eyebrow-lead"><LocalizedText>{"Catalogo · "}</LocalizedText></span>{totalTools}<LocalizedText>{" tool"}</LocalizedText><span className="ar4-intro__eyebrow-in"><LocalizedText>{" in "}</LocalizedText></span><span className="ar4-intro__eyebrow-sep"> · </span>{totalGroups}<LocalizedText>{" categorie "}</LocalizedText></span>
            </p>
            <h1 id="ar4-intro-title" className="ar4-intro__title"><LocalizedText>{"Trova i tool da valutare. "}</LocalizedText></h1>
          </div>

          <div className="ar4-intro__panel">
            <LocalizedAttributes><label className="ar4-intro__search" aria-label="Cerca nel catalogo">
              <Search size={16} aria-hidden="true" />
              <LocalizedAttributes><input
                type="search"
                placeholder="Cerca per nome o categoria…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoComplete="off"
                spellCheck={false}
              /></LocalizedAttributes>
              {query.trim().length > 0 ? (
                <LocalizedAttributes><button
                  type="button"
                  className="ar4-intro__search-clear"
                  onClick={() => setQuery("")}
                  aria-label="Cancella il termine di ricerca"
                >
                  <X size={14} aria-hidden="true" />
                </button></LocalizedAttributes>
              ) : null}
            </label></LocalizedAttributes>
            {query.trim().length > 0 ? (
              <p className="ar4-intro__search-helper" role="status" aria-live="polite"><LocalizedText>{"Risultati per “"}</LocalizedText>{query.trim()}<LocalizedText>{"” "}</LocalizedText></p>
            ) : null}

            {/* Counts live in the intro eyebrow only. */}
          </div>
          <CatalogoFacetHead active="tutti" className="ar4-intro__facet" />
        </div>
      </section>

      {/* ═══ 2. CATEGORIE — chip rail con expand/collapse ═══ */}
      <section className="ar4-categories" aria-labelledby="ar4-categories-title">
        <div className="ar4-categories__inner">
          <LocalizedAttributes><div ref={chipsRef} className="ar4-categories__chips" role="group" aria-label="Categorie del catalogo">
            <LocalizedAttributes><button
              type="button"
              className={cn("ar4-chip", activeGroup === "all" && "is-active")}
              onClick={() => setActiveGroup("all")}
              aria-pressed={activeGroup === "all"}
              aria-label="Mostra i tool di tutte le categorie"
            ><LocalizedText>{"Tutte "}</LocalizedText><em>({totalTools})</em>
            </button></LocalizedAttributes>
            {visibleCategoryGroups.map((g) => (
              <LocalizedAttributes key={g.key}><button
                key={g.key}
                type="button"
                className={cn("ar4-chip", activeGroup === g.key && "is-active")}
                onClick={() => setActiveGroup(g.key)}
                aria-pressed={activeGroup === g.key}
                aria-label={`Mostra i tool della categoria ${g.label}`}
              >
                <LocalizedText>{g.label}</LocalizedText> <em>{groupCounts.get(g.key) ?? 0}</em>
              </button></LocalizedAttributes>
            ))}
            {showAllCategories
              ? hiddenCategoryGroups.map((g) => (
                  <LocalizedAttributes key={g.key}><button
                    key={g.key}
                    type="button"
                    className={cn("ar4-chip", activeGroup === g.key && "is-active")}
                    onClick={() => setActiveGroup(g.key)}
                    aria-pressed={activeGroup === g.key}
                    aria-label={`Mostra i tool della categoria ${g.label}`}
                  >
                    <LocalizedText>{g.label}</LocalizedText> <em>{groupCounts.get(g.key) ?? 0}</em>
                  </button></LocalizedAttributes>
                ))
              : null}
          </div></LocalizedAttributes>

          {hiddenCategoryGroups.length > 0 ? (
            <button
              type="button"
              className="ar4-categories__disclosure"
              onClick={() => setShowAllCategories((v) => !v)}
              aria-expanded={showAllCategories}
            >
              {showAllCategories ? <ChevronUp size={14} aria-hidden="true" /> : <ChevronDown size={14} aria-hidden="true" />}
              <span><LocalizedText>{showAllCategories ? "Mostra meno categorie" : "Mostra tutte le categorie"}</LocalizedText></span>
            </button>
          ) : null}
        </div>
      </section>

      {/* ═══ 3a. DESKTOP FILTRI + ORDINAMENTO (>= 768px) ═══ */}
      <LocalizedAttributes><section className="ar4-filters" aria-label="Filtri catalogo">
        <div className="ar4-filters__inner">
          <LocalizedAttributes><div className="ar4-filters__group" role="tablist" aria-label="Livello">
            <span className="ar4-filters__label" aria-hidden="true">
              <span><LocalizedText>{"Livello"}</LocalizedText></span>
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
                <LocalizedText>{l.label}</LocalizedText>
              </button>
            ))}
          </div></LocalizedAttributes>

          <div className="ar4-filters__group ar4-filters__group--sort">
            <label className="ar4-filters__label" htmlFor="ar4-sort"><LocalizedText>{"Ordina per "}</LocalizedText></label>
            <select
              id="ar4-sort"
              className="ar4-filters__sort"
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.key} value={o.key}>
                  <LocalizedText>{o.label}</LocalizedText>
                </option>
              ))}
            </select>
          </div>
        </div>
      </section></LocalizedAttributes>

      {/* ═══ 3b. MOBILE FILTER BAR (< 768px) ═══ */}
      <LocalizedAttributes><section className="ar4-mobile-bar" aria-label="Filtri rapidi">
        <div className="ar4-mobile-bar__inner">
          <LocalizedAttributes><button
            type="button"
            ref={filterTriggerRef}
            className="ar4-mobile-bar__trigger"
            onClick={() => setFilterSheetOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={filterSheetOpen}
            aria-controls="ar4-filter-sheet"
            aria-label="Apri filtri catalogo"
          >
            <SlidersHorizontal size={16} aria-hidden="true" />
            <span><LocalizedText>{activeFilterCount > 0 ? `Filtri · ${activeFilterCount}` : "Filtri"}</LocalizedText></span>
          </button></LocalizedAttributes>
          <label className="ar4-mobile-bar__sort">
            <span className="sr-only"><LocalizedText>{"Ordina per"}</LocalizedText></span>
            <LocalizedAttributes><select
              className="ar4-mobile-bar__sort-select"
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              aria-label="Ordina per"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.key} value={o.key}>
                  <LocalizedText>{o.label}</LocalizedText>
                </option>
              ))}
            </select></LocalizedAttributes>
          </label>
        </div>
      </section></LocalizedAttributes>

      {hasActiveFilter ? (
        <LocalizedAttributes><div className="ar4-applied" aria-label="Filtri attivi">
          <p className="ar4-applied__label"><LocalizedText>{"Filtri attivi"}</LocalizedText></p>
          <div className="ar4-applied__chips">
            {query.trim() ? (
              <button type="button" className="ar4-applied__chip" onClick={() => setQuery("")}><LocalizedText>{"Ricerca: "}</LocalizedText>{query.trim()}
                <X size={12} aria-hidden="true" />
              </button>
            ) : null}
            {activeGroup !== "all" ? (
              <button type="button" className="ar4-applied__chip" onClick={() => setActiveGroup("all")}>
                <LocalizedText>{filterGroups.find((group) => group.key === activeGroup)?.label ?? activeGroup}</LocalizedText>
                <X size={12} aria-hidden="true" />
              </button>
            ) : null}
            {activeLevel !== "all" ? (
              <button type="button" className="ar4-applied__chip" onClick={() => setActiveLevel("all")}>
                <LocalizedText>{LEVEL_FILTERS.find((level) => level.key === activeLevel)?.label ?? activeLevel}</LocalizedText>
                <X size={12} aria-hidden="true" />
              </button>
            ) : null}
            <button type="button" className="ar4-applied__reset" onClick={resetAll}><LocalizedText>{"Reimposta "}</LocalizedText></button>
          </div>
        </div></LocalizedAttributes>
      ) : null}

      {/* ═══ 4. GRIGLIA — H2 dinamico + supporting + cards ═══ */}
      <section className="ar4-grid" aria-labelledby="ar4-grid-title">
        <div className="ar4-grid__inner">
          <header className="ar4-grid__head">
            <div>
              <h2 id="ar4-grid-title" className="ar4-grid__title">
                <LocalizedText>{gridH2}</LocalizedText>
              </h2>
              {gridSupporting ? (
                <p className="ar4-grid__supporting" aria-live="polite" aria-atomic="true">
                  <LocalizedText>{gridSupporting}</LocalizedText>
                </p>
              ) : null}
            </div>
          </header>

          {sortedFiltered.length === 0 ? (
            <div className="ar4-grid__empty" role="status">
              {query.trim().length > 0 ? (
                <>
                  <p className="ar4-grid__empty-title"><LocalizedText>{"Nessun risultato per “"}</LocalizedText>{query.trim()}<LocalizedText>{"” "}</LocalizedText></p>
                  <p className="ar4-grid__empty-body"><LocalizedText>{"Prova con un termine più ampio oppure rimuovi uno dei filtri attivi. "}</LocalizedText></p>
                </>
              ) : (
                <>
                  <p className="ar4-grid__empty-title"><LocalizedText>{"Nessun tool corrisponde ai filtri selezionati. "}</LocalizedText></p>
                  <p className="ar4-grid__empty-body"><LocalizedText>{"Prova a rimuovere un filtro o a esplorare tutte le categorie. "}</LocalizedText></p>
                </>
              )}
              <div className="ar4-grid__empty-actions">
                <button
                  type="button"
                  className="ar4-grid__empty-cta ar4-grid__empty-cta--primary"
                  onClick={resetAll}
                ><LocalizedText>{"Reimposta i filtri "}</LocalizedText></button>
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
                      <ArchiveV4ToolCard
                        tool={tool}
                        rank={idx + 1}
                        promotedTier={podiumTiers[tool.slug]}
                        density={cardDensity}
                        className={idx < 3 ? "ar4-card--lead" : "ar4-card--rest"}
                      />
                    </li>
                    {partnerInsert &&
                    !hasActiveFilter &&
                    idx === PARTNER_INSERT_AFTER - 1 ? (
                      <li
                        key="partner-experience-insert"
                        className="ar4-grid__item--partner"
                      >
                        <LocalizedText>{partnerInsert}</LocalizedText>
                      </li>
                    ) : null}
                    {adInsert &&
                    !hasActiveFilter &&
                    sortKey === "name-asc" &&
                    idx === TINYADZ_INSERT_AFTER - 1 ? (
                      <Fragment key="tinyadz-catalog-insert"><LocalizedText>{adInsert}</LocalizedText></Fragment>
                    ) : null}
                  </Fragment>
                ))}
              </ul>

              {/* Paginazione progressiva — mobile + tablet */}
              {hasMore ? (
                <div className="ar4-grid__more">
                  <LocalizedAttributes><button
                    type="button"
                    className="ar4-grid__more-btn"
                    onClick={() => setMobileVisibleCount((c) => c + MOBILE_STEP)}
                    aria-label="Mostra altri tool del Catalogo"
                  >
                    <LocalizedText>{nextBatchCount === 1 ? "Mostra un altro tool" : `Mostra altri ${nextBatchCount} tool`}</LocalizedText>
                    <ArrowRight size={14} aria-hidden="true" />
                  </button></LocalizedAttributes>
                  <p className="ar4-grid__more-hint" aria-live="polite" aria-atomic="true">
                    {visibleFiltered.length}<LocalizedText>{" di "}</LocalizedText>{sortedFiltered.length}<LocalizedText>{" "}</LocalizedText>
                    <LocalizedText>{visibleFiltered.length === 1 ? "tool mostrato" : "tool mostrati"}</LocalizedText>
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
          visibleCategoryGroups={visibleCategoryGroups}
          hiddenCategoryGroups={hiddenCategoryGroups}
          groupCounts={groupCounts}
          totalTools={totalTools}
          filteredCount={sortedFiltered.length}
          onSetGroup={setActiveGroup}
          onSetLevel={setActiveLevel}
          onSetQuery={setQuery}
          onClose={closeFilterSheet}
          onReset={resetAll}
          returnFocusRef={filterTriggerRef}
        />
      ) : null}

      {/* Wave 7: live compare tray unmounted. Collector is CompareSessionDock.
          Tray source kept on disk for Wave 15 DELETE-LATER.
          .ar4-shell:not(:has(.ar4-tray)) already shrinks catalog padding. */}
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
  visibleCategoryGroups: ToolFilterGroup[];
  hiddenCategoryGroups: ToolFilterGroup[];
  groupCounts: Map<string, number>;
  totalTools: number;
  filteredCount: number;
  onSetGroup: (g: string) => void;
  onSetLevel: (l: string) => void;
  onSetQuery: (q: string) => void;
  onClose: () => void;
  onReset: () => void;
  returnFocusRef: RefObject<HTMLButtonElement | null>;
};

type SheetGroupId = "categoria" | "obiettivi" | "livello";

function getSheetFocusable(root: HTMLElement) {
  return Array.from(
    root.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((el) => el.getClientRects().length > 0);
}

function FilterSheet({
  levelFilters,
  activeGroup,
  activeLevel,
  query,
  visibleCategoryGroups,
  hiddenCategoryGroups,
  groupCounts,
  totalTools,
  filteredCount,
  onSetGroup,
  onSetLevel,
  onSetQuery,
  onClose,
  onReset,
  returnFocusRef,
}: FilterSheetProps) {
  const isDirty = activeGroup !== "all" || activeLevel !== "all" || query.trim().length > 0;
  const [openGroup, setOpenGroup] = useState<SheetGroupId>("categoria");
  const [showAllSheetCategories, setShowAllSheetCategories] = useState(
    () => hiddenCategoryGroups.some((g) => g.key === activeGroup),
  );
  const panelRef = useRef<HTMLDivElement>(null);

  function toggleGroup(id: SheetGroupId) {
    setOpenGroup(id);
  }

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const root = panel;

    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const opener = returnFocusRef.current ?? previouslyFocused;
    const closeButton = root.querySelector<HTMLElement>(".ar4-sheet__close");
    const focusFrame = window.requestAnimationFrame(() => {
      (closeButton ?? getSheetFocusable(root)[0] ?? root).focus();
    });

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = getSheetFocusable(root);
      if (focusable.length === 0) {
        event.preventDefault();
        root.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    function onFocusIn(event: FocusEvent) {
      if (!root.contains(event.target as Node)) {
        const next = getSheetFocusable(root)[0] ?? root;
        next.focus();
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("focusin", onFocusIn);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("focusin", onFocusIn);
      document.body.style.overflow = previousOverflow;
      opener?.focus();
    };
  }, [onClose, returnFocusRef]);

  /* Portal to document.body: the sheet is a fixed overlay and must escape
     main#main-content's stacking context (relative z-10). Rendered in-tree,
     the compare dock (z-40) and the mobile bottom nav (z-50) sit ABOVE the
     sheet and intercept taps on its lower controls (v3.2 P1 fix). */
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      id="ar4-filter-sheet"
      className="ar4-sheet"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ar4-sheet-title"
      aria-describedby="ar4-sheet-desc"
    >
      <div
        className="ar4-sheet__backdrop"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        className="ar4-sheet__panel"
        tabIndex={-1}
      >
        <div className="ar4-sheet__head">
          <h3 id="ar4-sheet-title" className="ar4-sheet__title"><LocalizedText>{"Filtra il catalogo "}</LocalizedText></h3>
          <p id="ar4-sheet-desc" className="ar4-sheet__desc"><LocalizedText>{"Restringi i risultati senza perdere la selezione corrente. "}</LocalizedText></p>
          <LocalizedAttributes><button
            type="button"
            className="ar4-sheet__close"
            onClick={onClose}
            aria-label="Chiudi i filtri"
          >
            <X size={18} aria-hidden="true" />
          </button></LocalizedAttributes>
        </div>

        <div className="ar4-sheet__groups">
          <div className="ar4-sheet__group">
            <button
              type="button"
              className="ar4-sheet__group-toggle"
              aria-expanded={openGroup === "categoria"}
              aria-controls="ar4-sheet-group-categoria"
              id="ar4-sheet-group-categoria-label"
              onClick={() => toggleGroup("categoria")}
            >
              <span><LocalizedText>{"Categoria"}</LocalizedText></span>
              {openGroup === "categoria" ? (
                <ChevronUp size={16} aria-hidden="true" />
              ) : (
                <ChevronDown size={16} aria-hidden="true" />
              )}
            </button>
            {openGroup === "categoria" ? (
              <div
                id="ar4-sheet-group-categoria"
                role="region"
                aria-labelledby="ar4-sheet-group-categoria-label"
                className="ar4-sheet__group-body"
              >
                <LocalizedAttributes><div className="ar4-sheet__chips" role="group" aria-label="Categorie del catalogo">
                  <button
                    type="button"
                    className={cn("ar4-chip", activeGroup === "all" && "is-active")}
                    onClick={() => onSetGroup("all")}
                    aria-pressed={activeGroup === "all"}
                  ><LocalizedText>{"Tutti "}</LocalizedText><em>{totalTools}</em>
                  </button>
                  {visibleCategoryGroups.map((g) => (
                    <button
                      key={g.key}
                      type="button"
                      className={cn("ar4-chip", activeGroup === g.key && "is-active")}
                      onClick={() => onSetGroup(g.key)}
                      aria-pressed={activeGroup === g.key}
                    >
                      <LocalizedText>{g.label}</LocalizedText> <em>{groupCounts.get(g.key) ?? 0}</em>
                    </button>
                  ))}
                  {showAllSheetCategories
                    ? hiddenCategoryGroups.map((g) => (
                        <button
                          key={g.key}
                          type="button"
                          className={cn("ar4-chip", activeGroup === g.key && "is-active")}
                          onClick={() => onSetGroup(g.key)}
                          aria-pressed={activeGroup === g.key}
                        >
                          <LocalizedText>{g.label}</LocalizedText> <em>{groupCounts.get(g.key) ?? 0}</em>
                        </button>
                      ))
                    : null}
                </div></LocalizedAttributes>
                {hiddenCategoryGroups.length > 0 ? (
                  <button
                    type="button"
                    className="ar4-sheet__disclosure"
                    onClick={() => setShowAllSheetCategories((v) => !v)}
                    aria-expanded={showAllSheetCategories}
                  >
                    {showAllSheetCategories ? (
                      <ChevronUp size={14} aria-hidden="true" />
                    ) : (
                      <ChevronDown size={14} aria-hidden="true" />
                    )}
                    <span>
                      <LocalizedText>{showAllSheetCategories
                        ? "Mostra meno categorie"
                        : "Mostra tutte le categorie"}</LocalizedText>
                    </span>
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="ar4-sheet__group">
            <button
              type="button"
              className="ar4-sheet__group-toggle"
              aria-expanded={openGroup === "obiettivi"}
              aria-controls="ar4-sheet-group-obiettivi"
              id="ar4-sheet-group-obiettivi-label"
              onClick={() => toggleGroup("obiettivi")}
            >
              <span><LocalizedText>{"Obiettivi"}</LocalizedText></span>
              {openGroup === "obiettivi" ? (
                <ChevronUp size={16} aria-hidden="true" />
              ) : (
                <ChevronDown size={16} aria-hidden="true" />
              )}
            </button>
            {openGroup === "obiettivi" ? (
              <div
                id="ar4-sheet-group-obiettivi"
                role="region"
                aria-labelledby="ar4-sheet-group-obiettivi-label"
                className="ar4-sheet__group-body"
              >
                <LocalizedAttributes><div className="ar4-sheet__chips" role="group" aria-label="Obiettivi">
                  {DISCOVERY_INTENTS.map((intent) => {
                    const pressed = intent.group
                      ? activeGroup === intent.group
                      : Boolean(intent.query && query === intent.query);
                    return (
                      <button
                        key={intent.id}
                        type="button"
                        className={cn("ar4-chip", pressed && "is-active")}
                        aria-pressed={pressed}
                        onClick={() => applyDiscoveryIntent(intent, onSetGroup, onSetQuery)}
                      >
                        <LocalizedText>{intent.label}</LocalizedText>
                      </button>
                    );
                  })}
                </div></LocalizedAttributes>
              </div>
            ) : null}
          </div>

          <div className="ar4-sheet__group">
            <button
              type="button"
              className="ar4-sheet__group-toggle"
              aria-expanded={openGroup === "livello"}
              aria-controls="ar4-sheet-group-livello"
              id="ar4-sheet-group-livello-label"
              onClick={() => toggleGroup("livello")}
            >
              <span><LocalizedText>{"Livello"}</LocalizedText></span>
              {openGroup === "livello" ? (
                <ChevronUp size={16} aria-hidden="true" />
              ) : (
                <ChevronDown size={16} aria-hidden="true" />
              )}
            </button>
            {openGroup === "livello" ? (
              <div
                id="ar4-sheet-group-livello"
                role="region"
                aria-labelledby="ar4-sheet-group-livello-label"
                className="ar4-sheet__group-body"
              >
                <LocalizedAttributes><div className="ar4-sheet__chips" role="group" aria-label="Livello">
                  {levelFilters.map((l) => (
                    <button
                      key={l.key}
                      type="button"
                      className={cn(
                        "ar4-chip ar4-chip--level",
                        activeLevel === l.key && "is-active",
                      )}
                      onClick={() => onSetLevel(l.key)}
                      aria-pressed={activeLevel === l.key}
                    >
                      <LocalizedText>{l.label}</LocalizedText>
                    </button>
                  ))}
                </div></LocalizedAttributes>
              </div>
            ) : null}
          </div>
        </div>

        <div className="ar4-sheet__foot">
          <button
            type="button"
            className="ar4-sheet__reset"
            onClick={onReset}
            disabled={!isDirty}
          ><LocalizedText>{"Reimposta i filtri "}</LocalizedText></button>
          <button
            type="button"
            className="ar4-sheet__apply"
            onClick={onClose}
          >
            <Check size={16} aria-hidden="true" />
            <LocalizedText>{filteredCount === 0
              ? "Mostra 0 risultati"
              : filteredCount === 1
                ? "Mostra 1 risultato"
                : `Mostra ${filteredCount} risultati`}</LocalizedText>
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default DefinitiveArchive;
