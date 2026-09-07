import type { ToolPublicView } from "@/lib/data/tool-public-view";
import { formatItalianDate } from "@/lib/utils";

/**
 * Product information (Dati tecnici).
 * Embedded in Approfondisci; publication/domain/tags live here, not in the hero.
 */

type ToolDetailInformationProps = {
  tool: ToolPublicView;
  embedded?: boolean;
};

export function ToolDetailInformation({
  tool,
  embedded = false,
}: ToolDetailInformationProps) {
  const formattedPublishedAt = tool.publishedAt
    ? formatItalianDate(tool.publishedAt)
    : "Data non disponibile";

  const grid = (
    <dl className="td-final-information__grid" id={embedded ? "td-final-information" : undefined}>
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
        <dt>Analisi</dt>
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
    </dl>
  );

  if (embedded) return grid;

  return (
    <section
      id="td-final-information"
      className="td-final-information"
      aria-labelledby="td-final-information-title"
    >
      <p className="td-final-section-eyebrow">Scheda tecnica</p>
      <h2 id="td-final-information-title" className="td-final-section-title">
        Cosa devi sapere prima di provarlo.
      </h2>
      {grid}
    </section>
  );
}
