import Link from "next/link";

export default function CompareLoading() {
  return (
    <div className="compare-space-page">
      <section
        className="tool-battle-page tool-battle-page--loading"
        role="status"
        aria-live="polite"
        aria-busy="true"
        aria-label="Preparazione del confronto"
      >
        <header className="tool-battle-page__intro">
          <p className="tool-battle-page__eyebrow">Confronto editoriale</p>
          <h1>Confronto tool</h1>
          <p className="tool-battle-page__lede">
            Scegli 2 o 3 candidati per metterli alla prova fianco a fianco:
            prezzo, piattaforme, tag principali e nota editoriale. Il confronto
            mostra differenze concrete, non classifiche generiche.
          </p>
          <div className="tool-battle-page__cta-row">
            <Link
              href="/archivio"
              className="tool-battle-page__cta tool-battle-page__cta--primary"
            >
              Apri l&apos;archivio
            </Link>
            <Link
              href="/shortlist"
              className="tool-battle-page__cta tool-battle-page__cta--secondary"
            >
              Apri i salvati
            </Link>
          </div>
        </header>

        <div className="tool-battle-page__viewport" aria-label="Slot confronto in preparazione">
          <ol className="tool-battle-page__slots" aria-label="Slot del confronto">
            {[1, 2].map((slot) => (
              <li
                key={slot}
                className="tool-battle-page__slot tool-battle-page__slot--empty"
                aria-label={`Slot ${slot} vuoto`}
              >
                <span className="tool-battle-page__slot-index" aria-hidden="true">
                  {slot}
                </span>
                <p className="tool-battle-page__slot-title">Slot libero</p>
                <p className="tool-battle-page__slot-hint">
                  Aggiungi un tool dall&apos;archivio o dai salvati per riempire questo slot.
                </p>
              </li>
            ))}
          </ol>
          <p className="tool-battle-page__status" role="status">
            Stiamo preparando i tuoi slot. Appena arrivano i dati vedrai i tool qui.
          </p>
        </div>
      </section>
    </div>
  );
}
