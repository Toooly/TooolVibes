import type { ToolPublicView } from "@/lib/data/tool-public-view";
import { computeEditorialScore } from "@/lib/data/editorial-score";
import { deriveScoreDimensions } from "@/lib/data/tool-detail-derivation";

/**
 * B. Score Instrument
 * Server component. Renders the canonical 8.4 score with gold halo,
 * 4 derived dimensions, and a non-benchmark disclaimer.
 */

type ToolDetailScoreProps = {
  tool: ToolPublicView;
};

export function ToolDetailScore({ tool }: ToolDetailScoreProps) {
  const { value, label } = computeEditorialScore(tool);
  const dimensions = deriveScoreDimensions(tool);
  const evidenceCount =
    tool.useCases.length + tool.highlights.length + tool.cautions.length;

  return (
    <aside
      className="td-final-score"
      aria-label={`Punteggio editoriale TooolVibes ${value} su 10, ${label}`}
    >
      <div className="td-final-score__header">
        <span className="td-final-score__kicker">Valutazione editoriale</span>
        <span className="td-final-score__badge">
          Verdetto · {label}
        </span>
      </div>
      <div className="td-final-score__value">
        <span className="td-final-score__number">{value.toFixed(1)}</span>
        <span className="td-final-score__denom">/10</span>
      </div>
      <div
        className="td-final-score__bar"
        role="progressbar"
        aria-valuenow={Math.round(value * 10)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Score ${value} su 10`}
      >
        <span
          className="td-final-score__bar-fill"
          style={{ width: `${Math.min(value * 10, 100)}%` }}
        />
      </div>
      <ul className="td-final-score__dimensions" aria-label="Dimensioni">
        {dimensions.map((d) => (
          <li key={d.label} className="td-final-score__dim">
            <span className="td-final-score__dim-label">{d.label}</span>
            <span className="td-final-score__dim-value">{d.value}</span>
          </li>
        ))}
      </ul>
      <p className="td-final-score__note">
        Score editoriale {label.toLowerCase()} basato su segnali qualitativi
        della scheda
        {evidenceCount > 0
          ? ` e ${evidenceCount} ${evidenceCount === 1 ? "evidenza canonica" : "evidenze canoniche"}`
          : ""}.
        {" "}Non è un benchmark di laboratorio: serve a orientare la scelta.
      </p>
    </aside>
  );
}
