import { Sparkles } from "lucide-react";

import type { CuratedCollection } from "@/lib/types/collection";

type CollectionScenarioV4Props = {
  collection: CuratedCollection;
};

/**
 * Scenario V4 — visual sequence, not paragraph inside a card.
 *
 * Renders the scenario body as a step-by-step sequence:
 *   - Each sentence/clause becomes a numbered step
 *   - Connector markers between steps
 *   - "Scenario ipotetico" disclaimer at the end
 *
 * If the scenario is short (<=2 sentences), renders as a single
 * paragraph with the disclaimer.
 */
export function CollectionScenarioV4({ collection }: CollectionScenarioV4Props) {
  const scenario = collection.scenario;
  if (!scenario || !scenario.body) return null;

  const text = scenario.body;
  // Split by sentence-like delimiters. Conservative — keeps Italian
  // punctuation intact.
  const steps = text
    .split(/(?<=[.!?])\s+/)
    .map((s: string) => s.trim())
    .filter(Boolean);

  const isShort = steps.length <= 2;

  return (
    <section
      className="cx-scenario-v4 motion-reveal"
      aria-labelledby="cx-scenario-title"
    >
      <header className="cx-scenario-v4__head">
        <span className="cx-scenario-v4__eyebrow">
          <Sparkles className="size-3.5" aria-hidden="true" />
          Esempio reale
        </span>
        <h2 id="cx-scenario-title" className="cx-scenario-v4__title">
          {scenario.title || "Come si svolge, in pratica"}
        </h2>
      </header>

      {isShort ? (
        <p className="cx-scenario-v4__body">{text}</p>
      ) : (
        <ol className="cx-scenario-v4__steps">
          {steps.map((step: string, index: number) => (
            <li key={index} className="cx-scenario-v4__step">
              <span className="cx-scenario-v4__step-num" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <p className="cx-scenario-v4__step-text">{step}</p>
            </li>
          ))}
        </ol>
      )}

      <p className="cx-scenario-v4__disclaimer">
        Scenario ipotetico ma credibile. Non si basa su un cliente
        reale.
      </p>
    </section>
  );
}
