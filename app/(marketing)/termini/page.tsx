import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Termini",
  description: "Condizioni essenziali di utilizzo di TooolVibes.",
  alternates: { canonical: "/termini" },
};

export default function TermsPage() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-20">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6a3cff]">
        TooolVibes
      </p>
      <h1 className="mt-3 text-4xl font-black text-[#171225]">Termini</h1>
      <div className="mt-8 space-y-5 text-sm leading-7 text-[#4f4970]">
        <p>
          TooolVibes offre contenuti editoriali, schede tool, raccolte e funzioni
          di salvataggio pensate per orientare la scelta di strumenti digitali.
        </p>
        <p>
          Le informazioni pubblicate possono cambiare nel tempo. Prima di
          acquistare o adottare un tool, verifica sempre prezzi, condizioni e
          funzionalita sul sito ufficiale del fornitore.
        </p>
        <p>
          Non e consentito usare il servizio per inviare spam, compromettere la
          sicurezza della piattaforma o alterare dati e classifiche.
        </p>
      </div>
    </section>
  );
}
