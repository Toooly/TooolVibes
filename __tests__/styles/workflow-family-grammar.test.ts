import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * PHASE 3 — Workflow family grammar contract.
 * /collections and /collections/[slug]:
 * DISPLAY = Anton (H1 only), UI = Manrope, DATA = mono,
 * YELLOW = primary action, PURPLE = selected/structure,
 * cyan is not collection identity, no rainbow --cx-accent.
 */

const collectionsCss = readFileSync(
  resolve(process.cwd(), "app/(marketing)/collections/collections.css"),
  "utf8",
);
const tokensCss = readFileSync(resolve(process.cwd(), "styles/tokens.css"), "utf8");
const cardTsx = readFileSync(
  resolve(process.cwd(), "components/collections/collection-card-v4.tsx"),
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

describe("V3 workflow tokens", () => {
  it("espone la famiglia workflow come alias dello stack indigo", () => {
    expect(tokensCss).toContain("--tv-grammar-workflow-surface: var(--tv-grammar-stack-surface)");
    expect(tokensCss).toContain("--tv-grammar-workflow-structure: var(--tv-grammar-stack-accent)");
    expect(tokensCss).toContain("--tv-grammar-workflow-accent: var(--tv-grammar-stack-node)");
  });

  it("i --cx-accent-* non sono più una palette rainbow", () => {
    expect(tokensCss).not.toMatch(/--cx-accent-teal:\s*#5eead4/);
    expect(tokensCss).not.toMatch(/--cx-accent-amber:\s*#fbbf24/);
    expect(tokensCss).toContain("--cx-accent-indigo: var(--tv-grammar-workflow-accent)");
    expect(tokensCss).toContain("--cx-accent-teal: var(--tv-grammar-workflow-accent)");
    expect(tokensCss).toContain("--cx-accent-amber: var(--tv-grammar-workflow-accent)");
  });
});

describe("V3 workflow typography", () => {
  it("gli H1 restano display", () => {
    expect(extractBlock(collectionsCss, ".cx-index__title {")).toContain(
      "var(--tv-font-family-display",
    );
    expect(extractBlock(collectionsCss, ".cx-detail-hero-v4__title {")).toContain(
      "var(--tv-font-family-display",
    );
  });

  it("titoli di card e sezioni usano UI", () => {
    for (const selector of [
      ".cx-card-v4__title {",
      ".cx-stack-flow-v4__title {",
      ".cx-index__group-title {",
      ".cx-next-step-v4__card-title {",
    ]) {
      expect(extractBlock(collectionsCss, selector), selector).toContain("var(--tv-font-ui)");
    }
  });

  it("numeri di sequenza e metadati usano DATA", () => {
    expect(extractBlock(collectionsCss, ".cx-stack-flow-v4__num {")).toContain("var(--tv-font-data)");
    expect(extractBlock(collectionsCss, ".cx-detail-hero-v4__strip-num {")).toContain(
      "var(--tv-font-data)",
    );
    expect(extractBlock(collectionsCss, ".cx-detail-hero-v4__decision-value {")).toContain(
      "var(--tv-font-data)",
    );
    expect(extractBlock(collectionsCss, ".cx-card-v4__stack-no {")).toContain("var(--tv-font-data)");
  });
});

describe("V3 workflow CTA", () => {
  it("CTA primarie collections sono activation yellow", () => {
    for (const selector of [
      ".cx-card-v4__cta {",
      ".cx-detail-hero-v4__cta--primary {",
      ".cx-hero__cta {",
    ]) {
      const block = extractBlock(collectionsCss, selector);
      expect(block, selector).toContain("var(--tv-button-activation-bg)");
      expect(block, selector).toContain("var(--tv-button-activation-text)");
      expect(block, selector).not.toContain("var(--tv-accent-primary)");
    }
  });
});

describe("V3 workflow selection", () => {
  it("disclosure aperta e tab attiva usano purple di struttura", () => {
    const open = extractBlock(
      collectionsCss,
      ".cx-index__how[open] > .cx-index__how-summary,\n.cx-detail-depth[open] > .cx-detail-depth__summary {",
    );
    expect(open ?? collectionsCss).toContain("var(--tv-grammar-workflow-structure)");
    const tab = extractBlock(collectionsCss, ".cx-variant-paths-v4__tab--active {");
    expect(tab).toContain("var(--tv-accent-brand-aa)");
  });
});

describe("V3 workflow sequence", () => {
  it("le card espongono una sequenza numerata da dati reali", () => {
    expect(cardTsx).toContain("cx-card-v4__stack-no");
    expect(cardTsx).toContain('aria-hidden="true"');
    expect(cardTsx).toContain("visibleCores.map");
  });

  it("mobile group grid è un carousel con snap", () => {
    expect(collectionsCss).toContain("scroll-snap-type: x mandatory");
    expect(collectionsCss).toContain("flex: 0 0 82%");
  });
});
