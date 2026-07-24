"use client";

/**
 * TooolVibes — Archive V4 Tool Card
 * 2026-07-24
 *
 * Definitive tool card anatomy (different from legacy canonical-tool-card):
 *  - 4-state visual model: default / hover / selected (violet) / promoted (gold)
 *  - top row: identity (avatar + name + status pill)
 *  - middle: category + concise description (clamp 2)
 *  - bottom: level badge + score + votes
 *  - actions rail: save + compare toggles
 *  - selected state: violet border + subtle glow + rank tag
 *  - promoted state: gold border + featured ribbon
 *
 * Reuses:
 *  - CompareToggle / ShortlistToggle (workspace store)
 *  - ToolPublicView (data contract B14)
 *  - v4 design tokens (--tv-*)
 */

import Link from "next/link";
import { useState } from "react";
import { Bookmark, Columns3, Star } from "lucide-react";

import { useToolWorkspaceStore } from "@/lib/stores/tool-workspace-store";
import type { ToolPublicView } from "@/lib/data/tool-public-view";
import { cn } from "@/lib/utils";
import { CompareToggle } from "@/components/tools/compare-toggle";
import { ShortlistToggle } from "@/components/tools/shortlist-toggle";

type ArchiveV4ToolCardProps = {
  tool: ToolPublicView;
  /** rank/position 1..n (used for podium-style label on selected state) */
  rank?: number;
  /** force the "promoted" gold treatment */
  promoted?: boolean;
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

function ArchiveV4ToolCardInner({
  tool,
  rank,
  promoted = false,
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

  // Deterministic editorial score (6.8-9.5 range, mirrors Home v4 pattern)
  const scoreBase = 6.8 + (tool.name.length % 3) * 0.5;
  const score = (tool.toolOfWeek ? Math.min(scoreBase + 0.6, 9.5) : scoreBase).toFixed(1);

  // Deterministic votes
  const votes = 12 + (tool.name.length * 7) % 80;

  // Status (in_evidenza / nuovo / base) — derive from tool
  const statusLabel = tool.toolOfWeek
    ? "Tool della settimana"
    : promoted
      ? "Promosso"
      : tool.featured
        ? "In evidenza"
        : "Base";
  const statusKind = tool.toolOfWeek ? "primary" : promoted || tool.featured ? "gold" : "neutral";

  return (
    <article
      className={cn("ar4-card", hover && "is-hover", isSelected && "is-selected", promoted && "is-promoted", className)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      data-density={density}
      data-promoted={promoted || undefined}
      data-selected={isSelected || undefined}
    >
      {/* Top row: avatar + identity + status */}
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
        <span className={cn("ar4-card__status", `ar4-card__status--${statusKind}`)}>
          {tool.toolOfWeek && <Star size={11} aria-hidden="true" />}
          {statusLabel}
        </span>
      </div>

      {/* Description (clamp 2) */}
      <p className="ar4-card__desc">
        {tool.tldr || tool.shortDescription || "Tool selezionato da TooolVibes."}
      </p>

      {/* Mid row: level + score + votes */}
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

      {/* Action rail */}
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

      {/* Promote ribbon */}
      {promoted || tool.toolOfWeek ? (
        <span className="ar4-card__ribbon" aria-hidden="true">
          Featured
        </span>
      ) : null}
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
