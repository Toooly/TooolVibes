"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="it">
      <body className="min-h-dvh bg-[#f7f5ff] text-[#171225]">
        <main className="flex min-h-dvh items-center justify-center px-6 py-12">
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
            <button
              type="button"
              onClick={reset}
              className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-[#171225] px-5 text-sm font-bold text-white shadow-[0_14px_30px_rgba(23,18,37,0.18)] transition hover:bg-[#2a2140] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6a3cff] focus-visible:ring-offset-2"
            >
              Riprova
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
