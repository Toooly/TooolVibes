"use client";

import { LocalizedText, LocalizedAttributes } from "@/components/i18n/localized-text";
import { useMemo, useState, type ReactNode } from "react";

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
};

const DEFAULT_INITIAL = 6;

export function GuideGridSection({
  items,
  topics,
  initialVisible = DEFAULT_INITIAL,
  featured = null,
}: GuideGridSectionProps) {
  const [active, setActive] = useState<string>("Tutte");
  const [expanded, setExpanded] = useState(false);

  const visible = useMemo(() => {
    const filtered = active === "Tutte" ? items : items.filter((i) => i.topic === active);
    return expanded ? filtered : filtered.slice(0, initialVisible);
  }, [active, expanded, items, initialVisible]);

  const totalForActive = useMemo(() => {
    return active === "Tutte" ? items.length : items.filter((i) => i.topic === active).length;
  }, [active, items]);

  const showExpand = totalForActive > initialVisible;

  return (
    <section
      id="guides-all"
      className="guides-section"
      aria-labelledby="guides-all-title"
    >
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
            {items.length}
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

      {featured ? (
        <div className="guides-grid__featured" data-mobile-featured>
          <LocalizedText>{featured}</LocalizedText>
        </div>
      ) : null}

      <div className="guides-grid" id="guides-grid-list" aria-live="polite">
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
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            paddingTop: "0.4rem",
          }}
        >
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-controls="guides-grid-list"
            aria-expanded={expanded}
            className="guides-section__foot-link"
            style={{
              background: "rgba(18, 13, 47, 0.04)",
              border: "1px solid var(--guides-rule-strong)",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            <LocalizedText>{expanded
              ? `Mostra meno (${visible.length} visibili)`
              : `Mostra tutte (${totalForActive - initialVisible} altre)`}</LocalizedText>
            <span aria-hidden><LocalizedText>{expanded ? "↑" : "↓"}</LocalizedText></span>
          </button>
        </div>
      ) : null}
    </section>
  );
}
