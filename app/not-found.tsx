import Link from "@/components/ui/app-link";
import { BrandLogo } from "@/components/layout/brand-logo";

export default function NotFound() {
  // 404 panel is a self-contained dark surface — declare its own
  // foreground hierarchy so it doesn't inherit --foreground (scuro)
  // from the body and break visibility for headings and CTAs.
  return (
    <main className="page-shell py-16 sm:py-24">
      <section
        className="tv-state-panel tv-state-panel--dark mx-auto max-w-xl text-center"
        aria-labelledby="not-found-title"
      >
        <div className="flex justify-center" aria-hidden="true">
          <BrandLogo size={72} priority fallback="png" />
        </div>
        <p className="tv-state-panel__eyebrow mx-auto mt-5 justify-center">
          Pagina non trovata
        </p>
        <p className="tv-brand-stamp tv-brand-stamp--violet mx-auto mt-3">404</p>
        <h1
          id="not-found-title"
          className="mt-5 text-4xl sm:text-5xl"
          style={{ color: "var(--tv-ink-primary)" }}
        >
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
            className="inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-semibold"
            style={{
              background: "var(--tv-accent-primary)",
              color: "var(--tv-ink-on-brand)",
            }}
          >
            Torna alla home
          </Link>
          <Link
            href="/archivio"
            className="inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-semibold"
            style={{
              border: "1px solid var(--tv-border-interactive)",
              color: "var(--tv-ink-primary)",
            }}
          >
            Apri il catalogo
          </Link>
        </div>
      </section>
    </main>
  );
}
