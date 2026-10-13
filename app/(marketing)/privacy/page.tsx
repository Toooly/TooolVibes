import { LocalizedText, LocalizedAttributes } from "@/components/i18n/localized-text";
import type { Metadata } from "next";

import { LegalPageShell } from "@/components/legal/legal-page-shell";
import { createPublicPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPublicPageMetadata({
  title: "Informativa privacy",
  description: "Informazioni sul trattamento dei dati personali in TooolVibes.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <LocalizedAttributes><LegalPageShell
      index="L-01"
      title="Privacy"
      description="Come TooolVibes tratta i dati necessari a offrire account, preferenze e comunicazioni richieste."
    >
      <p><LocalizedText>{"TooolVibes raccoglie solo i dati necessari per far funzionare account, preferenze salvate, richieste inviate e comunicazioni richieste dagli utenti. "}</LocalizedText></p>
      <p><LocalizedText>{"I dati tecnici e di navigazione vengono usati per sicurezza, manutenzione e miglioramento del servizio. Le richieste inviate tramite form vengono conservate per gestire la risposta editoriale o operativa. "}</LocalizedText></p>

      <h3><LocalizedText>{"Finalità pubblicitaria e fornitore terzo"}</LocalizedText></h3>
      <p><LocalizedText>{"TooolVibes può mostrare pubblicità tramite il fornitore terzo"}</LocalizedText><LocalizedText>{" "}</LocalizedText>
        <strong><LocalizedText>{"TinyAdz"}</LocalizedText></strong><LocalizedText>{" (dominio "}</LocalizedText><code>cdn.apitiny.net</code><LocalizedText>{"). Questa finalità è "}</LocalizedText><strong><LocalizedText>{"disattivata per impostazione predefinita"}</LocalizedText></strong><LocalizedText>{" ed è attivata esclusivamente sulla base del tuo consenso specifico. "}</LocalizedText></p>
      <p><LocalizedText>{"Le categorie di dati tecnici osservati in questa finalità includono: "}</LocalizedText></p>
      <ul>
        <li><LocalizedText>{"indirizzi e parametri di richiesta di rete verso "}</LocalizedText><code>cdn.apitiny.net</code>;</li>
        <li><LocalizedText>{"dimensioni e contesto dello schermo/visione del dispositivo;"}</LocalizedText></li>
        <li><LocalizedText>{"identificatori locali generati dal runtime di TinyAdz (ad es. la cronologia di visualizzazione degli annunci in salvataggio locale);"}</LocalizedText></li>
        <li><LocalizedText>{"segnali di interazione (impression, visita, clic) rispetto ai componenti pubblicitari."}</LocalizedText></li>
      </ul>
      <p><LocalizedText>{"La base giuridica di questa finalità è il"}</LocalizedText><LocalizedText>{" "}</LocalizedText>
        <strong><LocalizedText>{"consenso"}</LocalizedText></strong><LocalizedText>{". Puoi concederlo, negarlo o revocarlo in qualsiasi momento tramite i comandi di preferenza (banner di consenso e link “Gestisci preferenze” nel footer). "}</LocalizedText></p>
      <p><LocalizedText>{"In caso di revoca, TinyAdz viene interrotto e la pagina viene ricaricata per rimuovere i componenti già eseguiti. Le richieste verso il fornitore sono contrastate mentre il consenso è assente. "}</LocalizedText></p>
      <p><LocalizedText>{"Per informazioni sul trattamento da parte del fornitore terzo, fai riferimento alle informative pubblicate da TinyAdz relative al servizio streaming/inserzionisti disponibile sulla sua piattaforma (laddove fornite). TooolVibes non è responsabile delle privacy policy di soggetti terzi. "}</LocalizedText></p>
      <p><LocalizedText>{"Per domande o richieste sui dati personali puoi scrivere a"}</LocalizedText><LocalizedText>{" "}</LocalizedText>
        <a href="mailto:hello@tooolvibes.com"><LocalizedText>{"hello@tooolvibes.com"}</LocalizedText></a>.
      </p>
    </LegalPageShell></LocalizedAttributes>
  );
}
