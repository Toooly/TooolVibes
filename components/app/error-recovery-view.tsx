"use client";

export type ErrorRecoveryViewProps = {
  error: Error & { digest?: string };
  reset: () => void;
  /** Navigation recovery target rendered as a plain anchor so it also works
   * when the app router tree is unavailable (global error). */
  homeHref?: string;
};

/**
 * Presentational recovery UI shared by the segment error boundary
 * (`app/error.tsx`) and the document-level boundary (`app/global-error.tsx`).
 * It preserves the copy, digest display and reset behavior of the previous
 * boundary and never renders document elements (`html`/`body`): those belong
 * exclusively to `app/global-error.tsx`.
 */
export function ErrorRecoveryView({
  error,
  reset,
  homeHref,
}: ErrorRecoveryViewProps) {
  return (
    <main className="error-recovery-view">
      <section className="error-recovery-view__panel">
        <p className="error-recovery-view__eyebrow">
          TooolVibes
        </p>
        <h1>Qualcosa &egrave; andato storto</h1>
        <p className="error-recovery-view__copy">
          La pagina non &egrave; riuscita a completare il caricamento. Puoi riprovare senza perdere il contesto.
        </p>
        {error.digest ? (
          <p className="error-recovery-view__digest">Codice errore: {error.digest}</p>
        ) : null}
        <div className="error-recovery-view__actions">
          <button
            type="button"
            onClick={reset}
            className="error-recovery-view__primary"
          >
            Riprova
          </button>
          {homeHref ? (
            <a
              href={homeHref}
              className="error-recovery-view__secondary"
            >
              Torna alla home
            </a>
          ) : null}
        </div>
      </section>
    </main>
  );
}
