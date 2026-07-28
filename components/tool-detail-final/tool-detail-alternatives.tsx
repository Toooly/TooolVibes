import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";

import type { ToolPublicView } from "@/lib/data/tool-public-view";
import {
  buildAlternativeWhy,
  deriveEssentialDifference,
} from "@/lib/data/tool-detail-derivation";
import { computeEditorialScore } from "@/lib/data/editorial-score";

/**
 * G. Alternatives Decision Desk
 * Editorial comparison rows. Each row shows tool name, reason to
 * compare, essential difference, editorial score, and a single open
 * action. No rich cards, no save/compare bulkheads, no Archive DNA.
 */

type ToolDetailAlternativesProps = {
  current: ToolPublicView;
  related: ToolPublicView[];
};

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
            Alternatives Decision Desk
          </p>
          <h2
            id="td-final-alternatives-title"
            className="td-final-alternatives__title"
          >
            Se ti interessa {current.name}, confronta questi.
          </h2>
          <p className="td-final-alternatives__lede">
            Tre profili affini, ciascuno con un taglio diverso. Confronto
            editoriale rapido per scegliere senza aprire ogni scheda.
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
          const { value: score } = computeEditorialScore(alt);

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
              <span className="td-final-alt-cell td-final-alt-cell--reason">
                {why}
              </span>
              <span className="td-final-alt-cell td-final-alt-cell--difference">
                {difference}
              </span>
              <span className="td-final-alt-cell td-final-alt-cell--score">
                <strong>{score.toFixed(1)}</strong>
                <em>/10</em>
              </span>
              <span className="td-final-alt-cell td-final-alt-cell--action">
                <Link
                  href={`/toools/${alt.slug}`}
                  className="td-final-alt-cell__open"
                >
                  Apri scheda
                  <ExternalLink size={12} aria-hidden="true" />
                </Link>
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
