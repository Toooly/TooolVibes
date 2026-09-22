"use client";

import { useMemo, useState, type ReactNode } from "react";

import type { EditorialPostRecord } from "@/lib/types/article";

import { GuideCard } from "@/components/guides/guide-card";

export type GuideGridItem = {
  post: EditorialPostRecord;
  topic: string;
  toolName?: string | null;
  toolHref?: string | null;
  readingMinutes: number;
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
        <div className="guides-filter" role="tablist" aria-label="Filtra per area">
          <button
            type="button"
            role="tab"
            aria-selected={active === "Tutte"}
            onClick={() => {
              setActive("Tutte");
              setExpanded(false);
            }}
            className="guides-filter__chip"
          >
            Tutte
            <span className="guides-filter__chip__count">
              {items.length}
            </span>
          </button>
          {topics.map((t) => (
            <button
              key={t.label}
              type="button"
              role="tab"
              aria-selected={active === t.label}
              onClick={() => {
                setActive(t.label);
                setExpanded(false);
              }}
              className="guides-filter__chip"
            >
              {t.label}
              <span className="guides-filter__chip__count">{t.count}</span>
            </button>
          ))}
        </div>

      {featured ? (
        <div className="guides-grid__featured" data-mobile-featured>
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
          >
            Nessuna guida trovata in quest&apos;area. Prova un filtro diverso.
          </p>
        ) : (
          visible.map((item) => (
            <GuideCard
              key={item.post.slug}
              post={item.post}
              topic={item.topic}
              toolName={item.toolName ?? null}
              toolHref={item.toolHref ?? null}
              readMinutes={item.readingMinutes}
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
            {expanded
              ? `Mostra meno (${visible.length} visibili)`
              : `Mostra tutte (${totalForActive - initialVisible} altre)`}
            <span aria-hidden>{expanded ? "↑" : "↓"}</span>
          </button>
        </div>
      ) : null}
    </section>
  );
}
