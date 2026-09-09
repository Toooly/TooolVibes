import type { ReactNode } from "react";

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

export function hasToolDetailInformation(tool: ToolPublicView): boolean {
  return (
    Boolean(tool.categoryLabel) ||
    Boolean(tool.levelLabel) ||
    Boolean(tool.domain) ||
    Boolean(tool.publishedAt) ||
    Boolean(tool.readingTime) ||
    tool.tags.length > 0
  );
}

function informationRows(tool: ToolPublicView): Array<{ dt: string; dd: ReactNode }> {
  const rows: Array<{ dt: string; dd: ReactNode }> = [];
  if (tool.categoryLabel) {
    rows.push({ dt: "Categoria", dd: tool.categoryLabel });
  }
  if (tool.levelLabel) {
    rows.push({ dt: "Livello", dd: tool.levelLabel });
  }
  if (tool.domain) {
    rows.push({ dt: "Dominio", dd: tool.domain });
  }
  if (tool.publishedAt) {
    rows.push({ dt: "Pubblicato", dd: formatItalianDate(tool.publishedAt) });
  }
  if (tool.readingTime) {
    rows.push({ dt: "Analisi", dd: tool.readingTime });
  }
  if (tool.tags.length > 0) {
    rows.push({
      dt: "Tag",
      dd: (
        <ul>
          {tool.tags.map((t) => (
            <li key={t}>#{t}</li>
          ))}
        </ul>
      ),
    });
  }
  return rows;
}

export function ToolDetailInformation({
  tool,
  embedded = false,
}: ToolDetailInformationProps) {
  const rows = informationRows(tool);
  if (rows.length === 0) return null;

  const grid = (
    <dl className="td-final-information__grid" id={embedded ? "td-final-information" : undefined}>
      {rows.map((row) => (
        <div className="td-final-information__row" key={row.dt}>
          <dt>{row.dt}</dt>
          <dd>{row.dd}</dd>
        </div>
      ))}
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
