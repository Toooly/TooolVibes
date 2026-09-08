import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const radarCss = readFileSync(resolve(process.cwd(), "styles/radar.css"), "utf8");
const tokensCss = readFileSync(resolve(process.cwd(), "styles/tokens.css"), "utf8");

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

describe("V3 signal tokens", () => {
  it("espone la famiglia signal come alias del radar midnight/cyan", () => {
    expect(tokensCss).toContain("--tv-grammar-signal-surface: var(--tv-grammar-radar-surface)");
    expect(tokensCss).toContain("--tv-grammar-signal-accent: var(--tv-grammar-radar-accent)");
    expect(tokensCss).toContain("--tv-grammar-signal-live: var(--tv-grammar-radar-live)");
  });
});

describe("V3 signal typography", () => {
  it("H1 Radar resta display; il count dello strumento è display eccezionale", () => {
    expect(extractBlock(radarCss, ".tv-radar__title {")).toContain(
      "var(--tv-font-family-display",
    );
    expect(extractBlock(radarCss, ".tv-radar-instrument__count strong {")).toContain(
      "var(--tv-font-family-display",
    );
  });

  it("titoli empty/loading usano UI, non Anton", () => {
    expect(extractBlock(radarCss, ".tv-radar-state__title {")).toContain("var(--tv-font-ui)");
    expect(extractBlock(radarCss, ".tv-radar__loading-title {")).toContain("var(--tv-font-ui)");
  });

  it("rank e status rail usano DATA/mono", () => {
    const ranks = extractBlock(radarCss, ".tv-radar-index__rank,\n.tv-radar-table__rank {");
    expect(ranks).toContain("var(--tv-font-data)");
    expect(extractBlock(radarCss, ".tv-radar-status-bar {")).toContain(
      "var(--tv-font-family-mono)",
    );
  });
});

describe("V3 signal color law", () => {
  it("green solo sullo stato live", () => {
    const live = extractBlock(
      radarCss,
      '.tv-radar-status-bar__status[data-state="live"] {',
    );
    expect(live).toContain("var(--tv-status-success)");
    const page = extractBlock(radarCss, ".tv-radar-page {");
    expect(page).not.toContain("var(--tv-status-success)");
  });

  it("rank e superficie pagina usano cyan/midnight, non brand fill", () => {
    const ranks = extractBlock(radarCss, ".tv-radar-index__rank,\n.tv-radar-table__rank {");
    expect(ranks).toContain("var(--tv-grammar-signal-accent)");
    expect(ranks).not.toContain("var(--tv-accent-brand)");
    expect(extractBlock(radarCss, ".tv-radar-page {")).toContain(
      "var(--tv-grammar-signal-surface)",
    );
  });

  it("selected periodo/vista è purple con peso, non cyan/yellow", () => {
    const pressed = extractBlock(radarCss, '.tv-radar-control button[aria-pressed="true"] {');
    expect(pressed).toContain("var(--tv-accent-brand)");
    expect(pressed).toContain("font-weight: 700");
    expect(pressed).not.toContain("activation");
    expect(pressed).not.toContain("cyan");
  });

  it("retry è activation yellow", () => {
    expect(radarCss).toContain(".tv-radar__retry");
    expect(radarCss).toContain("background: var(--tv-button-activation-bg)");
    const yellowRetries = radarCss.split(".tv-radar__retry {").slice(1)
      .map((chunk) => chunk.slice(0, chunk.indexOf("}")))
      .filter((block) => block.includes("var(--tv-button-activation-bg)"));
    expect(yellowRetries.length).toBeGreaterThan(0);
  });
});

describe("V3 signal offset", () => {
  it("non sottrae --tv-main-offset-top dalla viewport Radar", () => {
    const page = extractBlock(radarCss, ".tv-radar-page {");
    expect(page).not.toContain("--tv-main-offset-top");
    expect(page).toContain("min-height: 100%");
  });
});
