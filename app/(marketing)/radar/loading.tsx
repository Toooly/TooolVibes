/**
 * Radar loading route (V2, 2026-08-03).
 *
 * Un solo blocco di caricamento, no H1 (per evitare doppio H1 con la
 * pagina hydrated). Il copy segue il contratto V2:
 *   - Title: "Aggiornamento del Radar"
 *   - Body: "Stiamo recuperando i segnali da Product Hunt. I risultati
 *           compariranno appena saranno disponibili."
 *   - Screen reader: "Aggiornamento del Radar in corso."
 *
 * Niente duplicazioni: il blocco qui è l'unica istanza di "Aggiornamento
 * del Radar" in pagina; il grafico/strumento non riproduce il paragrafo.
 */
export default function RadarLoading() {
  return (
    <div
      className="tv-radar-page"
      data-state="loading"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Aggiornamento del Radar in corso."
    >
      <section
        className="tv-radar tv-radar--loading"
        aria-busy="true"
      >
        <div className="tv-radar__loading-block" role="status">
          <h2 className="tv-radar__loading-title">Aggiornamento del Radar</h2>
          <p className="tv-radar__loading-body">
            Stiamo recuperando i segnali da Product Hunt. I risultati
            compariranno appena saranno disponibili.
          </p>
        </div>
      </section>
    </div>
  );
}
