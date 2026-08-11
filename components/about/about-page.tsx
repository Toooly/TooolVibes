import {
  BrainCircuit,
  Code2,
  Cpu,
  Handshake,
  Layers3,
  Rocket,
  ShieldCheck,
  Sparkles,
  Target,
  Workflow,
} from "lucide-react";

import { PremiumBadge, PremiumLink } from "@/components/ui/premium";
import { RouteMarker } from "@/components/ui/route-marker";
import { AboutHero } from "@/components/about/about-hero";
import { AboutServices, type AboutService } from "@/components/about/about-services";
import { getNavDestination } from "@/lib/navigation/selectors";

const contactEmailDestination = getNavDestination("contact-email");

const serviceCards: ReadonlyArray<AboutService> = [
  {
    title: "Strategia digitale",
    label: "01",
    copy: "Trasformiamo obiettivi, vincoli e priorità in una roadmap concreta, misurabile e pronta da eseguire.",
    icon: <Target className="size-5" aria-hidden="true" />,
    accent: "#6a3cff",
  },
  {
    title: "Web app su misura",
    label: "02",
    copy: "Progettiamo prodotti veloci e accessibili, costruiti intorno ai flussi reali delle persone che li useranno.",
    icon: <Code2 className="size-5" aria-hidden="true" />,
    accent: "#39d2f6",
  },
  {
    title: "Automazioni AI",
    label: "03",
    copy: "Colleghiamo modelli, dati e strumenti per eliminare passaggi ripetitivi senza perdere controllo sul processo.",
    icon: <BrainCircuit className="size-5" aria-hidden="true" />,
    accent: "#f3bf4c",
  },
  {
    title: "Sistemi e integrazioni",
    label: "04",
    copy: "Facciamo dialogare piattaforme, API e contenuti in un'architettura stabile, leggibile e facile da mantenere.",
    icon: <Cpu className="size-5" aria-hidden="true" />,
    accent: "#10b981",
  },
  {
    title: "Esperienze e interfacce",
    label: "05",
    copy: "Diamo forma a interfacce chiare, riconoscibili e curate in ogni stato, dal primo accesso al risultato finale.",
    icon: <Layers3 className="size-5" aria-hidden="true" />,
    accent: "#ec4899",
  },
  {
    title: "Lancio e crescita",
    label: "06",
    copy: "Prepariamo il rilascio, osserviamo i segnali utili e miglioriamo il prodotto con cicli brevi e decisioni motivate.",
    icon: <Rocket className="size-5" aria-hidden="true" />,
    accent: "#4f46e5",
  },
];

const aboutFeatures = [
  [Sparkles, "Pensiero chiaro", "Partiamo dal problema e rendiamo esplicite le decisioni prima di costruire."],
  [Workflow, "Metodo operativo", "Discovery, design e sviluppo avanzano nello stesso flusso, senza passaggi opachi."],
  [Handshake, "Partner veri", "Condividiamo priorita, vincoli e progressi con un confronto diretto e continuo."],
] as const;

const heroCopy =
  "Siamo un team operativo che unisce strategia, design e tecnologia per trasformare idee complesse in prodotti semplici da capire e usare.";
const servicesIntroCopy =
  "Dalla prima decisione al rilascio, costruiamo sistemi digitali coerenti: meno passaggi dispersi, più controllo e un risultato che resta solido nel tempo.";
const teamCaptionCopy =
  "Discovery, design e build restano nello stesso flusso. Ogni fase condivide il contesto: il progetto resta veloce senza perdere qualità o intenzione.";
const communityCopy =
  "Condividi ciò che stai costruendo, confrontati con persone operative e trova strumenti, metodo e feedback per fare il prossimo passo.";

export function AboutPage() {
  return (
    <div className="page-shell pb-24 pt-4 sm:pb-18 sm:pt-6">
      {/* ─── Identity header (server) ─── */}
      <header className="v-about-identity">
        <RouteMarker
          index="02"
          label="Chi siamo"
          status="Team operativo"
          density="hero"
        />
        <h1 className="mt-5 max-w-[14ch] text-balance text-[clamp(2.35rem,9vw,5.15rem)] font-semibold leading-[0.96] text-[var(--tv-ink-primary)]">
          Persone vere, prodotti digitali vivi.
        </h1>
      </header>

      {/* ─── Hero composition (client island — motion) ─── */}
      <div className="mt-6 sm:mt-7">
        <AboutHero heroCopy={heroCopy} teamCaptionCopy={teamCaptionCopy} />
      </div>

      {/* ─── Servizi ─── */}
      <section className="v-about-services-section relative mt-8 overflow-hidden px-4 py-7 sm:mt-10 sm:px-7 sm:py-9 lg:px-8">
        <div className="relative grid gap-7 lg:grid-cols-[minmax(19rem,0.72fr)_minmax(0,1.28fr)] lg:items-start">
          <div className="lg:sticky lg:top-28">
            <PremiumBadge tone="dark" className="after:!hidden">
              I servizi che offriamo
            </PremiumBadge>
            <h2 className="mt-4 max-w-[11ch] text-[clamp(2rem,6vw,4.25rem)] leading-[0.98] text-white">
              Dal caos al sistema.
            </h2>
            <p className="mt-5 max-w-[34rem] text-[0.98rem] leading-7 text-white/72">
              {servicesIntroCopy}
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
              <PremiumLink href={contactEmailDestination.href} tone="primary">
                Raccontaci il progetto
              </PremiumLink>
              <a
                href="#servizi"
                className="v-about-secondary-cta"
              >
                Vedi servizi
                <span aria-hidden="true" className="v-about-secondary-cta__arrow">→</span>
              </a>
            </div>
          </div>

          <div id="servizi">
            <AboutServices services={serviceCards} />
          </div>
        </div>
      </section>

      {/* ─── Feature cards ─── */}
      <section className="motion-stagger mt-6 grid gap-3 sm:mt-8 md:grid-cols-3">
        <div className="mb-2 md:col-span-3">
          <PremiumBadge tone="accent" className="after:!hidden">
            Come lavoriamo
          </PremiumBadge>
          <h2 className="mt-3 max-w-[18ch] text-[clamp(1.8rem,5vw,2.8rem)] leading-[1.02] text-[var(--tv-ink-primary)]">
            Una rotta, non una pila di card.
          </h2>
        </div>
        {aboutFeatures.map(([Icon, title, copy]) => (
          <article key={title} className="v-about-feature-card">
            <Icon className="v-about-feature-icon" aria-hidden="true" />
            <h3 className="mt-4 text-[1.1rem] font-semibold text-[var(--tv-ink-primary)]">
              {title}
            </h3>
            <p className="mt-2 text-sm leading-6 text-[var(--tv-ink-secondary)]">{copy}</p>
          </article>
        ))}
      </section>

      {/* ─── CTA ─── */}
      <section className="v-about-cta-section mt-6 flex flex-col gap-4 sm:mt-8 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <PremiumBadge tone="accent" className="after:!hidden">
            <ShieldCheck className="mr-1 inline size-3.5" aria-hidden="true" />
            Una community che costruisce
          </PremiumBadge>
          <p className="mt-3 max-w-[48rem] text-[1rem] leading-7 text-[var(--tv-ink-secondary)]">
            {communityCopy}
          </p>
        </div>
        <PremiumLink href="/community" tone="premium" className="w-full shrink-0 sm:w-auto">
          Entra nella community
        </PremiumLink>
      </section>
    </div>
  );
}
