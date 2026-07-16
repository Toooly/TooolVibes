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

const serviceCards = [
  {
    title: "Strategia digitale",
    label: "01",
    copy: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer porta, sem at dictum commodo, nibh erat gravida neque, sed gravida justo augue in arcu.",
    icon: Target,
    accent: "#6a3cff",
  },
  {
    title: "Web app su misura",
    label: "02",
    copy: "Suspendisse potenti. Aliquam erat volutpat. Donec vitae mi vel justo facilisis fermentum non non ipsum.",
    icon: Code2,
    accent: "#39d2f6",
  },
  {
    title: "Automazioni AI",
    label: "03",
    copy: "Praesent vitae augue sed lorem luctus pretium. Curabitur non arcu non lorem efficitur cursus.",
    icon: BrainCircuit,
    accent: "#f3bf4c",
  },
  {
    title: "Sistemi e integrazioni",
    label: "04",
    copy: "Morbi luctus, massa id viverra sagittis, leo felis feugiat est, vitae dignissim sapien massa sed turpis.",
    icon: Cpu,
    accent: "#10b981",
  },
  {
    title: "Esperienze e interfacce",
    label: "05",
    copy: "Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Proin gravida lectus in mi pretium.",
    icon: Layers3,
    accent: "#ec4899",
  },
  {
    title: "Lancio e crescita",
    label: "06",
    copy: "Nullam at eros in neque gravida finibus. Sed imperdiet, turpis vitae facilisis cursus, mauris enim feugiat erat.",
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
  [Sparkles, "Pensiero chiaro", "Lorem ipsum dolor sit amet, consectetur adipiscing elit."],
  [Workflow, "Metodo operativo", "Donec id elit non mi porta gravida at eget metus."],
  [Handshake, "Partner veri", "Maecenas faucibus mollis interdum. Sed posuere consectetur est."],
];

function MobileAboutPage() {
  return (
    <div className="v-about-mobile page-shell space-y-5 pb-10 pt-5 md:hidden">
      <section className="v-about-mobile-hero">
        <div className="v-about-mobile-hero__copy">
          <PremiumBadge tone="accent">Chi siamo</PremiumBadge>
          <h1>Persone vere, prodotti digitali vivi.</h1>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus
            suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed.
          </p>
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
          <PremiumBadge tone="dark" className="bg-white/14 text-white">
            I servizi che offriamo
          </PremiumBadge>
          <h2>Dal caos al sistema.</h2>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam porta sem
            malesuada magna mollis euismod.
          </p>
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
          <PremiumBadge tone="accent">Come lavoriamo</PremiumBadge>
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
        <PremiumBadge tone="accent">
          <ShieldCheck className="mr-1 inline size-3.5" aria-hidden="true" />
          Placeholder pronto per il copy finale
        </PremiumBadge>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer posuere erat a
          ante venenatis dapibus posuere velit aliquet.
        </p>
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
      <section className="v-about-hero motion-reveal overflow-hidden px-4 py-6 sm:px-7 sm:py-8 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.88fr)_minmax(24rem,1.12fr)] lg:items-center">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.62, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-[47rem]"
          >
            <PremiumBadge tone="accent">Chi siamo</PremiumBadge>
            <h1 className="mt-4 max-w-[12ch] text-[clamp(2.35rem,9vw,5.15rem)] font-semibold leading-[0.96] text-[var(--foreground)]">
              Persone vere, prodotti digitali vivi.
            </h1>
            <p className="mt-5 max-w-[41rem] text-[1rem] leading-7 text-[var(--muted-strong)] sm:text-[1.08rem]">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus
              suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed,
              dolor. Cras elementum ultrices diam. Maecenas ligula massa, varius a, semper
              congue, euismod non, mi.
            </p>

            <div className="mt-7 hidden gap-3 sm:grid sm:grid-cols-3">
              {[
                ["3", "founder operativi"],
                ["0", "fumo nei processi"],
                ["1", "obiettivo: chiarezza"],
              ].map(([value, label]) => (
                <div key={label} className="v-about-stat-card">
                  <strong className="block font-[var(--tv-font-system)] text-2xl leading-none text-[var(--accent-strong)]">
                    {value}
                  </strong>
                  <span className="mt-1 block text-xs font-bold uppercase tracking-[0.1em] text-[var(--muted)]">
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
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(18,13,47,0.06),rgba(18,13,47,0.18)_48%,rgba(18,13,47,0.72))]" />
            <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-white/24 bg-white/18 px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-white shadow-[0_16px_44px_rgba(8,14,38,0.18)] backdrop-blur-xl sm:left-5 sm:top-5">
              <UsersRound className="size-4" aria-hidden="true" />
              Team reale
            </div>
            <div className="absolute bottom-4 left-4 right-4 rounded-[24px] border border-white/18 bg-white/14 p-4 text-white shadow-[0_18px_48px_rgba(8,14,38,0.22)] backdrop-blur-xl sm:bottom-5 sm:left-5 sm:right-5 sm:p-5">
              <div className="flex flex-wrap gap-2">
                {signals.map((signal) => (
                  <span key={signal} className="v-about-signal-chip">
                    {signal}
                  </span>
                ))}
              </div>
              <p className="mt-4 max-w-[34rem] text-[0.95rem] leading-6 text-white/78">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus luctus
                urna sed urna ultricies ac tempor dui sagittis.
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
            <PremiumBadge tone="dark" className="bg-white/14 text-white">
              I servizi che offriamo
            </PremiumBadge>
            <h2 className="mt-4 max-w-[11ch] text-[clamp(2rem,6vw,4.25rem)] leading-[0.98] text-white">
              Dal caos al sistema.
            </h2>
            <p className="mt-5 max-w-[34rem] text-[0.98rem] leading-7 text-white/72">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam porta sem
              malesuada magna mollis euismod. Donec sed odio dui. Aenean lacinia bibendum
              nulla sed consectetur.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
              <PremiumLink href="/shortlist#wishlist" tone="primary" className="bg-white text-[#2d1b81] hover:bg-white">
                Raccontaci il progetto
              </PremiumLink>
              <a
                href="#servizi"
                className="animated-link inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/16 bg-white/8 px-5 py-3 text-sm font-semibold text-white/84 transition hover:bg-white/12 hover:text-white"
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
        {[
          [Sparkles, "Pensiero chiaro", "Lorem ipsum dolor sit amet, consectetur adipiscing elit."],
          [Workflow, "Metodo operativo", "Donec id elit non mi porta gravida at eget metus."],
          [Handshake, "Partner veri", "Maecenas faucibus mollis interdum. Sed posuere consectetur est."],
        ].map(([Icon, title, copy]) => {
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
          <PremiumBadge tone="accent">
            <ShieldCheck className="mr-1 inline size-3.5" aria-hidden="true" />
            Placeholder pronto per il copy finale
          </PremiumBadge>
          <p className="mt-3 max-w-[48rem] text-[1rem] leading-7 text-[var(--muted-strong)]">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer posuere erat a
            ante venenatis dapibus posuere velit aliquet.
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
