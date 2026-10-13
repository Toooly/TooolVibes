"use client";

import { LocalizedText } from "@/components/i18n/localized-text";
import { useId } from "react";

import {
  COMPARE_OBJECTIVES,
  describeCompareObjectiveWeights,
  type CompareObjective,
} from "@/lib/compare/compare-objective";

/**
 * BATCH 34 / FLOW-603 — selettore obiettivo condiviso mobile/desktop.
 *
 * Stesso markup e stessa guida alla lettura su entrambe le superfici:
 * radio native dentro un fieldset (frecce tastiera e screen reader
 * funzionano senza logica custom). Gli obiettivi orientano la scelta, ma non
 * producono punteggi né vincitori automatici.
 */
export function CompareObjectiveSelector({
  objective,
  onObjectiveChange,
  idPrefix,
}: {
  objective: CompareObjective | null;
  onObjectiveChange: (objective: CompareObjective | null) => void;
  /** Prefisso unico per istanza (mobile e desktop sono montati insieme). */
  idPrefix: string;
}) {
  const reactId = useId();
  const groupName = `${idPrefix}-compare-objective-${reactId}`;
  const explanation = describeCompareObjectiveWeights(objective);

  return (
    <fieldset className="compare-objective">
      <legend className="compare-objective__legend"><LocalizedText>{"Obiettivo del confronto "}</LocalizedText></legend>

      <div className="compare-objective__options">
        <label className="compare-objective__chip" data-active={objective === null}>
          <input
            type="radio"
            className="compare-objective__input"
            name={groupName}
            value=""
            checked={objective === null}
            onChange={() => onObjectiveChange(null)}
          />
          <span className="compare-objective__chip-label"><LocalizedText>{"Neutro"}</LocalizedText></span>
        </label>

        {COMPARE_OBJECTIVES.map((option) => (
          <label
            key={option.key}
            className="compare-objective__chip"
            data-active={objective === option.key}
          >
            <input
              type="radio"
              className="compare-objective__input"
              name={groupName}
              value={option.key}
              checked={objective === option.key}
              onChange={() => onObjectiveChange(option.key)}
            />
            <span className="compare-objective__chip-label"><LocalizedText>{option.label}</LocalizedText></span>
          </label>
        ))}
      </div>

      <div className="compare-objective__explain" aria-live="polite">
        {explanation.map((line) => (
          <p key={line} className="compare-objective__explain-line">
            <LocalizedText>{line}</LocalizedText>
          </p>
        ))}
      </div>
    </fieldset>
  );
}
