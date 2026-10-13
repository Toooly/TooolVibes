import { LocalizedText, LocalizedAttributes } from "@/components/i18n/localized-text";
import type { ToolPublicView } from "@/lib/data/tool-public-view";
import { computeEditorialScore, editorialScoreBand } from "@/lib/data/editorial-score";

/**
 * Compact editorial score for the hero facts line.
 * Dimension breakdown lives in Approfondisci → Overview.
 */

type ToolDetailScoreProps = {
  tool: ToolPublicView;
  showVerdictPill?: boolean;
};

export function ToolDetailScore({ tool, showVerdictPill = true }: ToolDetailScoreProps) {
  const assessment = computeEditorialScore(tool);

  return (
    <LocalizedAttributes><p className="td-final-score td-final-score--compact" aria-label={assessment.label}>
      {assessment.value !== null ? (
        <>
          <span className="td-final-score__star" aria-hidden="true">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          </span>
          <span className="td-final-score__number">{assessment.value.toFixed(1)}</span>
          <span className="td-final-score__scale">/ 10</span>
          {showVerdictPill ? (
            <span className="td-final-score__verdict">{editorialScoreBand(assessment.value)}</span>
          ) : null}
        </>
      ) : (
        <span className="td-final-score__number td-final-score__number--status"><LocalizedText>{"Valutazione in preparazione "}</LocalizedText></span>
      )}
    </p></LocalizedAttributes>
  );
}
