import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * SecondaryPageShell — page-shell wrapper for company / product / community
 * secondary routes (Metodo, Contributi, Studio, Shop, legal documents).
 *
 * Provides consistent vertical rhythm and bottom-nav clearance on mobile.
 * It does not render a hero or any constrained surface — compose with
 * <SecondaryHero />, <SecondarySection />, <SecondaryClosingCTA />.
 *
 * Hero coordinate system: the hero is *outside* this shell on dark/ivory
 * composition pages and inside this shell on narrower doc pages. Default
 * vertical rhythm is generous; use `tight` for shorter routes.
 */
export type SecondaryPageShellProps = {
  children: ReactNode;
  className?: string;
  /** Reduce the bottom padding (legal docs, short pages). */
  tight?: boolean;
  as?: "div" | "main" | "section" | "article";
  /** Optional id for in-page anchor linking. */
  id?: string;
};

export function SecondaryPageShell({
  children,
  className,
  tight = false,
  as: Component = "div",
  id,
}: SecondaryPageShellProps) {
  return (
    <Component
      id={id}
      className={cn(
        "secondary-page",
        tight ? "secondary-page--tight" : null,
        "secondary-page__stack",
        className,
      )}
    >
      {children}
    </Component>
  );
}

SecondaryPageShell.displayName = "SecondaryPageShell";
