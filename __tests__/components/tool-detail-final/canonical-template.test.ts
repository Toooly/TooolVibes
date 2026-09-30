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
    expect(css).toContain("top: var(--tv-header-painted)");
  });

  it("all rendered ids are unique", () => {
    const idRe = /id="([^"]+)"/g;
    const ids: string[] = [];
    let match: RegExpExecArray | null;
    const all = [
      readFileSync("components/tool-detail-final/tool-detail-final-page.tsx", "utf8"),
      readFileSync("components/tool-detail-final/tool-detail-information.tsx", "utf8"),
      readFileSync("components/tool-detail-final/tool-detail-extended-content.tsx", "utf8"),
      readFileSync("components/tool-detail-final/tool-detail-decision-brief.tsx", "utf8"),
      readFileSync("components/tool-detail-final/tool-detail-pricing.tsx", "utf8"),
      readFileSync("components/tool-detail-final/tool-detail-alternatives.tsx", "utf8"),
    ].join("\n");
    while ((match = idRe.exec(all)) !== null) {
      if (match[1].startsWith("td-final-")) ids.push(match[1]);
    }
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it("each nav destination maps to exactly one DOM element", () => {
    const nav = readFileSync("components/tool-detail-final/tool-detail-decision-nav.tsx", "utf8");
    const targets = [...nav.matchAll(/id: "([^"]+)"/g)].map((m) => m[1]);
    expect(targets.length).toBeGreaterThan(0);
    const all = [
      readFileSync("components/tool-detail-final/tool-detail-final-page.tsx", "utf8"),
      readFileSync("components/tool-detail-final/tool-detail-extended-content.tsx", "utf8"),
      readFileSync("components/tool-detail-final/tool-detail-pricing.tsx", "utf8"),
      readFileSync("components/tool-detail-final/tool-detail-alternatives.tsx", "utf8"),
      readFileSync("components/tool-detail-final/tool-detail-information.tsx", "utf8"),
    ].join("\n");
    // Also collect dynamic IDs: id={`td-final-panel-${panel.id}`}
    const panelIds = [...all.matchAll(/id:\s*"([a-z][a-z0-9-]*)"/g)]
      .map((m) => `td-final-panel-${m[1]}`)
      .filter((x) => targets.includes(x));
    for (const target of targets) {
      const staticCount = all.split(`id="${target}"`).length - 1;
      const dynamicCount = panelIds.includes(target) ? 1 : 0;
      expect(staticCount + dynamicCount).toBe(1);
    }
  });

  it("breadcrumb is non-sticky and replaces the old catalog slab", () => {
    const page = readFileSync("components/tool-detail-final/tool-detail-final-page.tsx", "utf8");
    expect(page).toContain("td-final-breadcrumb");
    expect(page).not.toContain("td-final-mobileheader");
    const css = readFileSync("styles/tool-detail-final.css", "utf8");
    expect(css).toContain(".td-final-breadcrumb {");
    expect(css).not.toContain(".td-final-mobileheader {");
  });

  it("section nav shows all four tabs without horizontal scroll", () => {
    const css = readFileSync("styles/tool-detail-final.css", "utf8");
    expect(css).toContain(".td-final-decision-nav__link {");
    expect(css).toContain("flex: 1 1 0");
  });

  it("alternatives use a carousel with scroll-snap", () => {
    const css = readFileSync("styles/tool-detail-final.css", "utf8");
    expect(css).toContain("scroll-snap-type: x mandatory");
    expect(css).toContain("scroll-snap-align: start");
  });

  it("compare dock has no yellow left rail", () => {
    const css = readFileSync("styles/compare.css", "utf8");
    expect(css).not.toContain("tv-compare-dock__inner::before");
  });

  it("accordion auto-positions summary below sticky nav on open", () => {
    const deepenItems = readFileSync("components/tool-detail-final/tool-detail-deepen-items.tsx", "utf8");
    expect(deepenItems).toContain("onToggle");
    expect(deepenItems).toContain("td-final-decision-nav");
  });

  it("alternatives carousel has no 100vw overflow", () => {
    expect(css).not.toContain("100vw");
  });
});
