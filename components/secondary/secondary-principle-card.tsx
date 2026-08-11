import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * SecondaryPrincipleCard — concise editorial card used for principle /
 * pillar / capability summaries on secondary pages.
 *
 * Two-tone aware: defaults to the dark command-center surface, switches
 * to ivory automatically when nested inside `.secondary-section--ivory`
 * via the BEM class on the wrapper.
 */
export type SecondaryPrincipleCardProps = {
  title: ReactNode;
  copy: ReactNode;
  bullets?: ReadonlyArray<string>;
  icon?: ReactNode;
  tone?: "dark" | "ivory";
  className?: string;
  /** Optional id for deep-link anchors. */
  id?: string;
};

export function SecondaryPrincipleCard({
  title,
  copy,
  bullets,
  icon,
  tone = "dark",
  className,
  id,
}: SecondaryPrincipleCardProps) {
  return (
    <article
      id={id}
      className={cn(
        "secondary-principle",
        tone === "ivory" ? "secondary-card--ivory" : null,
        className,
      )}
    >
      <div className="secondary-principle__head">
        {icon ? (
          <span className="secondary-card__icon" aria-hidden="true">
            {icon}
          </span>
        ) : null}
        <h3 className="secondary-principle__title">{title}</h3>
      </div>
      <p className="secondary-principle__copy">{copy}</p>
      {bullets && bullets.length > 0 ? (
        <ul className="secondary-principle__list">
          {bullets.map((bullet) => (
            <li key={bullet}>{bullet}</li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}

SecondaryPrincipleCard.displayName = "SecondaryPrincipleCard";
