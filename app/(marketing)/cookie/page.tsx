import type { Metadata } from "next";

import { LegalPageShell } from "@/components/legal/legal-page-shell";
import { createPublicPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPublicPageMetadata({
  title: "Cookie",
  description: "Informazioni sui cookie e sul salvataggio locale usati da TooolVibes.",
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
      <p>
        Puoi gestire o cancellare cookie e dati locali dalle impostazioni del
        browser. Alcune funzioni potrebbero non essere disponibili dopo la
        cancellazione.
      </p>
    </LegalPageShell>
  );
}
