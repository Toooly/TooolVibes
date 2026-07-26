import type { ToolPublicView } from "@/lib/data/tool-public-view";
import { deriveTrend } from "@/lib/data/tool-detail-derivation";

type VisualLabSignalModuleProps = {
  tool: ToolPublicView;
};

function isPhSignalAvailable(): boolean {
  return false;
}

export function VisualLabSignalModule({ tool }: VisualLabSignalModuleProps) {
  const trend = deriveTrend(tool);
  const directionLabel =
    trend.direction === "up"
      ? "in crescita"
      : trend.direction === "down"
        ? "in calo"
        : "stabile";

  return (
    <section
      id="td-lab-signal"
      className="td-lab-signal"
      aria-labelledby="td-lab-signal-title"
    >
      <header className="td-lab-signal__head">
        <p className="td-lab-section-eyebrow">Signal module</p>
        <h2 id="td-lab-signal-title" className="td-lab-section-title">
          Cosa dice il momento di {tool.name}.
        </h2>
      </header>

      {isPhSignalAvailable() ? (
        <div className="td-lab-signal__live" />
      ) : (
        <div className="td-lab-signal__instrument" data-state="unavailable">
          <div className="td-lab-signal__lock" aria-hidden="true">
            <span className="td-lab-signal__lock-ring" />
            <span className="td-lab-signal__lock-core" />
            <span className="td-lab-signal__lock-scan" />
          </div>

          <div className="td-lab-signal__body">
            <p className="td-lab-signal__status">
              <span className="td-lab-signal__status-dot" aria-hidden="true" />
              Product Hunt · segnale non cablato
            </p>
            <p className="td-lab-signal__copy">
              Product Hunt e segnali live non sono al momento disponibili in TooolVibes
              (token di lettura non configurato). Mostriamo solo il segnale editoriale
              interno — mai dati simulati.
            </p>
            <dl className="td-lab-signal__metrics">
              <div>
                <dt>Variazione qualitativa</dt>
                <dd data-direction={trend.direction}>{trend.value}</dd>
              </div>
              <div>
                <dt>Direzione</dt>
                <dd>{directionLabel}</dd>
              </div>
              <div>
                <dt>Fonte</dt>
                <dd>Redazione TooolVibes</dd>
              </div>
            </dl>
          </div>
        </div>
      )}
    </section>
  );
}
