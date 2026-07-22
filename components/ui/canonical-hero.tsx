"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   CanonicalHero — single hero primitive for ALL hero slots (Phase 8 / DS-402).

   Replaces feature-local hero implementations:
   - components/home/mobile-hero-solar.tsx (mobile editorial)
   - components/home/home-3d-hero.tsx (desktop 3D immersive)
   - components/home/hero-section.tsx (orphan, will be deprecated)
   - components/home/mobile-marketing-hero.tsx (orphan, will be deprecated)

   Composition (progressive disclosure):
   - Eyebrow pill (gold accent)
   - Display title (Fraunces, 3xl-7xl responsive)
   - Description (Inter body, max 60ch)
   - Primary + secondary CTA row
   - Optional ambient layer (3D / decorative)

   Variants: 'mobile' | 'desktop' | 'editorial'
   The component switches intelligently based on props, never the viewport.
   ═══════════════════════════════════════════════════════════════ */

export type CanonicalHeroProps = {
  eyebrow: React.ReactNode;
  title: React.ReactNode;
  description: React.ReactNode;
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  variant?: "mobile" | "desktop" | "editorial";
  invert?: boolean;
  ambient?: React.ReactNode;
  className?: string;
};

export function CanonicalHero({
  eyebrow,
  title,
  description,
  primaryCta,
  secondaryCta,
  variant = "editorial",
  invert = false,
  ambient,
  className,
}: CanonicalHeroProps) {
  const surfaceText = invert
    ? "text-white"
    : "text-[var(--tv-ink-primary)]";
  const mutedText = invert ? "text-white/74" : "text-[var(--tv-ink-secondary)]";
  const eyebrowStyle = {
    background: "var(--tv-accent-gold)",
  };

  const minHeight =
    variant === "mobile"
      ? "min-h-[420px]"
      : variant === "desktop"
        ? "min-h-[680px] lg:min-h-[760px]"
        : "min-h-[520px]";

  const titleSize =
    variant === "mobile"
      ? "text-[clamp(2.25rem,8vw,3.5rem)]"
      : variant === "desktop"
        ? "text-[clamp(3rem,6vw,5.5rem)]"
        : "text-[clamp(2rem,4.5vw,3.75rem)]";

  return (
    <section
      role="region"
      aria-label="Hero"
      data-variant={variant}
      className={cn(
        "relative w-full overflow-hidden",
        minHeight,
        "flex items-center",
        className,
      )}
    >
      {ambient ? (
        <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
          {ambient}
        </div>
      ) : null}

      <div
        className={cn(
          "relative mx-auto w-full",
          variant === "mobile" ? "max-w-[28rem] px-5" : "max-w-[64rem] px-6 lg:px-8",
        )}
      >
        <div className="mb-4 flex items-center gap-2.5">
          <span
            className="h-2 w-2 rounded-full shadow-[0_0_0_4px_rgba(242,179,71,0.18)]"
            style={eyebrowStyle}
            aria-hidden="true"
          />
          <span
            className={cn(
              "inline-flex items-center rounded-[var(--tv-radius-pill)] border px-3 py-1 text-[length:var(--tv-text-xs)] font-semibold uppercase tracking-[var(--tv-tracking-label)]",
              invert ? "border-white/16 bg-white/10 text-white/82" : "border-[var(--tv-color-white-10)] bg-[var(--tv-color-white-08)] text-[var(--tv-ink-secondary)]",
            )}
          >
            {eyebrow}
          </span>
        </div>

        <h1
          className={cn(
            "font-[var(--tv-font-display)] font-semibold leading-[var(--tv-leading-tight)] tracking-[-0.02em]",
            titleSize,
            surfaceText,
          )}
        >
          {title}
        </h1>

        <p
          className={cn(
            "mt-4 max-w-[60ch] text-[length:var(--tv-text-body-lg)] leading-[var(--tv-leading-body)]",
            mutedText,
          )}
        >
          {description}
        </p>

        {(primaryCta || secondaryCta) && (
          <div
            className={cn(
              "mt-7 flex flex-wrap items-center gap-3",
              variant === "mobile" ? "flex-col items-stretch" : "",
            )}
          >
            {primaryCta ? (
              <a
                href={primaryCta.href}
                className={cn(
                  "group inline-flex items-center justify-center gap-2 rounded-[var(--tv-radius-pill)] px-6 py-3 text-sm font-semibold uppercase tracking-[var(--tv-tracking-label)] transition-all duration-[var(--tv-motion-base)]",
                  "bg-[var(--tv-accent-primary)] text-[var(--tv-color-ink-100)] shadow-[0_8px_24px_rgba(106,60,255,0.32)] hover:bg-[var(--tv-accent-primary-hover)] hover:shadow-[0_12px_32px_rgba(106,60,255,0.42)] active:scale-[var(--tv-press-scale)]",
                )}
                data-sonic-action="tap"
              >
                {primaryCta.label}
                <ArrowRight aria-hidden="true" className="size-4" />
              </a>
            ) : null}
            {secondaryCta ? (
              <a
                href={secondaryCta.href}
                className={cn(
                  "inline-flex items-center justify-center gap-2 rounded-[var(--tv-radius-pill)] px-6 py-3 text-sm font-semibold uppercase tracking-[var(--tv-tracking-label)] transition-all duration-[var(--tv-motion-base)]",
                  invert
                    ? "border border-white/20 bg-white/8 text-white hover:bg-white/12"
                    : "border border-[var(--tv-color-white-12)] bg-[var(--tv-color-white-04)] text-[var(--tv-ink-primary)] hover:bg-[var(--tv-color-white-08)]",
                  "active:scale-[var(--tv-press-scale)]",
                )}
                data-sonic-action="tap"
              >
                {secondaryCta.label}
              </a>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}

CanonicalHero.displayName = "CanonicalHero";
