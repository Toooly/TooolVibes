"use client";

import Link from "next/link";

import { useToolWorkspaceStore } from "@/lib/stores/tool-workspace-store";

type Step = {
  id: string;
  n: string;
  label: string;
  hint: string;
  href: string;
};

const STEPS: Step[] = [
  { id: "explore", n: "1", label: "Esplora", hint: "Catalogo", href: "/archivio" },
  { id: "evaluate", n: "2", label: "Valuta", hint: "Schede", href: "/archivio" },
  { id: "compare", n: "3", label: "Confronta", hint: "Differenze", href: "/compare" },
  { id: "save", n: "4", label: "Salva", hint: "Candidati", href: "/shortlist" },
  { id: "decide", n: "5", label: "Decidi", hint: "Motivazione", href: "/shortlist#wishlist" },
];

/**
 * Live decision path: steps light up from real workspace state
 * (compare slots + shortlist), never fake progress.
 */
export function DecisionJourney() {
  const compareCount = useToolWorkspaceStore((s) => s.compareSlugs.length);
  const savedCount = useToolWorkspaceStore((s) => s.savedSlugs.length);

  const activeId =
    savedCount > 0 && compareCount >= 2
      ? "decide"
      : savedCount > 0
        ? "save"
        : compareCount >= 2
          ? "compare"
          : compareCount === 1
            ? "evaluate"
            : "explore";

  const activeIndex = STEPS.findIndex((s) => s.id === activeId);

  return (
    <nav className="def-cockpit__journey" aria-label="Il tuo percorso di decisione">
      <p className="def-cockpit__journey-kicker">
        Percorso di decisione
        {savedCount > 0 || compareCount > 0 ? (
          <span className="def-cockpit__journey-live">
            {compareCount > 0 ? `${compareCount} in confronto` : null}
            {compareCount > 0 && savedCount > 0 ? " · " : null}
            {savedCount > 0 ? `${savedCount} salvati` : null}
          </span>
        ) : (
          <span className="def-cockpit__journey-live def-cockpit__journey-live--idle">
            Inizia dal catalogo
          </span>
        )}
      </p>
      <ol>
        {STEPS.map((step, index) => {
          const done = index < activeIndex;
          const active = index === activeIndex;
          return (
            <li
              key={step.id}
              className={[done && "is-done", active && "is-active"].filter(Boolean).join(" ") || undefined}
              data-step={step.id}
            >
              <Link href={step.href} aria-current={active ? "step" : undefined}>
                <span aria-hidden="true">{done ? "✓" : step.n}</span>
                <strong>{step.label}</strong>
                <em>{step.hint}</em>
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
