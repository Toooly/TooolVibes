"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { bindShellScroll, readingLine } from "@/lib/shell/scroll-port";

type Item = { id: string; label: string };

/**
 * In-page nav for the remaining public layers.
 * Selected pill follows the section under the sticky chrome, not window.scrollY.
 */
export function ToolDetailDecisionNav({
  showAlternatives,
  showDeepen = true,
  navSections,
}: {
  showAlternatives: boolean;
  showDeepen?: boolean;
  navSections?: Array<{ id: string; label: string }>;
}) {
  const items = useMemo<Item[]>(() => {
    if (navSections && navSections.length > 0) {
      return navSections.map((s) => ({ id: s.id, label: s.label }));
    }
    const next: Item[] = [];
    if (showDeepen) {
      next.push(
        { id: "td-final-overview", label: "Panoramica" },
        { id: "td-final-panel-pros-limits", label: "Pro e contro" },
        { id: "td-final-pricing", label: "Prezzi" },
      );
    }
    if (showAlternatives) next.push({ id: "td-final-alternatives", label: "Alternative" });
    return next;
  }, [navSections, showAlternatives, showDeepen]);
  const [active, setActive] = useState(items[0]?.id ?? "");
  const pinned = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || items.length === 0) return;
    const els = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (!els.length) return;

    let raf = 0;
    const measure = () => {
      if (pinned.current) {
        setActive(pinned.current);
        return;
      }
      const line = readingLine();
      let current = els[0]?.id ?? items[0]?.id ?? "";
      for (const el of els) {
        if (el.getBoundingClientRect().top <= line) current = el.id;
        else break;
      }
      setActive(current);
      const link = document.querySelector(`.td-final-decision-nav [href="#${current}"]`);
      if (link instanceof HTMLElement && document.activeElement !== link) {
        const nav = link.parentElement;
        if (nav instanceof HTMLElement) {
          const left = link.offsetLeft - nav.clientWidth / 2 + link.clientWidth / 2;
          nav.scrollTo({ left: Math.max(0, left) });
        }
      }
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };
    measure();
    const unbind = bindShellScroll(onScroll, { passive: true });
    window.addEventListener("hashchange", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      unbind();
      window.removeEventListener("hashchange", onScroll);
    };
  }, [items]);

  if (!showDeepen && !showAlternatives) return null;

  return (
    <nav className="td-final-decision-nav" aria-label="Sezioni della scheda">
      {items.map((item) => {
        const selected = active === item.id;
        return (
          <a
            key={item.id}
            className={selected ? "td-final-decision-nav__link is-active" : "td-final-decision-nav__link"}
            href={`#${item.id}`}
            aria-current={selected ? "true" : undefined}
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
        );
      })}
    </nav>
  );
}
