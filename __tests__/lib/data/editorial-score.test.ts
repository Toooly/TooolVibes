import { describe, expect, it } from "vitest";

import { completeToolPublicFixture } from "@/__tests__/fixtures/tool-public";
import { computeEditorialScore } from "@/lib/data/editorial-score";

describe("computeEditorialScore", () => {
  it("keeps a tool in preparation when only presentation metadata changes", () => {
    const assessment = computeEditorialScore({
      publicTool: {
        ...completeToolPublicFixture,
        name: "Blink",
        flags: { featured: true },
      },
    });

    expect(assessment).toMatchObject({
      status: "in_preparation",
      value: null,
      verdict: null,
      evidenceCount: 0,
      limitationsAssessed: false,
    });
  });

  it("renders an explicit assessment only with its evidence, method, date and limitations", () => {
    const assessment = computeEditorialScore({
      publicTool: {
        ...completeToolPublicFixture,
        score: {
          ...completeToolPublicFixture.score,
          value: 8.4,
          verdict: "Una scelta solida per ricerche con fonti controllabili.",
          limitationsAssessed: true,
        },
      },
    });

    expect(assessment).toMatchObject({
      status: "assessed",
      value: 8.4,
      label: "Valutazione editoriale",
      verdict: "Una scelta solida per ricerche con fonti controllabili.",
      methodologyVersion: "legacy-editorial-scorecard-v1",
      lastVerified: "2026-07-11T10:00:00.000Z",
      evidenceCount: 2,
      limitationsAssessed: true,
    });
  });

  it("does not display a number when any required assessment evidence is absent", () => {
    const assessment = computeEditorialScore({
      publicTool: {
        ...completeToolPublicFixture,
        score: {
          ...completeToolPublicFixture.score,
          value: 8.4,
          verdict: "Una scelta solida.",
          limitationsAssessed: false,
        },
      },
    });

    expect(assessment.status).toBe("in_preparation");
    expect(assessment.value).toBeNull();
  });
});
