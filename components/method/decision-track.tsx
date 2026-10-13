import { LocalizedText, LocalizedAttributes } from "@/components/i18n/localized-text";
import type { ReactNode } from "react";
import Link from "@/components/ui/app-link";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * DecisionTrack — the signature visual for /metodo.
 *
 * Lifecycle steps (Scopri → Valuta → Confronta → Decidi → Ricorda) with a connecting
 * trace. On wide viewports the steps lay out horizontally with a
 * gradient connector between them; on mobile they stack as a native
 * <details> accordion (first open, exclusive via the `name` attribute).
 *
 * Facts are kept verbatim from the prior /metodo composition so the
 * editorial meaning is preserved while the visual gets reconstructed.
 */
export type DecisionTrackStep = {
  /** Numeric id rendered inside the framed pill (e.g. "01"). */
  index: string;
  /** Short editorial label (e.g. "Scopri"). */
  label: string;
  /** Title rendered in the body type ramp. */
  title: string;
  /** Description paragraph. */
  copy: string;
  /** Internal route CTA destination. */
  href: string;
  /** CTA label. */
  cta: string;
};

export type DecisionTrackProps = {
  steps: ReadonlyArray<DecisionTrackStep>;
  className?: string;
  /** Optional eyebrow above the trace. */
  eyebrow?: ReactNode;
};

export function DecisionTrack({ steps, className, eyebrow }: DecisionTrackProps) {
  return (
    <div className={cn("method-track motion-reveal", className)}>
      {eyebrow ? (
        <div className="secondary-section__eyebrow" style={{ alignSelf: "start" }}>
          <LocalizedText>{eyebrow}</LocalizedText>
        </div>
      ) : null}
      <LocalizedAttributes><ol className="method-track__list" aria-label="Percorso editoriale TooolVibes">
        {steps.map((step, index) => (
          <li key={step.label} className="method-track__step">
            <details
              className="method-track__disclosure"
              name="tooolvibes-method-track"
              open={index === 0}
            >
              <summary className="method-track__summary">
                <span className="method-track__step-index" aria-hidden="true">
                  <LocalizedText>{step.index}</LocalizedText>
                </span>
                <span className="method-track__step-label"><LocalizedText>{step.label}</LocalizedText></span>
                <h3 className="method-track__step-title"><LocalizedText>{step.title}</LocalizedText></h3>
              </summary>
              <div className="method-track__step-body">
                <p className="method-track__step-copy"><LocalizedText>{step.copy}</LocalizedText></p>
                <Link className="method-track__step-cta" href={step.href}>
                  <span><LocalizedText>{step.cta}</LocalizedText></span>
                  <ArrowRight aria-hidden="true" className="size-3.5" />
                </Link>
              </div>
            </details>
          </li>
        ))}
      </ol></LocalizedAttributes>
    </div>
  );
}

DecisionTrack.displayName = "DecisionTrack";
