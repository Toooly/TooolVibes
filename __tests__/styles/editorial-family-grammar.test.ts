import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * PHASE 2 — Editorial family grammar contract.
 * Static source checks for the frozen roles on the editorial routes
 * (/archivio, /toools/[slug], /posts, /posts/[slug]):
 * UI = Manrope, DATA = mono, DISPLAY = Anton (exceptional only),
 * YELLOW = primary action, PURPLE = selected state.
 */

const archiveCss = readFileSync(resolve(process.cwd(), "styles/archive-v4.css"), "utf8");
const toolCss = readFileSync(resolve(process.cwd(), "styles/tool-detail-final.css"), "utf8");
const guidesCss = readFileSync(resolve(process.cwd(), "styles/guides.css"), "utf8");
const markdownGuard = readFileSync(
  resolve(process.cwd(), "lib/content/tool-markdown-public.ts"),
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
      if (depth === 0) {
        return source.slice(openIndex + 1, index);
      }
    }
  }
  return null;
}

describe("V3 editorial typography — archive", () => {
  it("il titolo H1 del catalogo resta display (Anton)", () => {
    const block = extractBlock(archiveCss, ".ar4-intro__title {");
    expect(block).toContain("var(--tv-font-family-display");
  });

  it("punteggi, rank e statistiche usano il ruolo DATA (mono)", () => {
    for (const selector of [
      ".ar4-card__score strong {",
      ".ar4-card__rank {",
      ".ar4-intro__data-item strong {",
      ".ar4-intro__data strong {",
    ]) {
      const block = extractBlock(archiveCss, selector);
      expect(block, selector).toContain("var(--tv-font-data)");
    }
  });

  it("avatar e titoli di sezione usano il ruolo UI (Manrope)", () => {
    for (const selector of [
      ".ar4-ivory__title {",
      ".ar4-grid__title {",
      ".ar4-sheet__title {",
      ".ar4-grid__empty-title {",
    ]) {
      const block = extractBlock(archiveCss, selector);
      expect(block, selector).toContain("var(--tv-font-ui)");
    }
    // L'avatar span compare in più varianti responsive: almeno una porta UI.
    const withUi = archiveCss
      .split(".ar4-card__avatar span {")
      .some((chunk) => chunk.slice(0, chunk.indexOf("}") + 1).includes("var(--tv-font-ui)"));
    expect(withUi).toBe(true);
  });

  it("la card catalogo è una superficie resource calda, non workflow purple", () => {
    const block = extractBlock(archiveCss, ".ar4-card {\n  position: relative");
    expect(block).toContain("var(--tv-grammar-resource-surface)");
    expect(block).toContain("var(--tv-grammar-resource-edge)");
    expect(block).not.toContain("var(--tv-grammar-workflow-surface)");
    expect(block).not.toContain("var(--tv-accent-cyan)");
  });
});

describe("V3 editorial CTA — archive", () => {
  it("l'empty-state primario è activation yellow, mai viola", () => {
    const block = extractBlock(archiveCss, ".ar4-grid__empty-cta--primary {");
    expect(block).toContain("var(--tv-button-activation-bg)");
    expect(block).toContain("var(--tv-button-activation-text)");
    expect(block).not.toContain("var(--tv-accent-primary)");
  });
});

describe("V3 editorial typography — tool detail", () => {
  it("il nome del tool resta display; i punteggi sono DATA", () => {
    const name = extractBlock(toolCss, ".td-final-hero__name {");
    expect(name).toContain("var(--tv-font-family-display)");

    for (const selector of [
      ".td-final-score__number {",
      ".td-final-score__denom {",
      ".td-final-score__dim-value {",
    ]) {
      const block = extractBlock(toolCss, selector);
      expect(block, selector).toContain("var(--tv-font-data)");
    }
  });

  it("accordion: etichette UI, stato aperto = selected (viola)", () => {
    const summary = extractBlock(toolCss, ".td-final-deepen__summary {");
    expect(summary).toContain("var(--tv-font-ui)");
    const openState = extractBlock(
      toolCss,
      ".td-final-deepen__item[open] > .td-final-deepen__summary {",
    );
    expect(openState).toContain("var(--tv-accent-violet-on-dark)");
  });
});

describe("V3 editorial typography — guides", () => {
  it("i titoli delle card guide e gli h2/h3 markdown sono UI", () => {
    const cardTitle = extractBlock(guidesCss, ".guides-card__title {");
    expect(cardTitle).toContain("var(--tv-font-ui)");

    const markdown = extractBlock(
      guidesCss,
      ".guides-article__body > .editorial-markdown :is(h1, h2, h3, h4) {",
    );
    expect(markdown).toContain("var(--tv-font-ui)");
  });

  it("l'unico display dell'articolo resta l'H1 dell'hero", () => {
    const h1 = extractBlock(guidesCss, ".guides-article__hero-h1 {");
    expect(h1).toContain("var(--tv-font-display)");
  });

  it("niente personalità italic sintetica sulle display statements", () => {
    for (const selector of [
      ".guides-masthead__title em {",
      ".guides-section__title em {",
      ".guides-article__end-title em {",
    ]) {
      const block = extractBlock(guidesCss, selector);
      expect(block, selector).toContain("font-style: normal");
    }
  });
});

describe("V3 editorial CTA — guides", () => {
  it("featured CTA e linked-tool CTA sono activation yellow", () => {
    const featured = extractBlock(
      guidesCss,
      '.guides-feature__cta a[data-variant="primary"] {',
    );
    expect(featured).toContain("var(--tv-button-activation-bg)");

    const rail = extractBlock(
      guidesCss,
      '.guides-rail__cta[data-variant="primary"] {',
    );
    expect(rail).toContain("var(--tv-button-activation-bg)");
  });

  it("i category chip selezionati sono viola (selected), non gialli", () => {
    const block = extractBlock(guidesCss, '.guides-filter__chip[aria-pressed="true"] {');
    expect(block).toContain("var(--tv-accent-primary)");
    expect(block).not.toContain("activation");
  });
});

describe("V3 internal-spec leak guard", () => {
  it("il markdown pubblico filtra gli heading di spec interna", () => {
    expect(markdownGuard).toContain('new Set(["cta e stati"])');
  });
});
