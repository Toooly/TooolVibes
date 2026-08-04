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
        Trend e segnali
      </p>
      <h2 id="td-final-signal-title" className="td-final-section-title">
        Cosa dice il momento di {tool.name}.
      </h2>
      {isPhSignalAvailable() ? (
        <div className="td-final-signal__grid" />
      ) : (
        <p className="td-final-signal__empty">
          I segnali live per questa scheda non sono disponibili in questo
          momento. Per {tool.name} non mostriamo variazioni o classifiche
          derivate: questo spazio si attiva solo con dati reali e verificabili.
        </p>
      )}
    </section>
  );
}
