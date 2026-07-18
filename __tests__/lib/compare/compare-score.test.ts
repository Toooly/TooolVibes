import { describe, expect, it } from "vitest";

import {
  completeToolPublicFixture,
  partialToolPublicFixture,
} from "@/__tests__/fixtures/tool-public";
import {
  COMPARE_SCORE_VERSION,
  compareScoreResults,
  compareToolsForCompare,
  rankCompareScores,
  scoreToolForCompare,
} from "@/lib/compare/compare-score";
import type { ToolPublic } from "@/lib/types/tool-public";

const atlas = completeToolPublicFixture;

const beta: ToolPublic = {
  ...completeToolPublicFixture,
  slug: "beta-clone",
  name: "Beta Clone",
  provenance: {
    ...completeToolPublicFixture.provenance,
    sourceId: "tool-beta",
  },
};

const gamma: ToolPublic = {
  ...completeToolPublicFixture,
  slug: "gamma-app",
  name: "Gamma",
  taxonomy: {
    canonicalCategory: "Produttività",
    sourceCategory: "Produttività",
    sourceCategoryLabel: "Produttività",
    tags: ["automation", "workflow", "team", "prototype"],
  },
  content: {
    summary: "Automazione completa dei flussi ripetitivi.",
    description: "Gamma automatizza workflow di team con approvazioni tracciate.",
    bestFor: "Team che vogliono automazione workflow completa",
    useCases: [
      "Automazione onboarding",
      "Approvazioni ricorrenti",
      "Sincronizzazione strumenti",
      "Report automatici",
    ],
  },
  editorial: {
    evidence: [
      { kind: "review", text: "Il motore di regole resta leggibile.", sourceField: "editorial_note" },
      { kind: "strength", text: "Automazione workflow completa", sourceField: "strengths" },
      { kind: "strength", text: "Permessi granulari", sourceField: "strengths" },
      { kind: "highlight", text: "Template pronti", sourceField: "highlights" },
    ],
  },
  score: {
    inputs: [
      { dimension: "ease_of_use", level: "strong" },
      { dimension: "workflow_fit", level: "strong" },
      { dimension: "editorial_conviction", level: "solid" },
    ],
    provenance: {
      kind: "editorial-assessment",
      sourceField: "editorial_scorecard",
      methodologyVersion: "editorial-scorecard-v2",
      assessedAt: "2026-07-12T10:00:00.000Z",
    },
  },
  provenance: {
    ...completeToolPublicFixture.provenance,
    sourceId: "tool-gamma",
  },
};

const deltaMedium: ToolPublic = {
  ...completeToolPublicFixture,
  slug: "delta-medium",
  name: "Delta Medium",
  taxonomy: {
    canonicalCategory: null,
    sourceCategory: "Legacy category",
    sourceCategoryLabel: "Legacy category",
    tags: [],
  },
  content: {
    ...completeToolPublicFixture.content,
    useCases: [],
  },
  provenance: {
    ...completeToolPublicFixture.provenance,
    sourceId: "tool-delta",
    missingFields: ["taxonomy.canonicalCategory", "content.useCases"],
  },
};

const partial = partialToolPublicFixture;

function permutations<T>(items: T[]): T[][] {
  if (items.length <= 1) return [items];

  return items.flatMap((item, index) =>
    permutations([...items.slice(0, index), ...items.slice(index + 1)]).map((rest) => [
      item,
      ...rest,
    ]),
  );
}

function rankingSignature(results: ReturnType<typeof compareToolsForCompare>) {
  return results.map((result) => ({
    slug: result.slug,
    total: result.total,
    rank: result.rank,
    confidence: result.confidence.level,
    explanation: result.explanation,
  }));
}

