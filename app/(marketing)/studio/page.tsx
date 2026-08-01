import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Compass, FileText, Layers3 } from "lucide-react";

import { ResponsiveDisclosureCard } from "@/components/ui/responsive-disclosure-card";
import { RouteMarker } from "@/components/ui/route-marker";
import { createPublicPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPublicPageMetadata({
  title: "Studio",
  description:
    "Servizi di ricerca, sistemi decisionali e contenuti editoriali per prodotti, team e organizzazioni.",
  path: "/studio",
  openGraphTitle: "Studio by TooolVibes",
  openGraphDescription:
    "Ricerca, sistemi decisionali e contenuti editoriali per prodotti e team.",
});

const services = [
  {
    title: "Ricerca e mappatura",
    copy: "Ricognizioni chiare su strumenti, categorie e opportunità prima di decidere cosa introdurre.",
    icon: Compass,
  },
  {
    title: "Sistemi decisionali",
    copy: "Criteri, confronti e percorsi per aiutare team e clienti a scegliere con più contesto.",
    icon: Layers3,
  },
  {
    title: "Editoriale di prodotto",
    copy: "Guide, pagine e narrative che rendono comprensibili prodotti complessi senza perdere precisione.",
    icon: FileText,
  },
];

export default function StudioPage() {
  return (
    <div className="page-shell space-y-5 pb-24 pt-4 sm:space-y-7 sm:pb-16 sm:pt-6">
      <section className="hero-shell motion-reveal bg-[var(--tv-surface-raised)] px-5 py-5 text-white before:!hidden after:!hidden sm:rounded-[38px] sm:px-7 sm:py-8">
        <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.6fr)] lg:items-end">
          <div className="max-w-[48rem]">
            <RouteMarker
              index="08"
              label="Studio by TooolVibes"
              status="Servizi"
              density="hero"
              className="mb-5"
            />
            <h1 className="max-w-[16ch] text-[clamp(2rem,8vw,3.35rem)] leading-[1.05] text-white sm:max-w-[22ch]">
              Diamo forma a decisioni più chiare.
            </h1>
            <p className="mt-4 max-w-[42rem] text-[0.98rem] leading-7 text-white/70 sm:mt-5 sm:text-[1rem]">
              Studio by TooolVibes collabora con prodotti e team che hanno bisogno di ricerca,
              struttura e parole precise per orientare persone reali.
            </p>
          </div>

          <div className="rounded-[24px] border border-[var(--tv-border-subtle)] bg-[var(--tv-surface-elevated)] p-4 sm:rounded-[28px] sm:p-5">
            <p className="text-sm leading-6 text-white/70">
              Raccontaci dove la scelta è diventata difficile: arriveremo con una prima lettura
              concreta del problema.
            </p>
            <a
              href="mailto:hello@tooolvibes.com?subject=Studio%20by%20TooolVibes"
              className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-[var(--tv-radius-control)] bg-white px-4 text-sm font-semibold text-[var(--tv-surface-raised)] transition-colors hover:bg-violet-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Parla del progetto
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>

      <section aria-labelledby="studio-services-title">
        <div className="max-w-[42rem]">
          <h2 id="studio-services-title" className="text-[1.6rem] leading-tight text-[var(--tv-ink-primary)] sm:text-[2rem]">
            Servizi dello Studio
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--tv-ink-secondary)] sm:text-base">
            Interventi essenziali, costruiti intorno a una domanda decisionale concreta.
          </p>
        </div>
        <div className="motion-stagger mt-4 grid gap-2 md:mt-5 md:grid-cols-3 md:gap-5">
          {services.map((service) => {
            const Icon = service.icon;

            return (
              <ResponsiveDisclosureCard
                key={service.title}
                title={service.title}
                icon={<Icon className="size-4 md:size-5" aria-hidden="true" />}
              >
                <p className="mt-3 text-sm leading-6 text-[var(--tv-ink-secondary)] md:mt-4 md:leading-7">
                  {service.copy}
                </p>
              </ResponsiveDisclosureCard>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 rounded-[24px] border border-[var(--tv-border-subtle)] bg-[var(--tv-surface-raised)] p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:rounded-[30px] sm:p-6">
        <div className="max-w-[48rem]">
          <h2 className="text-[1.35rem] leading-tight text-white sm:text-[1.75rem]">
            Vuoi capire come lavoriamo?
          </h2>
          <p className="mt-2 text-sm leading-6 text-white/70">
            La missione editoriale e il modo in cui manteniamo TooolVibes sono raccontati in Chi siamo.
          </p>
        </div>
        <Link
          href="/chi-siamo"
          className="inline-flex min-h-11 items-center justify-center rounded-[var(--tv-radius-control)] border border-white/20 px-4 text-sm font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Vai a Chi siamo
        </Link>
      </section>
    </div>
  );
}
