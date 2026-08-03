/**
 * Editorial assessments — index.
 *
 * Single source of truth per score verified. Il `slug` è la chiave.
 * Solo assessment con `approvalStatus === "approved"` vengono
 * esposti al runtime; gli altri (draft, rejected) restano off-line
 * e non sono indicizzati.
 *
 * Aggiungere un nuovo score qui significa:
 *   1. Avere un draft in
 *      `/Users/gianmariacaltagirone/Tooolvibes-copy-audit/docs/editorial-methodology/drafts/`
 *      approvato da TooolVibes Editorial.
 *   2. Creare un file `lib/data/editorial-assessments/<slug>.ts` con
 *      `approvalStatus: "approved"` e tutti i metadati richiesti.
 *   3. Aggiungere lo slug all'array `approvedAssessments` qui sotto.
 *
 * Rimozione / aggiornamento richiedono un bump di `methodologyVersion`
 * (cfr. ADR 0005 + metodologia in worktree editoriale).
 *
 * Closure 2026-08-03: Blink 8.4 è stato rimosso perché la sua provenienza
 * non è dimostrabile. Il valore 8.4 proviene da commit 2d4551d che contiene
 * un algoritmo di keyword-matching sintetico (categoryScoreBase + haystack),
 * non un assessment editoriale umano. La metodologia `editorial-scorecard-v1`
 * è etichettata come bozza NON runtime nel documento di metodologia.
 * Registry approvato vuoto per decisione forense.
 */

import type { ApprovedEditorialAssessment } from "./types";

const approvedAssessments: ReadonlyArray<ApprovedEditorialAssessment> = [];

const approvedBySlug: Map<string, ApprovedEditorialAssessment> = new Map(
  approvedAssessments.map((assessment) => [assessment.slug, assessment]),
);

export function getApprovedAssessmentBySlug(
  slug: string,
): ApprovedEditorialAssessment | null {
  return approvedBySlug.get(slug) ?? null;
}

export function listApprovedAssessmentSlugs(): readonly string[] {
  return approvedAssessments.map((assessment) => assessment.slug);
}
