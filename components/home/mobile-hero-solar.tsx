"use client";

import Link from "next/link";
import Image from "next/image";
import {
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
      className={`v-discovery-stage v-discovery-stage--orbital${compact ? " v-discovery-stage--flow" : ""} relative z-10 overflow-hidden px-4 py-16 md:py-24`}
      aria-label="Discovery Stage"
    >
      <div className="v-discovery-stage-bg" aria-hidden="true" />
      <div className="v-discovery-stage-grid-bg" aria-hidden="true" />

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
                style={
                  {
                    "--card-color": route.color,
                  } as React.CSSProperties
                }
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
              style={
                {
                  "--card-color": route.color,
                } as React.CSSProperties
              }
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
    </section>
  );
}
