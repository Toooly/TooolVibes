"use client";

import { useState, useMemo, useCallback, useEffect, type CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  SlidersHorizontal,
  X,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Code,
  Boxes,
  Layers,
  Database,
  Palette,
  Zap,
  Globe,
  FileText,
  Cpu,
  Layout,
  Pen,
  Image,
  Video,
  TrendingUp,
  DollarSign,
  Headphones,
  Bot,
  CreditCard,
  Monitor,
  Clock,
  ChevronDown,
  Columns3,
} from "lucide-react";
import Fuse from "fuse.js";
import { CompareToggle } from "@/components/tools/compare-toggle";
import { ShortlistToggle } from "@/components/tools/shortlist-toggle";
import { MAX_COMPARE_TOOLS, useToolWorkspaceStore } from "@/lib/stores/tool-workspace-store";
import type {
  DirectoryTool,
  DirectoryFilterGroup,
  DirectoryToolLevel,
} from "@/lib/data/tooolvibes-directory";

const CATEGORY_ICON_MAP = {
  Sparkles,
  Code,
  Boxes,
  Layers,
  Database,
  Palette,
  Zap,
  Globe,
  FileText,
  Cpu,
  Layout,
  Pen,
  Image,
  Video,
  TrendingUp,
  DollarSign,
  Headphones,
  Bot,
  CreditCard,
  Monitor,
  Clock,
} as const;

const CATEGORY_META: Record<
  string,
  { color: string; iconName: keyof typeof CATEGORY_ICON_MAP }
> = {
  all: { color: "#6a3cff", iconName: "Sparkles" },
  "vibe-coding": { color: "#39d2f6", iconName: "Code" },
  "ai-app-builder": { color: "#f3bf4c", iconName: "Boxes" },
  "no-code": { color: "#a855f7", iconName: "Layers" },
  "headless-cms": { color: "#ec4899", iconName: "Database" },
  "ui-builder": { color: "#f97316", iconName: "Layout" },
  "ai-writing": { color: "#8b5cf6", iconName: "Pen" },
  "ai-image": { color: "#06b6d4", iconName: "Image" },
  "ai-video": { color: "#e11d48", iconName: "Video" },
  marketing: { color: "#22c55e", iconName: "TrendingUp" },
  sales: { color: "#14b8a6", iconName: "DollarSign" },
  "customer-support": { color: "#6366f1", iconName: "Headphones" },
  automation: { color: "#f59e0b", iconName: "Bot" },
  "ai-agents": { color: "#10b981", iconName: "Cpu" },
  payments: { color: "#84cc16", iconName: "CreditCard" },
  "website-builder": { color: "#3b82f6", iconName: "Monitor" },
  productivity: { color: "#d946ef", iconName: "Clock" },
};



function extractDomain(url: string): string | undefined {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return undefined;
  }
}

/* ═══════════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════════ */

interface MobileCatalogViewProps {
  tools: DirectoryTool[];
  filterGroups: { key: DirectoryFilterGroup; label: string }[];
  initialQuery?: string;
  initialGroup?: DirectoryFilterGroup;
  initialTag?: string;
}

/* ═══════════════════════════════════════════════════════════════
   MobileCatalogView — root component
   ═══════════════════════════════════════════════════════════════ */

