import { LocalizedText, LocalizedAttributes } from "@/components/i18n/localized-text";
import type { Metadata } from "next";

import { LegalPageShell } from "@/components/legal/legal-page-shell";
import { createPublicPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPublicPageMetadata({
  title: "Termini di servizio",
  description: "Condizioni essenziali di utilizzo di TooolVibes.",
  path: "/termini",
});

export default function TermsPage() {
  return (
    <LocalizedAttributes><LegalPageShell
      index="L-02"
      title="Termini"
      description="Le condizioni essenziali per usare i contenuti, le raccolte e le funzioni di scelta di TooolVibes."
    >
      <p><LocalizedText>{"TooolVibes offre contenuti editoriali, schede tool, raccolte e funzioni di salvataggio pensate per orientare la scelta di strumenti digitali. "}</LocalizedText></p>
      <p><LocalizedText>{"Le informazioni pubblicate possono cambiare nel tempo. Prima di acquistare o adottare un tool, verifica sempre prezzi, condizioni e funzionalità sul sito ufficiale del fornitore. "}</LocalizedText></p>
      <p><LocalizedText>{"Non è consentito usare il servizio per inviare spam, compromettere la sicurezza della piattaforma o alterare dati e classifiche. "}</LocalizedText></p>
    </LegalPageShell></LocalizedAttributes>
  );
}
