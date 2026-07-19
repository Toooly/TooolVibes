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
import { searchTools } from "@/lib/search/tool-search";
import {
  createLegacyToolSearchIndex,
  type ToolSearchEngine,
} from "@/lib/search/tool-search-adapter";

/* ═══════════════════════════════════════════════════════════════
   Catalog controller — pure query/filter/URL state helpers.
   Behavior-preserving extraction from MobileCatalogView (B25):
   no visual, UX or routing semantic changes.
   B31: canonical URL state serialization + unified search engine
   (legacy Fuse engine preserved behind the unifiedSearch flag).
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

/* ── Canonical URL state (B31) ──────────────────────────────── */

export const CATALOG_LEVEL_VALUES: readonly CatalogToolLevel[] = [
  "featured",
  "beginner",
  "intermediate",
  "expert",
];

export type CatalogUrlState = {
  query?: string;
  group?: string | null;
  tag?: string;
  level?: CatalogLevelFilter;
};

/**
 * Single serializer for the archive URL state shared by the catalog
 * controller, the header search and the command palette (IA-504):
 * same state → same canonical URL. Param order is fixed
 * (group, q, tag, level); empty/default values are omitted.
 */
export function serializeCatalogUrl({
  query = "",
  group = null,
  tag = "",
  level = "all",
}: CatalogUrlState): string {
  const params = new URLSearchParams();
  if (group && group !== "all") {
    params.set("group", group);
  }
  const trimmedQuery = query.trim();
  if (trimmedQuery) {
    params.set("q", trimmedQuery);
  }
  if (tag) {
    params.set("tag", tag);
  }
  if (level && level !== "all") {
    params.set("level", level);
  }
  const serialized = params.toString();
  return serialized
    ? `${CATALOG_ALL_TOOLS_URL}?${serialized}`
    : CATALOG_ALL_TOOLS_URL;
}

export function parseCatalogLevelParam(
  value: string | null | undefined,
): CatalogLevelFilter {
  return value && (CATALOG_LEVEL_VALUES as readonly string[]).includes(value)
    ? (value as CatalogLevelFilter)
    : "all";
}

export function resolveCatalogGroupParam(
  filterGroups: { key: string; label: string }[],
  value: string | null | undefined,
): string {
  return value && filterGroups.some((group) => group.key === value)
    ? value
    : "all";
}

/* ── Search index ───────────────────────────────────────────── */

/**
 * Legacy pre-B31 Fuse index. Kept for the unifiedSearch=OFF rollback
 * path; the canonical engine is lib/search/tool-search.
 */
export function createCatalogSearchIndex(tools: ToolPublicView[]): Fuse<ToolPublicView> {
  return createLegacyToolSearchIndex(tools);
}

/* ── Filtering pipeline ─────────────────────────────────────── */

export type CatalogFilterInput = {
  tools: ToolPublicView[];
  searchIndex: Fuse<ToolPublicView> | null;
  activeGroup: string | null;
  tag: string;
  searchQuery: string;
  activeLevel: CatalogLevelFilter;
  searchEngine?: ToolSearchEngine;
};

export function filterCatalogTools({
  tools,
  searchIndex,
  activeGroup,
  tag,
  searchQuery,
  activeLevel,
  searchEngine = "canonical",
}: CatalogFilterInput): ToolPublicView[] {
  let result = [...tools];
  if (activeGroup && activeGroup !== "all") {
    result = result.filter((tool) => tool.segments.includes(activeGroup));
  }
  if (tag) {
    result = result.filter((tool) => tool.tags.includes(tag));
  }
  const trimmedQuery = searchQuery.trim();
  if (trimmedQuery) {
    const allowedSlugs = new Set(result.map((tool) => tool.slug));
    const ranked =
      searchEngine === "legacy-fuse"
        ? (searchIndex ?? createCatalogSearchIndex(tools))
            .search(trimmedQuery)
            .map((entry) => entry.item)
        : searchTools(tools, trimmedQuery);
    result = ranked.filter((tool) => allowedSlugs.has(tool.slug));
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
