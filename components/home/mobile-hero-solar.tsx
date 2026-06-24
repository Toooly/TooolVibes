"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Bookmark,
  Compass,
  GitCompare,
  Radar,
  Sparkles,
  ArrowRight,
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
};

export function MobileHeroSolar({ routes }: MobileHeroSolarProps) {
  // Prima fila: 3 cards, Seconda fila: 2 cards
  const frontRow = routes.slice(0, 3);
  const backRow = routes.slice(3);

  return (
    <section
      className="v-discovery-stage relative z-10 overflow-hidden px-4 py-16 md:py-24"
      aria-label="Discovery Stage"
    >
      {/* Background grid + particles */}
      <div className="v-discovery-stage-bg" aria-hidden="true" />
      <div className="v-discovery-stage-grid-bg" aria-hidden="true" />

      {/* Brand core */}
      <div className="v-discovery-brand" aria-hidden="true">
        <span className="v-discovery-brand-aura" />
        <span className="v-discovery-brand-ring" />
        <Image
          src="/brand/tooolvibes-logo.png"
          alt=""
          width={72}
          height={72}
          className="v-discovery-brand-logo"
          priority
        />
      </div>

      {/* Cards layout */}
      <div className="v-discovery-layout">
        {/* Front row — 3 cards */}
        <div className="v-discovery-front-row">
          {frontRow.map((route) => {
            const Icon = HOME_ICON_MAP[route.icon];
            return (
              <Link
                key={route.id}
                href={route.href}
                className="v-discovery-card"
                style={{ "--card-color": route.color } as React.CSSProperties}
                aria-label={route.label}
              >
                <span className="v-discovery-card-glow" aria-hidden="true" />
                <div className="v-discovery-card-inner">
                  <div className="v-discovery-card-icon">
                    <Icon aria-hidden="true" size={22} />
                  </div>
                  <div className="v-discovery-card-body">
                    <span className="v-discovery-card-label">{route.label}</span>
                    {route.badge && (
                      <span className="v-discovery-card-badge">{route.badge}</span>
                    )}
                  </div>
                  <ArrowRight
                    size={14}
                    className="v-discovery-card-arrow"
                    aria-hidden="true"
                  />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Back row — 2 cards, smaller, more depth */}
        {backRow.length > 0 && (
          <div className="v-discovery-back-row">
            {backRow.map((route) => {
              const Icon = HOME_ICON_MAP[route.icon];
              return (
                <Link
                  key={route.id}
                  href={route.href}
                  className="v-discovery-card v-discovery-card--back"
                  style={{ "--card-color": route.color } as React.CSSProperties}
                  aria-label={route.label}
                >
                  <span className="v-discovery-card-glow" aria-hidden="true" />
                  <div className="v-discovery-card-inner">
                    <div className="v-discovery-card-icon">
                      <Icon aria-hidden="true" size={18} />
                    </div>
                    <div className="v-discovery-card-body">
                      <span className="v-discovery-card-label">{route.label}</span>
                      {route.badge && (
                        <span className="v-discovery-card-badge">{route.badge}</span>
                      )}
                    </div>
                    <ArrowRight
                      size={12}
                      className="v-discovery-card-arrow"
                      aria-hidden="true"
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
