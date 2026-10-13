import { LocalizedText } from "@/components/i18n/localized-text";
import { TrendingUp, AlertTriangle, Scale } from "lucide-react";

import type { CuratedCollection } from "@/lib/types/collection";

type CollectionDecisionNotesV4Props = {
  collection: CuratedCollection;
};

/**
 * Decision Notes V4 — editorial grouping, not 6 KPI cards.
 *
 * Groups the 6 V2 fields into 3 editorial notes:
 *   1. "Cosa regge"     — strongest point
 *   2. "Cosa ci tiene d’occhio" — weakest + fragility
 *   3. "Scelte a lungo termine"  — vendor_lock_in + data_privacy + scalability
 *
 * Visual: typography + spacing, no card proliferation. Each group is
 * a section header + body text. If a group has no content, it is
 * omitted.
 */
export function CollectionDecisionNotesV4({
  collection,
}: CollectionDecisionNotesV4Props) {
  const di = collection.decision_intelligence;
  if (!di) return null;

  const hasGroup1 = Boolean(di.strongest);
  const hasGroup2 = Boolean(di.weakest || di.fragility);
  const hasGroup3 = Boolean(
    di.vendor_lock_in || di.data_privacy || di.scalability,
  );

  if (!hasGroup1 && !hasGroup2 && !hasGroup3) return null;

  return (
    <details
      id="cx-detail-decision"
      className="cx-decision-notes-v4 cx-detail-depth motion-reveal"
      aria-labelledby="cx-decision-notes-title"
    >
      <summary className="cx-detail-depth__summary"><LocalizedText>{"Note di decisione"}</LocalizedText></summary>
      <header className="cx-decision-notes-v4__head">
        <span className="cx-decision-notes-v4__eyebrow"><LocalizedText>{"Decision notes "}</LocalizedText></span>
        <h2 id="cx-decision-notes-title" className="cx-decision-notes-v4__title"><LocalizedText>{"Cosa ci tiene d’occhio su questo stack "}</LocalizedText></h2>
        <p className="cx-decision-notes-v4__lede"><LocalizedText>{"Note editoriali, non KPI. Le cose che vale la pena sapere prima di partire. "}</LocalizedText></p>
      </header>

      <div className="cx-decision-notes-v4__groups">
        {hasGroup1 && (
          <article className="cx-decision-notes-v4__group">
            <div className="cx-decision-notes-v4__group-head">
              <span
                className="cx-decision-notes-v4__group-icon"
                aria-hidden="true"
              >
                <TrendingUp className="size-4" />
              </span>
              <h3 className="cx-decision-notes-v4__group-title"><LocalizedText>{"Cosa regge"}</LocalizedText></h3>
            </div>
            <p className="cx-decision-notes-v4__group-body"><LocalizedText>{di.strongest}</LocalizedText></p>
          </article>
        )}

        {hasGroup2 && (
          <article className="cx-decision-notes-v4__group">
            <div className="cx-decision-notes-v4__group-head">
              <span
                className="cx-decision-notes-v4__group-icon"
                aria-hidden="true"
              >
                <AlertTriangle className="size-4" />
              </span>
              <h3 className="cx-decision-notes-v4__group-title"><LocalizedText>{"Cosa ci tiene d’occhio "}</LocalizedText></h3>
            </div>
            {di.weakest && (
              <p className="cx-decision-notes-v4__group-body">
                <strong><LocalizedText>{"Punto debole."}</LocalizedText></strong> <LocalizedText>{di.weakest}</LocalizedText>
              </p>
            )}
            {di.fragility && (
              <p className="cx-decision-notes-v4__group-body">
                <strong><LocalizedText>{"Dove si rompe."}</LocalizedText></strong> <LocalizedText>{di.fragility}</LocalizedText>
              </p>
            )}
          </article>
        )}

        {hasGroup3 && (
          <article className="cx-decision-notes-v4__group">
            <div className="cx-decision-notes-v4__group-head">
              <span
                className="cx-decision-notes-v4__group-icon"
                aria-hidden="true"
              >
                <Scale className="size-4" />
              </span>
              <h3 className="cx-decision-notes-v4__group-title"><LocalizedText>{"Scelte a lungo termine "}</LocalizedText></h3>
            </div>
            {di.vendor_lock_in && (
              <p className="cx-decision-notes-v4__group-body">
                <strong><LocalizedText>{"Vendor lock-in."}</LocalizedText></strong> <LocalizedText>{di.vendor_lock_in}</LocalizedText>
              </p>
            )}
            {di.data_privacy && (
              <p className="cx-decision-notes-v4__group-body">
                <strong><LocalizedText>{"Privacy / dati."}</LocalizedText></strong> <LocalizedText>{di.data_privacy}</LocalizedText>
              </p>
            )}
            {di.scalability && (
              <p className="cx-decision-notes-v4__group-body">
                <strong><LocalizedText>{"Quando smette di scalare."}</LocalizedText></strong> <LocalizedText>{di.scalability}</LocalizedText>
              </p>
            )}
          </article>
        )}
      </div>
    </details>
  );
}
