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
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const orbitRadius = isMobile ? 80 : 130;
  const duration = isMobile ? 32 : 48;

  return (
    <section
      className="v-hero-solar-section relative z-10 overflow-hidden px-4 py-16 md:py-24"
      aria-label="Sistema TooolVibes"
    >
      {/* Dark ambient glow */}
      <div className="v-hero-solar-ambient" aria-hidden="true" />

      {/* Orbit System — centered */}
      <div className="v-hero-solar-system" aria-label="Nodi interattivi">
        {/* Single ring */}
        <span
          className="catalog-orbit-ring v-hero-solar-ring"
          style={{
            "--ring-radius": `${orbitRadius}px`,
            "--ring-width": `${orbitRadius * 2}px`,
            "--ring-height": `${Math.round(orbitRadius * 0.72)}px`,
            "--ring-opacity": "0.38",
          } as CSSProperties}
        />

        {/* Brand core */}
        <div className="mobile-hero-solar__brand-core v-hero-solar-core" aria-hidden="true">
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
            "--node-size": isMobile ? '3rem' : '4.2rem',
          } as CSSProperties;

          return (
            <Link
              key={route.id}
              href={route.href}
              className="catalog-orbit-node home-orbit-node home-orbit-node--route mobile-hero-solar__node v-hero-solar-node"
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
