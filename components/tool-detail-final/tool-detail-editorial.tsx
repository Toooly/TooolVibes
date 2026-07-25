import Link from "next/link";

import type { ToolPublicView } from "@/lib/data/tool-public-view";

/**
 * C. Editorial Rationale
 * Server component. 2x2 cards: chi serve / dove funziona / limiti / quando altro.
 */

type ToolDetailEditorialProps = {
  tool: ToolPublicView;
};

export function ToolDetailEditorial({ tool }: ToolDetailEditorialProps) {
  return (
    <section
      id="td-final-editorial"
      className="td-final-editorial"
      aria-labelledby="td-final-editorial-title"
    >
      <p className="td-final-section-eyebrow">Perché TooolVibes lo consiglia</p>
      <h2 id="td-final-editorial-title" className="td-final-section-title">
        Il punto editoriale dietro {tool.name}.
      </h2>
      <div className="td-final-editorial__grid">
        <article className="td-final-editorial__card">
          <h3>A chi serve</h3>
          <p>
            {tool.idealUseCase ??
              tool.whyItMatters ??
              tool.tldr ??
              `${tool.name} è una soluzione adatta a chi cerca uno strumento ${tool.categoryLabel.toLowerCase()} con taglio editoriale.`}
          </p>
        </article>

        <article className="td-final-editorial__card">
          <h3>Dove funziona bene</h3>
          {tool.useCases.length > 0 ? (
            <ul>
              {tool.useCases.map((uc) => (
                <li key={uc}>{uc}</li>
              ))}
            </ul>
          ) : (
            <p>Le conferme d&apos;uso verificate non sono ancora state pubblicate per questa scheda.</p>
          )}
        </article>

        <article className="td-final-editorial__card td-final-editorial__card--cautions">
          <h3>Limiti da considerare</h3>
          {tool.cautions.length > 0 ? (
            <ul>
              {tool.cautions.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          ) : (
            <p>
              Nessun limite specifico segnalato in redazione. Verifica sempre i
              termini d&apos;uso ufficiali prima di adottarlo in produzione.
            </p>
          )}
        </article>

        <article className="td-final-editorial__card">
          <h3>Quando preferirne un altro</h3>
          <p>
            Se il tuo caso d&apos;uso richiede un taglio verticale diverso (es.
            enterprise, no-code puro, AI conversazionale lunga), valuta le
            <Link href="#td-final-alternatives"> alternative in fondo alla scheda</Link>.
          </p>
        </article>
      </div>
    </section>
  );
}
