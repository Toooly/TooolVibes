import { describe, expect, it } from "vitest";

import {
  completeToolPublicFixture,
  partialToolPublicFixture,
} from "@/__tests__/fixtures/tool-public";
import {
  getBattleVerdict,
  normalise,
  withBattleScores,
  withObjectiveScores,
} from "@/components/tools/tool-battle-shared";
import type { ToolPublic } from "@/lib/types/tool-public";

function withSupportedAssessment(tool: ToolPublic, value: number): ToolPublic {
  const score = tool.score;
  if (!score) throw new Error("A scorecard is required for this fixture.");

  return {
    ...tool,
    score: {
      ...score,
      value,
      verdict: "Valutazione editoriale verificata.",
      limitationsAssessed: true,
      provenance: {
        ...score.provenance,
        kind: "editorial-assessment",
        methodologyVersion: "editorial-score-v1",
        assessedAt: "2026-08-01T10:00:00.000Z",
      },
    },
    editorial: {
      evidence: [
        { kind: "review", text: "Prova verificata.", sourceField: "editorial_note" },
        { kind: "caution", text: "Limite verificato.", sourceField: "cautions" },
      ],
    },
  };
}

const atlas = withSupportedAssessment(completeToolPublicFixture, 8.4);
const beta = withSupportedAssessment(
  { ...completeToolPublicFixture, slug: "beta-clone", name: "Beta Clone" },
  8.4,
);
const gamma = withSupportedAssessment(
  { ...completeToolPublicFixture, slug: "gamma-app", name: "Gamma" },
  9.1,
);

const views = [
  createToolPublicView(atlas),
  createToolPublicView(beta),
  createToolPublicView(gamma),
  createToolPublicView(partialToolPublicFixture),
];

function battlePipeline(slugs: string[]) {
  return withBattleScores(normalise(views, slugs));
}

describe("tool-battle truth adapter", () => {
  it("does not turn an unassessed tool into a zero-score candidate", () => {
    const [tool] = battlePipeline(["partial-tool"]);

    expect(tool.battleScore).toBeNull();
    expect(tool.editorialScore).toBeNull();
    expect(tool.compareScore.rank).toBeNull();
  });

  it("returns insufficient_evidence and no winner when any candidate is incomplete", () => {
    const verdict = getBattleVerdict(battlePipeline(["atlas-ai", "partial-tool"]));

    expect(verdict.state).toBe("insufficient_evidence");
    expect(verdict.winner).toBeNull();
    expect(verdict.label).toBe("Valutazione editoriale in preparazione");
    expect(verdict.reasons.join(" ")).toContain("Valutazione editoriale in preparazione");
    expect(verdict.reasons.join(" ")).toContain("in preparazione per");
    expect(verdict.reasons.join(" ")).not.toMatch(/score\.(value|provenance|verdict)/);
  });

  it("returns tie and no winner for equal supported assessments, regardless of slug", () => {
    const forward = getBattleVerdict(battlePipeline(["atlas-ai", "beta-clone"]));
    const reversed = getBattleVerdict(battlePipeline(["beta-clone", "atlas-ai"]));

    expect(forward.state).toBe("tie");
    expect(forward.winner).toBeNull();
    expect(reversed.state).toBe("tie");
    expect(reversed.winner).toBeNull();
    expect(forward.scores.map(({ rank }) => rank)).toEqual([1, 1]);
    expect(reversed.scores.map(({ rank }) => rank)).toEqual([1, 1]);
  });

  it("uses editorial_lead only for a unique, fully-supported assessment", () => {
    const verdict = getBattleVerdict(battlePipeline(["atlas-ai", "gamma-app"]));

    expect(verdict.state).toBe("editorial_lead");
    expect(verdict.winner?.slug).toBe("gamma-app");
    expect(verdict.reasons.join(" ")).toContain("esplicita più alta");
  });

  it("does not let a selected objective alter scores or claim an automatic winner", () => {
    const base = battlePipeline(["atlas-ai", "gamma-app"]);
    const prioritised = withObjectiveScores(base, "save-time");
    const verdict = getBattleVerdict(prioritised, "save-time");

    expect(prioritised.map((tool) => tool.battleScore)).toEqual(base.map((tool) => tool.battleScore));
    expect(prioritised.every((tool) => tool.objectiveScore === undefined)).toBe(true);
    expect(verdict.state).toBe("user_preference_required");
    expect(verdict.winner).toBeNull();
    expect(verdict.reasons.join(" ")).toContain("non assegna da sola un vincitore automatico");
  });

  it("supports an explicit personal verdict without relabeling it as editorial", () => {
    const verdict = getBattleVerdict(
      battlePipeline(["atlas-ai", "gamma-app"]),
      null,
      { winnerSlug: "atlas-ai", reason: "Preferisco il flusso di ricerca." },
    );

    expect(verdict.state).toBe("personal_verdict");
    expect(verdict.winner?.slug).toBe("atlas-ai");
    expect(verdict.label).toBe("Verdetto personale");
  });
});

/**
 * Closure 2026-08-03 §8 — Confronto + Arena non deducono mai un totale da
 * `level`, `featured`, scorecard parziali o altri campi non editoriali.
 * VibeCode e WeWeb, in assenza di un `ToolPublic.score` verified,
 * restano su `insufficient_evidence` con label "Valutazione editoriale
 * in preparazione".
 */
import { directoryTools } from "@/lib/data/tooolvibes-directory";
import { adaptDirectoryToolToPublic } from "@/lib/data/tool-public-adapters";
import { createToolPublicView } from "@/lib/data/tool-public-view";

const findDirectory = (slug: string) => {
  const tool = directoryTools.find((t) => t.slug === slug);
  if (!tool) throw new Error(`Directory tool ${slug} not found`);
  return tool;
};

const vibecodeView = createToolPublicView(
  adaptDirectoryToolToPublic(findDirectory("vibecode"), { status: "published" }),
  findDirectory("vibecode"),
);
const wewebView = createToolPublicView(
  adaptDirectoryToolToPublic(findDirectory("weweb"), { status: "published" }),
  findDirectory("weweb"),
);

describe("VibeCode + WeWeb: nessun punteggio fabbricato (closure 2026-08-03 §8)", () => {
  it("VibeCode + WeWeb finiscono su insufficient_evidence senza winner", () => {
    const tools = withBattleScores(
      normalise([vibecodeView, wewebView], ["vibecode", "weweb"]),
    );

    const verdict = getBattleVerdict(tools);

    expect(verdict.state).toBe("insufficient_evidence");
    expect(verdict.winner).toBeNull();
    expect(verdict.label).toBe("Valutazione editoriale in preparazione");
    expect(tools.find((t) => t.slug === "weweb")?.battleScore).toBeNull();
    expect(tools.find((t) => t.slug === "vibecode")?.battleScore).toBeNull();
    expect(verdict.reasons.join(" ")).toContain("Valutazione editoriale in preparazione");
  });

  it("VibeCode alone: battleScore è null (nessuna fabbricazione)", () => {
    const tools = withBattleScores(
      normalise([vibecodeView], ["vibecode"]),
    );

    expect(tools[0].battleScore).toBeNull();
    expect(tools[0].compareScore.assessment.state).toBe("not_assessed");
  });
});
