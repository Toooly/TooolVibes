import type { ToolPublicView } from "@/lib/data/tool-public-view";
import { computeEditorialScore } from "@/lib/data/editorial-score";
import { deriveScoreDimensions } from "@/lib/data/tool-detail-derivation";

/**
 * B. Score Instrument
 * Server component. Renders the canonical editorial score with gold halo,
 * 4 derived dimensions, and a non-benchmark disclaimer.
 */

type ToolDetailScoreProps = {
  tool: ToolPublicView;
};

export function ToolDetailScore({ tool }: ToolDetailScoreProps) {
  const assessment = computeEditorialScore(tool);
  const dimensions = deriveScoreDimensions(tool);

  return (
    <aside
      className="td-final-score"
      aria-label={assessment.label}
    >
      <div className="td-final-score__header">
        <span className="td-final-score__kicker">Valutazione editoriale</span>
        <span
          className={
            assessment.status === "assessed"
              ? "td-final-score__badge tv-brand-stamp"
              : "td-final-score__badge tv-brand-stamp tv-brand-stamp--violet"
          }
        >
          {assessment.status === "assessed" ? "Valutazione verificata" : "In preparazione"}
        </span>
      </div>
      <div className="td-final-score__value">
        {assessment.value !== null ? (
          <>
            <span className="td-final-score__number">{assessment.value.toFixed(1)}</span>
            <span className="td-final-score__denom">/10</span>
          </>
        ) : (
          <span className="td-final-score__number td-final-score__number--status">
            Valutazione in preparazione
          </span>
        )}
      </div>
      {dimensions.length > 0 ? (
        <ul className="td-final-score__dimensions" aria-label="Dimensioni verificate">
          {dimensions.map((d) => (
            <li key={d.label} className="td-final-score__dim">
              <span className="td-final-score__dim-label">{d.label}</span>
              <span className="td-final-score__dim-value">{d.value}</span>
            </li>
          ))}
        </ul>
      ) : null}
      <p className="td-final-score__note">
        {assessment.status === "assessed"
          ? assessment.verdict
          : "Stiamo raccogliendo fonti, limiti e verifiche prima di pubblicare una valutazione."}
      </p>
    </aside>
  );
}
