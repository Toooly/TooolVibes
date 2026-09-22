import { Layers3, Wrench } from "lucide-react";

/**
 * In-page nav for the remaining public layers.
 */

export function ToolDetailDecisionNav({
  showAlternatives,
  showDeepen = true,
}: {
  showAlternatives: boolean;
  showDeepen?: boolean;
}) {
  if (!showDeepen && !showAlternatives) return null;

  return (
    <nav
      className="td-final-decision-nav"
      aria-label="Sezioni della scheda"
    >
      {showDeepen ? (
        <a className="td-final-decision-nav__link" href="#td-final-overview">
          <Layers3 size={13} aria-hidden="true" style={{ marginRight: 4 }} />
          Panoramica
        </a>
      ) : null}
      {showDeepen ? (
        <a className="td-final-decision-nav__link" href="#td-final-pros-limits">
          <Layers3 size={13} aria-hidden="true" style={{ marginRight: 4 }} />
          Pro e contro
        </a>
      ) : null}
      {showDeepen ? (
        <a className="td-final-decision-nav__link" href="#td-final-pricing">
          <Layers3 size={13} aria-hidden="true" style={{ marginRight: 4 }} />
          Prezzi
        </a>
      ) : null}
      {showAlternatives ? (
        <a className="td-final-decision-nav__link" href="#td-final-alternatives">
          <Wrench size={13} aria-hidden="true" style={{ marginRight: 4 }} />
          Alternative
        </a>
      ) : null}
    </nav>
  );
}
