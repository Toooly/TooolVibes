"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { bindShellScroll, readingLine } from "@/lib/shell/scroll-port";

export type CollectionSectionNavItem = {
  id: string;
  label: string;
};

type Props = {
  items: CollectionSectionNavItem[];
};

/**
 * Sticky in-page map for long Collection journeys.
 * Active pill follows the section that has crossed the shell reading line.
 */
export function CollectionSectionNavV4({ items }: Props) {
  const safe = useMemo(() => items.filter((i) => i.id && i.label), [items]);
  const [active, setActive] = useState<string | null>(safe[0]?.id ?? null);
  const pinned = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || safe.length < 2) return;
    const els = safe
      .map((i) => document.getElementById(i.id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (!els.length) return;

    let raf = 0;
    const measure = () => {
      if (pinned.current) {
        setActive(pinned.current);
        return;
      }
      const line = readingLine();
      let current = els[0]?.id ?? null;
      for (const el of els) {
        if (el.getBoundingClientRect().top <= line) current = el.id;
        else break;
      }
      setActive(current);
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };
    const onHash = () => {
      const hash = window.location.hash.replace(/^#/, "");
      if (hash && safe.some((item) => item.id === hash)) {
        pinned.current = hash;
        setActive(hash);
        window.setTimeout(() => {
          pinned.current = null;
          measure();
        }, 700);
      }
    };
    measure();
    const unbind = bindShellScroll(onScroll, { passive: true });
    window.addEventListener("hashchange", onHash);
    return () => {
      cancelAnimationFrame(raf);
      unbind();
      window.removeEventListener("hashchange", onHash);
    };
  }, [safe]);

  if (safe.length < 2) return null;

  return (
    <nav className="cx-section-nav" data-shell-nav="painted" aria-label="Sezioni della raccolta">
      <div className="cx-section-nav__scroller">
        <ol>
          {safe.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                aria-current={active === item.id ? "true" : undefined}
                className={active === item.id ? "is-active" : undefined}
                onClick={() => {
                  pinned.current = item.id;
                  setActive(item.id);
                  window.setTimeout(() => {
                    pinned.current = null;
                  }, 700);
                }}
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