describe("compare-score engine (B33)", () => {
  it("versiona il contratto e lo espone nel risultato", () => {
    const result = scoreToolForCompare(atlas);

    expect(result.version).toBe(COMPARE_SCORE_VERSION);
    expect(result.rank).toBe(0);
  });

  it("l'ordine di input non cambia punteggi, rank e spiegazioni", () => {
    const candidates = [atlas, gamma, partial];
    const signatures = permutations(candidates).map((order) =>
      rankingSignature(compareToolsForCompare(order)),
    );

    for (const signature of signatures) {
      expect(signature).toEqual(signatures[0]);
    }

    const winnerOrder = signatures[0].map((entry) => entry.slug);
    expect(winnerOrder).toEqual(["gamma-app", "atlas-ai", "partial-tool"]);
  });

  it("lo scoring del singolo tool è puro: non dipende dal contesto degli altri candidati", () => {
    const solo = scoreToolForCompare(atlas);
    const inGroup = compareToolsForCompare([gamma, atlas, partial]).find(
      (result) => result.slug === atlas.slug,
    );

    expect(inGroup).toBeDefined();
    expect({ ...inGroup, rank: 0 }).toEqual(solo);
  });

  it("rankCompareScores assegna rank canonici indipendenti dall'ordine", () => {
    const scored = [atlas, gamma, partial].map(scoreToolForCompare);
    const forward = rankCompareScores(scored);
    const reversed = rankCompareScores([...scored].reverse());

    expect(reversed).toEqual(forward);
    expect(forward.map((result) => result.rank)).toEqual([1, 2, 3]);
  });

  it("pareggio: stesso totale, tie-break deterministico sullo slug", () => {
    const atlasResult = scoreToolForCompare(atlas);
    const betaResult = scoreToolForCompare(beta);

    expect(betaResult.total).toBe(atlasResult.total);
    expect(compareScoreResults(atlasResult, betaResult)).toBeLessThan(0);
    expect(compareScoreResults(betaResult, atlasResult)).toBeGreaterThan(0);

    const ranked = rankCompareScores([betaResult, atlasResult]);
    expect(ranked.map((result) => result.slug)).toEqual(["atlas-ai", "beta-clone"]);
  });

  it("dati mancanti: nessun punteggio fantasma, confidence bassa e degrado dichiarato", () => {
    const result = scoreToolForCompare(partial);

    expect(result.total).toBe(0);
    expect(result.confidence.level).toBe("low");
    expect(result.confidence.coverage).toBe(0);
    expect(result.components.every((component) => !component.available)).toBe(true);
    expect(result.components.every((component) => component.value === 0)).toBe(true);
    expect(result.confidence.missing).toEqual(
      expect.arrayContaining([
        "Valutazione editoriale",
        "Prove editoriali",
        "Copertura casi d'uso",
        "Contesto tassonomico",
        "score",
        "taxonomy.canonicalCategory",
      ]),
    );
    expect(result.explanation.join("\n")).toContain("dati assenti, nessun contributo assegnato");
  });

  it("la confidence cresce con la copertura dei dati canonici", () => {
    const lowResult = scoreToolForCompare(partial);
    const mediumResult = scoreToolForCompare(deltaMedium);
    const highResult = scoreToolForCompare(atlas);

    expect(lowResult.confidence.level).toBe("low");
    expect(mediumResult.confidence.level).toBe("medium");
    expect(mediumResult.confidence.coverage).toBeCloseTo(0.7, 5);
    expect(highResult.confidence.level).toBe("high");
    expect(highResult.confidence.coverage).toBe(1);
  });

  it("calcola il totale come media pesata dei soli componenti disponibili", () => {
    const result = scoreToolForCompare(atlas);

    const byKey = new Map(result.components.map((component) => [component.key, component]));
    expect(byKey.get("editorial-scorecard")?.value).toBe(85);
    expect(byKey.get("editorial-evidence")?.value).toBe(50);
    expect(byKey.get("use-case-coverage")?.value).toBe(50);
    expect(byKey.get("taxonomy-context")?.value).toBe(75);
    expect(result.total).toBe(68);
  });

  it("ogni componente dichiara provenance: campo canonico e regola", () => {
    const result = scoreToolForCompare(gamma);

    for (const component of result.components) {
      expect(component.provenance.field.length).toBeGreaterThan(0);
      expect(component.provenance.rule.length).toBeGreaterThan(0);
    }

    const fields = result.components.map((component) => component.provenance.field);
    expect(fields).toEqual([
      "score.inputs",
      "editorial.evidence",
      "content.useCases",
      "taxonomy",
    ]);

    const scorecard = result.components.find(
      (component) => component.key === "editorial-scorecard",
    );
    expect(scorecard?.provenance.rule).toContain("editorial-scorecard-v2");
    expect(scorecard?.provenance.rule).toContain("editorial-assessment");
  });

  it("explanation stabile e leggibile su fixture (snapshot)", () => {
    const explanation = [gamma, atlas, partial].map(
      (tool) => scoreToolForCompare(tool).explanation,
    );

    expect(explanation).toMatchSnapshot();
  });
});
