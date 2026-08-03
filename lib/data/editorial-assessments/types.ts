/**
 * Editorial assessments — verified canonical resolver.
 *
 * Closure 2026-08-03 §8: solo `approved` produce un `ToolPublic.score`
 * pubblicabile. Le scorecard legacy, parziali o in `draft` NON entrano
 * nel runtime. Il `value` del totale 0-10 è esplicito e versionato
 * (`methodologyVersion` + `assessedAt` + `assessor` + `limitations`).
 *
 * Wired into `adaptDirectoryToolToPublic` in `lib/data/tool-public-adapters.ts`.
 * Le 4 superfici (Archive, Tool Detail, Compare, Arena) leggono il
 * ToolPublic canonico dallo stesso resolver, quindi uno score
 * verified appare identico ovunque.
 */

import type { ToolPublic } from "@/lib/types/tool-public";

export type EditorialApprovalStatus = "approved" | "draft" | "rejected";

export type EditorialAssessmentScore = NonNullable<ToolPublic["score"]>;

export type ApprovedEditorialAssessment = {
  slug: string;
  approvalStatus: "approved";
  /** ISO 8601 data di approvazione. */
  approvedAt: string;
  /** Nome editoriale che ha approvato (audit trail). */
  approvedBy: string;
  /** Score canonico `ToolPublic["score"]` con tutte e 7 le condizioni. */
  score: EditorialAssessmentScore;
  /** Chi ha materialmente compilato la scorecard. */
  assessor: string;
  /** Limitazioni esplicite (es. "verificato solo su Piano Pro", "no mobile nativo"). */
  limitations: readonly string[];
};

export type EditorialAssessment = ApprovedEditorialAssessment | {
  slug: string;
  approvalStatus: Exclude<EditorialApprovalStatus, "approved">;
};
