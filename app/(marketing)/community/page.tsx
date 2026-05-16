import type { Metadata } from "next";
import { ArrowRight, Compass, Lightbulb, MessageSquarePlus, Sparkles, Workflow } from "lucide-react";

import { PremiumBadge, PremiumLink, PremiumPanel } from "@/components/ui/premium";
import { siteConfig } from "@/lib/config/site";

export const metadata: Metadata = {
  title: "Community",
  description:
    "La community TooolVibes per scoprire, proporre e discutere i migliori AI tools, SaaS tools, no-code builder e automazioni.",
  openGraph: {
    title: `Community | ${siteConfig.name}`,
    description:
      "La community TooolVibes per scoprire e proporre i migliori tool digitali.",
    url: `${siteConfig.url}/community`,
  },
};

const contributionCards = [
  {
    title: "Tool emergenti",
    copy: "Segnala prodotti che stanno risolvendo un caso d'uso chiaro, non semplici novità rumorose.",
    icon: Sparkles,
  },
  {
    title: "Workflow pratici",
    copy: "Condividi sequenze reali: cosa usi, in che ordine, con quale risultato.",
    icon: Workflow,
  },
  {
    title: "Criteri editoriali",
    copy: "Aiutaci a distinguere tool belli da tool davvero utili per creator, founder e team.",
    icon: Compass,
  },
];

const communityPicks = [
  "AI app builder da testare in meno di un'ora",
  "Automazioni per content repurposing",
  "Stack no-code per landing e database",
  "Tool Product Hunt da monitorare dopo il lancio",
];

export default function CommunityPage() {
  return (
    <div className="page-shell space-y-5 pb-24 pt-4 sm:space-y-7 sm:pb-16 sm:pt-6">
      <section className="hero-shell hero-shell-community motion-reveal px-5 py-5 text-white sm:rounded-[38px] sm:px-7 sm:py-8">
        <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.72fr)] lg:items-center">
          <div className="max-w-[48rem]">
            <PremiumBadge tone="accent">Community TooolVibes</PremiumBadge>
            <h1 className="mt-4 max-w-[13ch] text-[clamp(2rem,9vw,3.35rem)] leading-[1.05] text-white">
              Tool, workflow e idee migliori restano condivisi.
            </h1>
            <p className="mt-4 max-w-[42rem] text-[0.98rem] leading-7 text-white/70 sm:mt-5 sm:text-[1rem]">
              La community raccoglie suggerimenti, use case e tool emergenti per rendere
              la directory più utile a creator, founder e team.
            </p>
          </div>

          <div className="hero-mini-visual rounded-[24px] border border-white/12 bg-white/9 p-4 shadow-[0_18px_48px_rgba(8,14,38,0.16)] sm:rounded-[28px] sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white/50">
                Partecipa
              </p>
              <MessageSquarePlus className="size-5 text-violet-100" aria-hidden="true" />
            </div>
            <p className="mt-3 text-[1rem] leading-7 text-white/72">
              Il modo più rapido per contribuire oggi è suggerire un tool con link,
              categoria e contesto d&apos;uso.
            </p>
            <PremiumLink href="/wishlist" className="mt-5">
              Suggerisci un tool
            </PremiumLink>
          </div>
        </div>
      </section>

      <section className="grid gap-2 md:hidden">
        {contributionCards.map((item) => {
          const Icon = item.icon;

          return (
            <details
              key={item.title}
              className="micro-details rounded-[20px] border border-[var(--line)] bg-white/76 px-3 py-2.5"
            >
              <summary>
                <span className="inline-flex min-w-0 items-center gap-2">
                  <Icon className="size-4 shrink-0 text-[var(--accent)]" aria-hidden="true" />
                  <span className="truncate">{item.title}</span>
                </span>
              </summary>
              <p className="mt-3 text-sm leading-6 text-[var(--muted-strong)]">
                {item.copy}
              </p>
            </details>
          );
        })}
      </section>

      <section className="motion-stagger hidden gap-4 md:grid md:grid-cols-3 md:gap-5">
        {contributionCards.map((item) => {
          const Icon = item.icon;

          return (
            <PremiumPanel key={item.title} tone="blue" as="article" className="p-5">
              <span className="grid size-12 place-items-center rounded-[18px] border border-white/10 bg-white/8 text-white">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <h2 className="mt-5 text-[1.32rem] leading-tight text-white">{item.title}</h2>
              <p className="mt-3 text-sm leading-7 text-white/66">{item.copy}</p>
            </PremiumPanel>
          );
        })}
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <PremiumPanel tone="airy" className="p-4 sm:p-6">
          <PremiumBadge tone="dark">Come contribuire</PremiumBadge>
          <div className="mt-4 grid gap-2.5 sm:mt-5 sm:gap-3">
            {[
              ["01", "Suggerisci un tool con URL ufficiale e categoria."],
              ["02", "Spiega il workflow o il problema che risolve."],
              ["03", "Noi lo valutiamo e lo trasformiamo in scheda utile."],
            ].map(([step, copy]) => (
              <div key={step} className="flex gap-3 rounded-[18px] border border-white/10 bg-white/7 p-3 sm:rounded-[22px] sm:p-4">
                <span className="text-sm font-semibold text-violet-100">{step}</span>
                <p className="text-sm leading-6 text-white/70">{copy}</p>
              </div>
            ))}
          </div>
        </PremiumPanel>

        <PremiumPanel tone="violet" className="p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <PremiumBadge tone="accent">Community picks</PremiumBadge>
              <h2 className="mt-4 text-[1.65rem] leading-tight text-white sm:text-[2.25rem]">
                Temi che vale la pena raccogliere.
              </h2>
            </div>
            <Lightbulb className="size-5 text-amber-100" aria-hidden="true" />
          </div>
          <div className="mt-4 grid gap-2.5 sm:mt-5 sm:grid-cols-2 sm:gap-3">
            {communityPicks.map((item) => (
              <div key={item} className="group flex items-center justify-between gap-3 rounded-[18px] border border-white/10 bg-white/7 p-3 transition hover:border-violet-200/28 hover:bg-white/10 sm:rounded-[20px] sm:p-4">
                <p className="text-sm font-semibold leading-6 text-white/76">{item}</p>
                <ArrowRight className="size-4 shrink-0 text-white/36 transition group-hover:translate-x-1 group-hover:text-white" aria-hidden="true" />
              </div>
            ))}
          </div>
        </PremiumPanel>
      </div>
    </div>
  );
}
