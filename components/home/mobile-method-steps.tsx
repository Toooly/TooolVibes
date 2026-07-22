"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import {
  Bookmark,
  GitCompare,
  Search,
  ArrowRight,
} from "lucide-react";

const STEP_ICON_MAP = {
  Bookmark,
  GitCompare,
  Search,
} as const;

export type MethodStep = {
  icon: keyof typeof STEP_ICON_MAP;
  label: string;
  title: string;
  description: string;
  href: string;
  color: string;
};

type MobileMethodStepsProps = {
  steps: MethodStep[];
};

export function MobileMethodSteps({ steps }: MobileMethodStepsProps) {
  return (
    <section
      className="v-method-section motion-reveal relative z-10 overflow-hidden"
      aria-label="Metodo TooolVibes"
    >
      {/* Particle background */}
      <div className="v-method-particles" aria-hidden="true" />

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-16 md:py-20">
        <div className="v-method-header text-center mb-10 md:mb-12">
          <span className="v-method-eyebrow">Metodo</span>
          <h2 className="v-method-title">Scopri, confronta, salva</h2>
          <p className="v-method-subtitle">
            Un percorso chiaro: scopri, confronta, decidi.
            Senza perdere tempo tra decine di schede uguali.
          </p>
        </div>

        <div className="v-method-grid motion-stagger">
          {steps.map((step, index) => {
            const Icon = STEP_ICON_MAP[step.icon];
            return (
              <div
                key={step.label}
                className="v-method-card"
                style={{ "--step-color": step.color } as CSSProperties}
              >
                <div className="v-method-card-glow" aria-hidden="true" />
                <div className="v-method-card-inner">
                  <div className="v-method-card-top">
                    <span className="v-method-number">{index + 1}</span>
                    <div className="v-method-icon">
                      <Icon aria-hidden="true" size={22} />
                    </div>
                  </div>
                  <span className="v-method-label">{step.label}</span>
                  <h3 className="v-method-card-title">{step.title}</h3>
                  <p className="v-method-card-desc">{step.description}</p>
                  <Link href={step.href} className="v-method-link">
                    Esplora
                    <ArrowRight aria-hidden="true" size={14} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