export function MobileCatalogView({
  tools,
  filterGroups,
  initialQuery = "",
  initialGroup = "all",
  initialTag = "",
}: MobileCatalogViewProps) {
  const router = useRouter();

  const [view, setView] = useState<"categories" | "tools">(
    initialGroup !== "all" || initialQuery ? "tools" : "categories"
  );
  const [activeGroup, setActiveGroup] = useState<DirectoryFilterGroup | null>(
    initialGroup !== "all" ? initialGroup : null
  );
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [activeLevel, setActiveLevel] = useState<DirectoryToolLevel | "all">("all");
  const [openPanel, setOpenPanel] = useState<"search" | "filters" | null>(null);

  const levelChips: { key: DirectoryToolLevel | "all"; label: string }[] = [
    { key: "all", label: "Tutti" },
    { key: "featured", label: "In evidenza" },
    { key: "beginner", label: "Base" },
    { key: "intermediate", label: "Intermedio" },
    { key: "expert", label: "Avanzato" },
  ];

  const fuse = useMemo(
    () =>
      new Fuse(tools, {
        keys: [
          "name",
          "categoryLabel",
          "tags",
          "shortDescription",
          "longDescription",
        ],
        threshold: 0.35,
      }),
    [tools]
  );

  const filteredTools = useMemo(() => {
    let result = [...tools];
    if (activeGroup && activeGroup !== "all") {
      result = result.filter((t) => t.segments.includes(activeGroup));
    }
    if (initialTag) {
      result = result.filter((t) => t.tags.includes(initialTag));
    }
    if (searchQuery.trim()) {
      const allowedSlugs = new Set(result.map((tool) => tool.slug));
      result = fuse
        .search(searchQuery.trim())
        .map((r) => r.item)
        .filter((tool) => allowedSlugs.has(tool.slug));
    }
    if (activeLevel !== "all") {
      result = result.filter((t) => t.level === activeLevel);
    }
    return result;
  }, [tools, activeGroup, initialTag, searchQuery, fuse, activeLevel]);

  const activeGroupLabel = useMemo(
    () => filterGroups.find((g) => g.key === activeGroup)?.label ?? "Tutti i tool",
    [filterGroups, activeGroup]
  );

  const categories = useMemo(() => {
    return filterGroups.map((cat) => {
      const categoryTools =
        cat.key === "all"
          ? tools
          : tools.filter((tool) => tool.segments.includes(cat.key));
      const count =
        cat.key === "all"
          ? tools.length
          : categoryTools.length;
      const meta = CATEGORY_META[cat.key] ?? { color: "#6a3cff", iconName: "Sparkles" };

      return {
        ...cat,
        count,
        ...meta,
      };
    });
  }, [filterGroups, tools]);

  const featuredTools = useMemo(() => {
    const featured = tools.filter((tool) => tool.level === "featured");
    return (featured.length ? featured : tools).slice(0, 6);
  }, [tools]);

  const handleCategorySelect = useCallback(
    (groupKey: string) => {
      if (groupKey === "all") {
        setActiveGroup(null);
      } else {
        setActiveGroup(groupKey as DirectoryFilterGroup);
      }
      setView("tools");
      const url = groupKey === "all" ? "/archivio" : `/archivio?group=${groupKey}`;
      router.push(url, { scroll: false });
    },
    [router]
  );

  const handleBack = useCallback(() => {
    setView("categories");
    setActiveGroup(null);
    setSearchQuery("");
    router.push("/archivio", { scroll: false });
  }, [router]);

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchQuery(value);
      if (value.trim() && view === "categories") {
        setView("tools");
      }
    },
    [view]
  );

  useEffect(() => {
    const handleCatalogPanel = (event: Event) => {
      const panel = (event as CustomEvent<"search" | "filters">).detail;
      if (panel !== "search" && panel !== "filters") return;
      setOpenPanel(panel);
      window.setTimeout(() => {
        document
          .querySelector<HTMLElement>("[data-catalog-panel]")
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
        if (panel === "search") {
          document
            .querySelector<HTMLInputElement>("[data-catalog-search]")
            ?.focus({ preventScroll: true });
        }
      }, 80);
    };

    window.addEventListener("tooolvibes:catalog-panel", handleCatalogPanel as EventListener);
    return () => window.removeEventListener("tooolvibes:catalog-panel", handleCatalogPanel as EventListener);
  }, []);

  const searchControl = (
    <div className="mobile-catalog-view__search">
      <Search size={16} className="shrink-0 text-[#6a3cff]" />
      <input
        data-catalog-search
        value={searchQuery}
        onChange={(e) => handleSearchChange(e.target.value)}
        placeholder={
          view === "categories"
            ? "Cerca categorie o tool..."
            : "Filtra i tool visibili..."
        }
        aria-label={view === "categories" ? "Cerca categorie o tool nel catalogo" : "Affina i tool visibili"}
      />
      {searchQuery && (
        <button
          type="button"
          onClick={() => handleSearchChange("")}
          className="shrink-0 rounded-full p-1 transition-colors hover:bg-[rgba(106,60,255,0.08)]"
          aria-label="Cancella ricerca"
        >
          <X size={14} className="text-[#4f4970]" />
        </button>
      )}
    </div>
  );

  const levelControls = (
    <div className="mobile-catalog-view__chips" data-catalog-filters>
      {levelChips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={() => setActiveLevel(chip.key)}
          className={`mobile-catalog-view__chip${activeLevel === chip.key ? " is-active" : ""}`}
        >
          {chip.label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="mobile-catalog-view relative min-h-screen pb-24">
      <AnimatePresence>
        {openPanel && (
          <motion.section
            key="catalog-panel"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
            className="mobile-catalog-command-panel"
            data-catalog-panel
            aria-label={openPanel === "search" ? "Ricerca catalogo" : "Filtri catalogo"}
          >
            <div className="mobile-catalog-command-panel__header">
              <span className="mobile-catalog-command-panel__icon">
                {openPanel === "search" ? (
                  <Search size={16} aria-hidden="true" />
                ) : (
                  <SlidersHorizontal size={16} aria-hidden="true" />
                )}
              </span>
              <strong>{openPanel === "search" ? "Affina" : "Filtri"}</strong>
              <button
                type="button"
                onClick={() => setOpenPanel(null)}
                className="mobile-catalog-command-panel__close"
                aria-label="Chiudi pannello"
              >
                <X size={15} aria-hidden="true" />
              </button>
            </div>

            {openPanel === "search" ? (
              <div className="mobile-catalog-command-panel__search">
                {searchControl}
              </div>
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
                          onClick={() => handleCategorySelect(group.key)}
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
            <MobileCategoryMap
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
            <MobileToolGrid
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
  );
}

/* ═══════════════════════════════════════════════════════════════
   CategoryGuide — visual scroll hint
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

/* ═══════════════════════════════════════════════════════════════
   MobileCategoryMap
   ═══════════════════════════════════════════════════════════════ */

type MobileCategoryMapProps = {
  categories: {
    key: DirectoryFilterGroup;
    label: string;
    count: number;
    color: string;
    iconName: keyof typeof CATEGORY_ICON_MAP;
  }[];
  onSelect: (key: string) => void;
  featuredTools: DirectoryTool[];
};

function MobileCategoryMap({
  categories,
  onSelect,
  featuredTools,
}: MobileCategoryMapProps) {
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

function CatalogFeaturedRail({
  tools,
  onSelectAll,
}: {
  tools: DirectoryTool[];
  onSelectAll: () => void;
}) {
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

/* ═══════════════════════════════════════════════════════════════
   MobileToolGrid
   ═══════════════════════════════════════════════════════════════ */

type MobileToolGridProps = {
  tools: DirectoryTool[];
  groupLabel: string;
  searchQuery: string;
};

function MobileToolGrid({ tools, groupLabel, searchQuery }: MobileToolGridProps) {
  const subtitle = searchQuery.trim()
    ? `${tools.length} risultati`
    : `${tools.length} tool`;

  return (
    <section className="mobile-tool-grid" aria-label={`Tool in ${groupLabel}`}>
      <div className="mobile-tool-grid__header">
        <h2>{groupLabel}</h2>
        <span>{subtitle}</span>
      </div>

      <div className="mobile-tool-grid__list">
        {tools.map((tool, index) => (
          <MobileToolCard key={tool.slug} tool={tool} index={index} />
        ))}
      </div>

      <MobileCompareToolbox tools={tools.slice(0, 3)} />
    </section>
  );
}

function MobileCompareToolbox({ tools }: { tools: DirectoryTool[] }) {
  const compareSlugs = useToolWorkspaceStore((state) => state.compareSlugs);
  const selectedTools = compareSlugs
    .map((slug) => tools.find((tool) => tool.slug === slug))
    .filter((tool): tool is DirectoryTool => Boolean(tool));
  const toolboxTools = [
    ...selectedTools,
    ...tools.filter((tool) => !compareSlugs.includes(tool.slug)),
  ].slice(0, MAX_COMPARE_TOOLS);

  if (!tools.length) return null;

  return (
    <section className="mobile-compare-toolbox" aria-label="Confronto rapido">
      <div className="mobile-compare-toolbox__header">
        <span className="mobile-compare-toolbox__icon">
          <Columns3 size={16} aria-hidden="true" />
        </span>
        <div>
          <h3>Confronto rapido</h3>
          <p>
            {compareSlugs.length >= 2
              ? `${compareSlugs.length} candidati pronti. Apri il confronto completo.`
              : "Aggiungi almeno 2 candidati e apri il confronto completo."}
          </p>
        </div>
      </div>
      <div className="mobile-compare-toolbox__pills">
        {toolboxTools.map((tool) => (
          <span key={tool.slug} className="mobile-compare-toolbox__pill">
            <span>{tool.name}</span>
            <CompareToggle slug={tool.slug} compact />
          </span>
        ))}
      </div>
      <Link href="/compare" className="mobile-compare-toolbox__cta">
        {compareSlugs.length >= 2 ? "Vai al confronto" : "Apri confronto"}
        <ArrowRight size={14} aria-hidden="true" />
      </Link>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MobileToolCard
   ═══════════════════════════════════════════════════════════════ */

type MobileToolCardProps = {
  tool: DirectoryTool;
  index: number;
};

function MobileToolCard({ tool, index }: MobileToolCardProps) {
  const domain = extractDomain(tool.url);
  const iconUrl = domain
    ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`
    : undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.3) }}
      className="relative"
    >
      <Link
        href={`/toools/${tool.slug}`}
        className="mobile-tool-card"
        aria-label={`${tool.name}. ${tool.shortDescription || ""}`}
        style={iconUrl ? { "--tool-icon": `url("${iconUrl}")` } as CSSProperties : undefined}
      >
        <div className="mobile-tool-card__visual">
          {iconUrl ? (
            <span className="mobile-tool-card__icon" aria-hidden="true" />
          ) : (
            <span className="mobile-tool-card__fallback">
              {tool.name.slice(0, 2).toUpperCase()}
            </span>
          )}
        </div>
        <div className="mobile-tool-card__meta">
          <div className="mobile-tool-card__topline">
            <span className="mobile-tool-card__category">{tool.categoryLabel}</span>
            <span className="mobile-tool-card__level">{tool.levelLabel}</span>
          </div>
          <h3 className="mobile-tool-card__title">{tool.name}</h3>
          <p className="mobile-tool-card__description">
            {tool.shortDescription || tool.tldr || ""}
          </p>
          <span className="mobile-tool-card__open">
            Apri scheda
            <ArrowRight size={13} aria-hidden="true" />
          </span>
        </div>
      </Link>
      <div className="mobile-tool-card__actions">
        <CompareToggle slug={tool.slug} compact />
        <ShortlistToggle slug={tool.slug} mode="compact" />
      </div>
    </motion.div>
  );
}
