"use client";

import { LocalizedText, LocalizedAttributes } from "@/components/i18n/localized-text";
import { useEffect, useMemo, useRef, useState } from "react";

import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { bindShellScroll, getShellScroller, readingLine } from "@/lib/shell/scroll-port";

export type TocItem = { id: string; text: string; level: 2 | 3 };

type GuideArticleTocProps = {
  items?: TocItem[];
  title?: string;
  readingMinutes?: number;
  progressRootSelector?: string;
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}

export function buildHeadingId(text: string, usedIds: Set<string>): string {
  const base = slugify(text) || "sezione";
  let id = base;
  let i = 2;
  while (usedIds.has(id)) {
    id = `${base}-${i++}`;
  }
  usedIds.add(id);
  return id;
}

export function GuideArticleToc({
  items: suppliedItems = [],
  title = "Indice della guida",
  readingMinutes,
  progressRootSelector = "[data-guides-article-body]",
}: GuideArticleTocProps) {
  const [renderedItems, setRenderedItems] = useState<TocItem[]>([]);
  const items = useMemo(
    () => suppliedItems.length > 0 ? suppliedItems : renderedItems,
    [suppliedItems, renderedItems],
  );
  const [activeId, setActiveId] = useState<string | null>(items[0]?.id ?? null);
  const [progress, setProgress] = useState(0);
  const preferReducedMotion = useReducedMotion();
  const pinned = useRef<string | null>(null);

  // Read the rendered article: server sibling render order cannot populate a ref
  // before this client component receives it. Locked preview content stays out.
  useEffect(() => {
    if (suppliedItems.length > 0) return;
    const root = document.querySelector(progressRootSelector);
    if (!root) return;
    const collect = () => {
      const next = Array.from(root.querySelectorAll<HTMLElement>("h2[id], h3[id]"))
        .filter((heading) => !heading.closest("[inert], [aria-hidden='true']"))
        .map((heading): TocItem => ({
          id: heading.id,
          text: heading.textContent?.trim() ?? "",
          level: heading.tagName === "H3" ? 3 : 2,
        }));
      setRenderedItems((previous) =>
        JSON.stringify(previous) === JSON.stringify(next) ? previous : next,
      );
    };
    collect();
    const observer = new MutationObserver(collect);
    observer.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["inert", "aria-hidden", "id"],
    });
    return () => observer.disconnect();
  }, [progressRootSelector, suppliedItems.length]);

  // Deep-link: honor #hash on first paint before scroll-spy takes over.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash.replace(/^#/, "");
    if (hash && items.some((item) => item.id === hash)) {
      setActiveId(hash);
    }
  }, [items]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const elements = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => Boolean(el));

    if (elements.length === 0) return;

    let raf = 0;
    const measure = () => {
      const root = document.querySelector(progressRootSelector) as HTMLElement | null;
      const target = root ?? document.body;
      const scroller = getShellScroller();
      const viewTop = scroller instanceof HTMLElement ? scroller.getBoundingClientRect().top : 0;
      const viewport = scroller instanceof HTMLElement ? scroller.clientHeight : window.innerHeight;
      const rect = target.getBoundingClientRect();
      const scrolled = viewTop - rect.top;
      const total = Math.max(1, target.offsetHeight - viewport);
      const pct = Math.max(0, Math.min(1, scrolled / total));
      setProgress(pct);

      if (pinned.current) {
        setActiveId(pinned.current);
        return;
      }

      const line = readingLine();
      let current: string | null = elements[0]?.id ?? null;
      for (const el of elements) {
        if (el.getBoundingClientRect().top <= line) current = el.id;
        else break;
      }
      setActiveId(current);
    };

    const onScroll = () => {
      if (preferReducedMotion) {
        measure();
        return;
      }
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };

    measure();
    const unbind = bindShellScroll(onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    window.addEventListener("hashchange", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      unbind();
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("hashchange", onScroll);
    };
  }, [items, preferReducedMotion, progressRootSelector]);

  const counter = useMemo(
    () => items.length.toString().padStart(2, "0"),
    [items.length],
  );

  if (items.length === 0) return null;

  return (
    <LocalizedAttributes><nav
      className={items.length < 3 ? "guides-toc is-compact" : "guides-toc"}
      aria-label={title}
      data-toc-count={items.length}
    >
      <div className="guides-toc__title">
        <LocalizedText>{title}</LocalizedText> <span aria-hidden>· <LocalizedText>{counter}</LocalizedText></span>
      </div>
      <LocalizedAttributes><div
        className="guides-toc__progress"
        role="progressbar"
        aria-label="Progresso di lettura"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress * 100)}
      >
        <span style={{ width: `${Math.round(progress * 100)}%` }} />
      </div></LocalizedAttributes>
      <ol className="guides-toc__list">
        {items.map((item) => (
          <li
            key={item.id}
            className={item.level === 3 ? "toc-h3" : "toc-h2"}
          >
            <a
              href={`#${item.id}`}
              aria-current={activeId === item.id ? "true" : undefined}
              onClick={() => {
                pinned.current = item.id;
                setActiveId(item.id);
                window.setTimeout(() => {
                  pinned.current = null;
                }, 700);
              }}
            >
              <LocalizedText>{item.text}</LocalizedText>
            </a>
          </li>
        ))}
      </ol>
      {readingMinutes && readingMinutes > 0 ? (
        <div className="guides-toc__cta">
          <span className="guides-meta"><LocalizedText>{"Lettura stimata · "}</LocalizedText><strong>{readingMinutes}<LocalizedText>{" min"}</LocalizedText></strong>
          </span>
        </div>
      ) : null}
    </nav></LocalizedAttributes>
  );
}
