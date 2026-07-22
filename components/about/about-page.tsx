"use client";

import Image from "next/image";
import { motion } from "motion/react";
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

const mobileStats = [
  ["3", "founder operativi"],
  ["0", "fumo"],
  ["1", "sistema chiaro"],
];

const mobileFeatures = [
  [Sparkles, "Pensiero chiaro", "Partiamo dal problema e rendiamo esplicite le decisioni prima di costruire."],
  [Workflow, "Metodo operativo", "Discovery, design e sviluppo avanzano nello stesso flusso, senza passaggi opachi."],
  [Handshake, "Partner veri", "Condividiamo priorita, vincoli e progressi con un confronto diretto e continuo."],
];

const heroCopy =
  "Siamo un team operativo che unisce strategia, design e tecnologia per trasformare idee complesse in prodotti semplici da capire e usare.";
const servicesIntroCopy =
  "Dalla prima decisione al rilascio, costruiamo sistemi digitali coerenti: meno passaggi dispersi, più controllo e un risultato che resta solido nel tempo.";
const teamCaptionCopy =
  "Ogni fase condivide lo stesso contesto: il progetto resta veloce senza perdere qualità o intenzione.";
const communityCopy =
  "Condividi ciò che stai costruendo, confrontati con persone operative e trova strumenti, metodo e feedback per fare il prossimo passo.";

function MobileAboutPage() {
  return (
    <div className="v-about-mobile page-shell space-y-5 pb-10 pt-5 md:hidden">
      <section className="v-about-mobile-hero">
        <div className="v-about-mobile-hero__copy">
          <PremiumBadge tone="accent" className="after:!hidden">Chi siamo</PremiumBadge>
          <h1>Persone vere, prodotti digitali vivi.</h1>
          <p>{heroCopy}</p>
        </div>

        <div className="v-about-mobile-scene" aria-label="Team TooolVibes al lavoro">
          <div className="v-about-mobile-scene__halo" aria-hidden="true" />
          <div className="v-about-mobile-scene__image">
            <Image
              src="/about/team-working.jpg"
              alt="Team TooolVibes al lavoro intorno a un laptop"
              fill
              priority
              unoptimized
              sizes="100vw"
              className="object-cover"
            />
          </div>
          <div className="v-about-mobile-scene__caption">
            <span>
              <UsersRound className="size-4" aria-hidden="true" />
              Team reale
            </span>
            <small>Discovery, design e build nello stesso flusso.</small>
          </div>
        </div>
      </section>

      <div className="v-about-mobile-stats" aria-label="Metriche TooolVibes">
        {mobileStats.map(([value, label]) => (
          <div key={label} className="v-about-mobile-stat">
            <strong>{value}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>

      <section className="v-about-mobile-panel v-about-mobile-panel--dark">
        <div className="v-about-mobile-section-head">
          <PremiumBadge tone="dark" className="after:!hidden">
            I servizi che offriamo
          </PremiumBadge>
          <h2>Dal caos al sistema.</h2>
          <p>{servicesIntroCopy}</p>
        </div>

        <div className="v-about-mobile-services" id="servizi-mobile">
          {serviceCards.map((service, index) => {
            const Icon = service.icon;

            return (
              <motion.article
                key={service.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.46, delay: Math.min(index * 0.04, 0.18), ease: [0.16, 1, 0.3, 1] }}
                className="v-about-mobile-service"
                style={
                  {
                    "--card-accent": service.accent,
                    "--card-accent-glow": `${service.accent}22`,
                  } as React.CSSProperties
                }
              >
                <span className="v-about-mobile-service__icon" style={{ color: service.accent }}>
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <span className="v-about-mobile-service__label">{service.label}</span>
                  <h3>{service.title}</h3>
                  <p>{service.copy}</p>
                </div>
              </motion.article>
            );
          })}
        </div>
      </section>

      <section className="v-about-mobile-panel">
        <div className="v-about-mobile-section-head">
          <PremiumBadge tone="accent" className="after:!hidden">Come lavoriamo</PremiumBadge>
          <h2>Una rotta, non una pila di card.</h2>
        </div>

        <div className="v-about-mobile-features">
          {mobileFeatures.map(([Icon, title, copy]) => {
            const FeatureIcon = Icon as typeof Sparkles;

            return (
              <article key={title as string} className="v-about-mobile-feature">
                <FeatureIcon className="v-about-mobile-feature__icon" aria-hidden="true" />
                <div>
                  <h3>{title as string}</h3>
                  <p>{copy as string}</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="v-about-mobile-cta">
        <PremiumBadge tone="accent" className="after:!hidden">
          <ShieldCheck className="mr-1 inline size-3.5" aria-hidden="true" />
          Una community che costruisce
        </PremiumBadge>
        <p>{communityCopy}</p>
        <PremiumLink href="/community" tone="premium" className="w-full">
          Entra nella community
        </PremiumLink>
      </section>
    </div>
  );
}

export function AboutPage() {
  return (
    <>
      <MobileAboutPage />

      <div className="page-shell hidden pb-24 pt-4 sm:pb-18 sm:pt-6 md:block">
      {/* ─── Hero ─── */}
      <section className="v-about-hero motion-reveal overflow-hidden px-4 py-6 text-[var(--tv-ink-inverted)] sm:px-7 sm:py-8 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.88fr)_minmax(24rem,1.12fr)] lg:items-center">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.62, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-[47rem]"
          >
            <PremiumBadge tone="accent" className="after:!hidden">Chi siamo</PremiumBadge>
            <h1 className="mt-4 max-w-[12ch] text-[clamp(2.35rem,9vw,5.15rem)] font-semibold leading-[0.96] text-[var(--tv-ink-inverted)]">
              Persone vere, prodotti digitali vivi.
            </h1>
            <p className="mt-5 max-w-[41rem] text-[1rem] leading-7 text-[var(--tv-ink-inverted-secondary)] sm:text-[1.08rem]">
              {heroCopy}
            </p>

            <div className="mt-7 hidden gap-3 sm:grid sm:grid-cols-3">
              {[
                ["3", "founder operativi"],
                ["0", "fumo nei processi"],
                ["1", "obiettivo: chiarezza"],
              ].map(([value, label]) => (
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
            initial={{ opacity: 0, scale: 0.96, rotate: -1.2 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.72, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="v-about-image-frame relative min-h-[23rem] sm:min-h-[30rem] lg:min-h-[34rem]"
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
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.58, ease: [0.16, 1, 0.3, 1] }}
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
                  initial={{ opacity: 0, y: 22, scale: 0.98 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, margin: "-90px" }}
                  transition={{ duration: 0.5, delay: Math.min(index * 0.05, 0.25), ease: [0.16, 1, 0.3, 1] }}
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
        {mobileFeatures.map(([Icon, title, copy]) => {
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
        <PremiumLink href="/community" tone="premium" className="shrink-0">
          Entra nella community
        </PremiumLink>
      </section>
      </div>
    </>
  );
}
