import type { Metadata } from "next";
import { BadgeCheck, ChartNoAxesCombined, QrCode, ShieldCheck } from "lucide-react";

import { AffiliateApplicationForm } from "@/components/affiliates/affiliate-application-form";
import { BrandLogo } from "@/components/layout/brand-logo";
import { PremiumBadge, PremiumPanel } from "@/components/ui/premium";

export const metadata: Metadata = {
  title: "Programma affiliati",
  description:
    "Candidati al programma affiliati TooolVibes e scopri come condividere la piattaforma con la tua community.",
};

const programSteps = [
  {
    icon: ShieldCheck,
    title: "Valutazione personale",
    description:
      "Leggiamo ogni candidatura per capire pubblico, canali e modo in cui racconteresti TooolVibes.",
  },
  {
    icon: BadgeCheck,
    title: "Conferma dedicata",
    description:
      "Se il profilo è in linea, ti inviamo via email il codice e le indicazioni per iniziare.",
  },
  {
    icon: QrCode,
    title: "Link e QR code",
    description:
      "Ricevi un link personale e un QR code pronti da usare nei tuoi canali.",
  },
];

export default function AffiliatiPage() {
  return (
    <div className="page-shell py-8 sm:py-12">
      <section className="grid gap-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(22rem,1.08fr)] lg:items-start">
        <div className="brand-panel brand-aura rounded-[var(--radius-xl)] p-6 sm:p-8 lg:p-10">
          <div className="flex items-center gap-3">
            <BrandLogo size={58} priority />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                Programma partner TooolVibes
              </p>
              <p className="mt-1 text-sm" style={{ color: "var(--muted-strong)" }}>
                Candidature affiliate
              </p>
            </div>
          </div>

          <PremiumBadge tone="accent" className="mt-6">
            Programma su richiesta
          </PremiumBadge>
          <h1 className="mt-4 text-[2.2rem] leading-[1.02] sm:text-[3.3rem] lg:text-[4rem]">
            Porta TooolVibes alla tua community.
          </h1>
          <p className="mt-5 max-w-[44rem] text-[1rem] leading-8" style={{ color: "var(--muted)" }}>
            Cerchiamo creator, newsletter, community e consulenti che parlano con persone
            interessate a tool AI, automazioni, no-code e scelte software più lucide.
          </p>

          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            {[
              { label: "Valutazione", value: "Personale" },
              { label: "Codice", value: "Dedicato" },
              { label: "Nuovo invio", value: "Dopo 30 giorni" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-[22px] border px-4 py-4"
                style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.72)" }}
              >
                <p className="editorial-label">{item.label}</p>
                <p className="mt-2 text-sm font-semibold">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <AffiliateApplicationForm />
      </section>

      <section className="mt-8 grid gap-4 lg:grid-cols-3">
        {programSteps.map((step) => {
          const Icon = step.icon;
          return (
            <PremiumPanel key={step.title} className="p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-[18px] bg-[rgba(106,60,255,0.1)] text-[var(--accent-strong)]">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <h2 className="text-[1.18rem]">{step.title}</h2>
              </div>
              <p className="mt-4 text-sm leading-7" style={{ color: "var(--muted)" }}>
                {step.description}
              </p>
            </PremiumPanel>
          );
        })}
      </section>

      <PremiumPanel className="mt-8 p-5 sm:p-7">
        <div className="grid gap-5 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-center">
          <span className="grid size-14 place-items-center rounded-[22px] bg-[rgba(15,118,110,0.1)] text-teal-700">
            <ChartNoAxesCombined className="size-6" aria-hidden="true" />
          </span>
          <div>
            <p className="editorial-label">Come funziona dopo l&apos;approvazione</p>
            <p className="mt-2 text-sm leading-7" style={{ color: "var(--muted)" }}>
              Dopo l’approvazione prepariamo il codice referral, generiamo il link dedicato e
              il QR code, poi ti inviamo tutto via email. Se la candidatura non è adatta,
              potrai riprovare dopo 30 giorni.
            </p>
          </div>
        </div>
      </PremiumPanel>
    </div>
  );
}
