import type { Metadata } from "next";

import { LegalPageShell } from "@/components/legal/legal-page-shell";

export const metadata: Metadata = {
  title: "Termini",
  description: "Condizioni essenziali di utilizzo di TooolVibes.",
  alternates: { canonical: "/termini" },
};

export default function TermsPage() {
  return (
    <LegalPageShell
      index="L-02"
      title="Termini"
      description="Le condizioni essenziali per usare i contenuti, le raccolte e le funzioni di scelta di TooolVibes."
    >
      <p>
        TooolVibes offre contenuti editoriali, schede tool, raccolte e funzioni
        di salvataggio pensate per orientare la scelta di strumenti digitali.
      </p>
      <p>
        Le informazioni pubblicate possono cambiare nel tempo. Prima di
        acquistare o adottare un tool, verifica sempre prezzi, condizioni e
        funzionalità sul sito ufficiale del fornitore.
      </p>
      <p>
        Non è consentito usare il servizio per inviare spam, compromettere la
        sicurezza della piattaforma o alterare dati e classifiche.
      </p>
    </LegalPageShell>
  );
}
