import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * SecondarySection — vertical section wrapper with optional in-place
 * eyebrow / title / lede header. Pages typically use <SectionHeader /> when
 * they want a more decorated header; this primitive is the structural
 * container, not a header replacement.
 *
 * Use `tone="ivory"` for editorial-rhythm pages that benefit from a warm
 * background between dark hero & closing surfaces.
 */
export type SecondarySectionProps = {
  children: ReactNode;
  className?: string;
  /** Optional eyebrow (small label). */
  eyebrow?: ReactNode;
  /** Optional section title (will be rendered as h2). */
  title?: ReactNode;
  /** Optional lede / description below the title. */
  lede?: ReactNode;
  /** Surface tone. */
  tone?: "plain" | "ivory";
  /** Optional id for in-page anchor linking. */
  id?: string;
  /** aria-label for the region. */
  ariaLabel?: string;
};

export function SecondarySection({
  children,
  className,
  eyebrow,
  title,
  lede,
  tone = "plain",
  id,
  ariaLabel,
}: SecondarySectionProps) {
  const hasHeader = Boolean(eyebrow || title || lede);

  return (
    <section
      id={id}
      aria-label={ariaLabel}
      className={cn(
        "secondary-section",
        tone === "ivory" ? "secondary-section--ivory" : null,
        className,
      )}
    >
      {hasHeader ? (
        <header className="secondary-section__header">
          {eyebrow ? (
            <span className="secondary-section__eyebrow">{eyebrow}</span>
          ) : null}
          {title ? <h2 className="secondary-section__title">{title}</h2> : null}
          {lede ? <p className="secondary-section__lede">{lede}</p> : null}
        </header>
      ) : null}
      {children}
    </section>
  );
}

SecondarySection.displayName = "SecondarySection";
