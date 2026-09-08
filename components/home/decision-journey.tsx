"use client";

import { useState } from "react";
import Link from "next/link";

import {
  DECISION_LIFECYCLE,
  DECISION_LIFECYCLE_COPY,
  DECISION_LIFECYCLE_HINTS,
  DECISION_LIFECYCLE_HREFS,
  DECISION_LIFECYCLE_LABELS,
  type DecisionLifecycleStage,
} from "@/lib/product/decision-lifecycle";
import { useToolWorkspaceStore } from "@/lib/stores/tool-workspace-store";

export function DecisionJourney() {
  const compareCount = useToolWorkspaceStore((s) => s.compareSlugs.length);
  const savedCount = useToolWorkspaceStore((s) => s.savedSlugs.length);

  const suggestedId: DecisionLifecycleStage =
    savedCount > 0 && compareCount >= 2
      ? "ricorda"
      : compareCount >= 2
        ? "decidi"
        : compareCount === 1
          ? "confronta"
          : savedCount > 0
            ? "valuta"
            : "scopri";

  const [overrideId, setOverrideId] = useState<DecisionLifecycleStage | null>(null);
  const activeId = overrideId ?? suggestedId;
  const activeIndex = DECISION_LIFECYCLE.indexOf(activeId);

  return (
    <div className="tv-decision-track def-cockpit__journey" aria-label="Percorso di decisione TooolVibes">
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
      <ol className="tv-decision-track__rail" aria-label="Cinque tappe">
        {DECISION_LIFECYCLE.map((stage, index) => {
          const done = index < activeIndex;
          const active = index === activeIndex;
          return (
            <li
              key={stage}
              className={[done && "is-done", active && "is-active"].filter(Boolean).join(" ") || undefined}
              data-step={stage}
            >
              <button
                type="button"
                className="tv-decision-track__node"
                aria-current={active ? "step" : undefined}
                aria-pressed={active}
                onClick={() => setOverrideId(stage)}
              >
                <span className="tv-decision-track__dot" aria-hidden="true" />
                <strong>{DECISION_LIFECYCLE_LABELS[stage]}</strong>
              </button>
            </li>
          );
        })}
      </ol>
      <div className="tv-decision-track__panel" role="status">
        <p>
          <span className="tv-decision-track__hint">{DECISION_LIFECYCLE_HINTS[activeId]}</span>
          {" "}
          {DECISION_LIFECYCLE_COPY[activeId]}
        </p>
        <Link href={DECISION_LIFECYCLE_HREFS[activeId]}>
          Continua da {DECISION_LIFECYCLE_LABELS[activeId]}
        </Link>
      </div>
    </div>
  );
}
