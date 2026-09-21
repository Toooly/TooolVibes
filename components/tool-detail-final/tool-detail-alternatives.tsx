import Link from "next/link";
import { ArrowRight } from "lucide-react";

import type { ToolPublicView } from "@/lib/data/tool-public-view";
import {
  buildAlternativeWhy,
  deriveEssentialDifference,
} from "@/lib/data/tool-detail-derivation";
import { computeEditorialScore } from "@/lib/data/editorial-score";

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
            <div className="td-final-alt-row" key={alt.slug}>
              <span className="td-final-alt-cell td-final-alt-cell--tool">
                <Link
                  href={`/toools/${alt.slug}`}
                  className="td-final-alt-cell__link"
                >
                  {alt.name}
                </Link>
              </span>
              {why ? (
                <span className="td-final-alt-cell td-final-alt-cell--reason">
                  {why}
                </span>
              ) : null}
              {difference ? (
                <span className="td-final-alt-cell td-final-alt-cell--difference">
                  {difference}
                </span>
              ) : null}
              <span className="td-final-alt-cell td-final-alt-cell--score">
                {assessment.value !== null ? (
                  <>
                    <strong>{assessment.value.toFixed(1)}</strong>
                    <em>/10</em>
                  </>
                ) : (
                  <em>Da valutare</em>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
