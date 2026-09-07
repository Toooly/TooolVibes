import type { ToolPublicView } from "@/lib/data/tool-public-view";
import { computeEditorialScore } from "@/lib/data/editorial-score";

/**
 * Compact editorial score for the hero facts line.
 * Dimension breakdown lives in Approfondisci → Overview.
 */

type ToolDetailScoreProps = {
  tool: ToolPublicView;
};

export function ToolDetailScore({ tool }: ToolDetailScoreProps) {
  const assessment = computeEditorialScore(tool);

  return (
    <p className="td-final-score td-final-score--compact" aria-label={assessment.label}>
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
    </p>
  );
}
