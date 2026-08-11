import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * SecondaryClosingCTA — intentional closing band for secondary pages.
 *
 * It is *not* a glued footer. It is the final conversion / handoff
 * surface before the global site footer. Use it to land the page on a
 * single next step (write to the editorial inbox, open the catalog,
 * continue the decision journey, etc.).
 *
 * Default tone is `dark` (matches the editorial-dark hero). Use `ivory`
 * for pages that wish to terminate on a warm surface.
 */
export type SecondaryClosingCTAProps = {
  title: ReactNode;
  body?: ReactNode;
  actions?: ReactNode;
  tone?: "dark" | "ivory";
  className?: string;
  /** Optional id for in-page anchor linking. */
  id?: string;
};

export function SecondaryClosingCTA({
  title,
  body,
  actions,
  tone = "dark",
  className,
  id,
}: SecondaryClosingCTAProps) {
  return (
    <section
      id={id}
      className={cn(
        "secondary-closing",
        tone === "dark" ? "secondary-closing--dark" : "secondary-closing--ivory",
        "motion-reveal",
        className,
      )}
    >
      <div className="secondary-closing__inner">
        <div>
          <h2 className="secondary-closing__title">{title}</h2>
          {body ? <p className="secondary-closing__body">{body}</p> : null}
        </div>
        {actions ? (
          <div className="secondary-closing__actions">{actions}</div>
        ) : null}
      </div>
    </section>
  );
}

SecondaryClosingCTA.displayName = "SecondaryClosingCTA";
