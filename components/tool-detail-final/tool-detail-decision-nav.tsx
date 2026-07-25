import {
  Compass,
  FileText,
  Layers,
  MessageSquare,
  TrendingUp,
  Wrench,
} from "lucide-react";

/**
 * D. Decision Navigation
 * Server component. Sticky ≥1024, in-flow <1024. Scroll-padding-top
 * (declared in app/globals.css) ensures anchor targets land below the
 * topbar.
 */

export function ToolDetailDecisionNav() {
  return (
    <nav
      className="td-final-decision-nav"
      aria-label="Sezioni della scheda"
    >
      <a className="td-final-decision-nav__link" href="#td-final-editorial" aria-current="true">
        <Compass size={13} aria-hidden="true" style={{ marginRight: 4 }} />
        Panoramica
      </a>
      <a className="td-final-decision-nav__link" href="#td-final-information">
        <FileText size={13} aria-hidden="true" style={{ marginRight: 4 }} />
        Scheda
      </a>
      <a className="td-final-decision-nav__link" href="#td-final-use-cases">
        <Layers size={13} aria-hidden="true" style={{ marginRight: 4 }} />
        Casi d&apos;uso
      </a>
      <a className="td-final-decision-nav__link" href="#td-final-signal">
        <TrendingUp size={13} aria-hidden="true" style={{ marginRight: 4 }} />
        Segnale
      </a>
      <a className="td-final-decision-nav__link" href="#td-final-alternatives">
        <Wrench size={13} aria-hidden="true" style={{ marginRight: 4 }} />
        Alternative
      </a>
      <a className="td-final-decision-nav__link" href="#td-final-editorial">
        <MessageSquare size={13} aria-hidden="true" style={{ marginRight: 4 }} />
        Recensione
      </a>
    </nav>
  );
}
