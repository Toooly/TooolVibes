"use client";

/**
 * TooolVibes — Archive V4 Tool Card (CATALOG V2, 2026-08-03)
 *
 * V2 contract:
 *  - Editorial badge "Selezione della redazione" only when toolOfWeek
 *  - Sponsored badge "Contenuto sponsorizzato" + disclosure when affiliateUrl
 *  - Generic pills ("Segnalato", "In vetrina", "In evidenza", "Base") REMOVED
 *  - Description fallback: "Scheda in preparazione."
 *  - CTA aria-label: "Apri la scheda di [Tool]"
 *  - Save / Compare aria-labels are tool-specific (V2 contract)
 *  - Mobile-first, no truncation
 *  - Decision Desk band removed from catalog — promoted tier prop kept
 *    optional for other surfaces (homepage, compare page, etc.)
 */

import Link from "next/link";
import { type MouseEvent, useState } from "react";
import { Bookmark, Star } from "lucide-react";

import {
  WorkspacePersonalStatusBadge,
  isHeartRedundantPersonalStatus,
  usePersonalToolStatus,
} from "@/components/account/workspace/workspace-personal-status";
import { useToolWorkspaceStore } from "@/lib/stores/tool-workspace-store";
import type { ToolPublicView } from "@/lib/data/tool-public-view";
import { computeEditorialScore } from "@/lib/data/editorial-score";
import { cn } from "@/lib/utils";
import { CompareToggle } from "@/components/tools/compare-toggle";
import { SaveOverflow } from "@/components/tools/save-overflow";

type ArchiveV4ToolCardProps = {
  tool: ToolPublicView;
  /** rank/position 1..n (used for podium-style label on selected state) */
  rank?: number;
  /** Force the promoted gold treatment (back-compat alias for tier="primary"). */
  promoted?: boolean;
  /**
   * Optional promoted tier — only meaningful outside the catalog
   * (Decision Desk, homepage spotlight). The catalog grid never passes a tier.
   */
  promotedTier?: "primary" | "secondary" | "tertiary";
  /** Density for the action rail. */
  density?: "comfortable" | "compact";
  /** Reduced rendering: hide metrics row, ribbon, and secondary metadata. */
  reduced?: boolean;
  className?: string;
};

const TIER_LABEL: Record<"primary" | "secondary" | "tertiary", string> = {
  primary: "In evidenza",
  secondary: "In vetrina",
  tertiary: "Selezione TooolVibes",
};

