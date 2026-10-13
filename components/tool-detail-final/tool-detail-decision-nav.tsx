"use client";

import { LocalizedText, LocalizedAttributes } from "@/components/i18n/localized-text";
import { useMemo, type CSSProperties } from "react";

import { useSectionNavigation } from "@/lib/hooks/use-section-navigation";

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
  const sections = useMemo<Item[]>(() => {
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
  const { items, active, navigate } = useSectionNavigation(sections);

  if (items.length < 2) return null;

  return (
    <LocalizedAttributes><nav className="td-final-decision-nav" aria-label="Sezioni della scheda" style={{ "--td-nav-columns": items.length } as CSSProperties}>
      {items.map((item) => {
        const selected = active === item.id;
        return (
          <a
            key={item.id}
            className={selected ? "td-final-decision-nav__link is-active" : "td-final-decision-nav__link"}
            href={`#${item.id}`}
            aria-current={selected ? "location" : undefined}
            onClick={(event) => navigate(event, item.id)}
          >
            <LocalizedText>{item.label}</LocalizedText>
          </a>
        );
      })}
    </nav></LocalizedAttributes>
  );
}
