import Link from "next/link";
import { ArrowRight } from "lucide-react";

import type { ToolPublicView } from "@/lib/data/tool-public-view";
import { buildAlternativeWhy } from "@/lib/data/tool-detail-derivation";

import { AlternativeDecisionCard } from "./alternative-decision-card";

/**
 * G. Alternatives Decision Desk
 * Server container + client card. Replaces ArchiveV4ToolCard with
 * AlternativeDecisionCard on the ivory surface.
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
            Tre profili affini, ciascuno con un taglio diverso. Le schede qui
            sotto usano la stessa grammatica del catalogo: salva, confronta,
            apri senza perdere lo stato.
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

      <div className="td-final-alternatives__grid">
        {related.map((alt) => {
          const why = buildAlternativeWhy(current, alt);
          return (
            <div key={alt.slug} className="td-final-alt">
              <div className="td-final-alt__why" aria-label={`Perché ${alt.name}`}>
                <strong>Perché {alt.name}</strong>
                {why}
              </div>
              <AlternativeDecisionCard tool={alt} />
            </div>
          );
        })}
      </div>
    </section>
  );
}
