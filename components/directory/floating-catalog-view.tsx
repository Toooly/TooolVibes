"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Search, X, LayoutGrid, Sparkles, Code, Boxes, Layers, Database, Palette, Zap, Globe, FileText, Cpu } from "lucide-react";
import Fuse from "fuse.js";
import { SectionOrbitProvider } from "@/components/app/orbital-system";
import type { OrbitalItem, OrbitalShapeType } from "@/components/app/orbital-system";
import { FloatingSectionAnchor } from "@/components/home/floating-section-anchor";
import { DirectoryBrowser } from "./directory-browser";
import type { DirectoryTool, DirectoryFilterGroup } from "@/lib/data/tooolvibes-directory";

// ── Category visual metadata ──
const CATEGORY_META: Record<
  string,
  { color: string; shape: OrbitalShapeType; iconName: string }
> = {
  all: { color: "#6a3cff", shape: "gem", iconName: "Sparkles" },
  "vibe-coding": { color: "#39d2f6", shape: "crystal", iconName: "Code" },
  "ai-app-builder": { color: "#f3bf4c", shape: "hexagon", iconName: "Boxes" },
  "no-code": { color: "#a855f7", shape: "blob", iconName: "Layers" },
  "headless-cms": { color: "#ec4899", shape: "shard", iconName: "Database" },
  marketing: { color: "#f97316", shape: "gem", iconName: "Zap" },
  automation: { color: "#22c55e", shape: "crystal", iconName: "Cpu" },
  design: { color: "#06b6d4", shape: "hexagon", iconName: "Palette" },
  writing: { color: "#8b5cf6", shape: "blob", iconName: "FileText" },
  dev: { color: "#14b8a6", shape: "shard", iconName: "Globe" },
};

function slugToShape(slug: string): OrbitalShapeType {
  const shapes: OrbitalShapeType[] = ["hexagon", "crystal", "shard", "gem", "blob"];
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = ((hash << 5) - hash) + slug.charCodeAt(i);
    hash |= 0;
  }
  return shapes[Math.abs(hash) % shapes.length];
}

function extractDomain(url: string): string | undefined {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return undefined;
  }
}

