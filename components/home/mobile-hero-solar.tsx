"use client";

import Link from "next/link";
import Image from "next/image";
import type { CSSProperties } from "react";
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
};

export function MobileHeroSolar({ routes }: MobileHeroSolarProps) {
  const orbitRadius = 130;
  const duration = 48;

  return (
    <section
      className="mobile-hero-solar relative z-10 min-h-[100svh] overflow-hidden px-4 pt-20 pb-32"
      aria-label="Sistema TooolVibes"
    >
      {/* HUD */}
      <div className="mobile-hero-solar__hud" data-text-zone="true">
        <p>Sistema TooolVibes</p>
        <h1>Scegli tool AI validi senza attraversare il rumore.</h1>
        <span>
          TooolVibes seleziona e confronta tool AI e SaaS utili.
          Nessuna vetrina infinita: solo nodi curati da esplorare, salvare e provare.
        </span>
      </div>

      {/* Orbit System */}
      <div className="mobile-hero-solar__system" aria-label="Nodi interattivi">
        <div className="catalog-orbit-depth" aria-hidden="true" />

        {/* Single ring */}
        <span
          className="catalog-orbit-ring"
          style={{
            "--ring-radius": `${orbitRadius}px`,
            "--ring-width": `${orbitRadius * 2}px`,
            "--ring-height": `${Math.round(orbitRadius * 0.72)}px`,
            "--ring-opacity": "0.38",
          } as CSSProperties}
        />

        {/* Brand core */}
        <div className="mobile-hero-solar__brand-core" aria-hidden="true">
          <span className="mobile-hero-solar__brand-aura" />
          <span className="mobile-hero-solar__brand-ring" />
          <Image
            src="/brand/tooolvibes-logo.png"
            alt=""
            width={72}
            height={72}
            className="mobile-hero-solar__brand-logo"
            priority
          />
        </div>

        {/* Nodes */}
        {routes.map((route, index) => {
          const angle = (index / routes.length) * 360;
          const Icon = HOME_ICON_MAP[route.icon];
          const nodeStyle = {
            "--orbit-angle": `${angle}deg`,
            "--orbit-angle-back": `${-angle}deg`,
            "--orbit-radius": `${orbitRadius}px`,
            "--orbit-depth": "0px",
            "--orbit-duration": `${duration}s`,
            "--orbit-delay": `${index * -9.6}s`,
            "--node-color": route.color,
            "--node-size": "4.2rem",
          } as CSSProperties;

          return (
            <Link
              key={route.id}
              href={route.href}
              className="catalog-orbit-node home-orbit-node home-orbit-node--route mobile-hero-solar__node"
              style={nodeStyle}
              aria-label={route.label}
            >
              <span className="catalog-orbit-node__halo" aria-hidden="true" />
              <span className="catalog-orbit-node__body">
                <Icon aria-hidden="true" />
              </span>
              <span className="catalog-orbit-node__label">
                <strong>{route.label}</strong>
                {route.badge && <small>{route.badge}</small>}
              </span>
              {route.badge && (
                <span className="home-orbit-node__badge">{route.badge}</span>
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
