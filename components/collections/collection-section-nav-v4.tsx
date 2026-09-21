"use client";

import { useEffect, useMemo, useState } from "react";

export type CollectionSectionNavItem = {
  id: string;
  label: string;
};

type Props = {
  items: CollectionSectionNavItem[];
};

/**
 * Sticky in-page map for long Collection journeys.
 * Only renders when there are enough real sections to navigate.
 */
export function CollectionSectionNavV4({ items }: Props) {
  const safe = useMemo(() => items.filter((i) => i.id && i.label), [items]);
  const [active, setActive] = useState<string | null>(safe[0]?.id ?? null);

  useEffect(() => {
    if (typeof window === "undefined" || safe.length < 2) return;
    const els = safe
      .map((i) => document.getElementById(i.id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (!els.length) return;

    let raf = 0;
    const measure = () => {
      const line = window.scrollY + window.innerHeight * 0.28;
      let current = els[0]?.id ?? null;
      for (const el of els) {
        const top = el.getBoundingClientRect().top + window.scrollY;
        if (top <= line) current = el.id;
        else break;
      }
      setActive(current);
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, [safe]);

  if (safe.length < 2) return null;

  return (
    <nav className="cx-section-nav" aria-label="Sezioni della raccolta">
      <div className="cx-section-nav__scroller">
        <ol>
          {safe.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                aria-current={active === item.id ? "true" : undefined}
                className={active === item.id ? "is-active" : undefined}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ol>
      </div>
    </nav>
  );
}
