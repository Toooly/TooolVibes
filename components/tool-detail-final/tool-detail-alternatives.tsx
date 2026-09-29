import Link from "next/link";
import { ArrowRight } from "lucide-react";

import type { ToolPublicView } from "@/lib/data/tool-public-view";
import {
  buildAlternativeWhy,
  deriveEssentialDifference,
} from "@/lib/data/tool-detail-derivation";
import { computeEditorialScore, editorialScoreBand } from "@/lib/data/editorial-score";
import { ToolDetailAlternativeActions } from "./tool-detail-alternative-actions";

/**
 * Alternative da confrontare
 * Editorial comparison rows. The tool name is the detail affordance.
 */

type ToolDetailAlternativesProps = {
  current: ToolPublicView;
  related: ToolPublicView[];
};

function alternativeLede(count: number) {
  if (count === 1) {
    return "Un profilo affine, con un taglio diverso. Un confronto rapido per scegliere senza aprire ogni scheda.";
  }
  if (count === 2) {
    return "Due profili affini, ciascuno con un taglio diverso. Un confronto rapido per scegliere senza aprire ogni scheda.";
  }
  if (count === 3) {
    return "Tre profili affini, ciascuno con un taglio diverso. Un confronto rapido per scegliere senza aprire ogni scheda.";
  }
  return `${count} profili affini, ciascuno con un taglio diverso. Un confronto rapido per scegliere senza aprire ogni scheda.`;
}

export function ToolDetailAlternatives({ current, related }: ToolDetailAlternativesProps) {
  if (related.length === 0) return null;

  return (
    <section
      id="td-final-alternatives"
      className="td-final-alternatives"
      aria-labelledby="td-final-alternatives-title"
    >
      <div className="td-final-alternatives__heading-row">
        <div>
          <p className="td-final-alternatives__eyebrow">
            Alternative da confrontare
          </p>
          <h2
            id="td-final-alternatives-title"
            className="td-final-alternatives__title"
          >
            Se ti interessa {current.name}, confronta questi.
          </h2>
          <p className="td-final-alternatives__lede">
            {alternativeLede(related.length)}
          </p>
        </div>
        <Link
          href={`/compare?from=${current.slug}`}
          className="td-final-alternatives__compare-link"
        >
          Apri confronto affiancato
          <ArrowRight size={13} aria-hidden="true" />
        </Link>
      </div>

      <div className="td-final-alternatives__table">
        {related.map((alt) => {
          const why = buildAlternativeWhy(current, alt);
          const difference = deriveEssentialDifference(current, alt);
          const assessment = computeEditorialScore(alt);

          return (
            <article className="td-final-alt-row" key={alt.slug}>
              <div className="td-final-alt-row__identity">
                <span className="td-final-alt-row__mark" aria-hidden="true">{alt.name.slice(0, 1)}</span>
                <div>
                  <Link href={`/toools/${alt.slug}`} className="td-final-alt-cell__link">{alt.name}</Link>
                  <p>{alt.categoryLabel}</p>
                </div>
              </div>
              {why || difference ? <p className="td-final-alt-row__why">{why || difference}</p> : null}
              <div className="td-final-alt-row__score">
                {assessment.value !== null ? (
                  <>
                    <strong>{assessment.value.toFixed(1)}</strong>
                    <span>{editorialScoreBand(assessment.value)}</span>
                  </>
                ) : (
                  <em>Da valutare</em>
                )}
              </div>
              <ToolDetailAlternativeActions slug={alt.slug} name={alt.name} />
            </article>
          );
        })}
      </div>
      <div className="td-final-alt-row__progress" aria-hidden="true">
        {related.map((_, i) => <span key={i} className={i === 0 ? "is-active" : ""} />)}
      </div>
    </section>
  );
}
