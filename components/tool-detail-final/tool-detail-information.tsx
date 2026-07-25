import { Sparkles } from "lucide-react";

import type { ToolPublicView } from "@/lib/data/tool-public-view";
import { formatItalianDate } from "@/lib/utils";

/**
 * E. Product Information
 * Server component. 8 dt/dd rows, honest unavailable states where
 * data is missing.
 */

type ToolDetailInformationProps = {
  tool: ToolPublicView;
};

export function ToolDetailInformation({ tool }: ToolDetailInformationProps) {
  const formattedPublishedAt = tool.publishedAt
    ? formatItalianDate(tool.publishedAt)
    : "Data non disponibile";

  return (
    <section
      id="td-final-information"
      className="td-final-information"
      aria-labelledby="td-final-information-title"
    >
      <p className="td-final-section-eyebrow">
        <Sparkles size={12} aria-hidden="true" />
        Scheda tecnica
      </p>
      <h2 id="td-final-information-title" className="td-final-section-title">
        Cosa devi sapere prima di provarlo.
      </h2>
      <dl className="td-final-information__grid">
        <div className="td-final-information__row">
          <dt>Categoria</dt>
          <dd>{tool.categoryLabel}</dd>
        </div>
        <div className="td-final-information__row">
          <dt>Livello</dt>
          <dd>{tool.levelLabel ?? "Non specificato"}</dd>
        </div>
        <div className="td-final-information__row">
          <dt>Dominio</dt>
          <dd>{tool.domain}</dd>
        </div>
        <div className="td-final-information__row">
          <dt>Pubblicato</dt>
          <dd>{formattedPublishedAt}</dd>
        </div>
        <div className="td-final-information__row">
          <dt>Lettura</dt>
          <dd>{tool.readingTime ?? "Non disponibile"}</dd>
        </div>
        <div className="td-final-information__row">
          <dt>Tag</dt>
          <dd>
            {tool.tags.length > 0 ? (
              <ul>
                {tool.tags.map((t) => (
                  <li key={t}>#{t}</li>
                ))}
              </ul>
            ) : (
              <span className="is-empty">Nessun tag associato</span>
            )}
          </dd>
        </div>
        <div className="td-final-information__row">
          <dt>Punti forti</dt>
          <dd>
            {tool.highlights.length > 0 ? (
              <ul>
                {tool.highlights.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
            ) : (
              <span className="is-empty">Punti forti non ancora pubblicati</span>
            )}
          </dd>
        </div>
        <div className="td-final-information__row">
          <dt>In evidenza</dt>
          <dd>
            {tool.toolOfWeek
              ? "Sì — è il Tool della settimana"
              : tool.featured
                ? "Sì — è in evidenza editoriale"
                : "No — profilo standard del catalogo"}
          </dd>
        </div>
      </dl>
    </section>
  );
}
