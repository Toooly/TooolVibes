export default function RadarLoading() {
  return (
    <div className="tv-radar-page" data-state="loading">
      <section
        className="tv-radar"
        aria-labelledby="tv-radar-title"
        aria-busy="true"
      >
        <header className="tv-radar__header">
          <div>
            <p className="tv-radar__eyebrow">Scrivania segnali · Product Hunt</p>
            <h1 id="tv-radar-title">Radar</h1>
            <p className="tv-radar__lede">
              Lanci reali, ordinati per periodo. Nessun dato simulato.
            </p>
          </div>
          <span
            className="tv-radar__status"
            data-state="loading"
            role="status"
            aria-live="polite"
          >
            <span aria-hidden="true" />
            CONNESSIONE
          </span>
        </header>

        <section
          className="tv-radar__panel"
          aria-label="Controlli e risultati Radar in caricamento"
        >
          <p className="tv-radar__panel-hint" role="status">
            Stiamo contattando Product Hunt per recuperare i segnali del
            periodo richiesto. Niente dati fittizi: appena arrivano i risultati
            vedrai la classifica reale.
          </p>
        </section>
      </section>
    </div>
  );
}
