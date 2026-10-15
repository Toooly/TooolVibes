import { describe, expect, it } from "vitest";
import { completeToolPublicFixture } from "@/__tests__/fixtures/tool-public";
import { createToolPublicView } from "@/lib/data/tool-public-view";
import {
  buildComparisonViewModel,
  comparisonKeyDifferences,
  comparisonValueKey,
  criterionDiffers,
  projectComparisonPair,
  resolveComparisonPair,
} from "@/lib/compare/comparison-view-model";

const tools = ["alpha", "beta", "gamma"].map((slug, index) =>
  createToolPublicView({
    ...completeToolPublicFixture,
    slug,
    name: slug,
    content: {
      ...completeToolPublicFixture.content,
      bestFor: index === 2 ? "Different use case" : "Same use case",
    },
  }),
);
const cell = (text: string) => ({ text, missing: false });
describe("Compare V2 normalized evidence", () => {
  it("ignores case, trailing punctuation, whitespace and list ordering", () => {
    expect(criterionDiffers([cell("Web\niOS."), cell(" ios\n WEB ")])).toBe(
      false,
    );
    expect(comparisonValueKey(cell("1.5"))).not.toBe(
      comparisonValueKey(cell("15")),
    );
    expect(criterionDiffers([cell("$20"), cell("€20")])).toBe(true);
  });
  it("compares entry prices independently from plan marketing names", () => {
    const catalog = tools.map((tool) => ({
      ...tool,
      publicTool: Object.assign({}, tool.publicTool, {
        pricingPlans: [{ name: tool.name, price: "$20", period: "al mese" }],
      }),
    }));
    const row = buildComparisonViewModel(catalog, [
      "alpha",
      "beta",
    ]).criteria.find((row) => row.id === "entry-price");
    expect(row?.differs).toBe(false);
  });
  it("does not treat missing evidence as a negative capability", () => {
    const model = buildComparisonViewModel(tools, ["alpha", "beta"]);
    expect(
      model.criteria.find((row) => row.id === "open-source")?.values.alpha,
    ).toEqual({ text: "Non documentato", missing: true });
    expect(
      model.criteria.find((row) => row.id === "open-source")?.differs,
    ).toBe(false);
    expect(
      criterionDiffers([
        { text: "Non documentato", missing: true },
        cell("No"),
      ]),
    ).toBe(true);
  });
  it("recomputes differences for the active pair without changing the pool", () => {
    const model = buildComparisonViewModel(tools, [
      "gamma",
      "alpha",
      "beta",
      "unknown",
      "alpha",
    ]);
    expect(model.tools.map((tool) => tool.slug)).toEqual([
      "gamma",
      "alpha",
      "beta",
    ]);
    expect(model.missingSlugs).toEqual(["unknown"]);
    expect(model.criteria.find((row) => row.id === "best-for")?.differs).toBe(
      true,
    );
    const paired = projectComparisonPair(model, ["alpha", "beta"]);
    expect(paired.criteria.find((row) => row.id === "best-for")?.differs).toBe(
      false,
    );
    expect(comparisonKeyDifferences(paired)).toEqual([]);
    expect(model.tools).toHaveLength(3);
  });
  it("repairs duplicate, stale or incomplete pair selections", () => {
    expect(
      resolveComparisonPair(
        ["alpha", "beta", "gamma"],
        ["gone", "gamma", "gamma"],
      ),
    ).toEqual(["gamma", "alpha"]);
    expect(resolveComparisonPair(["beta"], ["alpha"])).toEqual(["beta"]);
  });
  it("prioritises the selected goal without changing scores or selection order", () => {
    const base = buildComparisonViewModel(tools, ["beta", "alpha"]);
    const focused = buildComparisonViewModel(
      tools,
      ["beta", "alpha"],
      "save-money",
    );
    expect(focused.tools.map((tool) => [tool.slug, tool.rating])).toEqual(
      base.tools.map((tool) => [tool.slug, tool.rating]),
    );
    expect(
      focused.criteria.find((row) => row.id === "entry-price")!.importance,
    ).toBeGreaterThan(
      focused.criteria.find((row) => row.id === "best-for")!.importance,
    );
  });
  it("does not invent prices when no plans have been published", () => {
    const model = buildComparisonViewModel(tools, ["alpha", "beta"]);
    expect(model.tools.every((tool) => tool.pricing.missing)).toBe(true);
  });
});
