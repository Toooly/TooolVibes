import { LocalizedText, LocalizedAttributes } from "@/components/i18n/localized-text";
import type { Metadata } from "next";

import { LegalPageShell } from "@/components/legal/legal-page-shell";
import { createPublicPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPublicPageMetadata({
  title: "Informativa cookie",
  description: "Informazioni sui cookie e salvataggio locale usati da TooolVibes.",
  path: "/cookie",
});

export default function CookiePage() {
  return (
    <LocalizedAttributes><LegalPageShell
      index="L-03"
      title="Cookie"
      description="Le tecnologie locali necessarie a mantenere sessioni, preferenze e stato dell’interfaccia."
    >
      <p><LocalizedText>{"TooolVibes usa cookie tecnici e salvataggio locale per mantenere sessioni, preferenze, shortlist, confronti e stato dell'interfaccia. "}</LocalizedText></p>
      <p><LocalizedText>{"Alcune funzioni, come account e salvataggi sincronizzati, possono richiedere cookie di autenticazione strettamente necessari. "}</LocalizedText></p>

      <h3><LocalizedText>{"Pubblicità e misurazione (TinyAdz)"}</LocalizedText></h3>
      <p><LocalizedText>{"TinyAdz è un fornitore terzo di servizi pubblicitari. È"}</LocalizedText><LocalizedText>{" "}</LocalizedText>
        <strong><LocalizedText>{"disattivato per impostazione predefinita"}</LocalizedText></strong><LocalizedText>{" e viene caricato solo se concedi il consenso pubblicitario. Senza consenso (stato “non fornito” o “rifiutato”) TinyAdz non viene eseguito. "}</LocalizedText></p>
      <p><LocalizedText>{"Le finalità osservate in TooolVibes includono:"}</LocalizedText></p>
      <ul>
        <li><LocalizedText>{"rendering dei componenti pubblicitari (integrazioni iframe da"}</LocalizedText><LocalizedText>{" "}</LocalizedText>
          <code>cdn.apitiny.net/was/…</code>);
        </li>
        <li><LocalizedText>{"rilevamento di traffico non umano ("}</LocalizedText><LocalizedText>{" "}</LocalizedText>
          <code>cdn.apitiny.net/bot-detection</code>);
        </li>
        <li><LocalizedText>{"misurazione di impression e clic (configurazione"}</LocalizedText><LocalizedText>{" "}</LocalizedText>
          <code>cdn.apitiny.net/api/gsc</code><LocalizedText>{" ed eventi di misurazione). "}</LocalizedText></li>
      </ul>
      <p><LocalizedText>{"Origine di rete osservata: "}</LocalizedText><code>cdn.apitiny.net</code><LocalizedText>{". A seconda dell'implementazione attuale, TinyAdz può aggiungere identificatori, memorizzare preferenze locali (per esempio la cronologia di visualizzazione degli annunci) ed eseguire richieste di rete. "}</LocalizedText></p>
      <p><LocalizedText>{"Puoi concedere il consenso con “Accetta tutto” oppure rifiutare le finalità non necessarie con “Rifiuta non necessari”. Puoi anche usare “Personalizza” per gestire la singola finalità “Pubblicità e misurazione TinyAdz”, con “Salva preferenze”. "}</LocalizedText></p>
      <p><LocalizedText>{"Puoi negare o revocare il consenso pubblicitario in qualsiasi momento. La scelta viene salvata e ripristinata al ricaricamento della pagina. "}</LocalizedText></p>
      <p><LocalizedText>{"Per riaprire le preferenze in un secondo momento usa il link"}</LocalizedText><LocalizedText>{" "}</LocalizedText>
        <strong><LocalizedText>{"“Gestisci preferenze”"}</LocalizedText></strong><LocalizedText>{" nel footer del sito. "}</LocalizedText></p>
    </LegalPageShell></LocalizedAttributes>
  );
}
