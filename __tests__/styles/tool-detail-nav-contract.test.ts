import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync("styles/tool-detail-final.css", "utf8");
const navSrc = readFileSync(
  "components/tool-detail-final/tool-detail-decision-nav.tsx",
  "utf8",
);

function extractBlock(source: string, selector: string): string | null {
  const selectorIndex = source.indexOf(selector);
  if (selectorIndex === -1) return null;
  const openIndex = source.indexOf("{", selectorIndex);
  if (openIndex === -1) return null;
  let depth = 0;
  for (let index = openIndex; index < source.length; index += 1) {
    const char = source[index];
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(openIndex + 1, index);
    }
  }
  return null;
}

describe("tool detail nav final contract", () => {
  it("sticky contract: below painted header, subnav layer, no top:0", () => {
    const nav = extractBlock(css, ".td-final-decision-nav {");
    expect(nav).not.toBeNull();
    expect(nav).toContain("position: sticky");
    expect(nav).toContain("top: var(--tv-header-painted)");
    expect(nav).toContain("z-index: var(--tv-z-subnav, 30)");
    expect(nav).not.toMatch(/top:\s*0;/);
  });

  it("320: 2x2 grid, all tabs visible, no scroll", () => {
    expect(css).toContain("@media (max-width: 359px)");
    const small = css.slice(css.indexOf("@media (max-width: 359px)"));
    expect(small).toContain("grid-template-columns: repeat(2, minmax(0, 1fr))");
  });

  it("type never drops below the 12px floor", () => {
    const link = extractBlock(css, ".td-final-decision-nav__link {");
    expect(link).toContain("clamp(0.75rem,");
  });

  it("four tabs, no horizontal scroll geometry", () => {
    const nav = extractBlock(css, ".td-final-decision-nav {");
    expect(nav).toContain("grid-template-columns: repeat(var(--td-nav-columns, 4), minmax(0, 1fr))");
    expect(nav).not.toContain("overflow-x: auto");
    const link = extractBlock(css, ".td-final-decision-nav__link {");
    // Single-line labels with ellipsis: no wrap, no scroll. Grid columns
    // shrink (minmax 0) so all four fit at 320 without overflow-x.
    expect(link).toContain("white-space: nowrap");
    expect(link).toContain("text-overflow: ellipsis");
    // labels: Panoramica / Pro e contro / Prezzi / Alternative
    expect(navSrc).toContain('{ id: "td-final-overview", label: "Panoramica" }');
    expect(navSrc).toContain('{ id: "td-final-panel-pros-limits", label: "Pro e contro" }');
    expect(navSrc).toContain('{ id: "td-final-pricing", label: "Prezzi" }');
    expect(navSrc).toContain('{ id: "td-final-alternatives", label: "Alternative" }');
  });
});
