import type { Metadata } from "next";
import { BadgeCheck, ChartNoAxesCombined, QrCode, ShieldCheck } from "lucide-react";

import { AffiliateApplicationForm } from "@/components/affiliates/affiliate-application-form";
import { PremiumBadge, PremiumPanel } from "@/components/ui/premium";
import { RouteMarker } from "@/components/ui/route-marker";
import { createPublicPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPublicPageMetadata({
  title: "Programma affiliati",
  description:
    "Candidati al programma affiliati TooolVibes e scopri come condividere la piattaforma con la tua community.",
  path: "/affiliati",
});

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
    <div className="affiliates-page page-shell py-8 sm:py-12">
      <section className="affiliates-layout grid gap-6 xl:grid-cols-[minmax(0,0.92fr)_minmax(22rem,1.08fr)] xl:items-start">
        <div className="affiliates-intro brand-panel rounded-[var(--radius-xl)] p-5 sm:p-8 xl:p-10">
          <RouteMarker
            index="10"
            label="Rete partner"
            status="Candidature aperte"
            density="hero"
          />

          <PremiumBadge tone="accent" className="mt-5 after:!hidden sm:mt-6">
            Programma su richiesta
          </PremiumBadge>
          <h1 className="mt-3 max-w-none text-[clamp(2.25rem,4.2vw,2.9rem)] leading-[1.02] sm:mt-4 sm:max-w-[20ch]">
            Porta TooolVibes alla tua community.
          </h1>
          <p className="mt-4 max-w-[44rem] text-[1rem] leading-7 sm:mt-5" style={{ color: "var(--muted)" }}>
            Cerchiamo creator, newsletter, community e consulenti che parlano con persone
            interessate a tool AI, automazioni, no-code e scelte software più lucide.
          </p>

          <div className="mt-5 grid grid-cols-3 gap-2 sm:mt-7 sm:gap-3">
            {[
              { label: "Valutazione", value: "Personale" },
              { label: "Codice", value: "Dedicato" },
              { label: "Nuovo invio", value: "Dopo 30 giorni" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-[22px] border px-1.5 py-3 sm:px-4 sm:py-4"
                style={{ borderColor: "var(--tv-border-inverted)", background: "transparent" }}
              >
                <p className="editorial-label break-normal tracking-[0.04em]">
                  {item.label}
                </p>
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
            <PremiumPanel key={step.title} className="p-5 before:!hidden after:!hidden sm:p-6">
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-[18px] border border-[var(--tv-border-subtle)] bg-[var(--tv-surface-elevated)] text-[var(--tv-accent-brand-aa)]">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <h2 className="text-[1.18rem]">{step.title}</h2>
              </div>
              <p className="mt-4 text-[0.9375rem] leading-7" style={{ color: "var(--muted)" }}>
                {step.description}
              </p>
            </PremiumPanel>
          );
        })}
      </section>

      <PremiumPanel className="mt-8 p-5 before:!hidden after:!hidden sm:p-7">
        <div className="grid gap-5 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-center">
          <span className="grid size-14 place-items-center rounded-[22px] border border-[var(--tv-border-subtle)] bg-[var(--tv-surface-elevated)] text-emerald-300">
            <ChartNoAxesCombined className="size-6" aria-hidden="true" />
          </span>
          <div>
            <p className="editorial-label">Come funziona dopo l&apos;approvazione</p>
            <p className="mt-2 text-[0.9375rem] leading-7" style={{ color: "var(--muted)" }}>
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
