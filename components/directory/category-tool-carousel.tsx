"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bookmark,
  Check,
  ChevronLeft,
  ChevronRight,
  Columns3,
  Layers3,
} from "lucide-react";

import { DirectoryToolGlyph } from "@/components/directory/directory-tool-glyph";
import { PremiumBadge, PremiumButton } from "@/components/ui/premium";
import type { DirectoryTool } from "@/lib/data/tooolvibes-directory";
import { cn, formatItalianDate } from "@/lib/utils";

type CategoryToolCarouselProps = {
  title: string;
  description: string;
  tools: DirectoryTool[];
  savedSlugs: string[];
  compareSlugs: string[];
  stackSlugs: string[];
  onOpen: (slug: string) => void;
  onSave: (tool: DirectoryTool) => void;
  onCompare: (tool: DirectoryTool) => void;
  onStack: (slug: string) => void;
};

type CarouselState = {
  canPrev: boolean;
  canNext: boolean;
  currentPage: number;
  totalPages: number;
};

const levelTone: Record<DirectoryTool["level"], "accent" | "success" | "neutral" | "dark"> = {
  featured: "accent",
  beginner: "success",
  intermediate: "neutral",
  expert: "dark",
};

function getRailMetrics(rail: HTMLDivElement) {
  const firstCard = rail.querySelector<HTMLElement>("[data-carousel-card]");
  const styles = window.getComputedStyle(rail);
  const gap = Number.parseFloat(styles.columnGap || styles.gap || "0") || 0;
  const cardWidth = firstCard?.offsetWidth ?? rail.clientWidth;
  const itemStep = cardWidth + gap;
  const visibleCards = Math.max(1, Math.round((rail.clientWidth + gap) / itemStep));
  const pageStep = itemStep * visibleCards;
  const maxScroll = Math.max(0, rail.scrollWidth - rail.clientWidth);

  return { maxScroll, pageStep, visibleCards };
}

function CarouselIconButton({
  children,
  active,
  ariaLabel,
  sonicAction,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  ariaLabel: string;
  sonicAction?: "save" | "compare" | "stack" | "carousel";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      title={ariaLabel}
      aria-pressed={active}
      data-sonic-action={sonicAction}
      onClick={onClick}
      className={cn("category-tool-card__icon-button", active && "is-active")}
    >
      {children}
    </button>
  );
}

function ToolCarouselCard({
  tool,
  saved,
  compared,
  stacked,
  onOpen,
  onSave,
  onCompare,
  onStack,
}: {
  tool: DirectoryTool;
  saved: boolean;
  compared: boolean;
  stacked: boolean;
  onOpen: () => void;
  onSave: () => void;
  onCompare: () => void;
  onStack: () => void;
}) {
  const visibleTags = tool.tags.slice(0, 3);
  const hiddenTagCount = Math.max(0, tool.tags.length - visibleTags.length);

  return (
    <article
      data-carousel-card
      className="category-tool-card"
      style={{
        ["--tool-accent-from" as string]: tool.accentFrom,
        ["--tool-accent-to" as string]: tool.accentTo,
      }}
    >
      <span aria-hidden="true" className="category-tool-card__aura" />

      <div className="category-tool-card__header">
        <DirectoryToolGlyph tool={tool} size="md" className="category-tool-card__glyph" />
        <div className="min-w-0 flex-1">
          <div className="category-tool-card__badges">
            <PremiumBadge tone={levelTone[tool.level]} className="category-tool-card__badge">
              {tool.levelLabel}
            </PremiumBadge>
            {tool.toolOfWeek ? (
              <PremiumBadge tone="warning" className="category-tool-card__badge">
                Scelta
              </PremiumBadge>
            ) : null}
          </div>
          <h3 className="category-tool-card__title">{tool.name}</h3>
          <p className="category-tool-card__category">{tool.categoryLabel}</p>
        </div>
      </div>

      <p className="category-tool-card__description">{tool.shortDescription}</p>

      <div className="category-tool-card__insight" aria-label={`Sintesi di ${tool.name}`}>
        <div>
          <p>In breve</p>
          <strong>{tool.tldr}</strong>
        </div>
        <div>
          <p>Lettura</p>
          <span>{tool.editorialReview}</span>
        </div>
      </div>

      <div className="category-tool-card__tags" aria-label={`Tag di ${tool.name}`}>
        {visibleTags.map((tag) => (
          <span key={tag} className="category-tool-card__tag">
            {tag}
          </span>
        ))}
        {hiddenTagCount > 0 ? <span className="category-tool-card__tag">+{hiddenTagCount}</span> : null}
      </div>

      <div className="category-tool-card__footer">
        <div className="category-tool-card__meta">
          <div className="min-w-0">
            <p>Fonte</p>
            <strong>{tool.domain}</strong>
          </div>
          <time dateTime={tool.publishedAt}>{formatItalianDate(tool.publishedAt)}</time>
        </div>

        <div
          className="category-tool-card__actions"
          onPointerDown={(event) => event.stopPropagation()}
        >
          <PremiumButton
            type="button"
            size="sm"
            tone="premium"
            onMouseDown={(event) => event.preventDefault()}
            onClick={onOpen}
            className="category-tool-card__cta"
            data-sonic-action="detail"
          >
            Apri dettagli
          </PremiumButton>
          <CarouselIconButton active={saved} onClick={onSave} ariaLabel={`Salva ${tool.name}`} sonicAction="save">
            {saved ? <Check className="size-4" /> : <Bookmark className="size-4" />}
          </CarouselIconButton>
          <CarouselIconButton
            active={compared}
            onClick={onCompare}
            ariaLabel={`Confronta ${tool.name}`}
            sonicAction="compare"
          >
            <Columns3 className="size-4" />
          </CarouselIconButton>
          <CarouselIconButton
            active={stacked}
            onClick={onStack}
            ariaLabel={`Aggiungi ${tool.name} alla lista`}
            sonicAction="stack"
          >
            <Layers3 className="size-4" />
          </CarouselIconButton>
        </div>
      </div>
    </article>
  );
}

