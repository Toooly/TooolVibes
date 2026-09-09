import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * PHASE 1 — Global chrome visual grammar contract.
 * Static CSS/TS source checks for the frozen V3 chrome roles:
 * typography (UI wordmarks, DATA role), the single yellow public primary,
 * the utility footer variant, and token-driven bottom-nav geometry.
 */

const tokensCss = readFileSync(resolve(process.cwd(), "styles/tokens.css"), "utf8");
const shellCss = readFileSync(resolve(process.cwd(), "styles/shell.css"), "utf8");
const commandBarCss = readFileSync(resolve(process.cwd(), "styles/command-bar.css"), "utf8");
const mobileTopBarCss = readFileSync(
  resolve(process.cwd(), "styles/mobile-top-bar.css"),
  "utf8",
);
const mobileBottomNavCss = readFileSync(
  resolve(process.cwd(), "styles/mobile-bottom-nav.css"),
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

describe("V3 typography roles — shared chrome", () => {
  it("tokens definiscono i tre ruoli funzionali: display, ui, data", () => {
    expect(tokensCss).toContain("--tv-font-data: var(--tv-font-family-mono)");
    expect(tokensCss).toContain("--tv-type-data: var(--tv-font-family-mono)");
    expect(tokensCss).toContain("--tv-font-display: var(--tv-font-family-display)");
    expect(tokensCss).toContain("--tv-font-ui: var(--tv-font-family-ui)");
  });

  it("i wordmark del chrome usano il ruolo UI, non display", () => {
    const desktopWordmark = extractBlock(commandBarCss, ".command-bar__brand-word {");
    expect(desktopWordmark).not.toBeNull();
    expect(desktopWordmark).toContain("var(--tv-font-ui)");
    expect(desktopWordmark).not.toContain("var(--tv-font-family-display)");
    expect(desktopWordmark).not.toContain("var(--tv-font-display)");

    const mobileWordmark = extractBlock(mobileTopBarCss, ".mobile-top-bar__brand-text {");
    expect(mobileWordmark).not.toBeNull();
    expect(mobileWordmark).toContain("var(--tv-font-ui)");
    expect(mobileWordmark).not.toContain("var(--tv-font-family-display)");
    expect(mobileWordmark).not.toContain("var(--tv-font-display)");
  });
});

describe("V3 CTA semantics — single public primary", () => {
  it("ogni primitivo primaria condivisa mappa sull'activation yellow", () => {
    const ctaLawIndex = shellCss.indexOf("V3 CTA law");
    expect(ctaLawIndex).toBeGreaterThan(-1);
    // Regione completa: selettore + blocco della legge CTA.
    const region = shellCss.slice(ctaLawIndex, ctaLawIndex + 900);
    expect(region).toContain(".premium-button-primary");
    expect(region).toContain(".premium-button-premium");
    expect(region).toContain(".button-primary");
    expect(region).toContain(".tv-cta-primary");
    expect(region).toContain("var(--tv-button-activation-bg)");
    expect(region).toContain("var(--tv-button-activation-text) !important");
  });
});

describe("V3 utility footer — variante non-Home", () => {
  it("il footer utility resta compatto e senza accordion architecture", () => {
    const block = extractBlock(shellCss, ".site-footer-v2.tv-utility {");
    expect(block).not.toBeNull();
    expect(shellCss).toContain(".site-footer-v2.tv-utility");
    expect(shellCss).toContain(".tv-utility__group h3");
    expect(shellCss).toContain(".tv-utility__disclosure");
  });

  it("il footer utility mantiene la riserva bottom-nav (Phase 0)", () => {
    // La singola riserva vive in .site-footer-v2__shell mobile padding.
    expect(shellCss).toContain("var(--tv-bottom-nav-total");
  });
});

describe("V3 bottom-nav geometry — token-driven", () => {
  it("le altezze inner consumano i token canonici", () => {
    const inner = extractBlock(mobileBottomNavCss, ".mobile-bottom-shell__inner {");
    expect(inner).toContain("var(--tv-bottom-nav-inner)");

    const compact = extractBlock(
      mobileBottomNavCss,
      ".mobile-bottom-shell--compact .mobile-bottom-shell__inner {",
    );
    expect(compact).toContain("var(--tv-bottom-nav-inner-compact)");

    expect(tokensCss).toContain("--tv-bottom-nav-inner: 3.25rem");
    expect(tokensCss).toContain("--tv-bottom-nav-inner-compact: 2.5rem");
  });
});
