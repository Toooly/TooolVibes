"use client";

/**
 * TooolVibes — Archive V4 Tool Card (CATALOG FINAL V2, 2026-10-02)
 *
 * V3 contract:
 *  - Two actions only: Save + Compare. No overflow/third action.
 *  - Card body opens Tool Detail via stretched link.
 *  - Mobile anatomy: TOP (logo + identity), BODY (desc + Ideale per),
 *    FOOTER (score + Save + Compare).
 *  - State semantics: SAVED = luminous perimeter, COMPARE = interior wash +
 *    watermark, FEATURED = gold. These meanings never overlap.
 *  - Save tap fires a one-shot perimeter trace (~650ms) then settles to a
 *    stable thin luminous border.
 *  - Editorial (gold) border is preserved when saved; saved uses an inner
 *    violet trace on editorial cards.
 */

import { Target } from "lucide-react";
import Link from "next/link";
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

const SAVE_TRACE_DURATION_MS = 650;

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
  const [justSaved, setJustSaved] = useState(false);
  const [compareFresh, setCompareFresh] = useState(false);
  const [justUnsaved, setJustUnsaved] = useState(false);
  const [showSaveAck, setShowSaveAck] = useState(false);
  const saveAckTimerRef = useRef<number | null>(null);
  const [justUncompared, setJustUncompared] = useState(false);

  const saveTimerRef = useRef<number | null>(null);
  const compareTimerRef = useRef<number | null>(null);
  const unsaveTimerRef = useRef<number | null>(null);
  const uncompareTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
      if (compareTimerRef.current) window.clearTimeout(compareTimerRef.current);
      if (unsaveTimerRef.current) window.clearTimeout(unsaveTimerRef.current);
      if (saveAckTimerRef.current) window.clearTimeout(saveAckTimerRef.current);
      const ucTimer = uncompareTimerRef.current;
      if (ucTimer) window.clearTimeout(ucTimer);
    };
  }, []);

  const prevSelectedRef = useRef(isSelected);
  useEffect(() => {
    // Clear all animation timers before starting new one
    if (compareTimerRef.current) window.clearTimeout(compareTimerRef.current);
    const ucTimer2 = uncompareTimerRef.current;
    if (ucTimer2) window.clearTimeout(ucTimer2);
    setCompareFresh(false);
    setJustUncompared(false);
    if (isSelected && !prevSelectedRef.current) {
      setCompareFresh(true);
      compareTimerRef.current = window.setTimeout(() => setCompareFresh(false), 400);
    } else if (!isSelected && prevSelectedRef.current) {
      setJustUncompared(true);
      uncompareTimerRef.current = window.setTimeout(() => setJustUncompared(false), 240);
    }
    prevSelectedRef.current = isSelected;
  }, [isSelected]);

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
    // Clear all animation timers before starting new one
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    if (unsaveTimerRef.current) window.clearTimeout(unsaveTimerRef.current);
    setJustSaved(false);
    setJustUnsaved(false);
    if (!wasSaved) {
      setJustSaved(true);
      saveTimerRef.current = window.setTimeout(
        () => setJustSaved(false),
        SAVE_TRACE_DURATION_MS,
      );
      setShowSaveAck(true);
      if (saveAckTimerRef.current) window.clearTimeout(saveAckTimerRef.current);
      saveAckTimerRef.current = window.setTimeout(() => setShowSaveAck(false), 1500);
    } else {
      setJustUnsaved(true);
      unsaveTimerRef.current = window.setTimeout(() => setJustUnsaved(false), 240);
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
        justSaved && "is-save-trace", justUnsaved && "is-unsave-fade",
        compareFresh && "is-compare-fresh", justUncompared && "is-uncompare-fade",
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
    >
      {/* TOP: logo + identity */}
      <div className="ar4-card__top">
        <span className="ar4-card__avatar" aria-hidden="true">
          {iconUrl && !logoFailed ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={iconUrl}
              alt=""
              loading="lazy"
              decoding="async"
              onError={() => setLogoFailed(true)}
            />
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

      {/* BODY: description + Ideale per */}
      <p className="ar4-card__desc">
        {tool.tldr || tool.shortDescription || "Scheda in preparazione."}
      </p>
      {!reduced && bestFor ? (
        <p className="ar4-card__best">
          <span className="ar4-card__best-icon" aria-hidden="true">
            <Target />
          </span>
          <span className="ar4-card__best-label">Ideale per</span>
          <span className="ar4-card__best-text">{bestFor}</span>
        </p>
      ) : null}
      {/* Compare watermark: filled dual-panel, decorative */}
      {isSelected && <div className="ar4-card__watermark" aria-hidden="true" />}

      {/* Enriched density: shows only PUBLIC canonical Tool metadata
          (levelLabel, readingTime, tags). No PII, no private data.
          tv-density cookie is a presentation hint — NOT authorization. */}
      {density === "enriched" && (tool.levelLabel || tool.readingTime || tool.tags.length > 0) && (
        <div className="ar4-card__enriched">
          {(tool.levelLabel || tool.readingTime) && (
            <div className="ar4-card__enriched-meta">
              {tool.levelLabel ? (
                <span className="ar4-card__enriched-label">{tool.levelLabel}</span>
              ) : null}
              {tool.levelLabel && tool.readingTime ? (
                <span className="ar4-card__enriched-sep">·</span>
              ) : null}
              {tool.readingTime ? (
                <span className="ar4-card__enriched-label">{tool.readingTime}</span>
              ) : null}
            </div>
          )}
          {tool.tags.length > 0 && (
            <div className="ar4-card__enriched-tags">
              {tool.tags.slice(0, 2).map((tag) => (
                <span key={tag} className="ar4-card__enriched-chip">{tag}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* FOOTER: score + Save + Compare */}
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
          {!reduced && scoreLine ? (
            <span className="ar4-card__score">{scoreLine}</span>
          ) : null}
          <div className="ar4-card__toggles">
            <button
              type="button"
              className="ar4-card__bookmark"
              data-saved={isSaved || undefined}
              aria-pressed={isSaved}
              aria-label={isSaved ? `Rimuovi ${tool.name} dai salvati` : `Salva ${tool.name}`}
              onClick={handleSave}
            >
              <Bookmark
                className="ar4-card__bookmark-icon"
                aria-hidden="true"
                fill={isSaved ? "currentColor" : "none"}
              />
            </button>
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
        <p className="ar4-card__disclosure">
          Link affiliato: potremmo ricevere una commissione, senza costi
          aggiuntivi per te.
        </p>
      ) : null}
      {/* Save acknowledgement pill */}
      {showSaveAck && (
        <div className="tv-save-ack" role="status" aria-live="polite">
          <svg width="12" height="12" viewBox="0 0 10 14" fill="currentColor" aria-hidden="true">
            <path d="M1 1h8v12l-4-3-4 3z" />
          </svg>
          <span>Salvato</span>
        </div>
      )}
    </article>
  );
}



export { ArchiveV4ToolCard };
export default ArchiveV4ToolCard;