export function CategoryToolCarousel({
  title,
  description,
  tools,
  savedSlugs,
  compareSlugs,
  stackSlugs,
  onOpen,
  onSave,
  onCompare,
  onStack,
}: CategoryToolCarouselProps) {
  const railRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);
  const [state, setState] = useState<CarouselState>({
    canPrev: false,
    canNext: false,
    currentPage: 1,
    totalPages: 1,
  });
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const updateState = useCallback(() => {
    const rail = railRef.current;
    if (!rail) {
      return;
    }

    const { maxScroll, pageStep, visibleCards } = getRailMetrics(rail);
    const totalPages = Math.max(1, Math.ceil(tools.length / visibleCards));
    const currentPage = Math.min(
      totalPages,
      Math.max(1, Math.round(rail.scrollLeft / Math.max(1, pageStep)) + 1),
    );

    const nextState = {
      canPrev: rail.scrollLeft > 3,
      canNext: rail.scrollLeft < maxScroll - 3,
      currentPage,
      totalPages,
    };

    const current = stateRef.current;
    if (
      current.canPrev !== nextState.canPrev ||
      current.canNext !== nextState.canNext ||
      current.currentPage !== nextState.currentPage ||
      current.totalPages !== nextState.totalPages
    ) {
      stateRef.current = nextState;
      setState(nextState);
    }
  }, [tools.length]);

  const requestStateUpdate = useCallback(() => {
    if (frameRef.current !== null) {
      return;
    }

    frameRef.current = window.requestAnimationFrame(() => {
      frameRef.current = null;
      updateState();
    });
  }, [updateState]);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) {
      return;
    }

    const resizeObserver = new ResizeObserver(requestStateUpdate);

    updateState();
    resizeObserver.observe(rail);
    rail.addEventListener("scroll", requestStateUpdate, { passive: true });

    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      resizeObserver.disconnect();
      rail.removeEventListener("scroll", requestStateUpdate);
    };
  }, [requestStateUpdate, updateState]);

  const scrollByPage = useCallback((direction: -1 | 1) => {
    const rail = railRef.current;
    if (!rail) {
      return;
    }

    const { maxScroll, pageStep } = getRailMetrics(rail);
    const target = direction > 0
      ? Math.min(maxScroll, rail.scrollLeft + pageStep)
      : Math.max(0, rail.scrollLeft - pageStep);

    rail.scrollTo({ left: target, behavior: "smooth" });
  }, []);

  const scrollToPage = useCallback((pageIndex: number) => {
    const rail = railRef.current;
    if (!rail) {
      return;
    }

    const { maxScroll, pageStep } = getRailMetrics(rail);
    rail.scrollTo({
      left: Math.min(maxScroll, pageStep * pageIndex),
      behavior: "smooth",
    });
  }, []);

  return (
    <section
      className="category-tool-carousel"
      aria-label={title}
      data-active-page={state.currentPage}
    >
      <div className="category-tool-carousel__header">
        <div className="min-w-0">
          <div className="category-tool-carousel__title-row">
            <h4>{title}</h4>
            <span>{tools.length} tool</span>
          </div>
          <p>{description}</p>
        </div>

        <div className="category-tool-carousel__controls" aria-label={`Controlli carosello ${title}`}>
          <span aria-live="polite" className="category-tool-carousel__page-count">
            {state.currentPage} / {state.totalPages}
          </span>
          <button
            type="button"
            onClick={() => scrollByPage(-1)}
            disabled={!state.canPrev}
            aria-label={`Scorri ${title} indietro`}
            title={`Scorri ${title} indietro`}
            className="category-tool-carousel__control"
            data-sonic-action="carousel"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollByPage(1)}
            disabled={!state.canNext}
            aria-label={`Scorri ${title} avanti`}
            title={`Scorri ${title} avanti`}
            className="category-tool-carousel__control"
            data-sonic-action="carousel"
          >
            <ChevronRight className="size-4" />
          </button>
          <div className="category-tool-carousel__dots" aria-hidden="true">
            {Array.from({ length: state.totalPages }).map((_, index) => (
              <button
                key={index}
                type="button"
                tabIndex={-1}
                onClick={() => scrollToPage(index)}
                data-sonic-action="carousel"
                className={cn(
                  "category-tool-carousel__dot",
                  state.currentPage === index + 1 && "is-active",
                )}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="category-tool-carousel__viewport">
        <div
          ref={railRef}
          className="category-tool-carousel__track"
        >
          {tools.map((tool) => (
            <ToolCarouselCard
              key={tool.slug}
              tool={tool}
              saved={savedSlugs.includes(tool.slug)}
              compared={compareSlugs.includes(tool.slug)}
              stacked={stackSlugs.includes(tool.slug)}
              onOpen={() => onOpen(tool.slug)}
              onSave={() => onSave(tool)}
              onCompare={() => onCompare(tool)}
              onStack={() => onStack(tool.slug)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
