import {
  Compass,
  FileText,
  MessageSquare,
  MessagesSquare,
  TrendingUp,
  Wrench,
} from "lucide-react";

/**
 * D. Decision Navigation
 * Server component. Sticky ≥1024, in-flow <1024. Scroll-padding-top
 * (declared in app/globals.css) ensures anchor targets land below the
 * topbar.
 */

export function ToolDetailDecisionNav({
  showAlternatives,
  showExperiences = false,
}: {
  showAlternatives: boolean;
  showExperiences?: boolean;
}) {
  return (
    <nav
      className="td-final-decision-nav"
      aria-label="Sezioni della scheda"
    >
      <a className="td-final-decision-nav__link" href="#td-final-overview">
        <Compass size={13} aria-hidden="true" style={{ marginRight: 4 }} />
        Panoramica
      </a>
      <a className="td-final-decision-nav__link" href="#td-final-editorial">
        <MessageSquare size={13} aria-hidden="true" style={{ marginRight: 4 }} />
        Valutazione
      </a>
      <a className="td-final-decision-nav__link" href="#td-final-information">
        <FileText size={13} aria-hidden="true" style={{ marginRight: 4 }} />
        Scheda
      </a>
      <a className="td-final-decision-nav__link" href="#td-final-signal">
        <TrendingUp size={13} aria-hidden="true" style={{ marginRight: 4 }} />
        Segnale
      </a>
      {showExperiences ? (
        <a className="td-final-decision-nav__link" href="#td-final-experiences">
          <MessagesSquare size={13} aria-hidden="true" style={{ marginRight: 4 }} />
          Esperienze
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
