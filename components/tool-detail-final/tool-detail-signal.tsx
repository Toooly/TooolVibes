import { TrendingUp } from "lucide-react";

import type { ToolPublicView } from "@/lib/data/tool-public-view";
import { deriveTrend } from "@/lib/data/tool-detail-derivation";

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
  const trend = deriveTrend(tool);

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
          (token di lettura non configurato). Mostriamo quindi solo il segnale
          editoriale interno: <strong>{trend.value}</strong> di variazione
          qualitativa rispetto all&apos;ultima revisione, con direzione{" "}
          <strong>
            {trend.direction === "up"
              ? "in crescita"
              : trend.direction === "down"
                ? "in calo"
                : "stabile"}
          </strong>
          . Quando il segnale Product Hunt sarà cablato, apparirà qui sotto
          forma di grafici e metriche reali, mai simulate.
        </p>
      )}
    </section>
  );
}
