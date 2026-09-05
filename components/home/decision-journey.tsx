"use client";

import Link from "next/link";

import {
  DECISION_LIFECYCLE,
  DECISION_LIFECYCLE_HINTS,
  DECISION_LIFECYCLE_HREFS,
  DECISION_LIFECYCLE_LABELS,
  type DecisionLifecycleStage,
} from "@/lib/product/decision-lifecycle";
import { useToolWorkspaceStore } from "@/lib/stores/tool-workspace-store";

export function DecisionJourney() {
  const compareCount = useToolWorkspaceStore((s) => s.compareSlugs.length);
  const savedCount = useToolWorkspaceStore((s) => s.savedSlugs.length);

  const activeId: DecisionLifecycleStage =
    savedCount > 0 && compareCount >= 2
      ? "ricorda"
      : compareCount >= 2
        ? "decidi"
        : compareCount === 1
          ? "valuta"
          : savedCount > 0
            ? "ricorda"
            : "scopri";

  const activeIndex = DECISION_LIFECYCLE.indexOf(activeId);

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
        {DECISION_LIFECYCLE.map((stage, index) => {
          const done = index < activeIndex;
          const active = index === activeIndex;
          return (
            <li
              key={stage}
              className={[done && "is-done", active && "is-active"].filter(Boolean).join(" ") || undefined}
              data-step={stage}
            >
              <Link href={DECISION_LIFECYCLE_HREFS[stage]} aria-current={active ? "step" : undefined}>
                <span aria-hidden="true">{done ? "✓" : String(index + 1)}</span>
                <strong>{DECISION_LIFECYCLE_LABELS[stage]}</strong>
                <em>{DECISION_LIFECYCLE_HINTS[stage]}</em>
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
