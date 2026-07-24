"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Bookmark,
  Compass,
  GitCompare,
  Radar,
  Sparkles,
} from "lucide-react";

const HOME_ICON_MAP = {
  Bookmark,
  Compass,
  GitCompare,
  Radar,
  Sparkles,
} as const;

export type SolarRoute = {
  id: string;
  label: string;
  href: string;
  color: string;
  icon: keyof typeof HOME_ICON_MAP;
  badge?: string;
};

type MobileHeroSolarProps = {
  routes: SolarRoute[];
  /* BATCH 40 (MOB-704): in layout "time-to-value" lo stage non forza piu'
     100svh (classe v-discovery-stage--flow, override in app/globals.css):
     la sezione orbitale resta interattiva ma segue il flusso del contenuto. */
  compact?: boolean;
};

export function MobileHeroSolar({ routes, compact = false }: MobileHeroSolarProps) {
  return (
    <section
      id="v-discovery-stage"
      className={`home-discovery-hero v-discovery-stage v-discovery-stage--orbital${compact ? " v-discovery-stage--flow" : ""}`}
      aria-labelledby="home-discovery-title"
    >
      <div className="v-discovery-stage-bg" aria-hidden="true" />
      <div className="v-discovery-stage-grid-bg" aria-hidden="true" />

      <div className="home-discovery-hero__layout">
        <div className="home-discovery-hero__copy">
          <p className="home-discovery-hero__eyebrow">
            Curatela indipendente · meno rumore, più segnale
          </p>
          <h1 id="home-discovery-title">
            Trova il tool giusto prima che il <em className="home-discovery-hero__highlight">rumore</em> scelga per te.
          </h1>
          <p className="home-discovery-hero__lede">
            Esplora una selezione ragionata, confronta i candidati e costruisci
            uno stack che abbia davvero senso per il tuo lavoro.
          </p>
          <div className="home-discovery-hero__actions">
            <Link
              href="/archivio"
              className="btn btn--primary btn--lg home-discovery-hero__cta home-discovery-hero__cta--primary"
            >
              Esplora i tool
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
            <Link
              href="/radar"
              className="btn btn--secondary btn--lg home-discovery-hero__cta home-discovery-hero__cta--secondary"
            >
              Guarda il Radar
            </Link>
          </div>
          {/* BATCH 2 (WS-C): decision journey panel — kept as the
              reference 'definitive UI mockup' (3 numbered steps, brand
              color accent per step). Now uses the canonical button system
              internally. */}
          <nav className="home-decision-track" aria-label="Il tuo percorso di scelta">
            <div className="home-decision-track__header">
              <span>Il tuo percorso</span>
              <strong>1/3</strong>
            </div>
            <ol>
              <li className="is-active">
                <Link href="/archivio">
                  <span aria-hidden="true">1</span>
                  Scopri
                </Link>
              </li>
              <li>
                <Link href="/compare">
                  <span aria-hidden="true">2</span>
                  Confronta
                </Link>
              </li>
              <li>
                <Link href="/shortlist">
                  <span aria-hidden="true">3</span>
                  Salva
                </Link>
              </li>
            </ol>
          </nav>
        </div>

        <div className="home-discovery-hero__visual" aria-label="Percorsi rapidi">
          <div className="v-discovery-orbit-shell">
            <span className="v-discovery-orbit-ring v-discovery-orbit-ring--outer" aria-hidden="true" />
            <span className="v-discovery-orbit-ring v-discovery-orbit-ring--inner" aria-hidden="true" />

            <div className="v-discovery-brand" aria-hidden="true">
              <span className="v-discovery-brand-aura" />
              <span className="v-discovery-brand-ring" />
              <span className="v-discovery-brand-hologram">
                <Image
                  src="/brand/tooolvibes-logo.png"
                  alt=""
                  width={72}
                  height={72}
                  className="v-discovery-brand-logo"
                  priority
                />
              </span>
            </div>

            <div className="v-discovery-orbit-track">
              {routes.map((route) => {
                const Icon = HOME_ICON_MAP[route.icon];

                return (
                  <Link
                    key={route.id}
                    href={route.href}
                    className="v-discovery-orbit-node"
                    style={{ "--card-color": route.color } as React.CSSProperties}
                    aria-label={route.label}
                  >
                    <span className="v-discovery-orbit-node__glow" aria-hidden="true" />
                    <span className="v-discovery-orbit-node__content">
                      <span className="v-discovery-orbit-node__icon">
                        <Icon aria-hidden="true" size={20} />
                      </span>
                      <span className="v-discovery-orbit-node__label">{route.label}</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="v-discovery-grid" aria-label="Percorsi discovery">
            {routes.map((route) => {
              const Icon = HOME_ICON_MAP[route.icon];

              return (
                <Link
                  key={`grid-${route.id}`}
                  href={route.href}
                  className="v-discovery-grid-node"
                  style={{ "--card-color": route.color } as React.CSSProperties}
                  aria-label={route.label}
                >
                  <span className="v-discovery-grid-node__icon">
                    <Icon aria-hidden="true" size={20} />
                  </span>
                  <span className="v-discovery-grid-node__label">{route.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
