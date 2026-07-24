"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

import { DirectoryToolGlyph } from "@/components/directory/directory-tool-glyph";
import { CompareToggle } from "@/components/tools/compare-toggle";
import { ShortlistToggle } from "@/components/tools/shortlist-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { DirectoryTool } from "@/lib/data/tooolvibes-directory";
import type { ToolPublicView } from "@/lib/data/tool-public-view";
import { useToolWorkspaceStore } from "@/lib/stores/tool-workspace-store";
import { cn, formatItalianDate } from "@/lib/utils";

/* ═══════════════════════════════════════════════════════════════
   CanonicalToolCard — ToolCard responsive canonica (B24 / DS-306).

   Un'unica API (`tool` + `density`) rende grid/list/mobile senza
   perdere informazioni: ogni densità decide solo la disposizione,
   i dati arrivano dallo stesso modello pubblico condiviso
   (DirectoryTool | ToolPublicView, contratto B14).

   La card compone le primitive canoniche B23 (Card/Badge/Button)
   e i token `--tv-*`; le azioni save/compare sono i toggle
   condivisi esistenti sul workspace store (ShortlistToggle /
   CompareToggle), mai logica duplicata. Il glyph con fallback
   iniziali copre il caso missing logo.

   Adapter ufficiali: DirectoryToolCard (density="grid") e
   MobileToolCard (density="mobile") — export e props invariati,
   reversibilità affidata a git revert.
   ═══════════════════════════════════════════════════════════════ */

export type CanonicalToolCardTool = DirectoryTool | ToolPublicView;
/* "mobile-list" (B38 / MOB-702): card list per la colonna singola
   sotto soglia — information priority title → use case → CTA con
   copy utile estesa (clamp 3) e action rail protetta nel footer. */
export type CanonicalToolCardDensity = "grid" | "list" | "mobile" | "mobile-list";

export type CanonicalToolCardProps = {
  tool: CanonicalToolCardTool;
  /** Layout/densità responsive: grid (default), list, mobile. */
  density?: CanonicalToolCardDensity;
  /** Enfasi visiva sul glyph (es. prima card di un carosello). */
  priority?: boolean;
  /** Override dello slot azioni (default: toggle save/compare condivisi). */
  actions?: ReactNode;
  /** false nasconde lo slot azioni (default: true). */
  showActions?: boolean;
  className?: string;
};

type LevelBadgeVariant = "neutral" | "accent" | "success" | "info";

function getLevelBadgeVariant(level: string | null): LevelBadgeVariant {
  if (level === "featured") return "accent";
  if (level === "beginner") return "success";
  if (level === "expert") return "info";
  return "neutral";
}

/* Score derivato per la Score badge del card: tiene conto di
   level + featured + toolOfWeek. Il numero e' una visualizzazione
   editoriale fissa (4.5-9.5) coerente con i mockup; non e' una
   metrica di qualita' reale. */
function getCardScore(
  level: string | null | undefined,
  featured: boolean | undefined,
  toolOfWeek: boolean | undefined,
): { value: number; label: string } {
  let base = 7.4;
  if (level === "featured") base = 8.8;
  else if (level === "expert") base = 8.2;
  else if (level === "intermediate") base = 7.6;
  else if (level === "beginner") base = 6.8;
  if (featured) base = Math.min(base + 0.4, 9.5);
  if (toolOfWeek) base = Math.min(base + 0.3, 9.5);
  const rounded = Math.round(base * 10) / 10;
  const label =
    rounded >= 9.0 ? "Ottimo" : rounded >= 8.0 ? "Solido" : rounded >= 7.0 ? "Buono" : "Base";
  return { value: rounded, label };
}

/* Contratto tipografico B21: mai sotto 12px (--tv-text-xs), tracking
   uppercase solo per label corte (0.08em) o eyebrow (max 0.14em). */
const eyebrowClass =
  "text-[length:var(--tv-text-xs)] font-semibold uppercase tracking-[var(--tv-tracking-label)]";
const panelClass =
  "rounded-[var(--tv-radius-feature)] border border-[var(--tv-border-subtle)] bg-[var(--tv-surface-elevated)]";
const panelLabelClass = `${eyebrowClass} text-[var(--tv-ink-muted-aa)]`;
const panelTextClass =
  "mt-2 break-words text-[length:var(--tv-text-sm)] leading-[var(--tv-leading-body)] text-[var(--tv-ink-primary)]";
