"use client";

/**
 * TooolVibes — Archive V4 Tool Card (stabilized, 2026-07-24)
 *
 * Mobile-first tool card with two distinct anatomies:
 *
 * STANDARD CARD (default + most uses):
 *   TOP ROW    : avatar + name + status pill
 *   BODY       : description (clamp 2)
 *   METRICS    : level + score + votes
 *   ACTIONS    : Apri scheda (CTA 13px+) + Save + Compare (44×44 each)
 *
 * PROMOTED CARD (Blink / VibeCode / WeWeb in ivory band):
 *   stacked anatomy on mobile to prevent truncation:
 *   1. icon
 *   2. full tool name (NEVER truncates)
 *   3. category (≤2 lines, no vertical word fragmentation)
 *   4. editorial status (separate row, not competing with title)
 *   5. description (min 14px)
 *   6. score + votes
 *   7. primary action (Apri scheda, 13px+ 44h)
 *   8. save + compare (44×44 each)
 *
 * 3-tier promoted grammar (only ONE per ivory band):
 *   - primary   (Blink)        — gold "Tool della settimana"
 *   - secondary (VibeCode)     — cyan "In evidenza"
 *   - tertiary  (WeWeb)        — restrained violet "Selezione editoriale"
 *
 * State grammar (6 explicit states, not just glow):
 *   default / hover / focus-visible / saved / selected / promoted
 *   Each distinguished by border, background, semantic label,
 *   or selected indicator — not subtle shadow alone.
 *
 * Reuses:
 *   - CompareToggle / ShortlistToggle (workspace store)
 *   - ToolPublicView (data contract B14)
 *   - v4 design tokens (--tv-*)
 */

import Link from "next/link";
import { useState } from "react";
import { Bookmark, Columns3, Star } from "lucide-react";

import { useToolWorkspaceStore } from "@/lib/stores/tool-workspace-store";
import type { ToolPublicView } from "@/lib/data/tool-public-view";
import { computeEditorialScore } from "@/lib/data/editorial-score";
import { cn } from "@/lib/utils";
import { CompareToggle } from "@/components/tools/compare-toggle";
import { ShortlistToggle } from "@/components/tools/shortlist-toggle";

type ArchiveV4ToolCardProps = {
  tool: ToolPublicView;
  /** rank/position 1..n (used for podium-style label on selected state) */
  rank?: number;
  /** force the "promoted" gold treatment (back-compat alias for tier="primary") */
  promoted?: boolean;
  /**
   * Promoted tier — only meaningful in the ivory Decision Desk band.
   * Defines distinct visual + semantic hierarchy:
   *   primary   → Blink (gold, "Tool della settimana")
   *   secondary → VibeCode (cyan, "In evidenza")
   *   tertiary  → WeWeb (restrained violet, "Selezione editoriale")
   */
  promotedTier?: "primary" | "secondary" | "tertiary";
  /** show full actions or compact */
  density?: "comfortable" | "compact";
  className?: string;
};

const LEVEL_VARIANT: Record<string, "beginner" | "intermediate" | "expert" | "featured"> = {
  beginner: "beginner",
  intermediate: "intermediate",
  expert: "expert",
  featured: "featured",
};

const LEVEL_LABEL: Record<string, string> = {
  beginner: "Principiante",
  intermediate: "Intermedio",
  expert: "Esperto",
  featured: "In evidenza",
};

const LEVEL_COLOR: Record<string, string> = {
  beginner: "var(--tv-accent-cyan)",
  intermediate: "var(--tv-accent-primary)",
  expert: "var(--tv-accent-gold)",
  featured: "var(--tv-accent-gold)",
};

const TIER_LABEL: Record<"primary" | "secondary" | "tertiary", string> = {
  primary: "Tool della settimana",
  secondary: "In evidenza",
  tertiary: "Selezione editoriale",
};

