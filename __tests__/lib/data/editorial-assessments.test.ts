/**
 * Canonical resolver — editorial assessments.
 *
 * Closure 2026-08-04 — owner-approved registry (Gianmaria):
 *   - 30 assessments approved (25 APPROVE + 5 APPROVE_WITH_LIMITATIONS).
 *   - Metodologia: builder-first-v1.
 *   - Tutti i 30 tool di directoryTools sono `assessed`.
 *   - Blink = 8.0, Synthesia AI = 9.1, Omi = 4.8.
 *   - Nessun punteggio deriva da level, featured, keyword matching o score sintetici.
 *   - Parity confermata: Archive == Tool Detail == Compare == Arena.
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

function viewForSlug(slug: string) {
  const directory = directoryTools.find((tool) => tool.slug === slug);
  if (!directory) throw new Error(`directory tool ${slug} not found`);
  const publicTool = adaptDirectoryToolToPublic(directory, { status: "published" });
  return createToolPublicView(publicTool, directory);
}

describe("Editorial assessments — index (closure 2026-08-04, approved)", () => {
  it("registry approvato contiene esattamente 30 assessment", () => {
    expect(listApprovedAssessmentSlugs()).toHaveLength(30);
  });

  it("tutti i 30 slug canonici del directory sono coperti", () => {
    const approved = new Set(listApprovedAssessmentSlugs());
    const directory = new Set(directoryTools.map((t) => t.slug));
    expect(approved).toEqual(directory);
  });

  it("Blink e approvato con score 8.0, non piu 8.4", () => {
    const a = getApprovedAssessmentBySlug("blink");
    expect(a).not.toBeNull();
    expect(a!.score.value).toBe(8.0);
    expect(a!.approvalStatus).toBe("approved");
  });

  it("Synthesia AI e approvato con score 9.1", () => {
    const a = getApprovedAssessmentBySlug("synthesia-ai");
    expect(a).not.toBeNull();
    expect(a!.score.value).toBe(9.1);
  });

  it("Omi e approvato con score 4.8", () => {
    const a = getApprovedAssessmentBySlug("omi");
    expect(a).not.toBeNull();
    expect(a!.score.value).toBe(4.8);
  });

  it("tutti gli assessment hanno provenance builder-first-v1", () => {
    for (const slug of listApprovedAssessmentSlugs()) {
      const a = getApprovedAssessmentBySlug(slug);
      expect(a!.score.provenance.methodologyVersion).toBe("builder-first-v1");
    }
  });

  it("tutti gli assessment hanno limitations esplicite", () => {
    for (const slug of listApprovedAssessmentSlugs()) {
      const a = getApprovedAssessmentBySlug(slug);
      expect(a!.limitations.length).toBeGreaterThan(0);
    }
  });
});

describe("Canonical resolver — parity (closure 2026-08-04, approved)", () => {
  it("Archive / Tool Detail: Blink mostra valutazione editoriale 8.0", () => {
    const view = viewForSlug("blink");
    const assessment = computeEditorialScore(view);

    expect(assessment.status).toBe("assessed");
    expect(assessment.value).toBe(8.0);
    expect(assessment.label).toBe("Valutazione editoriale");
    expect(assessment.limitationsAssessed).toBe(true);
  });

  it("Compare / Arena: Blink e verified, totale 8.0", () => {
    const view = viewForSlug("blink");
    const result = scoreToolForCompare(view.publicTool);

    expect(result.assessment.state).toBe("verified");
    expect(result.total).toBe(8.0);
    expect(result.confidence.coverage).toBe(1);
    expect(result.confidence.level).toBe("high");
  });

  it("tutte e quattro le superfici concordano: Blink verified con 8.0", () => {
    const view = viewForSlug("blink");
    const archive = computeEditorialScore(view);
    const compare = scoreToolForCompare(view.publicTool);

    expect(archive.value).toBe(8.0);
    expect(compare.total).toBe(8.0);
    expect(archive.status).toBe("assessed");
    expect(compare.assessment.state).toBe("verified");
  });
});

describe("Canonical resolver — non-fabbricazione (closure 2026-08-04 §8)", () => {
  it("tutti i 30 tool directory hanno un assessment verified", () => {
    for (const tool of directoryTools) {
      const a = getApprovedAssessmentBySlug(tool.slug);
      expect(a).not.toBeNull();
      expect(a!.score.value).toBeGreaterThan(0);
      expect(a!.score.value).toBeLessThanOrEqual(10);
    }
  });

  it("nessun punteggio viene dedotto da level, featured, o scorecard parziale", () => {
    for (const tool of directoryTools) {
      const view = createToolPublicView(
        adaptDirectoryToolToPublic(tool, { status: "published" }),
        tool,
      );
      // AdaptDirectoryToolToPublic now produces canonical scores from the approved registry
      expect(view.publicTool.score).not.toBeNull();
      expect(view.publicTool.score!.provenance.kind).toBe("editorial-assessment");
    }
  });

  it("rejects unknown or non-approved slugs", () => {
    expect(getApprovedAssessmentBySlug("not-a-real-slug")).toBeNull();
  });
});
