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
    <main className="flex min-h-dvh items-center justify-center bg-[#f7f5ff] px-6 py-12 text-[#171225]">
      <section className="w-full max-w-md text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6a3cff]">
          TooolVibes
        </p>
        <h1 className="mt-3 text-2xl font-black">Qualcosa &egrave; andato storto</h1>
        <p className="mt-3 text-sm leading-6 text-[#5d566f]">
          La pagina non &egrave; riuscita a completare il caricamento. Puoi riprovare senza perdere il contesto.
        </p>
        {error.digest ? (
          <p className="mt-2 text-xs text-[#7d748f]">Codice errore: {error.digest}</p>
        ) : null}
        <div className="mt-6 flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#171225] px-5 text-sm font-bold text-white shadow-[0_14px_30px_rgba(23,18,37,0.18)] transition hover:bg-[#2a2140] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6a3cff] focus-visible:ring-offset-2"
          >
            Riprova
          </button>
          {homeHref ? (
            <a
              href={homeHref}
              className="inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-semibold text-[#171225] underline-offset-4 transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6a3cff] focus-visible:ring-offset-2"
            >
              Torna alla home
            </a>
          ) : null}
        </div>
      </section>
    </main>
  );
}
