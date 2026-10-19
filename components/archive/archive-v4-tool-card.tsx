"use client";

import { LocalizedText, LocalizedAttributes } from "@/components/i18n/localized-text";
/** Catalog card: save/compare state stays stable; feedback belongs to the action. */

import { Target } from "lucide-react";
import Link from "@/components/ui/app-link";
import { type MouseEvent, useEffect, useRef, useState } from "react";
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
import { MOTION_DURATION_MS } from "@/lib/motion/tokens";
import { CompareToggle } from "@/components/tools/compare-toggle";
import { useCardReveal } from "@/lib/hooks/use-card-reveal";

type ArchiveV4ToolCardProps = {
  tool: ToolPublicView;
  rank?: number;
  promoted?: boolean;
  promotedTier?: "primary" | "secondary" | "tertiary";
  density?: "compact" | "enriched";
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
  promotedTier,
  density = "compact",
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
  const revealRef = useCardReveal<HTMLElement>(rank && rank <= 6 ? (rank - 1) * 28 : 0);
  const [logoFailed, setLogoFailed] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState(false);
  const saveTimerRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (saveTimerRef.current !== null) window.clearTimeout(saveTimerRef.current);
  }, []);

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

  const handleSave = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const wasSaved = isSaved;
    toggleSaved(tool.slug);
    if (saveTimerRef.current !== null) window.clearTimeout(saveTimerRef.current);
    setSaveFeedback(!wasSaved);
    if (!wasSaved) {
      saveTimerRef.current = window.setTimeout(() => {
        setSaveFeedback(false);
        saveTimerRef.current = null;
      }, MOTION_DURATION_MS.standard);
    }
  };

  const iconUrl = tool.domain
    ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(tool.domain)}&sz=128`
    : null;
  const initial = tool.name.slice(0, 2).toUpperCase();

  // Metallic tier is resolved solely from canonical podium position
  // (resolvePodiumTiers). No tool identity or flag fallback.
  const effectiveTier: "primary" | "secondary" | "tertiary" | null =
    promotedTier ?? null;
  const isPromoted = effectiveTier !== null;

  const showEditorialBadge = tool.toolOfWeek;
  const showSponsoredBadge = Boolean(tool.affiliateUrl);
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
      ref={revealRef}
      className={cn(
        "ar4-card",
        isSelected && "is-selected",
        isPromoted && "is-promoted",
        effectiveTier && `is-tier-${effectiveTier}`,
        reduced && "is-reduced",
        showSponsoredBadge && "is-sponsored",
        className,
      )}
      onClick={handleCardActivate}
      data-density={density}
      data-rank-label={effectiveTier === "primary" ? "01" : effectiveTier === "secondary" ? "02" : effectiveTier === "tertiary" ? "03" : undefined}
      data-promoted={isPromoted || undefined}
      data-selected={isSelected || undefined}
      data-tier={effectiveTier || undefined}
      data-saved={isSaved || undefined}
      data-reduced={reduced || undefined}
      data-sponsored={showSponsoredBadge || undefined}
      data-qa-saved={isSaved ? "true" : "false"}
      data-qa-compared={isSelected ? "true" : "false"}
      data-qa-tier={effectiveTier === "primary" ? "gold" : effectiveTier === "secondary" ? "silver" : effectiveTier === "tertiary" ? "bronze" : "none"}
    >
      {/* STATE LAYERS: explicit decorative layers (aria-hidden, pointer-events:none) */}
      <div className="ar4-card__save-layer" aria-hidden="true" />
      <div className="ar4-card__compare-layer" aria-hidden="true" />
      <div className="ar4-card__state-hotspots" aria-hidden="true" />

      {/* 1. IDENTITY: logo + name + category + badges */}
      <div className="ar4-card__top">
        <span className="ar4-card__avatar" aria-hidden="true">
          {iconUrl && !logoFailed ? (
            // eslint-disable-next-line @next/next/no-img-element
            <LocalizedAttributes><img
              src={iconUrl}
              alt=""
              loading="lazy"
              decoding="async"
              onError={() => setLogoFailed(true)}
            /></LocalizedAttributes>
          ) : (
            <span><LocalizedText>{initial}</LocalizedText></span>
          )}
        </span>
        <div className="ar4-card__identity">
          <h3 className="ar4-card__name">
            <LocalizedAttributes><Link
              href={`/toools/${tool.slug}`}
              prefetch={false}
              className="ar4-card__name-link"
              aria-label={`Apri la scheda di ${tool.name}`}
            >
              <span className="ar4-card__name-text">{tool.name}</span>
            </Link></LocalizedAttributes>
          </h3>
          <p className="ar4-card__category"><LocalizedText>{tool.categoryLabel}</LocalizedText></p>
        </div>
        <div className="ar4-card__badges">
        {showEditorialBadge ? (
          <LocalizedAttributes><span
            className="ar4-card__status ar4-card__status--editorial"
            aria-label="Scelta della redazione"
          >
            <Star size={11} aria-hidden="true" /><LocalizedText>{"Scelta della redazione "}</LocalizedText></span></LocalizedAttributes>
        ) : null}
        {showTierBadge ? (
          <span
            className={cn(
              "ar4-card__status ar4-card__status--tier",
              `ar4-card__status--tier-${effectiveTier}`,
            )}
          >
            {effectiveTier === "primary" ? <Star size={11} aria-hidden="true" /> : null}
            <LocalizedText>{tierLabel}</LocalizedText>
          </span>
        ) : null}
        {showSponsoredBadge ? (
          <LocalizedAttributes><span
            className="ar4-card__status ar4-card__status--sponsored"
            aria-label="Contenuto sponsorizzato"
          ><LocalizedText>{"Contenuto sponsorizzato "}</LocalizedText></span></LocalizedAttributes>
        ) : null}
        </div>
      </div>

      {/* 2. DESCRIPTION: 2-line editorial block */}
      <p className="ar4-card__desc">
        <LocalizedText>{tool.tldr || tool.shortDescription || "Scheda in preparazione."}</LocalizedText>
      </p>
      {!reduced && bestFor ? (
        <p className="ar4-card__best">
          <span className="ar4-card__best-icon" aria-hidden="true">
            <Target />
          </span>
          <span>
            <span className="ar4-card__best-label"><LocalizedText>{"Ideale per"}</LocalizedText></span><LocalizedText>{" "}</LocalizedText>
            <span className="ar4-card__best-text"><LocalizedText>{bestFor}</LocalizedText></span>
          </span>
        </p>
      ) : null}
      {/* Compare watermark: filled dual-panel, decorative */}
      <div className="ar4-card__watermark" aria-hidden="true" />

      {/* 4. ENRICHED DECISION META: level · reading time · tags (compact rail) */}
      {density === "enriched" && (tool.levelLabel || tool.readingTime || tool.tags.length > 0) && (
        <div className="ar4-card__enriched">
          <div className="ar4-card__enriched-rail">
            {tool.levelLabel ? (
              <span className="ar4-card__enriched-label"><LocalizedText>{tool.levelLabel}</LocalizedText></span>
            ) : null}
            {tool.levelLabel && tool.readingTime ? (
              <span className="ar4-card__enriched-sep">·</span>
            ) : null}
            {tool.readingTime ? (
              <span className="ar4-card__enriched-label"><LocalizedText>{tool.readingTime}</LocalizedText></span>
            ) : null}
            {tool.tags.slice(0, 2).map((tag) => (
              <span key={tag} className="ar4-card__enriched-chip"><LocalizedText>{tag}</LocalizedText></span>
            ))}
          </div>
        </div>
      )}

      {/* 5. FINAL ROW: score left + Save + Compare right */}
      <div className="ar4-card__actions">
        <div className="ar4-card__control-rail" data-has-rank={showRank ? "true" : undefined}>
          {showRank ? (
            <div className="ar4-card__state-flags" aria-live="polite">
              <LocalizedAttributes><span className="ar4-card__rank" aria-label={`Selezionato, posizione ${rank}`}>
                #<LocalizedText>{String(rank).padStart(2, "0")}</LocalizedText>
              </span></LocalizedAttributes>
            </div>
          ) : (
            <WorkspacePersonalStatusBadge
              slug={tool.slug}
              className="ar4-card__saved-label"
            />
          )}
          {!reduced && scoreLine ? (
            <span className="ar4-card__score"><LocalizedText>{scoreLine}</LocalizedText></span>
          ) : null}
          <div className="ar4-card__toggles">
            <LocalizedAttributes><button
              type="button"
              className="ar4-card__bookmark"
              data-saved={isSaved || undefined}
              data-save-feedback={isSaved && saveFeedback ? "added" : undefined}
              aria-pressed={isSaved}
              aria-label={isSaved ? `Rimuovi ${tool.name} dai salvati` : `Salva ${tool.name}`}
              onClick={handleSave}
            >
              <Bookmark
                className="ar4-card__bookmark-icon tool-action__icon"
                aria-hidden="true"
                fill={isSaved ? "currentColor" : "none"}
              />
            </button></LocalizedAttributes>
            <CompareToggle
              slug={tool.slug}
              mode="icon"
              toolName={tool.name}
            />
          </div>
        </div>
      </div>

      {/* DISCLOSURE */}
      {showSponsoredBadge ? (
        <p className="ar4-card__disclosure"><LocalizedText>{"Link affiliato: potremmo ricevere una commissione, senza costi aggiuntivi per te. "}</LocalizedText></p>
      ) : null}
      {saveFeedback && isSaved ? (
        <span className="sr-only" role="status"><LocalizedText>Salvato</LocalizedText></span>
      ) : null}
    </article>
  );
}



export { ArchiveV4ToolCard };
export default ArchiveV4ToolCard;
