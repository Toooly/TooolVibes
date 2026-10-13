import { LocalizedText, LocalizedAttributes } from "@/components/i18n/localized-text";
import type { ReactNode } from "react";

import { RouteMarker } from "@/components/ui/route-marker";
import { cn } from "@/lib/utils";

/**
 * SecondaryHero — premium route hero used on all secondary pages.
 *
 * Not a clone of every hero: it provides intentional variants via
 * `tone` (dark | ivory) and `layout` (split | stack). The optional
 * `signature` slot renders a side panel (status card, mini visual,
 * decision track) on split layouts.
 *
 * Display title uses Anton 400 with text-wrap: balance. Lede is
 * constrained to a 42ch measure for readability.
 */
export type SecondaryHeroProps = {
  /** Inverse word or phrase emphasized in violet on the title. */
  emphasis?: string;
  /** Display title — Anton 400, balanced. */
  title: ReactNode;
  /** Hero lede — body paragraph below the title. */
  lede: ReactNode;
  /** Optional primary + secondary actions rendered below the lede. */
  actions?: ReactNode;
  /** Optional side panel (status card, mini visual, decision track). */
  signature?: ReactNode;
  /** Optional eyebrow (RouteMarker) — overrides the default eyebrow. */
  eyebrow?: ReactNode;
  /** RouteMarker index — required when `eyebrow` is undefined. */
  routeIndex?: string;
  /** Eyebrow label — used with `routeIndex`. */
  routeLabel?: string;
  /** Eyebrow status — used with `routeIndex`. */
  routeStatus?: string;
  /** Surface tone. */
  tone?: "dark" | "ivory";
  /** Layout — split (default) places signature beside copy on wide viewports. */
  layout?: "split" | "stack";
  /** Class extension for the wrapper. */
  className?: string;
  /** Optional id for deep-link anchors. */
  id?: string;
  /** aria-label for the signature region (if used). */
  signatureLabel?: string;
};

export function SecondaryHero({
  emphasis,
  title,
  lede,
  actions,
  signature,
  eyebrow,
  routeIndex,
  routeLabel,
  routeStatus,
  tone = "dark",
  layout = "split",
  className,
  id,
  signatureLabel,
}: SecondaryHeroProps) {
  const resolvedEyebrow = eyebrow
    ? eyebrow
    : routeIndex && routeLabel
      ? (
          <RouteMarker
            index={routeIndex}
            label={routeLabel}
            status={routeStatus}
            density={layout === "split" ? "hero" : "editorial"}
          />
        )
      : null;

  // If emphasis is provided, render title as a string with <strong> emphasis.
  // Otherwise treat title as a pre-formatted ReactNode.
  const renderedTitle =
    emphasis && typeof title === "string"
      ? renderTitleWithEmphasis(title, emphasis)
      : title;

  return (
    <section
      id={id}
      className={cn(
        "secondary-hero",
        tone === "dark" ? "secondary-hero--dark" : "secondary-hero--ivory",
        layout === "split" ? "secondary-hero--split" : null,
        "motion-reveal",
        className,
      )}
    >
      <div className="secondary-hero__inner">
        <div className="secondary-hero__copy">
          {resolvedEyebrow ? (
            <div className="secondary-hero__eyebrow"><LocalizedText>{resolvedEyebrow}</LocalizedText></div>
          ) : null}
          <h1 className="secondary-hero__title"><LocalizedText>{renderedTitle}</LocalizedText></h1>
          <p className="secondary-hero__lede"><LocalizedText>{lede}</LocalizedText></p>
          {actions ? <div className="secondary-hero__actions"><LocalizedText>{actions}</LocalizedText></div> : null}
        </div>

        {signature ? (
          <LocalizedAttributes><aside
            className="secondary-hero__signature"
            aria-label={signatureLabel}
          >
            <LocalizedText>{signature}</LocalizedText>
          </aside></LocalizedAttributes>
        ) : null}
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────
   Internal helpers
   ────────────────────────────────────────────────────────────────── */

/**
 * Splits the title into up-to-three segments and wraps the first
 * occurrence of `emphasis` in <strong>. The match is case-insensitive.
 * Punctuation is preserved around the matched substring.
 */
function renderTitleWithEmphasis(title: string, emphasis: string) {
  const lower = title.toLowerCase();
  const needle = emphasis.toLowerCase();
  const at = lower.indexOf(needle);
  if (at < 0) {
    return title;
  }
  const before = title.slice(0, at);
  const match = title.slice(at, at + emphasis.length);
  const after = title.slice(at + emphasis.length);
  return (
    <>
      <LocalizedText>{before}</LocalizedText>
      <strong><LocalizedText>{match}</LocalizedText></strong>
      <LocalizedText>{after}</LocalizedText>
    </>
  );
}

SecondaryHero.displayName = "SecondaryHero";
