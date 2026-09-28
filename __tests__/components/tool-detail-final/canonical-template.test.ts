import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const page = readFileSync("components/tool-detail-final/tool-detail-final-page.tsx", "utf8");
const css = readFileSync("styles/tool-detail-final.css", "utf8");
const parity = readFileSync("styles/mockup-parity-v4.css", "utf8");
const score = readFileSync("components/tool-detail-final/tool-detail-score.tsx", "utf8");

describe("canonical tool detail template", () => {
  it("keeps one shared page template and canonical section order", () => {
    const brief = page.indexOf("<ToolDetailDecisionBrief");
    const deep = page.indexOf("<ToolDetailExtendedContent");
    const pricing = page.indexOf("<ToolDetailPricing");
    const alts = page.indexOf("<ToolDetailAlternatives");
    const info = page.indexOf("<ToolDetailInformation");
    expect(brief).toBeGreaterThan(0);
    expect(deep).toBeGreaterThan(brief);
    expect(pricing).toBeGreaterThan(deep);
    expect(alts).toBeGreaterThan(pricing);
    expect(info).toBeGreaterThan(alts);
    expect(page.match(/ToolDetailFinalPage/g)?.length).toBeGreaterThan(0);
  });

  it("renders one score star and no parity star pseudo-element", () => {
    expect(score.match(/td-final-score__star/g)?.length).toBe(1);
    expect(parity).not.toContain('.td-final-score::before { content: "★ ');
  });

  it("does not make the page a scroll container that kills sticky", () => {
    const block = css.slice(css.indexOf(".td-final-page {"), css.indexOf(".td-final-hero {"));
    expect(block).not.toContain("overflow-x: hidden");
    expect(css).toContain("position: sticky");
    expect(css).toContain("--tool-toolbar-height");
  });

  it("stacks alternatives instead of a horizontal carousel", () => {
    expect(css).not.toContain("scroll-snap-type: x mandatory");
    expect(css).not.toContain("flex: 0 0 calc(100% - 2.5rem)");
  });
});
