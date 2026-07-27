import type { Metadata } from "next";

import { LegalPageShell } from "@/components/legal/legal-page-shell";

export const metadata: Metadata = {
  title: "Privacy",
  description: "Informazioni sul trattamento dei dati personali in TooolVibes.",
  alternates: { canonical: "/privacy" },
};

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
      <p>
        Per domande o richieste sui dati personali puoi scrivere a{" "}
        <a href="mailto:hello@tooolvibes.com">hello@tooolvibes.com</a>.
      </p>
    </LegalPageShell>
  );
}
