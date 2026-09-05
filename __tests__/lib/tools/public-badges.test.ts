import { describe, expect, it } from "vitest";

import { buildPromoChips } from "@/lib/tools/public-badges";

/**
 * Public promo-badge derivation for the /toools/[slug] hero.
 *
 * Contract:
 *  - deterministic: same input → same output;
 *  - general dedupe: if two signals produce the same public label, only the
 *    first occurrence is rendered (order preserved);
 *  - toolOfWeek / featured stay real in the data: this helper only derives
 *    the public presentation, it never mutates inputs;
 *  - distinct labels are never collapsed.
 */

describe("buildPromoChips — public label dedupe", () => {
  it("renders a single \"In evidenza\" when toolOfWeek and featured are both true", () => {
    const chips = buildPromoChips({ toolOfWeek: true, featured: true });
    expect(chips.map((c) => c.label)).toEqual(["In evidenza"]);
    expect(chips[0].kind).toBe("tool-of-week");
  });

  it("does not treat \"In evidenza\" as a skill level", () => {
    const chips = buildPromoChips({
      levelLabel: "In evidenza",
      toolOfWeek: true,
      featured: true,
    });
    expect(chips.map((c) => c.label)).toEqual(["In evidenza"]);
    expect(chips[0].kind).toBe("tool-of-week");
  });

  it("keeps distinct labels side by side", () => {
    const chips = buildPromoChips({
      levelLabel: "Avanzato",
      toolOfWeek: true,
      featured: true,
    });
    expect(chips.map((c) => c.label)).toEqual(["Avanzato", "In evidenza"]);
  });

  it("renders only the level chip when no promo signal is set", () => {
    const chips = buildPromoChips({ levelLabel: "Base" });
    expect(chips.map((c) => c.label)).toEqual(["Base"]);
  });

  it("renders nothing when there are no signals", () => {
    expect(buildPromoChips({})).toEqual([]);
  });

  it("renders featured \"In evidenza\" when only featured is set", () => {
    const chips = buildPromoChips({ featured: true });
    expect(chips.map((c) => c.label)).toEqual(["In evidenza"]);
    expect(chips[0].kind).toBe("featured");
  });

  it("preserves featured when levelLabel wrongly repeats In evidenza", () => {
    const chips = buildPromoChips({
      levelLabel: "In evidenza",
      featured: true,
    });
    expect(chips.map((c) => c.label)).toEqual(["In evidenza"]);
    expect(chips[0].kind).toBe("featured");
  });

  it("does not mutate the input signals", () => {
    const input = { toolOfWeek: true, featured: true, levelLabel: "In evidenza" };
    buildPromoChips(input);
    expect(input).toEqual({ toolOfWeek: true, featured: true, levelLabel: "In evidenza" });
  });
});
