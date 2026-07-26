import Link from "next/link";

import type { ToolPublicView } from "@/lib/data/tool-public-view";

type VisualLabEditorialVerdictProps = {
  tool: ToolPublicView;
};

export function VisualLabEditorialVerdict({ tool }: VisualLabEditorialVerdictProps) {
  const serves =
    tool.idealUseCase ??
    tool.whyItMatters ??
    tool.tldr ??
    `${tool.name} è una soluzione adatta a chi cerca uno strumento ${tool.categoryLabel.toLowerCase()} con taglio editoriale.`;

  return (
    <section
      id="td-lab-editorial"
      className="td-lab-verdict"
      aria-labelledby="td-lab-verdict-title"
    >
      <header className="td-lab-verdict__head">
        <p className="td-lab-section-eyebrow">Editorial verdict</p>
        <h2 id="td-lab-verdict-title" className="td-lab-section-title td-lab-section-title--editorial">
          Il punto editoriale dietro {tool.name}.
        </h2>
      </header>

      <div className="td-lab-verdict__composition">
        <article className="td-lab-verdict__lead">
          <span className="td-lab-verdict__index" aria-hidden="true">01</span>
          <h3>A chi serve</h3>
          <p>{serves}</p>
          <span className="td-lab-verdict__trace" aria-hidden="true" />
        </article>

        <div className="td-lab-verdict__stack">
          <article className="td-lab-verdict__panel td-lab-verdict__panel--works">
            <span className="td-lab-verdict__index" aria-hidden="true">02</span>
            <h3>Dove funziona bene</h3>
            {tool.useCases.length > 0 ? (
              <ul>
                {tool.useCases.map((uc) => (
                  <li key={uc}>
                    <span className="td-lab-verdict__node" aria-hidden="true" />
                    {uc}
                  </li>
                ))}
              </ul>
            ) : (
              <p>Le conferme d&apos;uso verificate non sono ancora state pubblicate per questa scheda.</p>
            )}
          </article>

          <article className="td-lab-verdict__panel td-lab-verdict__panel--limits">
            <span className="td-lab-verdict__index" aria-hidden="true">03</span>
            <h3>Limiti da considerare</h3>
            {tool.cautions.length > 0 ? (
              <ul>
                {tool.cautions.map((c) => (
                  <li key={c}>
                    <span className="td-lab-verdict__node" aria-hidden="true" />
                    {c}
                  </li>
                ))}
              </ul>
            ) : (
              <p>
                Nessun limite specifico segnalato in redazione. Verifica sempre i
                termini d&apos;uso ufficiali prima di adottarlo in produzione.
              </p>
            )}
          </article>

          <article className="td-lab-verdict__panel td-lab-verdict__panel--else">
            <span className="td-lab-verdict__index" aria-hidden="true">04</span>
            <h3>Quando scegliere altro</h3>
            <p>
              Se il tuo caso d&apos;uso richiede un taglio verticale diverso (enterprise,
              no-code puro, AI conversazionale lunga), valuta le{" "}
              <Link href="#td-lab-alternatives">alternative in Decision Desk</Link>.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
