import type { ReactNode } from "react";

import type { ToolPublicView } from "@/lib/data/tool-public-view";
import { formatItalianDate } from "@/lib/utils";

type VisualLabProductIntelligenceProps = {
  tool: ToolPublicView;
};

export function VisualLabProductIntelligence({ tool }: VisualLabProductIntelligenceProps) {
  const formattedPublishedAt = tool.publishedAt
    ? formatItalianDate(tool.publishedAt)
    : "Data non disponibile";

  const rows: { label: string; value: ReactNode }[] = [
    { label: "Categoria", value: tool.categoryLabel },
    { label: "Livello", value: tool.levelLabel ?? "Non specificato" },
    { label: "Dominio", value: tool.domain },
    { label: "Pubblicato", value: formattedPublishedAt },
    { label: "Lettura", value: tool.readingTime ?? "Non disponibile" },
    {
      label: "Tag",
      value:
        tool.tags.length > 0 ? (
          <ul className="td-lab-intel__chips">
            {tool.tags.map((t) => (
              <li key={t}>#{t}</li>
            ))}
          </ul>
        ) : (
          <span className="is-empty">Nessun tag associato</span>
        ),
    },
    {
      label: "Punti forti",
      value:
        tool.highlights.length > 0 ? (
          <ul>
            {tool.highlights.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        ) : (
          <span className="is-empty">Punti forti non ancora pubblicati</span>
        ),
    },
    {
      label: "In evidenza",
      value: tool.toolOfWeek
        ? "Sì — Tool della settimana"
        : tool.featured
          ? "Sì — in evidenza editoriale"
          : "No — profilo standard del catalogo",
    },
  ];

  return (
    <section
      id="td-lab-information"
      className="td-lab-intel"
      aria-labelledby="td-lab-intel-title"
    >
      <header className="td-lab-intel__head">
        <p className="td-lab-section-eyebrow">Product intelligence</p>
        <h2 id="td-lab-intel-title" className="td-lab-section-title">
          Cosa devi sapere prima di provarlo.
        </h2>
      </header>

      <div className="td-lab-intel__scan" aria-hidden="true">
        <span className="td-lab-intel__scan-line" />
      </div>

      <dl className="td-lab-intel__list">
        {rows.map((row, i) => (
          <div key={row.label} className="td-lab-intel__row" data-index={i + 1}>
            <dt>
              <span className="td-lab-intel__node" aria-hidden="true" />
              {row.label}
            </dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