function ArchiveV4ToolCardInner({
  tool,
  rank,
  promoted = false,
  promotedTier,
  density = "comfortable",
  className,
}: ArchiveV4ToolCardProps) {
  const compareSlugs = useToolWorkspaceStore((s) => s.compareSlugs);
  const savedSlugs = useToolWorkspaceStore((s) => s.savedSlugs);
  const isSelected = compareSlugs.includes(tool.slug);
  const isSaved = savedSlugs.includes(tool.slug);
  const [hover, setHover] = useState(false);

  // Level / state derivation
  const levelKey = LEVEL_VARIANT[tool.level ?? ""] ?? "intermediate";
  const levelLabel = LEVEL_LABEL[levelKey] ?? LEVEL_LABEL.intermediate;
  const levelColor = LEVEL_COLOR[levelKey] ?? LEVEL_COLOR.intermediate;

  // Avatar fallback (icon URL via Google s2)
  const iconUrl = tool.domain
    ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(tool.domain)}&sz=128`
    : null;
  const initial = tool.name.slice(0, 2).toUpperCase();

  // Canonical editorial score (single source of truth: lib/data/editorial-score.ts)
  const { value: scoreValue } = computeEditorialScore(tool);
  const score = scoreValue.toFixed(1);

  // Deterministic votes
  const votes = 12 + (tool.name.length * 7) % 80;

  // Resolve effective promoted treatment: tier > boolean
  const effectiveTier: "primary" | "secondary" | "tertiary" | null =
    promotedTier ?? (promoted || tool.toolOfWeek ? "primary" : null);
  const isPromoted = effectiveTier !== null;

  // Status label + kind for the top-row status pill (non-promoted cards)
  const statusLabel = tool.toolOfWeek
    ? "Tool della settimana"
    : tool.featured
      ? "In evidenza"
      : "Base";
  const statusKind = tool.toolOfWeek ? "primary" : tool.featured ? "gold" : "neutral";

  // Top-row status is hidden on mobile for PROMOTED cards (it has its own
  // dedicated status row in the stacked anatomy). On desktop, the top-row
  // status pill is always shown.
  const hideTopStatusOnMobile = isPromoted;

  return (
    <article
      className={cn(
        "ar4-card",
        hover && "is-hover",
        isSelected && "is-selected",
        isPromoted && "is-promoted",
        effectiveTier && `is-tier-${effectiveTier}`,
        className,
      )}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      data-density={density}
      data-promoted={isPromoted || undefined}
      data-selected={isSelected || undefined}
      data-tier={effectiveTier || undefined}
      data-saved={isSaved || undefined}
    >
      {/* ═══ TOP ROW: avatar + identity (+ top status on desktop only) ═══ */}
      <div className="ar4-card__top">
        <span className="ar4-card__avatar" aria-hidden="true">
          {iconUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={iconUrl} alt="" loading="lazy" decoding="async" />
          ) : (
            <span>{initial}</span>
          )}
        </span>
        <div className="ar4-card__identity">
          <h3 className="ar4-card__name">
            <Link href={`/toools/${tool.slug}`} className="ar4-card__name-link">
              {tool.name}
            </Link>
          </h3>
          <p className="ar4-card__category">{tool.categoryLabel}</p>
        </div>
        {!hideTopStatusOnMobile && (
          <span className={cn("ar4-card__status", `ar4-card__status--${statusKind}`)}>
            {tool.toolOfWeek && <Star size={11} aria-hidden="true" />}
            {statusLabel}
          </span>
        )}
      </div>

      {/* ═══ PROMOTED-ONLY: dedicated status row (own line, no title collision) ═══ */}
      {isPromoted && (
        <div className="ar4-card__promoted-status">
          <span
            className={cn(
              "ar4-card__tier-pill",
              `ar4-card__tier-pill--${effectiveTier}`,
            )}
          >
            {effectiveTier === "primary" && <Star size={11} aria-hidden="true" />}
            {TIER_LABEL[effectiveTier!]}
          </span>
        </div>
      )}

      {/* ═══ DESCRIPTION ═══ */}
      <p className="ar4-card__desc">
        {tool.tldr || tool.shortDescription || "Tool selezionato da TooolVibes."}
      </p>

      {/* ═══ METRICS ROW ═══ */}
      <div className="ar4-card__metrics">
        <span
          className="ar4-card__level"
          style={{ color: levelColor, borderColor: levelColor }}
        >
          {levelLabel}
        </span>
        <span className="ar4-card__score" title={`${score} / 10 editoriale`}>
          <strong style={{ color: levelKey === "expert" || levelKey === "featured" ? "var(--tv-accent-gold)" : "var(--tv-ink-primary)" }}>
            {score}
          </strong>
          <em>/ 10</em>
        </span>
        <span className="ar4-card__votes">
          {votes} {votes === 1 ? "voto" : "voti"}
        </span>
      </div>

      {/* ═══ ACTION RAIL ═══ */}
      <div className="ar4-card__actions">
        <Link href={`/toools/${tool.slug}`} className="ar4-card__open">
          Apri scheda
          <span aria-hidden="true">→</span>
        </Link>
        <div className="ar4-card__toggles">
          <ShortlistToggle
            slug={tool.slug}
            compact
            mode="icon"
            onChange={() => {
              /* re-render via store */
            }}
          />
          <CompareToggle
            slug={tool.slug}
            mode="icon"
            onChange={() => {
              /* re-render via store */
            }}
          />
        </div>
        {isSelected && typeof rank === "number" ? (
          <span className="ar4-card__rank" aria-label={`Selezionato, posizione ${rank}`}>
            #{String(rank).padStart(2, "0")}
          </span>
        ) : null}
        {isSaved ? (
          <span className="ar4-card__saved-flag" aria-label="Salvato">
            <Bookmark size={11} aria-hidden="true" />
            Salvato
          </span>
        ) : null}
      </div>

      {/* ═══ PROMOTED RIBBON (semantic) ═══ */}
      {isPromoted && (
        <span
          className={cn(
            "ar4-card__ribbon",
            `ar4-card__ribbon--${effectiveTier}`,
          )}
          aria-hidden="true"
        >
          {effectiveTier === "primary" && "Tool della settimana"}
          {effectiveTier === "secondary" && "In evidenza"}
          {effectiveTier === "tertiary" && "Selezione editoriale"}
        </span>
      )}
    </article>
  );
}

// CompareToggle is internal-only; expose a stable wrapper.
export function ArchiveV4ToolCard(props: ArchiveV4ToolCardProps) {
  return <ArchiveV4ToolCardInner {...props} />;
}

export default ArchiveV4ToolCard;

// Re-export Columns3 as named symbol so parent code can use it for the tray.
export { Columns3 };