function ArchiveV4ToolCard({
  tool,
  rank,
  promoted = false,
  promotedTier,
  density = "comfortable",
  reduced = false,
  className,
}: ArchiveV4ToolCardProps) {
  const compareSlugs = useToolWorkspaceStore((s) => s.compareSlugs);
  const savedSlugs = useToolWorkspaceStore((s) => s.savedSlugs);
  const toggleSaved = useToolWorkspaceStore((s) => s.toggleSaved);
  const isSelected = compareSlugs.includes(tool.slug);
  const isSaved = savedSlugs.includes(tool.slug);
  const personalStatus = usePersonalToolStatus(tool.slug);
  const personalWord =
    personalStatus && !isHeartRedundantPersonalStatus(personalStatus.key)
      ? personalStatus
      : null;
  const showRank = isSelected && typeof rank === "number" && !personalWord;
  const [hover, setHover] = useState(false);

  // iOS Safari can miss hit-testing the stretched ::after card link, so the
  // whole card must still activate. Keep the anchor for semantics/SEO and, when
  // the tap did not already land on the link or on an in-card control
  // (save / compare / overflow), forward it to that anchor.
  const handleCardActivate = (event: MouseEvent<HTMLElement>) => {
    if (event.defaultPrevented) return;
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    const target = event.target as HTMLElement | null;
    if (
      target?.closest(
        "a, button, input, select, textarea, [role='button'], [role='link']",
      )
    ) {
      return;
    }
    event.currentTarget
      .querySelector<HTMLAnchorElement>(".ar4-card__name-link")
      ?.click();
  };

  // Avatar fallback (icon URL via Google s2)
  const iconUrl = tool.domain
    ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(tool.domain)}&sz=128`
    : null;
  const initial = tool.name.slice(0, 2).toUpperCase();

  // Resolve effective promoted treatment (only used when caller passes tier)
  const effectiveTier: "primary" | "secondary" | "tertiary" | null =
    promotedTier ?? (promoted || tool.toolOfWeek ? "primary" : null);
  const isPromoted = effectiveTier !== null;

  // V2 badges:
  //  - editorial: "Selezione della redazione" only when toolOfWeek (real)
  //  - sponsored: "Contenuto sponsorizzato" + disclosure when affiliateUrl
  const showEditorialBadge = tool.toolOfWeek;
  const showSponsoredBadge = Boolean(tool.affiliateUrl);
  // Tier-based badge only if the caller passed a tier (preserved for
  // backwards-compat with surfaces that still use a Decision Desk).
  const showTierBadge = isPromoted && promotedTier !== undefined;
  const bestFor = reduced
    ? null
    : (tool.idealUseCase?.trim() || tool.useCases[0] || null);
  const editorialScore = reduced
    ? null
    : computeEditorialScore({ publicTool: tool.publicTool, cautions: tool.cautions });
  const showScore =
    editorialScore?.status === "assessed" && editorialScore.value !== null;
  const scoreLine =
    showScore && editorialScore?.value != null
      ? `★ ${editorialScore.value.toFixed(1)}`
      : null;
  const tierLabel = effectiveTier ? TIER_LABEL[effectiveTier] : null;

  return (
    <article
      className={cn(
        "ar4-card",
        hover && "is-hover",
        isSelected && "is-selected",
        isPromoted && "is-promoted",
        effectiveTier && `is-tier-${effectiveTier}`,
        reduced && "is-reduced",
        showSponsoredBadge && "is-sponsored",
        className,
      )}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={handleCardActivate}
      data-density={density}
      data-promoted={isPromoted || undefined}
      data-selected={isSelected || undefined}
      data-tier={effectiveTier || undefined}
      data-saved={isSaved || undefined}
      data-reduced={reduced || undefined}
      data-sponsored={showSponsoredBadge || undefined}
    >
      {/* ═══ TOP ROW: avatar + identity ═══ */}
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
            <Link
              href={`/toools/${tool.slug}`}
              prefetch={false}
              className="ar4-card__name-link"
              aria-label={`Apri la scheda di ${tool.name}`}
            >
              <span className="ar4-card__name-text">{tool.name}</span>
            </Link>
          </h3>
          <p className="ar4-card__category">{tool.categoryLabel}</p>
        </div>
        {showEditorialBadge ? (
          <span
            className="ar4-card__status ar4-card__status--editorial"
            aria-label="In evidenza"
          >
            <Star size={11} aria-hidden="true" />
            In evidenza
          </span>
        ) : null}
        {showTierBadge ? (
          <span
            className={cn(
              "ar4-card__status ar4-card__status--tier",
              `ar4-card__status--tier-${effectiveTier}`,
            )}
          >
            {effectiveTier === "primary" ? <Star size={11} aria-hidden="true" /> : null}
            {tierLabel}
          </span>
        ) : null}
        {showSponsoredBadge ? (
          <span
            className="ar4-card__status ar4-card__status--sponsored"
            aria-label="Contenuto sponsorizzato"
          >
            Contenuto sponsorizzato
          </span>
        ) : null}
      </div>

      {/* ═══ DESCRIPTION ═══ */}
      <p className="ar4-card__desc">
        {tool.tldr || tool.shortDescription || "Scheda in preparazione."}
      </p>
      {!reduced && (scoreLine || bestFor) ? (
        <div className="ar4-card__triage">
          {scoreLine ? <span className="ar4-card__score">{scoreLine}</span> : null}
          {bestFor ? <p className="ar4-card__best">Ideale per {bestFor}</p> : null}
        </div>
      ) : null}

      {/* ═══ ACTION RAIL — reserved control cluster (no absolute overlays) ═══ */}
      <div className="ar4-card__actions">
        <div className="ar4-card__control-rail" data-has-rank={showRank ? "true" : undefined}>
          {showRank ? (
            <div className="ar4-card__state-flags" aria-live="polite">
              <span className="ar4-card__rank" aria-label={`Selezionato, posizione ${rank}`}>
                #{String(rank).padStart(2, "0")}
              </span>
            </div>
          ) : (
            <WorkspacePersonalStatusBadge
              slug={tool.slug}
              className="ar4-card__saved-label"
            />
          )}
          <div className="ar4-card__toggles">
            <button
              type="button"
              className="ar4-card__bookmark"
              data-saved={isSaved || undefined}
              aria-pressed={isSaved}
              aria-label={isSaved ? `Rimuovi ${tool.name} dai salvati` : `Salva ${tool.name}`}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                toggleSaved(tool.slug);
              }}
            >
              <Bookmark
                className="ar4-card__bookmark-icon"
                aria-hidden="true"
                fill={isSaved ? "currentColor" : "none"}
              />
              {isSaved ? (
                <span className="ar4-card__bookmark-dot" aria-hidden="true" />
              ) : null}
            </button>
            <span className="ar4-card__toggles-more">
              <SaveOverflow
                slug={tool.slug}
                toolName={tool.name}
                triggerClassName="ar4-card__save-more"
              />
              <CompareToggle
                slug={tool.slug}
                mode="icon"
                toolName={tool.name}
                onChange={() => {
                  /* re-render via store */
                }}
              />
            </span>
          </div>
        </div>
      </div>

      {/* ═══ DISCLOSURE — only when the card carries an affiliate link ═══ */}
      {showSponsoredBadge ? (
        <p className="ar4-card__disclosure">
          Link affiliato: potremmo ricevere una commissione, senza costi
          aggiuntivi per te.
        </p>
      ) : null}
    </article>
  );
}

export { ArchiveV4ToolCard };
export default ArchiveV4ToolCard;
