import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * DecisionTrack — the signature visual for /metodo.
 *
 * Three numbered steps (Scopri → Confronta → Salva) with a connecting
 * trace. On wide viewports the steps lay out horizontally with a
 * gradient connector between them; on mobile they stack vertically with
 * a vertical connector dotted line.
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
          {eyebrow}
        </div>
      ) : null}
      <ol className="method-track__list" aria-label="Percorso editoriale TooolVibes">
        {steps.map((step) => (
          <li key={step.label} className="method-track__step">
            <span className="method-track__step-index" aria-hidden="true">
              {step.index}
            </span>
            <div className="method-track__step-body">
              <span className="method-track__step-label">{step.label}</span>
              <h3 className="method-track__step-title">{step.title}</h3>
              <p className="method-track__step-copy">{step.copy}</p>
              <Link className="method-track__step-cta" href={step.href}>
                <span>{step.cta}</span>
                <ArrowRight aria-hidden="true" className="size-3.5" />
              </Link>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

DecisionTrack.displayName = "DecisionTrack";
