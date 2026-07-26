import type { ToolPublicView } from "@/lib/data/tool-public-view";
import { computeEditorialScore } from "@/lib/data/editorial-score";
import {
  deriveScoreDimensions,
  deriveTrend,
  deriveVotes,
} from "@/lib/data/tool-detail-derivation";

type VisualLabScoreInstrumentProps = {
  tool: ToolPublicView;
};

export function VisualLabScoreInstrument({ tool }: VisualLabScoreInstrumentProps) {
  const { value, label } = computeEditorialScore(tool);
  const trend = deriveTrend(tool);
  const votes = deriveVotes(tool);
  const dimensions = deriveScoreDimensions(tool);
  const pct = Math.min(value * 10, 100);

  return (
    <aside
      className="td-lab-score"
      aria-label={`Punteggio editoriale TooolVibes ${value} su 10, ${label}`}
    >
      <div className="td-lab-score__orbit" aria-hidden="true">
        <span className="td-lab-score__ring td-lab-score__ring--outer" />
        <span className="td-lab-score__ring td-lab-score__ring--mid" />
        <span className="td-lab-score__scan" />
        <span className="td-lab-score__node td-lab-score__node--n1" />
        <span className="td-lab-score__node td-lab-score__node--n2" />
        <span className="td-lab-score__node td-lab-score__node--n3" />
      </div>

      <div className="td-lab-score__core">
        <span className="td-lab-score__kicker">Score instrument</span>
        <div className="td-lab-score__value">
          <span className="td-lab-score__number">{value.toFixed(1)}</span>
          <span className="td-lab-score__denom">/10</span>
        </div>
        <span className="td-lab-score__label">{label}</span>
        <div
          className="td-lab-score__trace"
          role="progressbar"
          aria-valuenow={Math.round(value * 10)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Score ${value} su 10`}
        >
          <span className="td-lab-score__trace-fill" style={{ width: `${pct}%` }} />
          <span className="td-lab-score__trace-pulse" style={{ left: `${pct}%` }} />
        </div>
      </div>

      <ul className="td-lab-score__dims" aria-label="Dimensioni score">
        {dimensions.map((d, i) => (
          <li key={d.label} className="td-lab-score__dim" data-index={i + 1}>
            <span className="td-lab-score__dim-node" aria-hidden="true" />
            <span className="td-lab-score__dim-label">{d.label}</span>
            <span className="td-lab-score__dim-value">{d.value}</span>
          </li>
        ))}
      </ul>

      <footer className="td-lab-score__foot">
        <span className="td-lab-score__trend" data-direction={trend.direction}>
          {trend.direction === "up" ? "↑" : trend.direction === "down" ? "↓" : "—"}{" "}
          {trend.value}
        </span>
        <p className="td-lab-score__note">
          Confidenza editoriale <strong>{label.toLowerCase()}</strong> · {votes}{" "}
          segnalazioni redazione. Non è un benchmark di laboratorio.
        </p>
      </footer>
    </aside>
  );
}
