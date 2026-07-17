import Fuse from "fuse.js";
import {
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
} from "lucide-react";
import type { ToolPublicView } from "@/lib/data/tool-public-view";

/* ═══════════════════════════════════════════════════════════════
   Catalog controller — pure query/filter/URL state helpers.
   Behavior-preserving extraction from MobileCatalogView (B25):
   no visual, UX or routing semantic changes.
   ═══════════════════════════════════════════════════════════════ */

export type CatalogToolLevel = "featured" | "beginner" | "intermediate" | "expert";

export type CatalogLevelFilter = CatalogToolLevel | "all";

export type CatalogView = "categories" | "tools";

export const CATEGORY_ICON_MAP = {
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

export const CATEGORY_META: Record<
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

export const DEFAULT_CATEGORY_META: { color: string; iconName: keyof typeof CATEGORY_ICON_MAP } = {
  color: "#6a3cff",
  iconName: "Sparkles",
};

export const CATALOG_LEVEL_CHIPS: { key: CatalogLevelFilter; label: string }[] = [
  { key: "all", label: "Tutti" },
  { key: "featured", label: "In evidenza" },
  { key: "beginner", label: "Base" },
  { key: "intermediate", label: "Intermedio" },
  { key: "expert", label: "Avanzato" },
];

export type CatalogCategorySummary = {
  key: string;
  label: string;
  count: number;
  color: string;
  iconName: keyof typeof CATEGORY_ICON_MAP;
};

export function extractDomain(url: string): string | undefined {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return undefined;
  }
}

/* ── URL state: parse (initial props) + serialize (push) ────── */

export function resolveInitialCatalogView(
  initialGroup: string,
  initialQuery: string,
): CatalogView {
  return initialGroup !== "all" || initialQuery ? "tools" : "categories";
}

export function resolveInitialActiveGroup(initialGroup: string): string | null {
  return initialGroup !== "all" ? initialGroup : null;
}

export function buildCatalogGroupUrl(groupKey: string): string {
  return groupKey === "all" ? "/archivio" : `/archivio?group=${groupKey}`;
}

export const CATALOG_ALL_TOOLS_URL = "/archivio";

/* ── Search index ───────────────────────────────────────────── */

export function createCatalogSearchIndex(tools: ToolPublicView[]): Fuse<ToolPublicView> {
  return new Fuse(tools, {
    keys: ["name", "categoryLabel", "tags", "shortDescription", "longDescription"],
    threshold: 0.35,
  });
}

/* ── Filtering pipeline ─────────────────────────────────────── */

export type CatalogFilterInput = {
  tools: ToolPublicView[];
  searchIndex: Fuse<ToolPublicView>;
  activeGroup: string | null;
  tag: string;
  searchQuery: string;
  activeLevel: CatalogLevelFilter;
};

export function filterCatalogTools({
  tools,
  searchIndex,
  activeGroup,
  tag,
  searchQuery,
  activeLevel,
}: CatalogFilterInput): ToolPublicView[] {
  let result = [...tools];
  if (activeGroup && activeGroup !== "all") {
    result = result.filter((tool) => tool.segments.includes(activeGroup));
  }
  if (tag) {
    result = result.filter((tool) => tool.tags.includes(tag));
  }
  if (searchQuery.trim()) {
    const allowedSlugs = new Set(result.map((tool) => tool.slug));
    result = searchIndex
      .search(searchQuery.trim())
      .map((entry) => entry.item)
      .filter((tool) => allowedSlugs.has(tool.slug));
  }
  if (activeLevel !== "all") {
    result = result.filter((tool) => tool.level === activeLevel);
  }
  return result;
}

/* ── Derived collections ────────────────────────────────────── */

export function summarizeCatalogCategories(
  filterGroups: { key: string; label: string }[],
  tools: ToolPublicView[],
): CatalogCategorySummary[] {
  return filterGroups.map((cat) => {
    const categoryTools =
      cat.key === "all" ? tools : tools.filter((tool) => tool.segments.includes(cat.key));
    const count = cat.key === "all" ? tools.length : categoryTools.length;
    const meta = CATEGORY_META[cat.key] ?? DEFAULT_CATEGORY_META;

    return {
      ...cat,
      count,
      ...meta,
    };
  });
}

export function resolveFeaturedTools(tools: ToolPublicView[]): ToolPublicView[] {
  const featured = tools.filter((tool) => tool.level === "featured");
  return (featured.length ? featured : tools).slice(0, 6);
}

export function resolveActiveGroupLabel(
  filterGroups: { key: string; label: string }[],
  activeGroup: string | null,
): string {
  return filterGroups.find((group) => group.key === activeGroup)?.label ?? "Tutti i tool";
}
