"use client";

import { LocalizedText, LocalizedAttributes } from "@/components/i18n/localized-text";
import { useEffect, useMemo, useRef } from "react";
import { useSectionNavigation } from "@/lib/hooks/use-section-navigation";

export type CollectionSectionNavItem = { id: string; label: string };

export function CollectionSectionNavV4({ items: suppliedItems }: { items: CollectionSectionNavItem[] }) {
  const sections = useMemo(() => suppliedItems.filter((item) => item.id && item.label), [suppliedItems]);
  const { items, active, navigate } = useSectionNavigation(sections);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = scroller.current;
    if (!root) return;
    const reveal = () => {
      if (root.scrollWidth <= root.clientWidth) return;
      const link = Array.from(root.querySelectorAll("a")).find((item) => item.hash === `#${active}`);
      if (!link) return;
      const box = link.getBoundingClientRect();
      const rail = root.getBoundingClientRect();
      if (box.left < rail.left + 8 || box.right > rail.right - 8) {
        root.scrollTo({ left: root.scrollLeft + box.left - rail.left - (rail.width - box.width) / 2 });
      }
    };
    reveal();
    window.addEventListener("resize", reveal);
    return () => window.removeEventListener("resize", reveal);
  }, [active, items]);

  if (items.length < 2) return null;
  return (
    <LocalizedAttributes><nav className="cx-section-nav" data-shell-nav="painted" aria-label="Sezioni della raccolta">
      <div ref={scroller} className="cx-section-nav__scroller">
        <ol>
          {items.map((item) => (
            <li key={item.id}>
              <a href={`#${item.id}`} aria-current={active === item.id ? "location" : undefined}
                className={active === item.id ? "is-active" : undefined}
                onClick={(event) => navigate(event, item.id)}>
                <LocalizedText>{item.label}</LocalizedText>
              </a>
            </li>
          ))}
        </ol>
      </div>
    </nav></LocalizedAttributes>
  );
}
