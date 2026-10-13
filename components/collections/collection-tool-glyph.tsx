"use client";

import { LocalizedText, LocalizedAttributes } from "@/components/i18n/localized-text";
/**
 * CollectionToolGlyph — gradient square + favicon (or monogram) for
 * Collection cards.
 *
 * Reuses the same visual language as the rest of TooolVibes:
 * - gradient brand square (rounded 10-14px) — same shape as
 *   DirectoryToolGlyph used by tool cards, tool detail, home, guides
 * - real per-tool brand colors when available
 * - favicon (Google s2 endpoint) when domain is known, with monogram
 *   fallback on error (identical behavior to DirectoryToolGlyph)
 *
 * If the slim CollectionTool does not carry the brand fields (e.g.
 * because the runtime tool source is not the directory), a
 * deterministic gradient is derived from the slug so the visual
 * identity remains stable per tool.
 *
 * The glyph is a client component because the favicon is loaded
 * asynchronously and needs an onError fallback state.
 */

type CollectionToolGlyphProps = {
  /** Tool slug — primary key, used for fallback gradient derivation. */
  slug: string;
  /** Tool name — used for the monogram fallback. */
  name: string;
  /** Real brand gradient start color (e.g. "#6d3bff"). Optional. */
  accentFrom?: string;
  /** Real brand gradient end color. Optional. */
  accentTo?: string;
  /** Real domain for favicon lookup. Optional. */
  domain?: string;
  /** External URL — used for favicon lookup if domain is missing. */
  externalUrl?: string;
  /** Size preset. */
  size?: "sm" | "md" | "lg";
  className?: string;
};

import { useState } from "react";

const sizeClasses: Record<NonNullable<CollectionToolGlyphProps["size"]>, string> = {
  /* Radii + sizes aligned with DirectoryToolGlyph so the same tool
     renders identically across surfaces (cards, strip, detail).
     The lg radius (18px vs 14px) prevents glyph squish when used
     inside tight flex rows. */
  sm: "h-9 w-9 shrink-0 rounded-[11px] text-[0.78rem]",
  md: "h-11 w-11 shrink-0 rounded-[13px] text-[0.92rem]",
  lg: "h-14 w-14 shrink-0 rounded-[18px] text-[1.05rem]",
};

/**
 * Deterministic hash → number. Stable per slug.
 */
function hashSlug(slug: string): number {
  let hash = 5381;
  for (let i = 0; i < slug.length; i++) {
    hash = ((hash << 5) + hash + slug.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/**
 * Fallback gradient derived from slug. Used when the real brand
 * fields are missing. Hue is shifted into the 200-340 range
 * (blues / purples / teals / magentas) to harmonize with the
 * TooolVibes palette.
 */
function deriveFallbackGradient(slug: string): { from: string; to: string } {
  const hash = hashSlug(slug);
  const hue = 200 + (hash % 140);
  const hue2 = (hue + 25) % 360;
  return {
    from: `hsl(${hue}, 70%, 58%)`,
    to: `hsl(${hue2}, 75%, 62%)`,
  };
}

/**
 * First letter of the tool name, uppercased.
 */
function monogram(name: string, slug: string): string {
  const source = (name && name.trim()) || slug;
  const first = source.replace(/[^A-Za-z0-9]/g, "").charAt(0);
  return (first || slug.charAt(0) || "?").toUpperCase();
}

/**
 * Resolve the favicon URL. Same logic as DirectoryToolGlyph.
 * Falls back gracefully — never throws.
 */
function getFaviconUrl(
  domain: string | undefined,
  externalUrl: string | undefined,
): string | null {
  const host = domain || (externalUrl ? safeDomain(externalUrl) : null);
  if (!host) return null;
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=64`;
}

function safeDomain(url: string): string | null {
  try {
    const u = new URL(url);
    return u.hostname;
  } catch {
    return null;
  }
}

export function CollectionToolGlyph({
  slug,
  name,
  accentFrom,
  accentTo,
  domain,
  externalUrl,
  size = "md",
  className = "",
}: CollectionToolGlyphProps) {
  const [logoFailed, setLogoFailed] = useState(false);
  const gradient = accentFrom && accentTo
    ? { from: accentFrom, to: accentTo }
    : deriveFallbackGradient(slug);
  const letter = monogram(name, slug);
  const faviconUrl = getFaviconUrl(domain, externalUrl);
  const showFavicon = faviconUrl && !logoFailed;

  return (
    <span
      aria-hidden="true"
      className={`collection-tool-glyph inline-flex items-center justify-center border border-[rgba(76,55,166,0.2)] font-semibold uppercase tracking-[0.04em] text-white shadow-[0_8px_18px_rgba(0,0,0,0.18)] overflow-hidden ${sizeClasses[size]} ${className}`.trim()}
      style={{
        background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})`,
      }}
    >
      {showFavicon && (
        // eslint-disable-next-line @next/next/no-img-element
        <LocalizedAttributes><img
          src={faviconUrl}
          alt=""
          loading="lazy"
          decoding="async"
          className="h-[60%] w-[60%] object-contain"
          onError={() => setLogoFailed(true)}
        /></LocalizedAttributes>
      )}
      <span className={showFavicon ? "hidden" : "block"}><LocalizedText>{letter}</LocalizedText></span>
    </span>
  );
}
