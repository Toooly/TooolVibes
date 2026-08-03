/**
 * Canonical resolver — editorial assessments.
 *
 * Closure 2026-08-03 — forensic provenance review:
 *   - Blink 8.4 RIMOSSO: proviene da commit 2d4551d (keyword-matching
 *     algoritmico), non da assessment editoriale umano verificabile.
 *   - Registry approvato vuoto. Nessuno score viene pubblicato.
 *   - Tutti i 30 tool di directoryTools sono `not_assessed`.
 *   - VibeCode e WeWeb restano draft_review_required.
 *   - Le scorecard legacy, fixture e mock non entrano nel runtime.
 *   - Il resolver canonico, i tipi e le validazioni sono mantenuti.
 *   - I test anti-fabbricazione sono mantenuti e rinforzati.
 */

import { describe, expect, it } from "vitest";

import { computeEditorialScore } from "@/lib/data/editorial-score";
import { scoreToolForCompare } from "@/lib/compare/compare-score";
import { adaptDirectoryToolToPublic } from "@/lib/data/tool-public-adapters";
import { createToolPublicView } from "@/lib/data/tool-public-view";
import {
  getApprovedAssessmentBySlug,
  listApprovedAssessmentSlugs,
} from "@/lib/data/editorial-assessments";
import { directoryTools } from "@/lib/data/tooolvibes-directory";
import { mockTools } from "@/lib/data/mock-tools";

function viewForSlug(slug: string) {
  const directory = directoryTools.find((tool) => tool.slug === slug);
  if (!directory) throw new Error(`directory tool ${slug} not found`);
  const publicTool = adaptDirectoryToolToPublic(directory, { status: "published" });
  return createToolPublicView(publicTool, directory);
}

describe("Editorial assessments — index (closure 2026-08-03, forensic)", () => {
  it("registry approvato vuoto: nessuno score verified viene pubblicato", () => {
    expect(listApprovedAssessmentSlugs()).toEqual([]);
  });

  it("Blink non è più negli approved: provenienza non dimostrabile", () => {
    expect(getApprovedAssessmentBySlug("blink")).toBeNull();
  });

  it("nessun tool di directory ha un assessment approved", () => {
    expect(getApprovedAssessmentBySlug("vibecode")).toBeNull();
    expect(getApprovedAssessmentBySlug("weweb")).toBeNull();
  });

  it("rejects unknown or non-approved slugs", () => {
    expect(getApprovedAssessmentBySlug("not-a-real-slug")).toBeNull();
  });
});

describe("Canonical resolver — parità (closure 2026-08-03, forensic)", () => {
  it("Archive / Tool Detail: Blink mostra valutazione in preparazione", () => {
    const view = viewForSlug("blink");
    const assessment = computeEditorialScore(view);

    expect(assessment.status).toBe("in_preparation");
    expect(assessment.value).toBeNull();
    expect(assessment.label).toContain("Valutazione editoriale");
  });

  it("Compare / Arena: Blink è not_assessed, nessun totale", () => {
    const view = viewForSlug("blink");
    const result = scoreToolForCompare(view.publicTool);

    expect(result.assessment.state).toBe("not_assessed");
    expect(result.total).toBeNull();
    expect(result.confidence.coverage).toBe(0);
    expect(result.confidence.level).toBe("low");
    expect(result.explanation.join(" ")).toContain("in preparazione");
  });

  it("tutte e quattro le superfici concordano: Blink not_assessed", () => {
    const view = viewForSlug("blink");
    const archive = computeEditorialScore(view);
    const compare = scoreToolForCompare(view.publicTool);

    expect(archive.value).toBeNull();
    expect(compare.total).toBeNull();
    expect(archive.status).toBe("in_preparation");
    expect(compare.assessment.state).toBe("not_assessed");
  });
});

describe("Canonical resolver — non-fabbricazione (closure 2026-08-03 §8)", () => {
  it("VibeCode: not_assessed, nessun totale, nessun winner", () => {
    const view = viewForSlug("vibecode");
    const assessment = computeEditorialScore(view);
    const compare = scoreToolForCompare(view.publicTool);

    expect(assessment.status).toBe("in_preparation");
    expect(assessment.value).toBeNull();
    expect(compare.assessment.state).toBe("not_assessed");
    expect(compare.total).toBeNull();
  });

  it("WeWeb: not_assessed, nessun totale, nessun winner", () => {
    const view = viewForSlug("weweb");
    const assessment = computeEditorialScore(view);
    const compare = scoreToolForCompare(view.publicTool);

    expect(assessment.status).toBe("in_preparation");
    expect(assessment.value).toBeNull();
    expect(compare.assessment.state).toBe("not_assessed");
    expect(compare.total).toBeNull();
  });

  it("tutti i 30 tool directory: nessun punteggio fabbricato", () => {
    const approved = new Set(listApprovedAssessmentSlugs());
    expect(approved.size).toBe(0);

    const unassessed = directoryTools.filter(
      (tool) => !approved.has(tool.slug),
    );

    expect(unassessed.length).toBe(directoryTools.length);
    for (const tool of unassessed) {
      const view = createToolPublicView(
        adaptDirectoryToolToPublic(tool, { status: "published" }),
        tool,
      );
      const compare = scoreToolForCompare(view.publicTool);

      expect(compare.total).toBeNull();
      expect(compare.assessment.state).toBe("not_assessed");
    }
  });

  it("scorecard legacy di mockTools non entrano nel runtime", () => {
    expect(mockTools.length).toBeGreaterThan(0);
    for (const record of mockTools) {
      expect(listApprovedAssessmentSlugs().includes(record.slug)).toBe(false);
    }
  });

  it("nessun punteggio viene dedotto da level, featured, o scorecard parziale", () => {
    for (const tool of directoryTools) {
      const view = createToolPublicView(
        adaptDirectoryToolToPublic(tool, { status: "published" }),
        tool,
      );
      // Verifica che adaptDirectoryToolToPublic non produca score fabbricati
      expect(view.publicTool.score).toBeNull();
    }
  });
});
