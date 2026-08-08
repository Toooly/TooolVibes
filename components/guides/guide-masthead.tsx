import Link from "next/link";

type GuideMastheadProps = {
  totalGuides: number;
  totalReadingMinutes: number;
  topTopics: Array<{ label: string; count: number }>;
  totalTools: number;
  totalCollections: number;
};

function formatBigNumber(n: number): string {
  if (n >= 1000) {
    return `${Math.round(n / 100) / 10}k`;
  }
  return n.toString();
}

export function GuideMasthead({
  totalGuides,
  totalReadingMinutes,
  topTopics,
  totalTools,
  totalCollections,
}: GuideMastheadProps) {
  return (
    <header className="guides-masthead" aria-labelledby="guides-masthead-title">
      <div className="guides-masthead__lede">
        <p className="guides-kicker">Sezione Guide · TooolVibes</p>
        <h1 id="guides-masthead-title" className="guides-masthead__title">
          Guide scritte per <em>decidere</em>, non per riempire una SERP.
        </h1>
        <p className="guides-masthead__dek">
          Letture lunghe, verticali, riscritte da zero per chi deve scegliere
          un tool o impostare un flusso. Ogni guida ha una tesi, una struttura
          e un parere — non una lista di funzioni.
        </p>

        <div className="guides-masthead__meta" aria-label="Cosa contiene la sezione">
          <span>
            <strong>{totalGuides}</strong> guide
          </span>
          <span>
            <strong>{formatBigNumber(totalReadingMinutes)} min</strong> di lettura totale
          </span>
          <span>
            <strong>{totalTools}</strong> tool collegati
          </span>
          <span>
            <strong>{totalCollections}</strong> raccolte
          </span>
        </div>

        <div className="guides-masthead__cta" role="group" aria-label="Azioni rapide">
          <a href="#guides-featured" data-variant="primary">
            Inizia dalla guida in evidenza
            <span aria-hidden>↓</span>
          </a>
          <a href="#guides-all" data-variant="ghost">
            Esplora tutte le guide
            <span aria-hidden>→</span>
          </a>
          <Link href="/archivio" data-variant="ghost">
            Catalogo tool
            <span aria-hidden>↗</span>
          </Link>
        </div>
      </div>

      <div className="guides-masthead__hud" aria-label="A colpo d&apos;occhio">
        <div className="guides-hud-card guides-hud-card--stats">
          <div>
            <p>Guide</p>
            <p>{totalGuides.toString().padStart(2, "0")}</p>
          </div>
          <div>
            <p>Tool</p>
            <p>{totalTools.toString().padStart(2, "0")}</p>
          </div>
          <div>
            <p>Raccolte</p>
            <p>{totalCollections.toString().padStart(2, "0")}</p>
          </div>
        </div>

        <div className="guides-hud-card">
          <p className="guides-hud-card__label">Aree coperte</p>
          <p className="guides-hud-card__hint">
            Ogni guida appartiene a una di queste aree tematiche — la
            filtriamo per te, senza un motore di ricerca rumoroso.
          </p>
          <div className="guides-hud-pill-row">
            {topTopics.map((topic) => (
              <span className="guides-hud-pill" key={topic.label}>
                {topic.label}
                <span style={{ opacity: 0.6 }}>{topic.count}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
