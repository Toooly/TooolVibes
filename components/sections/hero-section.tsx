import Link from "next/link";

import { ButtonLink } from "@/components/ui/button";
import { marketingStrings } from "@/lib/config/strings";

const steps = [
  "1. Orienta",
  "2. Screma",
  "3. Decidi",
];

export function HeroSection() {
  return (
    <section className="tone-orient page-shell pt-2 sm:pt-4">
      <div className="brand-panel brand-aura section-stage hero-stage group relative overflow-hidden rounded-[36px] px-5 py-6 sm:px-8 sm:py-10 lg:px-10 lg:py-11">
        <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.82),transparent_72%)]" />
        <div className="aura-orb aura-orb-soft absolute -right-16 top-16 h-52 w-52 rounded-full bg-[rgba(99,50,255,0.14)] blur-3xl" />
        <div className="aura-orb aura-orb-mid absolute left-10 top-16 h-28 w-28 rounded-full bg-[rgba(255,200,61,0.14)] blur-3xl" />
        <div className="aura-orb aura-orb-deep absolute bottom-10 left-[45%] h-24 w-24 rounded-full bg-[rgba(68,220,255,0.12)] blur-3xl" />

        <div className="max-w-[48rem]">
          <p className="pill">{marketingStrings.hero.eyebrow}</p>
          <p className="mt-5 brand-kicker">Orientamento rapido</p>
          <h1 className="text-display-hero mt-2 max-w-none text-[1.82rem] sm:max-w-[12.6ch] sm:text-[3rem] sm:text-balance lg:max-w-[13ch] lg:text-[3.86rem]">
            {marketingStrings.hero.title}
          </h1>
          <p className="text-body-soft mt-4 max-w-[42rem] text-[0.96rem] sm:text-[1rem]" style={{ color: "var(--muted-strong)" }}>
            {marketingStrings.hero.description}
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <ButtonLink href="/archivio" className="sm:min-w-[13rem]">
              {marketingStrings.hero.primaryCta}
            </ButtonLink>
            <Link
              href="/collections"
              className="section-quiet-link text-sm font-semibold"
              style={{ color: "var(--accent-strong)" }}
            >
              Oppure entra da una collection
            </Link>
          </div>

          <div className="tool-rail discovery-strip mt-6 -mx-1 flex snap-x gap-2 rounded-[22px] px-3 py-3 sm:px-4">
            {steps.map((step) => (
              <span
                key={step}
                className="selection-chip inline-flex shrink-0 rounded-full border px-3.5 py-1.75 text-[0.68rem] font-semibold uppercase tracking-[0.16em]"
                style={{
                  borderColor: "var(--line)",
                  background: "linear-gradient(180deg, rgba(252,249,255,0.9), rgba(246,241,255,0.84))",
                  color: "var(--muted-strong)",
                }}
              >
                {step}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
