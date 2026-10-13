"use client";

import { useLocale } from "@/components/i18n/locale-provider";
import { LocalizedText } from "@/components/i18n/localized-text";
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
  const { t } = useLocale();
  const scenario = collection.scenario;
  if (!scenario || !scenario.body) return null;

  const text = t(scenario.body);
  // Split by sentence-like delimiters. Conservative — keeps Italian
  // punctuation intact.
  const steps = text
    .split(/(?<=[.!?])\s+/)
    .map((s: string) => s.trim())
    .filter(Boolean);

  const isShort = steps.length <= 2;

  return (
    <details
      id="cx-detail-scenario"
      className="cx-scenario-v4 cx-detail-depth motion-reveal"
      aria-labelledby="cx-scenario-title"
    >
      <summary className="cx-detail-depth__summary"><LocalizedText>{"Esempio reale"}</LocalizedText></summary>
      <header className="cx-scenario-v4__head">
        <span className="cx-scenario-v4__eyebrow">
          <Sparkles className="size-3.5" aria-hidden="true" /><LocalizedText>{"Esempio reale "}</LocalizedText></span>
        <h2 id="cx-scenario-title" className="cx-scenario-v4__title">
          <LocalizedText>{scenario.title || "Come si svolge, in pratica"}</LocalizedText>
        </h2>
      </header>

      {isShort ? (
        <p className="cx-scenario-v4__body"><LocalizedText>{text}</LocalizedText></p>
      ) : (
        <ol className="cx-scenario-v4__steps">
          {steps.map((step: string, index: number) => (
            <li key={index} className="cx-scenario-v4__step">
              <span className="cx-scenario-v4__step-num" aria-hidden="true">
                <LocalizedText>{String(index + 1).padStart(2, "0")}</LocalizedText>
              </span>
              <p className="cx-scenario-v4__step-text"><LocalizedText>{step}</LocalizedText></p>
            </li>
          ))}
        </ol>
      )}

      <p className="cx-scenario-v4__disclaimer"><LocalizedText>{"Scenario ipotetico ma credibile. Non si basa su un cliente reale. "}</LocalizedText></p>
    </details>
  );
}
