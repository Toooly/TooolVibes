import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  completeToolPublicFixture,
  partialToolPublicFixture,
} from "@/__tests__/fixtures/tool-public";
import { compareToolsForCompare } from "@/lib/compare/compare-score";
import {
  legacyBaseScore,
  legacyDirScore,
  legacyStableScoreOffset,
  withLegacyBattleScores,
  type LegacyBattleScoreInput,
} from "@/lib/compare/legacy-score";
import { createToolPublicView } from "@/lib/data/tool-public-view";

/**
 * Confronto interno pre/post B33 (FLOW-602).
 *
 * Il vecchio score resta disponibile SOLO qui: questi test ne
 * documentano il comportamento (reversibilita` per audit) e provano
 * perche` e` stato sostituito. Nessuna view o route pubblica puo`
 * importare `lib/compare/legacy-score` (guard statico sotto).
 */

const legacyInputs: LegacyBattleScoreInput[] = [
  { slug: "atlas-ai", name: "Atlas AI", category: "Assistente AI", score: 84 },
  { slug: "gamma-app", name: "Gamma", category: "Produttività", score: 90 },
  { slug: "partial-tool", name: "Partial Tool", category: "Legacy category", score: 70 },
];

function permutations<T>(items: T[]): T[][] {
  if (items.length <= 1) return [items];

  return items.flatMap((item, index) =>
    permutations([...items.slice(0, index), ...items.slice(index + 1)]).map((rest) => [
      item,
      ...rest,
    ]),
  );
}

describe("legacy compare score — confronto interno (B33)", () => {
  it("il vecchio battle score dipende dall'ordine di input (difetto documentato)", () => {
    const scoresBySlugAcrossPermutations = new Map<string, Set<number>>();

    for (const order of permutations(legacyInputs)) {
      for (const tool of withLegacyBattleScores(order)) {
        const scores = scoresBySlugAcrossPermutations.get(tool.slug) ?? new Set<number>();
        scores.add(tool.battleScore);
        scoresBySlugAcrossPermutations.set(tool.slug, scores);
      }
    }

    const orderDependentSlugs = [...scoresBySlugAcrossPermutations.entries()]
      .filter(([, scores]) => scores.size > 1)
      .map(([slug]) => slug);

    expect(orderDependentSlugs.length).toBeGreaterThan(0);
  });

  it("il nuovo engine mantiene valutazioni e rank indipendenti dall'ordine", () => {
    const tools = [completeToolPublicFixture, partialToolPublicFixture];
    const signatures = permutations(tools).map((order) =>
      new Map(compareToolsForCompare(order).map((result) => [
        result.slug,
        { total: result.total, rank: result.rank },
      ])),
    );

    for (const signature of signatures) {
      expect(signature).toEqual(signatures[0]);
    }
  });

  it("reversibilità: il vecchio score per-tool resta calcolabile e deterministico", () => {
    const view = createToolPublicView(completeToolPublicFixture);

    expect(legacyBaseScore(view)).toBe(legacyBaseScore(view));
    expect(legacyDirScore(view)).toBe(legacyDirScore(view));
    expect(legacyStableScoreOffset("atlas-ai:Assistente AI:0")).toBe(
      legacyStableScoreOffset("atlas-ai:Assistente AI:0"),
    );
  });

  it("il vecchio score non è importato dalle view pubbliche del confronto", () => {
    const publicFiles = [
      "components/tools/tool-battle-shared.ts",
      "components/tools/tool-battle-view.tsx",
      "components/tools/mobile-compare-view.tsx",
      "components/tools/desktop-compare-view.tsx",
    ];

    for (const file of publicFiles) {
      const source = readFileSync(new URL(`../../../${file}`, import.meta.url), "utf8");
      expect(source).not.toContain("lib/compare/legacy-score");
    }
  });
});
