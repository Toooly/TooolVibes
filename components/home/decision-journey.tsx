"use client";

import { LocalizedText, LocalizedAttributes } from "@/components/i18n/localized-text";
import { useState } from "react";
import Link from "@/components/ui/app-link";

import {
  DECISION_LIFECYCLE,
  DECISION_LIFECYCLE_COPY,
  DECISION_LIFECYCLE_HINTS,
  DECISION_LIFECYCLE_HREFS,
  DECISION_LIFECYCLE_LABELS,
  type DecisionLifecycleStage,
} from "@/lib/product/decision-lifecycle";
import { useToolWorkspaceStore } from "@/lib/stores/tool-workspace-store";

const DECISION_LIFECYCLE_CTAS: Record<DecisionLifecycleStage, string> = {
  scopri: "Apri il catalogo",
  valuta: "Apri il catalogo",
  confronta: "Apri il confronto",
  decidi: "Apri le decisioni",
  ricorda: "Apri i salvati",
};

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
    <LocalizedAttributes><div className="tv-decision-track def-cockpit__journey" aria-label="Percorso di decisione TooolVibes">
      <p className="def-cockpit__journey-kicker"><LocalizedText>{"Percorso di decisione "}</LocalizedText>{savedCount > 0 || compareCount > 0 ? (
          <span className="def-cockpit__journey-live">
            <LocalizedText>{compareCount > 0 ? `${compareCount} in confronto` : null}</LocalizedText>
            <LocalizedText>{compareCount > 0 && savedCount > 0 ? " · " : null}</LocalizedText>
            <LocalizedText>{savedCount > 0 ? `${savedCount} salvati` : null}</LocalizedText>
          </span>
        ) : (
          <span className="def-cockpit__journey-live def-cockpit__journey-live--idle"><LocalizedText>{"Inizia dal catalogo "}</LocalizedText></span>
        )}
      </p>
      <LocalizedAttributes><ol className="tv-decision-track__rail" aria-label="Cinque tappe">
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
                <strong><LocalizedText>{DECISION_LIFECYCLE_LABELS[stage]}</LocalizedText></strong>
              </button>
            </li>
          );
        })}
      </ol></LocalizedAttributes>
      <div className="tv-decision-track__panel" role="status">
        <p>
          <span className="tv-decision-track__hint"><LocalizedText>{DECISION_LIFECYCLE_HINTS[activeId]}</LocalizedText></span>
          <LocalizedText>{" "}</LocalizedText>
          <LocalizedText>{DECISION_LIFECYCLE_COPY[activeId]}</LocalizedText>
        </p>
        <Link href={DECISION_LIFECYCLE_HREFS[activeId]}>
          <LocalizedText>{DECISION_LIFECYCLE_CTAS[activeId]}</LocalizedText>
        </Link>
      </div>
    </div></LocalizedAttributes>
  );
}
