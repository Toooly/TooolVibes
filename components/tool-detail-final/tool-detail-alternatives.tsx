import { LocalizedText } from "@/components/i18n/localized-text";
import Link from "@/components/ui/app-link";
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
          <p className="td-final-alternatives__eyebrow"><LocalizedText>{"Alternative da confrontare "}</LocalizedText></p>
          <h2
            id="td-final-alternatives-title"
            className="td-final-alternatives__title"
          ><LocalizedText>{`Alternative a ${current.name}`}</LocalizedText></h2>
          <p className="td-final-alternatives__lede">
            <LocalizedText>{"Confronta approcci, punti di forza e limiti."}</LocalizedText>
          </p>
        </div>
        <Link
          href={`/compare?from=${current.slug}`}
          className="td-final-alternatives__compare-link"
        ><LocalizedText>{"Apri il confronto"}</LocalizedText><ArrowRight size={13} aria-hidden="true" />
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
                  <p><LocalizedText>{alt.categoryLabel}</LocalizedText></p>
                </div>
              </div>
              {why || difference ? <p className="td-final-alt-row__why"><LocalizedText>{why || difference}</LocalizedText></p> : null}
              <div className="td-final-alt-row__score">
                {assessment.value !== null ? (
                  <>
                    <strong>{assessment.value.toFixed(1)}</strong>
                    <span><LocalizedText>{editorialScoreBand(assessment.value)}</LocalizedText></span>
                  </>
                ) : (
                  <em><LocalizedText>{"Da valutare"}</LocalizedText></em>
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
