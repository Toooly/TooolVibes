"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/* ═══════════════════════════════════════════════════════════════
   SectionHeader — canonical section heading primitive (Phase 8 / DS-401).

   Single visual language for ALL section headers across TooolVibes.
   Replaces feature-local duplicates:
   - components/sections/section-heading.tsx
   - SurfaceIntro (feature-local)
   - One-off divs with eyebrow/title/description

   Composition (top-down, intentional hierarchy):
   1. Eyebrow pill (gold dot + tracked uppercase + accent line)
   2. Title (display heading, max 22ch line-length)
   3. Description (body, max 60ch)

   Optional: invert for dark/editorial sections.
   ═══════════════════════════════════════════════════════════════ */

export type SectionHeaderProps = {
  eyebrow: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  as?: "h1" | "h2";
  invert?: boolean;
  align?: "start" | "center";
  className?: string;
  /** Slot for trailing action (link, CTA, count). */
  trailing?: React.ReactNode;
  size?: "default" | "feature";
};

export function SectionHeader({
  eyebrow,
  title,
  description,
  as: Heading = "h2",
  invert = false,
  align = "start",
  className,
  trailing,
  size = "default",
}: SectionHeaderProps) {
  const surfaceText = invert ? "text-white" : "text-[var(--tv-ink-primary)]";
  const mutedText = invert
    ? "text-white/74"
    : "text-[var(--tv-ink-secondary)]";
  const eyebrowBg = invert
    ? "bg-white/10"
    : "bg-[var(--tv-color-white-08)]";
  const eyebrowBorder = invert
    ? "border-white/16"
    : "border-[var(--tv-color-white-10)]";
  const dotColor = "var(--tv-accent-gold)";

  const titleSizeClass =
    size === "feature"
      ? "text-[clamp(2rem,4vw,3rem)]"
      : "text-[clamp(1.5rem,2.5vw,2.25rem)]";

  const container = (
    <div
      className={cn(
        align === "center" ? "mx-auto max-w-[58rem] text-center" : "max-w-[58rem]",
        className,
      )}
    >
      <div
        className={cn(
          "flex items-center gap-2.5",
          align === "center" ? "justify-center" : "",
        )}
      >
        <span
          className="h-2 w-2 rounded-full shadow-[0_0_0_4px_rgba(242,179,71,0.12)]"
          style={{ background: dotColor }}
          aria-hidden="true"
        />
        <span
          className={cn(
            "inline-flex items-center rounded-[var(--tv-radius-pill)] border px-3 py-1 text-[length:var(--tv-text-xs)] font-semibold uppercase tracking-[var(--tv-tracking-label)]",
            eyebrowBg,
            eyebrowBorder,
            "text-[var(--tv-ink-secondary)]",
          )}
        >
          {eyebrow}
        </span>
        <div
          className={cn(
            "title-accent hidden h-px flex-1",
            align === "center" ? "" : "sm:block",
          )}
          aria-hidden="true"
        />
        {trailing ? <div className="ml-auto">{trailing}</div> : null}
      </div>
      <Heading
        className={cn(
          "mt-2.5 max-w-none break-words font-[var(--tv-font-display)] font-semibold leading-[var(--tv-leading-tight)] tracking-[-0.01em]",
          titleSizeClass,
          surfaceText,
        )}
      >
        {title}
      </Heading>
      {description ? (
        <p
          className={cn(
            "mt-2.5 max-w-[60ch] text-[length:var(--tv-text-body)] leading-[var(--tv-leading-body)]",
            mutedText,
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );

  return container;
}

SectionHeader.displayName = "SectionHeader";
