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
      className="mobile-method-steps relative z-10 px-4 py-16"
      aria-label="Metodo TooolVibes"
    >
      <div className="mobile-method-steps__header">
        <span>Metodo</span>
        <h2>Scopri, confronta, salva</h2>
        <p>
          Un percorso chiaro: scopri, confronta, decidi.
          Senza perdere tempo tra decine di schede uguali.
        </p>
      </div>

      <div className="mobile-method-steps__list">
        {steps.map((step, index) => {
          const Icon = STEP_ICON_MAP[step.icon];
          return (
            <div key={step.label} className="mobile-method-steps__item">
              <div className="mobile-method-steps__line">
                <span
                  className="mobile-method-steps__dot"
                  style={{ "--step-color": step.color } as CSSProperties}
                >
                  {index + 1}
                </span>
                {index < steps.length - 1 && (
                  <span className="mobile-method-steps__connector" />
                )}
              </div>

              <div className="mobile-method-steps__content">
                <div className="mobile-method-steps__icon">
                  <Icon aria-hidden="true" size={18} />
                </div>
                <span className="mobile-method-steps__label">{step.label}</span>
                <h3 className="mobile-method-steps__title">{step.title}</h3>
                <p className="mobile-method-steps__description">
                  {step.description}
                </p>
                <Link
                  href={step.href}
                  className="mobile-method-steps__link"
                >
                  Esplora
                  <ArrowRight aria-hidden="true" size={12} />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
