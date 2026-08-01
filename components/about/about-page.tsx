"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowRight,
  BrainCircuit,
  Code2,
  Cpu,
  Handshake,
  Layers3,
  Rocket,
  ShieldCheck,
  Sparkles,
  Target,
  UsersRound,
  Workflow,
} from "lucide-react";

import { PremiumBadge, PremiumLink } from "@/components/ui/premium";
import { getNavDestination } from "@/lib/navigation/selectors";

const contactEmailDestination = getNavDestination("contact-email");

const serviceCards = [
  {
    title: "Strategia digitale",
    label: "01",
    copy: "Trasformiamo obiettivi, vincoli e priorità in una roadmap concreta, misurabile e pronta da eseguire.",
    icon: Target,
    accent: "#6a3cff",
  },
  {
    title: "Web app su misura",
    label: "02",
    copy: "Progettiamo prodotti veloci e accessibili, costruiti intorno ai flussi reali delle persone che li useranno.",
    icon: Code2,
    accent: "#39d2f6",
  },
  {
    title: "Automazioni AI",
    label: "03",
    copy: "Colleghiamo modelli, dati e strumenti per eliminare passaggi ripetitivi senza perdere controllo sul processo.",
    icon: BrainCircuit,
    accent: "#f3bf4c",
  },
  {
    title: "Sistemi e integrazioni",
    label: "04",
    copy: "Facciamo dialogare piattaforme, API e contenuti in un'architettura stabile, leggibile e facile da mantenere.",
    icon: Cpu,
    accent: "#10b981",
  },
  {
    title: "Esperienze e interfacce",
    label: "05",
    copy: "Diamo forma a interfacce chiare, riconoscibili e curate in ogni stato, dal primo accesso al risultato finale.",
    icon: Layers3,
    accent: "#ec4899",
  },
  {
    title: "Lancio e crescita",
    label: "06",
    copy: "Prepariamo il rilascio, osserviamo i segnali utili e miglioriamo il prodotto con cicli brevi e decisioni motivate.",
    icon: Rocket,
    accent: "#4f46e5",
  },
];

const signals = ["Discovery", "Design", "Build", "Deploy"];

const aboutStats = [
  ["3", "founder operativi"],
  ["0", "fumo nei processi"],
  ["1", "obiettivo: un sistema chiaro"],
];

const aboutFeatures = [
  [Sparkles, "Pensiero chiaro", "Partiamo dal problema e rendiamo esplicite le decisioni prima di costruire."],
  [Workflow, "Metodo operativo", "Discovery, design e sviluppo avanzano nello stesso flusso, senza passaggi opachi."],
  [Handshake, "Partner veri", "Condividiamo priorita, vincoli e progressi con un confronto diretto e continuo."],
];

const heroCopy =
  "Siamo un team operativo che unisce strategia, design e tecnologia per trasformare idee complesse in prodotti semplici da capire e usare.";
const servicesIntroCopy =
  "Dalla prima decisione al rilascio, costruiamo sistemi digitali coerenti: meno passaggi dispersi, più controllo e un risultato che resta solido nel tempo.";
const teamCaptionCopy =
  "Discovery, design e build restano nello stesso flusso. Ogni fase condivide il contesto: il progetto resta veloce senza perdere qualità o intenzione.";
const communityCopy =
  "Condividi ciò che stai costruendo, confrontati con persone operative e trova strumenti, metodo e feedback per fare il prossimo passo.";

