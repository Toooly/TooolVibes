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
    <LegalPageShell
      index="L-01"
      title="Privacy"
      description="Come TooolVibes tratta i dati necessari a offrire account, preferenze e comunicazioni richieste."
    >
      <p>
        TooolVibes raccoglie solo i dati necessari per far funzionare account,
        preferenze salvate, richieste inviate e comunicazioni richieste dagli utenti.
      </p>
      <p>
        I dati tecnici e di navigazione vengono usati per sicurezza,
        manutenzione e miglioramento del servizio. Le richieste inviate tramite
        form vengono conservate per gestire la risposta editoriale o operativa.
      </p>

      <h3>Finalità pubblicitaria e fornitore terzo</h3>
      <p>
        TooolVibes può mostrare pubblicità tramite il fornitore terzo{" "}
        <strong>TinyAdz</strong> (dominio <code>cdn.apitiny.net</code>). Questa
        finalità è <strong>disattivata per impostazione predefinita</strong> ed
        è attivata esclusivamente sulla base del tuo consenso specifico.
      </p>
      <p>
        Le categorie di dati tecnici osservati in questa finalità includono:
      </p>
      <ul>
        <li>indirizzi e parametri di richiesta di rete verso
          <code>cdn.apitiny.net</code>;</li>
        <li>dimensioni e contesto dello schermo/visione del dispositivo;</li>
        <li>identificatori locali generati dal runtime di TinyAdz (ad es. la
          cronologia di visualizzazione degli annunci in salvataggio locale);</li>
        <li>segnali di interazione (impression, visita, clic) rispetto ai
          componenti pubblicitari.</li>
      </ul>
      <p>
        La base giuridica di questa finalità è il{" "}
        <strong>consenso</strong>. Puoi concederlo, negarlo o revocarlo in
        qualsiasi momento tramite i comandi di preferenza (banner di consenso e
        link “Gestisci preferenze” nel footer).
      </p>
      <p>
        In caso di revoca, TinyAdz viene interrotto e la pagina viene ricaricata
        per rimuovere i componenti già eseguiti. Le richieste verso il fornitore
        sono contrastate mentre il consenso è assente.
      </p>
      <p>
        Per informazioni sul trattamento da parte del fornitore terzo, fai
        riferimento alle informative pubblicate da TinyAdz relative al servizio
        streaming/inserzionisti disponibile sulla sua piattaforma (laddove
        fornite). TooolVibes non è responsabile delle privacy policy di soggetti
        terzi.
      </p>
      <p>
        Per domande o richieste sui dati personali puoi scrivere a{" "}
        <a href="mailto:hello@tooolvibes.com">hello@tooolvibes.com</a>.
      </p>
    </LegalPageShell>
  );
}
