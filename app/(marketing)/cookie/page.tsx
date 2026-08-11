import type { Metadata } from "next";

import { LegalPageShell } from "@/components/legal/legal-page-shell";
import { createPublicPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPublicPageMetadata({
  title: "Cookie",
  description: "Informazioni sui cookie e salvataggio locale usati da TooolVibes.",
  path: "/cookie",
});

export default function CookiePage() {
  return (
    <LegalPageShell
      index="L-03"
      title="Cookie"
      description="Le tecnologie locali necessarie a mantenere sessioni, preferenze e stato dell’interfaccia."
    >
      <p>
        TooolVibes usa cookie tecnici e salvataggio locale per mantenere
        sessioni, preferenze, shortlist, confronti e stato dell&apos;interfaccia.
      </p>
      <p>
        Alcune funzioni, come account e salvataggi sincronizzati, possono
        richiedere cookie di autenticazione strettamente necessari.
      </p>

      <h3>Pubblicità e misurazione (TinyAdz)</h3>
      <p>
        TinyAdz è un fornitore terzo di servizi pubblicitari. È{" "}
        <strong>disattivato per impostazione predefinita</strong> e viene
        caricato solo se concedi il consenso pubblicitario. Senza consenso
        (stato “non fornito” o “rifiutato”) TinyAdz non viene eseguito.
      </p>
      <p>Le finalità osservate in TooolVibes includono:</p>
      <ul>
        <li>
          rendering dei componenti pubblicitari (integrazioni iframe da{" "}
          <code>cdn.apitiny.net/was/…</code>);
        </li>
        <li>
          rilevamento di traffico non umano ({" "}
          <code>cdn.apitiny.net/bot-detection</code>);
        </li>
        <li>
          misurazione di impression e clic (configurazione{" "}
          <code>cdn.apitiny.net/api/gsc</code> ed eventi di misurazione).
        </li>
      </ul>
      <p>
        Origine di rete osservata: <code>cdn.apitiny.net</code>. A seconda
        dell&apos;implementazione attuale, TinyAdz può aggiungere identificatori,
        memorizzare preferenze locali (per esempio la cronologia di
        visualizzazione degli annunci) ed eseguire richieste di rete.
      </p>
      <p>
        Puoi concedere il consenso con “Accetta tutto” oppure rifiutare le
        finalità non necessarie con “Rifiuta non necessari”. Puoi anche usare
        “Personalizza” per gestire la singola finalità “Pubblicità e
        misurazione TinyAdz”, con “Salva preferenze”.
      </p>
      <p>
        Puoi negare o revocare il consenso pubblicitario in qualsiasi momento.
        La scelta viene salvata e ripristinata al ricaricamento della pagina.
      </p>
      <p>
        Per riaprire le preferenze in un secondo momento usa il link{" "}
        <strong>“Gestisci preferenze”</strong> nel footer del sito.
      </p>
    </LegalPageShell>
  );
}