export function AboutPage() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="page-shell pb-24 pt-4 sm:pb-18 sm:pt-6">
      {/* ─── Hero ─── */}
      <section className="v-about-hero motion-reveal overflow-hidden px-4 py-6 text-[var(--tv-ink-inverted)] sm:px-7 sm:py-8 lg:px-8">
        <div className="grid gap-8 xl:grid-cols-[minmax(0,0.88fr)_minmax(24rem,1.12fr)] xl:items-center">
          <motion.div
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : { duration: 0.62, ease: [0.16, 1, 0.3, 1] }
            }
            className="max-w-[47rem]"
          >
            <PremiumBadge tone="accent" className="after:!hidden">Chi siamo</PremiumBadge>
            <h1 className="mt-4 max-w-none text-balance text-[clamp(2.35rem,9vw,5.15rem)] font-semibold leading-[0.96] text-[var(--tv-ink-inverted)]">
              Persone vere, prodotti digitali vivi.
            </h1>
            <p className="mt-5 max-w-[41rem] text-[1rem] leading-7 text-[var(--tv-ink-inverted-secondary)] sm:text-[1.08rem]">
              {heroCopy}
            </p>

            <div
              className="mt-7 grid grid-cols-3 gap-2 sm:gap-3"
              aria-label="Metriche TooolVibes"
            >
              {aboutStats.map(([value, label]) => (
                <div key={label} className="v-about-stat-card">
                  <strong className="block font-[var(--tv-font-system)] text-2xl leading-none text-[var(--tv-accent-brand)]">
                    {value}
                  </strong>
                  <span className="mt-1 block text-xs font-bold uppercase tracking-[0.1em] text-[var(--tv-ink-inverted-secondary)]">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={false}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : {
                    duration: 0.72,
                    delay: 0.1,
                    ease: [0.16, 1, 0.3, 1],
                  }
            }
            className="v-about-image-frame relative min-h-[18rem] sm:min-h-[30rem] xl:min-h-[34rem]"
          >
            <Image
              src="/about/team-working.jpg"
              alt="Team TooolVibes al lavoro intorno a un laptop"
              fill
              priority
              unoptimized
              sizes="(min-width: 1024px) 54vw, 100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/30" />
            <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-[var(--tv-border-interactive)] bg-[var(--tv-surface-raised)] px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-[var(--tv-ink-primary)] sm:left-5 sm:top-5">
              <UsersRound className="size-4" aria-hidden="true" />
              Team reale
            </div>
            <div className="absolute bottom-4 left-4 right-4 rounded-[24px] border border-[var(--tv-border-interactive)] bg-[var(--tv-surface-raised)] p-4 text-[var(--tv-ink-primary)] sm:bottom-5 sm:left-5 sm:right-5 sm:p-5">
              <div className="flex flex-wrap gap-2">
                {signals.map((signal) => (
                  <span key={signal} className="v-about-signal-chip">
                    {signal}
                  </span>
                ))}
              </div>
              <p className="mt-4 max-w-[34rem] text-[0.95rem] leading-6 text-[var(--tv-ink-secondary)]">
                {teamCaptionCopy}
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Servizi ─── */}
      <section className="v-about-services-section relative mt-8 overflow-hidden px-4 py-7 sm:mt-10 sm:px-7 sm:py-9 lg:px-8">
        <div className="relative grid gap-7 lg:grid-cols-[minmax(19rem,0.72fr)_minmax(0,1.28fr)] lg:items-start">
          <motion.div
            initial={false}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : { duration: 0.58, ease: [0.16, 1, 0.3, 1] }
            }
            className="lg:sticky lg:top-28"
          >
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
                className="animated-link inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--tv-radius-md)] border border-[var(--tv-border-interactive)] bg-transparent px-5 py-3 text-sm font-semibold text-[var(--tv-ink-primary)] transition-colors hover:border-[var(--tv-accent-brand-aa)] hover:bg-[var(--tv-surface-elevated)] focus-visible:border-[var(--tv-accent-brand-aa)] focus-visible:bg-[var(--tv-surface-elevated)]"
              >
                Vedi servizi
                <ArrowRight className="size-4" aria-hidden="true" />
              </a>
            </div>
          </motion.div>

          <div id="servizi" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {serviceCards.map((service, index) => {
              const Icon = service.icon;

              return (
                <motion.article
                  key={service.title}
                  initial={false}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, margin: "-90px" }}
                  transition={
                    shouldReduceMotion
                      ? { duration: 0 }
                      : {
                          duration: 0.5,
                          delay: Math.min(index * 0.05, 0.25),
                          ease: [0.16, 1, 0.3, 1],
                        }
                  }
                  className="v-about-service-card group"
                  style={
                    {
                      "--card-accent": service.accent,
                      "--card-accent-glow": `${service.accent}14`,
                    } as React.CSSProperties
                  }
                >
                  <div className="flex items-start justify-between gap-4">
                    <span
                      className="v-about-service-icon"
                      style={{ color: service.accent }}
                    >
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <span className="v-about-service-label">{service.label}</span>
                  </div>
                  <h3 className="v-about-service-title">{service.title}</h3>
                  <p className="v-about-service-copy">{service.copy}</p>
                </motion.article>
              );
            })}
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
        {aboutFeatures.map(([Icon, title, copy]) => {
          const FeatureIcon = Icon as typeof Sparkles;

          return (
            <article key={title as string} className="v-about-feature-card">
              <FeatureIcon className="v-about-feature-icon" aria-hidden="true" />
              <h3 className="mt-4 text-[1.1rem] font-semibold text-[var(--foreground)]">
                {title as string}
              </h3>
              <p className="mt-2 text-sm leading-6 text-[var(--muted-strong)]">{copy as string}</p>
            </article>
          );
        })}
      </section>

      {/* ─── CTA ─── */}
      <section className="v-about-cta-section mt-6 flex flex-col gap-4 sm:mt-8 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <PremiumBadge tone="accent" className="after:!hidden">
            <ShieldCheck className="mr-1 inline size-3.5" aria-hidden="true" />
            Una community che costruisce
          </PremiumBadge>
          <p className="mt-3 max-w-[48rem] text-[1rem] leading-7 text-[var(--muted-strong)]">
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