const focusRingClass =
  "rounded-[var(--tv-radius-sm)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--tv-focus-ring)]";

export function CanonicalToolCard({
  tool,
  density = "grid",
  priority = false,
  actions,
  showActions = true,
  className,
}: CanonicalToolCardProps) {
  const isSaved = useToolWorkspaceStore((state) =>
    state.savedSlugs.includes(tool.slug),
  );
  const isCompared = useToolWorkspaceStore((state) =>
    state.compareSlugs.includes(tool.slug),
  );

  const profileHref = `/toools/${tool.slug}`;
  const levelLabel = tool.levelLabel ?? null;
  const levelVariant = getLevelBadgeVariant(tool.level ?? null);
  const description = tool.shortDescription || tool.tldr || "";
  const tldr = tool.tldr || tool.shortDescription || "";
  const whatItDoes = tool.whatItDoes || "";
  const editorialReview = tool.editorialReview ?? "";
  const whyItMatters = tool.whyItMatters ?? "";
  const highlights = tool.highlights.slice(0, 3);
  const tags = tool.tags.slice(0, 3);
  const publishedLabel = tool.publishedAt
    ? `Aggiornato ${formatItalianDate(tool.publishedAt)}`
    : "Data non disponibile";
  const cardScore = getCardScore(tool.level, tool.featured, tool.toolOfWeek);
  const isFeatured = Boolean(tool.toolOfWeek || tool.featured);

  const actionNode = actions ?? (
    <>
      <ShortlistToggle slug={tool.slug} mode="compact" />
      <CompareToggle slug={tool.slug} compact />
    </>
  );

  const badges = (
    <>
      {tool.toolOfWeek ? <Badge variant="warning">Tool della settimana</Badge> : null}
      {levelLabel ? <Badge variant={levelVariant}>{levelLabel}</Badge> : null}
    </>
  );

  const glyph = (
    <DirectoryToolGlyph
      tool={tool}
      size={density === "mobile" || density === "mobile-list" ? "md" : "lg"}
      className={priority ? "shadow-[0_16px_30px_rgba(92,60,255,0.18)]" : ""}
    />
  );

  const tagBadges = tags.length > 0 ? (
    <div
      data-slot="tool-card-tags"
      className="flex flex-wrap content-start gap-1.5 sm:min-h-[3rem] sm:gap-2"
    >
      {tags.map((tag) => (
        <Badge
          key={tag}
          variant="outline"
          render={<Link href={`/archivio?tag=${encodeURIComponent(tag)}`} />}
          className="h-auto px-2.5 py-1 uppercase tracking-[var(--tv-tracking-label)] sm:px-3"
        >
          {tag}
        </Badge>
      ))}
    </div>
  ) : null;

  const highlightBadges = highlights.length > 0 ? (
    <div
      data-slot="tool-card-highlights"
      className="flex flex-wrap content-start gap-1.5 sm:gap-2"
    >
      {highlights.map((item) => (
        <Badge
          key={item}
          variant="neutral"
          className="h-auto whitespace-normal px-2.5 py-1 text-left sm:px-3"
        >
          {item}
        </Badge>
      ))}
    </div>
  ) : null;

  const metaPanel = (
    <div
      data-slot="tool-card-meta"
      className={cn(panelClass, "grid grid-cols-2 gap-3 px-4 py-3")}
    >
      <div className="min-w-0">
        <p className={panelLabelClass}>Livello</p>
        <p className={cn(panelTextClass, "font-semibold")}>
          {levelLabel ?? "Non specificato"}
        </p>
      </div>
      <div className="min-w-0">
        <p className={panelLabelClass}>Fonte</p>
        <p className={cn(panelTextClass, "truncate font-semibold")}>{tool.domain}</p>
      </div>
    </div>
  );

  const insightSections =
    tldr || whatItDoes || editorialReview ? (
      <>
        {tldr ? (
          <section data-slot="tool-card-section" className={cn(panelClass, "p-4")}>
            <h4 className={panelLabelClass}>In breve</h4>
            <p className={cn(panelTextClass, "line-clamp-2")}>{tldr}</p>
          </section>
        ) : null}
        {whatItDoes || editorialReview ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {whatItDoes ? (
              <section data-slot="tool-card-section" className={cn(panelClass, "p-3.5")}>
                <h4 className={panelLabelClass}>Cosa fa</h4>
                <p className={cn(panelTextClass, "line-clamp-3")}>{whatItDoes}</p>
              </section>
            ) : null}
            {editorialReview ? (
              <section data-slot="tool-card-section" className={cn(panelClass, "p-3.5")}>
                <h4 className={panelLabelClass}>Lettura rapida</h4>
                <p className={cn(panelTextClass, "line-clamp-3")}>{editorialReview}</p>
              </section>
            ) : null}
          </div>
        ) : null}
      </>
    ) : null;

  const ctaRow = (
    <div data-slot="tool-card-cta" className="grid gap-2 sm:grid-cols-2">
      <Button
        size="sm"
        render={<a href={tool.url} target="_blank" rel="noopener noreferrer" />}
      >
        {tool.ctaLabel ?? "Apri il sito"}
        <ArrowRight aria-hidden="true" className="size-3.5" />
      </Button>
      <Button variant="secondary" size="sm" render={<Link href={profileHref} />}>
        Scopri di più
      </Button>
    </div>
  );

  const dateLabel = (
    <p className={cn(eyebrowClass, "text-[var(--muted-strong)]")}>{publishedLabel}</p>
  );

  const stateProps = {
    "data-density": density,
    "data-saved": isSaved ? "" : undefined,
    "data-compared": isCompared ? "" : undefined,
  } as const;

  const rootClass = cn(
    "gap-0 py-0 shadow-[var(--tv-elevation-rest)] ring-[var(--tv-border-subtle)] transition-shadow duration-[var(--tv-motion-base)] hover:shadow-[var(--tv-elevation-raised)]",
    density === "grid" &&
      "h-full min-h-[21rem] rounded-[var(--tv-radius-feature)] sm:min-h-[30rem]",
    density === "list" && "h-full rounded-[var(--tv-radius-feature)]",
    (density === "mobile" || density === "mobile-list") &&
      "rounded-[var(--tv-radius-lg)]",
    className,
  );

  if (density === "grid") {
    return (
      <Card role="article" aria-label={tool.name} {...stateProps} className={rootClass}>
        <div
          data-slot="tool-card-media"
          className="relative border-b border-[var(--line)] p-4 sm:p-6"
          style={{
            background: `radial-gradient(circle at top right, ${tool.accentFrom ?? "#6a3cff"}33, transparent 38%), radial-gradient(circle at bottom left, ${tool.accentTo ?? "#43c6ff"}24, transparent 36%), linear-gradient(180deg, color-mix(in srgb, var(--tv-surface-raised) 96%, ${tool.accentFrom ?? "#6a3cff"}10) 0%, color-mix(in srgb, var(--tv-surface-elevated) 96%, ${tool.accentTo ?? "#43c6ff"}08) 100%)`,
          }}
        >
          <div
            data-slot="tool-card-score"
            className={cn(
              "absolute right-3 top-3 z-10 flex items-center gap-1.5 rounded-full border px-2.5 py-1 sm:right-4 sm:top-4",
              "border-[var(--tv-accent-gold)]/40 bg-[var(--tv-bg-base)]/90 backdrop-blur-sm",
              "text-[var(--tv-ink-primary)]",
            )}
            aria-label={`Punteggio editoriale ${cardScore.value} su 10, ${cardScore.label}`}
          >
            <span
              className="font-[family-name:var(--tv-font-family-display)] text-sm font-black leading-none text-[var(--tv-accent-gold)] sm:text-base"
              aria-hidden="true"
            >
              {cardScore.value.toFixed(1)}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--tv-ink-muted-aa)] sm:text-[11px]">
              {cardScore.label}
            </span>
          </div>
          <div className="flex items-start gap-3">
            {glyph}
            <div className="min-w-0 flex-1 pr-12">
              <div
                data-slot="tool-card-badges"
                className="flex min-h-[1.7rem] flex-wrap items-center gap-1.5 sm:min-h-[2rem] sm:gap-2"
              >
                {isFeatured ? (
                  <span
                    data-slot="tool-card-featured-pill"
                    className="inline-flex items-center gap-1 rounded-full border border-[var(--tv-accent-primary)]/40 bg-[var(--tv-accent-primary)]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--tv-accent-primary)] sm:text-[11px]"
                  >
                    <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[var(--tv-accent-primary)]" />
                    In evidenza
                  </span>
                ) : (
                  badges
                )}
              </div>
              <div className="mt-2 min-h-[3.8rem] sm:mt-3 sm:min-h-[4.7rem]">
                <h3
                  data-slot="tool-card-title"
                  className="text-display-card text-[length:var(--tv-text-lg)] font-semibold leading-[var(--tv-leading-heading)] break-words text-card-foreground sm:text-[length:var(--tv-text-xl)]"
                >
                  {tool.name}
                </h3>
                <p
                  className={cn(
                    eyebrowClass,
                    "mt-1.5 tracking-[var(--tv-tracking-eyebrow)] text-[var(--muted-strong)] sm:mt-2",
                  )}
                >
                  {tool.categoryLabel}
                </p>
              </div>
            </div>
          </div>
          {highlightBadges ? (
            <div className="mt-4 min-h-[2.4rem] sm:mt-5 sm:min-h-[3.1rem]">
              {highlightBadges}
            </div>
          ) : null}
        </div>

        <CardContent
          data-slot="tool-card-body"
          className="flex flex-1 flex-col gap-4 p-4 sm:gap-5 sm:p-6"
        >
          {metaPanel}
          {insightSections}
          {tagBadges}
        </CardContent>

        <div
          data-slot="tool-card-footer"
          className="space-y-3 px-4 pb-4 sm:space-y-4 sm:px-6 sm:pb-6"
        >
          {whyItMatters ? (
            <p className="line-clamp-2 break-words text-[length:var(--tv-text-sm)] leading-[var(--tv-leading-body)] text-card-foreground">
              {whyItMatters}
            </p>
          ) : null}
          {ctaRow}
          <div className="flex flex-wrap items-center justify-between gap-2">
            {showActions ? (
              <div data-slot="tool-card-actions" className="flex flex-wrap items-center gap-2">
                {actionNode}
              </div>
            ) : null}
            {dateLabel}
          </div>
        </div>
      </Card>
    );
  }

  if (density === "list") {
    return (
      <Card role="article" aria-label={tool.name} {...stateProps} className={rootClass}>
        <div className="flex h-full flex-col gap-4 p-4 sm:p-5 md:flex-row md:gap-6">
          <div className="flex min-w-0 items-start gap-3 md:w-64 md:shrink-0">
            {glyph}
            <div className="min-w-0 flex-1">
              <div
                data-slot="tool-card-badges"
                className="flex flex-wrap items-center gap-1.5 sm:gap-2"
              >
                {badges}
              </div>
              <h3
                data-slot="tool-card-title"
                className="text-display-card mt-2 text-[length:var(--tv-text-lg)] font-semibold leading-[var(--tv-leading-heading)] break-words text-card-foreground"
              >
                <Link href={profileHref} className={focusRingClass}>
                  {tool.name}
                </Link>
              </h3>
              <p
                className={cn(
                  eyebrowClass,
                  "mt-1.5 tracking-[var(--tv-tracking-eyebrow)] text-[var(--muted-strong)]",
                )}
              >
                {tool.categoryLabel}
              </p>
              {highlightBadges ? <div className="mt-3">{highlightBadges}</div> : null}
            </div>
          </div>

          <div
            data-slot="tool-card-body"
            className="min-w-0 flex-1 space-y-3 md:border-l md:border-[var(--line)] md:pl-6"
          >
            {insightSections}
            {tagBadges}
          </div>

          <div className="flex shrink-0 flex-col gap-3 md:w-60">
            {metaPanel}
            {whyItMatters ? (
              <p className="line-clamp-3 break-words text-[length:var(--tv-text-sm)] leading-[var(--tv-leading-body)] text-card-foreground">
                {whyItMatters}
              </p>
            ) : null}
            {ctaRow}
            <div className="mt-auto flex flex-wrap items-center justify-between gap-2">
              {showActions ? (
                <div data-slot="tool-card-actions" className="flex flex-wrap items-center gap-2">
                  {actionNode}
                </div>
              ) : null}
              {dateLabel}
            </div>
          </div>
        </div>
      </Card>
    );
  }

  if (density === "mobile-list") {
    /* B38 / MOB-702 — card list per la colonna singola sotto soglia:
       a tutta larghezza il use case ha spazio per tre righe (clamp 3),
       titolo sempre leggibile (break-words, clamp 2) e action rail
       protetta nel footer con wrap garantito anche a 320px. */
    return (
      <Card
        size="sm"
        role="article"
        aria-label={tool.name}
        {...stateProps}
        className={cn(rootClass, "bg-[var(--tv-surface-raised)] text-[var(--tv-ink-primary)] border-[var(--tv-border-subtle)]")}
      >
        <div className="flex items-start gap-3 p-3.5">
          {glyph}
          <div className="min-w-0 flex-1">
            <div
              data-slot="tool-card-topline"
              className="flex items-center justify-between gap-2"
            >
              <p className={cn(eyebrowClass, "truncate text-[var(--tv-ink-muted-aa)]")}>
                {tool.categoryLabel}
              </p>
              <div className="flex shrink-0 items-center gap-1.5">
                {levelLabel ? (
                  <Badge variant={levelVariant} className="shrink-0">
                    {levelLabel}
                  </Badge>
                ) : null}
                <span
                  className="inline-flex items-center gap-1 rounded-full border border-[var(--tv-accent-gold)]/30 bg-[var(--tv-bg-base)]/60 px-1.5 py-0.5 text-[9px] font-semibold"
                  aria-label={`Punteggio ${cardScore.value} su 10`}
                >
                  <span className="font-[family-name:var(--tv-font-family-display)] text-[10px] font-black leading-none text-[var(--tv-accent-gold)]">
                    {cardScore.value.toFixed(1)}
                  </span>
                </span>
              </div>
            </div>
            <h3
              data-slot="tool-card-title"
              className="text-display-card mt-1.5 text-[length:var(--tv-text-md)] font-semibold leading-[var(--tv-leading-heading)] break-words text-[var(--tv-ink-primary)]"
            >
              <Link href={profileHref} className={cn("line-clamp-2", focusRingClass)}>
                {tool.name}
              </Link>
            </h3>
            {description ? (
              <p
                data-slot="tool-card-description"
                className="mt-1 line-clamp-3 break-words text-[length:var(--tv-text-sm)] leading-[var(--tv-leading-body)] text-[var(--tv-ink-secondary)]"
              >
                {description}
              </p>
            ) : null}
          </div>
        </div>
        <div
          data-slot="tool-card-footer"
          className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--tv-border-subtle)] px-3.5 py-2.5"
        >
          <Button
            variant="link"
            size="sm"
            render={<Link href={profileHref} />}
            aria-label={`Apri la scheda di ${tool.name}`}
          >
            Apri scheda
            <ArrowRight aria-hidden="true" className="size-3.5" />
          </Button>
          {showActions ? (
            <div data-slot="tool-card-actions" className="flex items-center gap-2">
              {actionNode}
            </div>
          ) : null}
        </div>
      </Card>
    );
  }

  return (
    <Card
      size="sm"
      role="article"
      aria-label={tool.name}
      {...stateProps}
      className={rootClass}
    >
      <div className="flex items-start gap-3 p-3.5">
        {glyph}
        <div className="min-w-0 flex-1">
          <div
            data-slot="tool-card-topline"
            className="flex items-center justify-between gap-2"
          >
            <p className={cn(eyebrowClass, "truncate text-[var(--muted-strong)]")}>
              {tool.categoryLabel}
            </p>
            {levelLabel ? (
              <Badge variant={levelVariant} className="shrink-0">
                {levelLabel}
              </Badge>
            ) : null}
          </div>
          <h3
            data-slot="tool-card-title"
            className="text-display-card mt-1.5 text-[length:var(--tv-text-md)] font-semibold leading-[var(--tv-leading-heading)] break-words text-card-foreground"
          >
            <Link href={profileHref} className={cn("line-clamp-2", focusRingClass)}>
              {tool.name}
            </Link>
          </h3>
          {description ? (
            <p
              data-slot="tool-card-description"
              className="mt-1 line-clamp-2 break-words text-[length:var(--tv-text-sm)] leading-[var(--tv-leading-body)] text-[var(--muted)]"
            >
              {description}
            </p>
          ) : null}
        </div>
      </div>
      <div
        data-slot="tool-card-footer"
        className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--line)] px-3.5 py-2.5"
      >
        <Button
          variant="link"
          size="sm"
          render={<Link href={profileHref} />}
          aria-label={`Apri la scheda di ${tool.name}`}
        >
          Apri scheda
          <ArrowRight aria-hidden="true" className="size-3.5" />
        </Button>
        {showActions ? (
          <div data-slot="tool-card-actions" className="flex items-center gap-2">
            {actionNode}
          </div>
        ) : null}
      </div>
    </Card>
  );
}
