type GuideMastheadProps = {
  totalGuides: number;
  totalReadingMinutes: number;
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
  totalTools,
  totalCollections,
}: GuideMastheadProps) {
  return (
    <header className="guides-masthead" aria-labelledby="guides-masthead-title">
      <div className="guides-masthead__lede">
        <p className="guides-kicker">Sezione Guide · TooolVibes</p>
        <h1 id="guides-masthead-title" className="guides-masthead__title">
          Guide scritte per <em>decidere</em>.
        </h1>
        <p className="guides-masthead__dek">
          Letture lunghe su un tool o un flusso. Tesi, struttura, parere.
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
        </div>
      </div>
    </header>
  );
}