function toolToOrbital(tool: DirectoryTool, sectionId: string): OrbitalItem {
  const words = tool.name.split(/\s+/).filter(Boolean);
  const initials =
    words.length === 1
      ? words[0].slice(0, 2).toUpperCase()
      : (words[0]?.[0] ?? "") + (words[1]?.[0] ?? "");
  const domain = extractDomain(tool.url);
  const iconUrl = domain
    ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`
    : undefined;
  return {
    id: `${sectionId}-${tool.slug}`,
    title: tool.name,
    initials: initials.toUpperCase(),
    description: tool.shortDescription || tool.tldr || "",
    category: tool.categoryLabel,
    href: `/toools/${tool.slug}`,
    sectionId,
    priority: 1,
    color: tool.accentFrom || "#6a3cff",
    shapeType: slugToShape(tool.slug),
    iconUrl,
    variant: "tool",
    size: "sm",
  };
}

// ── Types ──
interface FloatingCatalogViewProps {
  tools: DirectoryTool[];
  filterGroups: { key: DirectoryFilterGroup; label: string }[];
  initialQuery?: string;
  initialGroup?: DirectoryFilterGroup;
  initialTag?: string;
}

export function FloatingCatalogView({
  tools,
  filterGroups,
  initialQuery = "",
  initialGroup = "all",
  initialTag = "",
}: FloatingCatalogViewProps) {
  const router = useRouter();

  const [view, setView] = useState<"categories" | "tools">(
    initialGroup !== "all" || initialQuery ? "tools" : "categories"
  );
  const [activeGroup, setActiveGroup] = useState<DirectoryFilterGroup | null>(
    initialGroup !== "all" ? initialGroup : null
  );
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [showFallback, setShowFallback] = useState(false);

  // Fuse instance
  const fuse = useMemo(
    () =>
      new Fuse(tools, {
        keys: ["name", "categoryLabel", "tags", "shortDescription", "longDescription"],
        threshold: 0.35,
      }),
    [tools]
  );

  // Filtered tools
  const filteredTools = useMemo(() => {
    let result = [...tools];
    if (activeGroup && activeGroup !== "all") {
      result = result.filter((t) => t.segments.includes(activeGroup));
    }
    if (initialTag) {
      result = result.filter((t) => t.tags.includes(initialTag));
    }
    if (searchQuery.trim()) {
      result = fuse.search(searchQuery.trim()).map((r) => r.item);
    }
    return result.slice(0, 16);
  }, [tools, activeGroup, initialTag, searchQuery, fuse]);

  // Category orbital items
  const categoryItems: OrbitalItem[] = useMemo(() => {
    return filterGroups.map((cat) => {
      const count = cat.key === "all" ? tools.length : tools.filter((t) => t.segments.includes(cat.key)).length;
      const meta = CATEGORY_META[cat.key] ?? { color: "#6a3cff", shape: "gem", iconName: "Sparkles" };
      return {
        id: `cat-${cat.key}`,
        title: cat.label,
        initials: cat.label.slice(0, 1).toUpperCase(),
        description: `${count} tool${count !== 1 ? "" : ""}`,
        category: "Categoria",
        href: cat.key === "all" ? "/archivio" : `/archivio?group=${cat.key}`,
        sectionId: "archive-categories",
        priority: 1,
        color: meta.color,
        shapeType: meta.shape,
        variant: "category",
        size: "lg",
        iconName: meta.iconName,
        meta: `${count} tool`,
      };
    });
  }, [filterGroups, tools]);

  // Tool orbital items
  const toolItems: OrbitalItem[] = useMemo(
    () => filteredTools.map((t) => toolToOrbital(t, "archive-tools")),
    [filteredTools]
  );

  // Current view config
  const currentSectionId = view === "categories" ? "archive-categories" : "archive-tools";
  const currentItems = view === "categories" ? categoryItems : toolItems;
  const currentLabel = view === "categories" ? "Categorie" : "Tool";

  const activeGroupLabel = useMemo(
    () => filterGroups.find((g) => g.key === activeGroup)?.label ?? "Tutti i tool",
    [filterGroups, activeGroup]
  );

  // Handlers
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    if (value.trim() && view === "categories") {
      setView("tools");
    }
  }, [view]);

  const handleBackToCategories = useCallback(() => {
    setView("categories");
    setActiveGroup(null);
    setSearchQuery("");
    router.push("/archivio", { scroll: false });
  }, [router]);

  const handleCategoryNavigate = useCallback(
    (groupKey: string) => {
      if (groupKey === "all") {
        setActiveGroup(null);
      } else {
        setActiveGroup(groupKey as DirectoryFilterGroup);
      }
      setView("tools");
      // Update URL without full reload
      const url = groupKey === "all" ? "/archivio" : `/archivio?group=${groupKey}`;
      router.push(url, { scroll: false });
    },
    [router]
  );

  // Build section anchor title/description based on view
  const anchorTitle = view === "categories" ? "Esplora per categoria" : activeGroupLabel;
  const anchorDescription =
    view === "categories"
      ? "Scegli un cluster per scoprire i tool che fanno parte di quel mondo."
      : `${filteredTools.length} tool trovati`;

  if (showFallback) {
    return (
      <div className="relative pt-20">
        <div className="fixed top-20 right-6 z-40">
          <button
            onClick={() => setShowFallback(false)}
            className="flex items-center gap-2 rounded-xl border border-[rgba(106,60,255,0.12)] bg-[rgba(255,255,255,0.7)] px-4 py-2 text-sm font-medium text-[#120d2f] backdrop-blur-xl"
          >
            <LayoutGrid size={16} />
            Vista spaziale
          </button>
        </div>
        <div className="px-4 pt-32 pb-20">
          <DirectoryBrowser
            tools={tools}
            eyebrow={searchQuery ? "Risultato" : "Esplora il catalogo"}
            title={searchQuery ? "Risultato diretto" : "Tutti i tool selezionati in una vista che respira."}
            description={searchQuery ? "" : "Filtra, salva, confronta e costruisci uno stack senza perdere contesto o ritmo."}
            initialQuery={searchQuery}
            initialTag={initialTag}
            initialGroup={activeGroup ?? "all"}
            directSearchMode={Boolean(searchQuery)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen pb-32">
      {/* ═══ Floating Control Bar ═══ */}
      <div className="fixed top-20 left-1/2 z-40 w-[92%] max-w-xl -translate-x-1/2">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex items-center gap-3 rounded-2xl border border-[rgba(106,60,255,0.1)] bg-[rgba(255,255,255,0.75)] px-4 py-3 backdrop-blur-xl shadow-[0_8px_32px_rgba(106,60,255,0.08)]"
        >
          <Search size={18} className="shrink-0 text-[#6a3cff]" />
          <input
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Cerca tool, categorie, tag..."
            className="flex-1 bg-transparent text-sm text-[#120d2f] placeholder:text-[#4f4970]/50 outline-none"
            aria-label="Cerca nel catalogo"
          />
          {searchQuery && (
            <button
              onClick={() => handleSearchChange("")}
              className="shrink-0 rounded-full p-1 transition-colors hover:bg-[rgba(106,60,255,0.08)]"
              aria-label="Cancella ricerca"
            >
              <X size={16} className="text-[#4f4970]" />
            </button>
          )}
          {/* Fallback toggle */}
          <button
            onClick={() => setShowFallback(true)}
            className="shrink-0 rounded-lg border border-[rgba(106,60,255,0.08)] bg-[rgba(106,60,255,0.04)] px-2.5 py-1.5 text-[11px] font-medium text-[#6a3cff] transition-colors hover:bg-[rgba(106,60,255,0.08)]"
            title="Passa alla vista lista classica"
          >
            Lista
          </button>
        </motion.div>
      </div>

      {/* ═══ Back Navigation ═══ */}
      <AnimatePresence>
        {view === "tools" && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="fixed top-32 left-6 z-40"
          >
            <button
              onClick={handleBackToCategories}
              className="flex items-center gap-2 rounded-xl border border-[rgba(106,60,255,0.1)] bg-[rgba(255,255,255,0.7)] px-4 py-2.5 text-sm font-medium text-[#120d2f] backdrop-blur-xl shadow-[0_4px_16px_rgba(106,60,255,0.06)] transition-all hover:bg-[rgba(255,255,255,0.9)]"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">Tutte le categorie</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ Active group chips (when in tool view) ═══ */}
      <AnimatePresence>
        {view === "tools" && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="fixed top-32 right-6 z-40 hidden max-w-xs flex-wrap justify-end gap-2 md:flex"
          >
            {filterGroups.slice(0, 6).map((cat) => {
              const isActive =
                (cat.key === "all" && !activeGroup) || cat.key === activeGroup;
              return (
                <button
                  key={cat.key}
                  onClick={() => handleCategoryNavigate(cat.key)}
                  className={`rounded-full px-3 py-1.5 text-[11px] font-medium backdrop-blur-md transition-all ${
                    isActive
                      ? "bg-[#6a3cff] text-white shadow-[0_2px_8px_rgba(106,60,255,0.25)]"
                      : "border border-[rgba(106,60,255,0.1)] bg-[rgba(255,255,255,0.6)] text-[#4f4970] hover:bg-[rgba(106,60,255,0.06)]"
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ Spatial Content ═══ */}
      <div className="pt-28">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSectionId}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          >
            <SectionOrbitProvider
              sectionId={currentSectionId}
              label={currentLabel}
              items={currentItems}
            >
              <FloatingSectionAnchor
                label={view === "categories" ? "Catalogo" : activeGroupLabel}
                title={anchorTitle}
                description={anchorDescription}
                action={
                  view === "tools" && filteredTools.length > 0
                    ? { label: "Vedi tutti", href: "/archivio" }
                    : undefined
                }
              />
            </SectionOrbitProvider>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ═══ Empty state ═══ */}
      <AnimatePresence>
        {view === "tools" && filteredTools.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(106,60,255,0.08)]">
              <Search size={24} className="text-[#6a3cff]" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-[#120d2f]">Nessun tool trovato</h3>
            <p className="mb-6 max-w-sm text-sm text-[#4f4970]">
              Prova a cambiare i filtri o la ricerca per trovare quello che cerchi.
            </p>
            <button
              onClick={handleBackToCategories}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#6a3cff] to-[#4f46e5] px-6 py-3 text-sm font-semibold text-white shadow-[0_6px_24px_rgba(106,60,255,0.25)]"
            >
              Torna alle categorie
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ Footer hint ═══ */}
      <div className="pointer-events-none absolute bottom-8 left-1/2 -translate-x-1/2 text-center">
        <p className="text-[11px] text-[#4f4970]/40">
          {view === "categories"
            ? "Clicca una categoria per esplorare i tool"
            : "Clicca un tool per scoprire i dettagli"}
        </p>
      </div>
    </div>
  );
}
