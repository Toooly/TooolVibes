import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy",
  description: "Informazioni sul trattamento dei dati personali in TooolVibes.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-20">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
        TooolVibes
      </p>
      <h1 className="mt-3 text-4xl font-black text-[var(--tv-ink-primary)]">Privacy</h1>
      <div className="mt-8 space-y-5 text-sm leading-7 text-[var(--tv-ink-secondary)]">
        <p>
          TooolVibes raccoglie solo i dati necessari per far funzionare account,
          preferenze salvate, richieste inviate e comunicazioni richieste dagli utenti.
        </p>
        <p>
          I dati tecnici e di navigazione vengono usati per sicurezza,
          manutenzione e miglioramento del servizio. Le richieste inviate tramite
          form vengono conservate per gestire la risposta editoriale o operativa.
        </p>
        <p>
          Per domande o richieste sui dati personali puoi scrivere a
          {" "}
          <a
            href="mailto:hello@tooolvibes.com"
            className="font-semibold text-[var(--tv-accent-brand-aa)] underline decoration-current/40 underline-offset-4 transition-colors hover:text-[var(--tv-ink-primary)] focus-visible:text-[var(--tv-ink-primary)]"
          >
            hello@tooolvibes.com
          </a>
          .
        </p>
      </div>
    </section>
  );
}
