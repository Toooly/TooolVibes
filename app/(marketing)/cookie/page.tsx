import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie",
  description: "Informazioni sui cookie e sul salvataggio locale usati da TooolVibes.",
  alternates: { canonical: "/cookie" },
};

export default function CookiePage() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-20">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6a3cff]">
        TooolVibes
      </p>
      <h1 className="mt-3 text-4xl font-black text-[#171225]">Cookie</h1>
      <div className="mt-8 space-y-5 text-sm leading-7 text-[#4f4970]">
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
      </div>
    </section>
  );
}
