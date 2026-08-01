import Link from "next/link";
import { BrandLogo } from "@/components/layout/brand-logo";

export default function NotFound() {
  return (
    <main className="page-shell py-16 sm:py-24">
      <section
        className="tv-state-panel mx-auto max-w-xl text-center"
        aria-labelledby="not-found-title"
      >
        <div className="flex justify-center" aria-hidden="true">
          <BrandLogo size={72} priority fallback="png" />
        </div>
        <p className="tv-state-panel__eyebrow mx-auto mt-5 justify-center">
          Coordinata assente
        </p>
        <p className="tv-brand-stamp tv-brand-stamp--violet mx-auto mt-3">404</p>
        <h1 id="not-found-title" className="mt-5 text-4xl sm:text-5xl">
          Questa pagina non è disponibile.
        </h1>
        <p
          className="mx-auto mt-4 max-w-md text-base leading-7"
          style={{ color: "var(--tv-ink-secondary)" }}
        >
          Il contenuto che stai cercando non è stato trovato oppure non è ancora
          pubblicato.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--tv-accent-primary)] px-5 text-sm font-semibold text-white"
          >
            Torna alla home
          </Link>
          <Link
            href="/archivio"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--tv-border-interactive)] px-5 text-sm font-semibold text-[var(--tv-ink-primary)]"
          >
            Apri il catalogo
          </Link>
        </div>
      </section>
    </main>
  );
}
