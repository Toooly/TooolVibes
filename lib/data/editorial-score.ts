/**
 * Canonical public editorial-assessment contract.
 *
 * A score is never inferred from a title, field count, feature flag, tag or
 * presentation state. It is displayable only when the editorial source
 * supplies a numeric value, methodology, verification date, explicit verdict,
 * factual evidence and an assessed limitation.
 */

import type { ToolPublic } from "@/lib/types/tool-public";

export type EditorialAssessmentStatus = "assessed" | "in_preparation";

export type EditorialScore = {
  status: EditorialAssessmentStatus;
  value: number | null;
  label: "Valutazione editoriale" | "Valutazione editoriale in preparazione";
  verdict: string | null;
  methodologyVersion: string | null;
  lastVerified: string | null;
  evidenceCount: number;
  limitationsAssessed: boolean;
};

type AssessmentInput = {
  publicTool?: ToolPublic;
  cautions?: readonly string[];
};

function hasSupportedAssessment(tool: AssessmentInput) {
  const score = tool.publicTool?.score;
  const hasEvidence = (tool.publicTool?.editorial.evidence.length ?? 0) > 0;
  const hasCaution = (tool.cautions?.length ?? 0) > 0 || score?.limitationsAssessed === true;

  return Boolean(
    score &&
      typeof score.value === "number" &&
      score.provenance.kind === "editorial-assessment" &&
      score.provenance.methodologyVersion &&
      score.provenance.assessedAt &&
      score.verdict &&
      hasEvidence &&
      hasCaution,
  );
}

export function computeEditorialScore(tool: AssessmentInput): EditorialScore {
  const score = tool.publicTool?.score;
  const assessed = hasSupportedAssessment(tool);

  return {
    status: assessed ? "assessed" : "in_preparation",
    value: assessed && typeof score?.value === "number" ? score.value : null,
    label: assessed
      ? "Valutazione editoriale"
      : "Valutazione editoriale in preparazione",
    verdict: assessed ? score?.verdict ?? null : null,
    methodologyVersion: assessed ? score?.provenance.methodologyVersion ?? null : null,
    lastVerified: assessed ? score?.provenance.assessedAt ?? null : null,
    evidenceCount: assessed ? tool.publicTool?.editorial.evidence.length ?? 0 : 0,
    limitationsAssessed: assessed,
  };
}
