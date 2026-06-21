import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy",
  description: "Informazioni sul trattamento dei dati personali in TooolVibes.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-20">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6a3cff]">
        TooolVibes
      </p>
      <h1 className="mt-3 text-4xl font-black text-[#171225]">Privacy</h1>
      <div className="mt-8 space-y-5 text-sm leading-7 text-[#4f4970]">
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
          hello@tooolvibes.com.
        </p>
      </div>
    </section>
  );
}
