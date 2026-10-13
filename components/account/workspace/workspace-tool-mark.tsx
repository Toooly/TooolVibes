"use client";

import { LocalizedText } from "@/components/i18n/localized-text";
import type { PublicToolCatalogItem } from "@/lib/data/public-tool-catalog-types";

const PALETTE = [
  ["#6a3cff", "#43c6ff"],
  ["#2f6dff", "#7ae0c8"],
  ["#c9a227", "#f0d58a"],
  ["#c45c3e", "#f0a27a"],
  ["#3d7a5a", "#8fd4b0"],
  ["#7a4ad6", "#c9b6ff"],
] as const;

function hashSlug(slug: string) {
  let hash = 0;
  for (const char of slug) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return hash;
}

export function toolBadgeLabel(name: string) {
  if (name.toLowerCase() === "v0") return "v0";
  const compact = name.replace(/[^a-z0-9]/gi, "");
  if (compact.length <= 2) return compact.toUpperCase();
  return compact.slice(0, 2).toUpperCase();
}

export function catalogItem(
  catalog: readonly PublicToolCatalogItem[],
  slug: string,
) {
  return catalog.find((item) => item.slug === slug) ?? null;
}

export function markColors(item: PublicToolCatalogItem | null, slug: string) {
  if (item?.accentFrom && item?.accentTo) {
    return [item.accentFrom, item.accentTo] as const;
  }
  return PALETTE[hashSlug(slug) % PALETTE.length];
}

type Size = "xs" | "sm" | "md" | "lg" | "xl";

const SIZE_CLASS: Record<Size, string> = {
  xs: "tv-tool-mark tv-tool-mark--xs",
  sm: "tv-tool-mark tv-tool-mark--sm",
  md: "tv-tool-mark tv-tool-mark--md",
  lg: "tv-tool-mark tv-tool-mark--lg",
  xl: "tv-tool-mark tv-tool-mark--xl",
};

export function WorkspaceToolMark({
  slug,
  name,
  accentFrom,
  accentTo,
  size = "md",
}: {
  slug: string;
  name?: string;
  domain?: string | null;
  accentFrom?: string;
  accentTo?: string;
  size?: Size;
}) {
  const label = toolBadgeLabel(name || slug);
  const colors =
    accentFrom && accentTo
      ? ([accentFrom, accentTo] as const)
      : markColors(null, slug);

  return (
    <span
      aria-hidden="true"
      className={SIZE_CLASS[size]}
      style={{
        background: `linear-gradient(145deg, ${colors[0]}, ${colors[1]})`,
        ["--mark-a" as string]: colors[0],
        ["--mark-b" as string]: colors[1],
      }}
    >
      <span className="tv-tool-mark__jewel" />
      <span className="tv-tool-mark__fallback"><LocalizedText>{label}</LocalizedText></span>
    </span>
  );
}

export function WorkspaceCatalogMark({
  catalog,
  slug,
  size = "md",
}: {
  catalog: readonly PublicToolCatalogItem[];
  slug: string;
  size?: Size;
}) {
  const item = catalogItem(catalog, slug);
  return (
    <WorkspaceToolMark
      slug={slug}
      name={item?.name ?? slug}
      accentFrom={item?.accentFrom}
      accentTo={item?.accentTo}
      size={size}
    />
  );
}

export function WorkspaceMarkStrip({
  catalog,
  slugs,
  limit = 5,
  size = "sm",
}: {
  catalog: readonly PublicToolCatalogItem[];
  slugs: readonly string[];
  limit?: number;
  size?: Size;
}) {
  const shown = slugs.slice(0, limit);
  const extra = slugs.length - shown.length;
  if (shown.length === 0) return null;
  return (
    <span className="tv-mark-strip" aria-hidden="true">
      {shown.map((slug) => (
        <WorkspaceCatalogMark key={slug} catalog={catalog} slug={slug} size={size} />
      ))}
      {extra > 0 ? <span className="tv-mark-strip__extra">+{extra}</span> : null}
    </span>
  );
}
