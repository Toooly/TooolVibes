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
    <section
      data-cx-accent="indigo"
      className="cx-decision-notes-v4"
      aria-labelledby="cx-decision-notes-title"
    >
      <header className="cx-decision-notes-v4__head">
        <span className="cx-decision-notes-v4__eyebrow">
          Decision notes
        </span>
        <h2 id="cx-decision-notes-title" className="cx-decision-notes-v4__title">
          Cosa ci tiene d’occhio su questo stack
        </h2>
        <p className="cx-decision-notes-v4__lede">
          Note editoriali, non KPI. Le cose che vale la pena sapere prima
          di partire.
        </p>
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
              <h3 className="cx-decision-notes-v4__group-title">Cosa regge</h3>
            </div>
            <p className="cx-decision-notes-v4__group-body">{di.strongest}</p>
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
              <h3 className="cx-decision-notes-v4__group-title">
                Cosa ci tiene d’occhio
              </h3>
            </div>
            {di.weakest && (
              <p className="cx-decision-notes-v4__group-body">
                <strong>Punto debole.</strong> {di.weakest}
              </p>
            )}
            {di.fragility && (
              <p className="cx-decision-notes-v4__group-body">
                <strong>Dove si rompe.</strong> {di.fragility}
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
              <h3 className="cx-decision-notes-v4__group-title">
                Scelte a lungo termine
              </h3>
            </div>
            {di.vendor_lock_in && (
              <p className="cx-decision-notes-v4__group-body">
                <strong>Vendor lock-in.</strong> {di.vendor_lock_in}
              </p>
            )}
            {di.data_privacy && (
              <p className="cx-decision-notes-v4__group-body">
                <strong>Privacy / dati.</strong> {di.data_privacy}
              </p>
            )}
            {di.scalability && (
              <p className="cx-decision-notes-v4__group-body">
                <strong>Quando smette di scalare.</strong> {di.scalability}
              </p>
            )}
          </article>
        )}
      </div>
    </section>
  );
}
