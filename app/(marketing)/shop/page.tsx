import { ArrowRight, Boxes, FileText, Layers3, Sparkles, Zap } from "lucide-react";

import { PremiumBadge, PremiumLink, PremiumPanel } from "@/components/ui/premium";
import { siteConfig } from "@/lib/config/site";

export const metadata = {
  title: "Shop",
  description: "Kit, risorse operative e raccolte premium TooolVibes.",
  alternates: { canonical: "/shop" },
};

const shopCards = [
  {
    title: "Kit curati",
    copy: "Selezioni premium di tool e flussi già ragionate per creator, founder e team piccoli.",
    example: "Esempio: kit per MVP, contenuti AI e automazioni di partenza.",
    icon: Layers3,
  },
  {
    title: "Risorse operative",
    copy: "Materiali che riducono attrito: esempi concreti, checklist e percorsi pronti al test.",
    example: "Esempio: brief, prompt pronti e schede per valutare i tool.",
    icon: FileText,
  },
  {
    title: "Percorsi più rapidi",
    copy: "Le risorse premium servono quando vuoi passare più in fretta da scoperta, scelta e implementazione.",
    example: "Esempio: sequenze operative per lanciare, automatizzare o validare.",
    icon: Zap,
  },
];

export default function ShopPage() {
  return (
    <div className="page-shell space-y-5 pb-24 pt-4 sm:space-y-7 sm:pb-16 sm:pt-6">
      <section className="hero-shell hero-shell-shop motion-reveal px-5 py-5 text-white sm:rounded-[38px] sm:px-7 sm:py-8">
        <div className="grid gap-7 lg:grid-cols-[minmax(0,0.94fr)_minmax(20rem,0.8fr)] lg:items-center">
          <div className="max-w-[44rem]">
            <PremiumBadge tone="warning">Shop digitale</PremiumBadge>
            <h1 className="mt-4 max-w-[13ch] text-[clamp(2rem,9vw,3.3rem)] leading-[1.05] text-white">
              Risorse, selezioni premium e percorsi pronti per lavorare più veloce.
            </h1>
            <p className="mt-4 max-w-[40rem] text-[0.98rem] leading-7 text-white/74 sm:mt-5 sm:text-[1rem]">
              Lo shop digitale raccoglie selezioni premium,
              risorse e percorsi più approfonditi. Il punto non è aggiungere rumore: è darti
              materiali più pronti all&apos;uso.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <PremiumLink href={siteConfig.shopUrl} external>
                Apri lo shop digitale
              </PremiumLink>
              <PremiumLink href="/archivio" tone="secondary">
                Vedi catalogo
              </PremiumLink>
            </div>
          </div>

          <div className="hero-mini-visual rounded-[30px] border border-white/12 bg-white/9 p-4 shadow-[0_22px_58px_rgba(8,14,38,0.18)]">
            <div className="flex items-center justify-between gap-3 rounded-[22px] border border-white/10 bg-white/7 p-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/48">
                  Anteprima kit
                </p>
                <p className="mt-1 text-sm font-semibold text-white">
                  Kit operativo TooolVibes
                </p>
              </div>
              <Sparkles className="size-5 text-amber-100" aria-hidden="true" />
            </div>
            <div className="mt-4 grid gap-3">
              {["Tool salvati", "Prompt operativi", "Checklist decisionale"].map((item, index) => (
                <div
                  key={item}
                  className="flex items-center justify-between rounded-[20px] border border-white/10 bg-white/7 p-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid size-9 place-items-center rounded-[14px] bg-white/10 text-xs font-semibold text-white">
                      {index + 1}
                    </span>
                    <span className="text-sm font-semibold text-white/82">{item}</span>
                  </div>
                  <ArrowRight className="size-4 text-white/40" aria-hidden="true" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-2 md:hidden">
        {shopCards.map((item) => {
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
              <div className="micro-popover-panel mt-3 px-3 py-2 text-xs leading-5 text-[var(--muted)]">
                {item.example}
              </div>
            </details>
          );
        })}
      </section>

      <section className="motion-stagger hidden gap-4 md:grid md:grid-cols-3 md:gap-5">
        {shopCards.map((item) => {
          const Icon = item.icon;

          return (
            <PremiumPanel key={item.title} tone="airy" as="article" className="p-5">
              <div className="flex items-start justify-between gap-4">
                <span className="grid size-12 place-items-center rounded-[18px] border border-white/10 bg-white/8 text-white">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <PremiumBadge tone="dark">In preparazione</PremiumBadge>
              </div>
              <h2 className="mt-5 text-[1.38rem] leading-[1.08] text-white">
                {item.title}
              </h2>
              <p className="mt-4 text-[0.98rem] leading-7 text-white/68">
                {item.copy}
              </p>
              <div className="mt-5 rounded-[20px] border border-white/10 bg-white/7 p-4 text-sm leading-6 text-white/64">
                {item.example}
              </div>
            </PremiumPanel>
          );
        })}
      </section>

      <PremiumPanel tone="warm" className="p-4 sm:p-6">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div>
            <PremiumBadge tone="accent">Valore reale</PremiumBadge>
            <h2 className="mt-4 text-[1.75rem] leading-tight text-white sm:text-[2.35rem]">
              Lo shop deve aiutarti a decidere e costruire, non solo vendere file.
            </h2>
            <p className="mt-3 max-w-[48rem] text-sm leading-7 text-white/66">
              Ogni risorsa premium parte da un problema operativo: scegliere una combinazione di tool,
              validare una scelta, automatizzare un passaggio o rendere un flusso replicabile.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-2 min-[380px]:grid-cols-3 lg:grid-cols-1">
            {["Pronto al test", "Curato", "Operativo"].map((item) => (
              <div key={item} className="flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/7 px-3 py-2 text-xs font-semibold text-white/72 sm:px-4 sm:text-sm">
                <Boxes className="size-4 text-violet-100" aria-hidden="true" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </PremiumPanel>
    </div>
  );
}
