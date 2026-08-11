import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * SecondaryCardGrid — responsive grid for principle / service / contribution
 * cards. Renders any list of children inside a consistent 1 → 2 → 3 column
 * grid with the BEM-style class names that the secondary-pages CSS expects.
 *
 * Pages use this with their own card primitive (ResponsiveDisclosureCard,
 * MethodStep, etc.) — the grid only owns spacing + responsive column counts.
 */
export type SecondaryCardGridProps = {
  children: ReactNode;
  columns?: 1 | 2 | 3;
  className?: string;
  /** Optional id for in-page anchor linking. */
  id?: string;
  /** aria-label for the group. */
  ariaLabel?: string;
  /** Bottom margin only — keeps the grid structurally flat. */
  stagger?: boolean;
};

export function SecondaryCardGrid({
  children,
  columns = 3,
  className,
  id,
  ariaLabel,
  stagger = false,
}: SecondaryCardGridProps) {
  const columnClass =
    columns === 2 ? "secondary-grid--two" : columns === 3 ? "secondary-grid--three" : null;

  return (
    <div
      id={id}
      aria-label={ariaLabel}
      className={cn(
        "secondary-grid",
        columnClass,
        stagger ? "motion-stagger" : null,
        className,
      )}
    >
      {children}
    </div>
  );
}

SecondaryCardGrid.displayName = "SecondaryCardGrid";
