/**
 * Wave 7 — session-only note after Decide.
 * Not WorkspaceStateV1. Survives in-memory remounts in the same JS context
 * so the empty workbench can say "Confronto chiuso" instead of first-use
 * education. A real page reload starts empty again.
 */

export type CompareDecisionNote = {
  slug: string;
  name: string;
};

let note: CompareDecisionNote | null = null;

export function noteCompareDecision(payload: CompareDecisionNote) {
  const slug = payload.slug.trim();
  const name = payload.name.trim();
  if (!slug || !name) return;
  note = { slug, name };
}

export function peekCompareDecision(): CompareDecisionNote | null {
  return note;
}

export function consumeCompareDecision(): CompareDecisionNote | null {
  const current = note;
  note = null;
  return current;
}
