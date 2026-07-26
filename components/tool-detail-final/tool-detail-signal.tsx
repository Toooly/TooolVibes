import { TrendingUp } from "lucide-react";

import type { ToolPublicView } from "@/lib/data/tool-public-view";

/**
 * F. Trend / Signal Module
 * Server component. Honest empty state when Product Hunt signal is
 * unavailable (current state per the runtime ledger).
 */

type ToolDetailSignalProps = {
  tool: ToolPublicView;
};

function isPhSignalAvailable(): boolean {
  return false; // Product Hunt token is not configured in this environment.
}

export function ToolDetailSignal({ tool }: ToolDetailSignalProps) {
  return (
    <section
      id="td-final-signal"
      className="td-final-signal"
      aria-labelledby="td-final-signal-title"
    >
      <p className="td-final-section-eyebrow">
        <TrendingUp size={12} aria-hidden="true" />
        Trend e segnale editoriale
      </p>
      <h2 id="td-final-signal-title" className="td-final-section-title">
        Cosa dice il momento di {tool.name}.
      </h2>
      {isPhSignalAvailable() ? (
        <div className="td-final-signal__grid" />
      ) : (
        <p className="td-final-signal__empty">
          Product Hunt e segnali live non sono al momento disponibili in TooolVibes
          (token di lettura non configurato). Per {tool.name} non mostriamo
          variazioni o classifiche derivate: questo spazio si attiverà solo
          quando saranno disponibili metriche reali e verificabili.
        </p>
      )}
    </section>
  );
}
