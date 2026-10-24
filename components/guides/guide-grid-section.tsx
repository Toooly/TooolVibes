"use client";

import { LocalizedText, LocalizedAttributes } from "@/components/i18n/localized-text";
import { useMemo, useRef, useState, type ReactNode } from "react";
import { useLocale } from "@/components/i18n/locale-provider";

import type { EditorialPostRecord } from "@/lib/types/article";

import { GuideCard } from "@/components/guides/guide-card";

export type GuideGridItem = {
  post: EditorialPostRecord;
  topic: string;
  toolName?: string | null;
  toolHref?: string | null;
  readingMinutes: number;
  toolDomain?: string | null;
};

type GuideGridSectionProps = {
  items: GuideGridItem[];
  topics: Array<{ label: string; count: number }>;
  initialVisible?: number;
  featured?: ReactNode;
  featuredItem?: GuideGridItem | null;
};

const DEFAULT_INITIAL = 6;

export function GuideGridSection({
  items,
  topics,
  initialVisible = DEFAULT_INITIAL,
  featured = null,
  featuredItem = null,
}: GuideGridSectionProps) {
  const { locale } = useLocale();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [active, setActive] = useState<string>("Tutte");
  const [expanded, setExpanded] = useState(false);

  const filtered = useMemo(() => {
    if (active === "Tutte") return items;
    const searchable = featuredItem
      ? [featuredItem, ...items.filter((item) => item.post.slug !== featuredItem.post.slug)]
      : items;
    return searchable.filter((item) => item.topic === active);
  }, [active, items, featuredItem]);
  const visible = expanded ? filtered : filtered.slice(0, initialVisible);
  const totalForActive = filtered.length;
  const featuredCount = active === "Tutte" && featuredItem ? 1 : 0;
  const allCount = items.length + (featuredItem ? 1 : 0);
  const resultCount = totalForActive + featuredCount;
  const showExpand = totalForActive > initialVisible;
  const toggleExpanded = () => {
    setExpanded(!expanded);
    if (expanded) requestAnimationFrame(() => {
      const heading = headingRef.current;
      heading?.focus({ preventScroll: true });
      heading?.scrollIntoView?.({ block: "start", behavior: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
    });
  };

  return (
    <section
      id="guides-all"
      className="guides-section"
      aria-labelledby="guides-all-title"
    >
      <header className="guides-grid__head">
        <h2 id="guides-all-title" ref={headingRef} tabIndex={-1}>
          {locale === "en" ? "Explore the guides" : "Esplora le guide"}
        </h2>
        <p className="guides-grid__status" role="status" aria-live="polite" aria-atomic="true">
          {locale === "en" ? `${visible.length + featuredCount} of ${resultCount} ${resultCount === 1 ? "guide" : "guides"}` : `${visible.length + featuredCount} di ${resultCount} ${resultCount === 1 ? "guida" : "guide"}`}
        </p>
      </header>
      <LocalizedAttributes><div className="guides-filter" role="group" aria-label="Filtra per area">
        <button
          type="button"
          aria-pressed={active === "Tutte"}
          onClick={() => {
            setActive("Tutte");
            setExpanded(false);
          }}
          className="guides-filter__chip"
          aria-controls="guides-grid-list"
        ><LocalizedText>{"Tutte "}</LocalizedText><span className="guides-filter__chip__count">
            {allCount}
          </span>
        </button>
        {topics.map((t) => (
          <button
            key={t.label}
            type="button"
            aria-pressed={active === t.label}
            onClick={() => {
              setActive(t.label);
              setExpanded(false);
            }}
            className="guides-filter__chip"
            aria-controls="guides-grid-list"
          >
            <LocalizedText>{t.label}</LocalizedText>
            <span className="guides-filter__chip__count">{t.count}</span>
          </button>
        ))}
      </div></LocalizedAttributes>

      {featured && active === "Tutte" ? (
        <div className="guides-grid__featured-result">
          {featured}
        </div>
      ) : null}

      <div className="guides-grid" id="guides-grid-list">
        {visible.length === 0 ? (
          <p
            style={{
              gridColumn: "1 / -1",
              textAlign: "center",
              padding: "2rem 1rem",
              color: "var(--guides-text-muted)",
              fontSize: "0.95rem",
            }}
          ><LocalizedText>{"Nessuna guida trovata in quest'area. Prova un filtro diverso. "}</LocalizedText></p>
        ) : (
          visible.map((item) => (
            <GuideCard
              key={item.post.slug}
              post={item.post}
              topic={item.topic}
              toolName={item.toolName ?? null}
              toolHref={item.toolHref ?? null}
              readMinutes={item.readingMinutes}
              thumbDomain={item.toolDomain ?? null}
            />
          ))
        )}
      </div>

      {showExpand ? (
        <div className="guides-grid__more">
          <button
            type="button"
            onClick={toggleExpanded}
            aria-controls="guides-grid-list"
            aria-expanded={expanded}
            className="guides-section__foot-link"
          >
            {locale === "en"
              ? expanded ? "Show fewer guides" : `Show all ${totalForActive + featuredCount} guides`
              : expanded ? "Mostra meno guide" : `Mostra tutte le ${totalForActive + featuredCount} guide`}
            <span aria-hidden>{expanded ? "↑" : "↓"}</span>
          </button>
        </div>
      ) : null}
    </section>
  );
}
