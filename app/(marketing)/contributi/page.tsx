import type { Metadata } from "next";
import Link from "next/link";
import { FileCheck2, Lightbulb, Send, Sparkles } from "lucide-react";

import { ResponsiveDisclosureCard } from "@/components/ui/responsive-disclosure-card";
import { RouteMarker } from "@/components/ui/route-marker";
import { createPublicPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPublicPageMetadata({
  title: "Contributi",
  description:
    "Proponi un tool, racconta un flusso di lavoro o segnala una correzione alla redazione TooolVibes.",
  path: "/contributi",
  openGraphDescription:
    "Un canale editoriale per proporre tool, flussi e correzioni utili.",
});

const contributionTypes = [
  {
    title: "Un tool da valutare",
    copy: "Indica il link ufficiale, il problema che risolve e per chi può essere utile.",
    icon: Sparkles,
  },
  {
    title: "Un flusso che funziona",
    copy: "Racconta i passaggi essenziali e il contesto: la redazione può trasformarlo in una guida utile.",
    icon: Lightbulb,
  },
  {
    title: "Una correzione",
    copy: "Se una scheda non è più precisa o completa, segnalarlo aiuta a mantenere il Catalogo affidabile.",
    icon: FileCheck2,
  },
];

export default function ContributiPage() {
  return (
    <div className="page-shell space-y-5 pb-24 pt-4 sm:space-y-7 sm:pb-16 sm:pt-6">
      <section className="hero-shell motion-reveal bg-[var(--tv-surface-raised)] px-5 py-5 text-white before:!hidden after:!hidden sm:rounded-[38px] sm:px-7 sm:py-8">
        <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.6fr)] lg:items-end">
          <div className="max-w-[48rem]">
            <RouteMarker
              index="07"
              label="Contributi"
              status="Canale editoriale"
              density="hero"
              className="mb-5"
            />
            <h1 className="max-w-none text-balance text-[clamp(2rem,8vw,3.35rem)] leading-[1.05] text-white sm:max-w-[22ch]">
              Le scelte migliori <span className="whitespace-nowrap">meritano contesto.</span>
            </h1>
            <p className="mt-4 max-w-[42rem] text-[0.98rem] leading-7 text-white/70 sm:mt-5 sm:text-[1rem]">
              Puoi proporre un tool, raccontare un flusso o correggere una scheda. Ogni invio viene
              letto dalla redazione: non promettiamo pubblicazioni automatiche.
            </p>
          </div>

          <div className="rounded-[24px] border border-[var(--tv-border-subtle)] bg-[var(--tv-surface-elevated)] p-4 sm:rounded-[28px] sm:p-5">
            <Send className="size-5 text-violet-100" aria-hidden="true" />
            <h2 className="mt-4 text-[1.3rem] leading-tight text-white">
              Invia una proposta utile.
            </h2>
            <p className="mt-2 text-sm leading-6 text-white/70">
              Bastano un link ufficiale e poche righe sul caso d&apos;uso.
            </p>
            <Link
              href="/shortlist#wishlist"
              className="mt-5 inline-flex min-h-11 items-center justify-center rounded-[var(--tv-radius-control)] bg-white px-4 text-sm font-semibold text-[var(--tv-surface-raised)] transition-colors hover:bg-violet-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Proponi un tool
            </Link>
          </div>
        </div>
      </section>

      <section aria-labelledby="contribution-types-title">
        <div className="max-w-[42rem]">
          <h2 id="contribution-types-title" className="text-[1.6rem] leading-tight text-[var(--tv-ink-primary)] sm:text-[2rem]">
            Cosa puoi inviare
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--tv-ink-secondary)] sm:text-base">
            I contributi migliori partono da un bisogno concreto e aiutano altre persone a scegliere.
          </p>
        </div>
        <div className="motion-stagger mt-4 grid gap-2 md:mt-5 md:grid-cols-3 md:gap-5">
          {contributionTypes.map((item) => {
            const Icon = item.icon;

            return (
              <ResponsiveDisclosureCard
                key={item.title}
                title={item.title}
                icon={<Icon className="size-4 md:size-5" aria-hidden="true" />}
              >
                <p className="mt-3 text-sm leading-6 text-[var(--tv-ink-secondary)] md:mt-4 md:leading-7">
                  {item.copy}
                </p>
              </ResponsiveDisclosureCard>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 rounded-[24px] border border-[var(--tv-border-subtle)] bg-[var(--tv-surface-raised)] p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:rounded-[30px] sm:p-6">
        <div className="max-w-[48rem]">
          <h2 className="text-[1.35rem] leading-tight text-white sm:text-[1.75rem]">
            Prima di inviare, verifica il Metodo.
          </h2>
          <p className="mt-2 text-sm leading-6 text-white/70">
            Spiega quali fonti e limiti rendono una valutazione editoriale davvero utile.
          </p>
        </div>
        <Link
          href="/metodo"
          className="inline-flex min-h-11 items-center justify-center rounded-[var(--tv-radius-control)] border border-white/20 px-4 text-sm font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Leggi il Metodo
        </Link>
      </section>
    </div>
  );
}
