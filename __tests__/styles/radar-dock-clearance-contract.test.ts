import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * RADAR DOCK CLEARANCE — CompareSessionDock interaction clearance (spec §1-§4).
 *
 * jsdom does not lay out. The geometric contract "quick preview and its final
 * actions never sit beneath the Compare Dock + Bottom Nav + safe area" is
 * asserted statically against the CSS source, which is the single source of
 * truth for that geometry — the same approach as
 * `shell-floating-dock-contract.test.ts`.
 *
 * Clearance must be composed ONLY of the canonical shell/chrome variables
 * (`--tv-bottom-nav-total`, `--tv-consent-banner-height`, `--tv-tray-height`,
 * `--tv-compare-gap`, `env(safe-area-inset-bottom)`), mirroring
 * `styles/compare.css`'s own `.tv-compare-dock` positioning. No route-specific
 * magic number, no Radar-specific dock, no change to the dock itself.
 */

const radarFullCss = readFileSync(
  resolve(process.cwd(), "styles/radar-full.css"),
  "utf8",
);
const compareCss = readFileSync(
  resolve(process.cwd(), "styles/compare.css"),
  "utf8",
);
const tokensCss = readFileSync(
  resolve(process.cwd(), "styles/tokens.css"),
  "utf8",
);

/** Extracts the `{ ... }` body following the first occurrence of `selector`. */
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

const rootBlock = extractBlock(radarFullCss, ".tv-rx {");
const previewBlock = extractBlock(radarFullCss, ".tv-rx-preview {");
const actionsBlock = extractBlock(radarFullCss, ".tv-rx-preview__actions {");
const desktopBlock = extractBlock(radarFullCss, "@media (min-width: 1280px) {\n  .tv-rx {");

describe("RADAR-DOCK-CLEARANCE — canonical chrome clearance contract", () => {
  it("RADAR-DOCK-01 la clearance usa solo variabili shell/chrome canoniche", () => {
    expect(rootBlock).not.toBeNull();
    expect(rootBlock).toContain("--tv-rx-chrome-clearance:");
    const decl = rootBlock!.slice(
      rootBlock!.indexOf("--tv-rx-chrome-clearance:"),
      rootBlock!.indexOf(";", rootBlock!.indexOf("--tv-rx-chrome-clearance:")),
    );
    expect(decl).toContain("var(--tv-bottom-nav-total");
    expect(decl).toContain("var(--tv-consent-banner-height");
    expect(decl).toContain("var(--tv-tray-height");
    expect(decl).toContain("var(--tv-compare-gap");
    expect(decl).toContain("env(safe-area-inset-bottom");
  });

  it("RADAR-DOCK-02 nessun magic number route-specifico nella clearance", () => {
    const decl = rootBlock!.slice(
      rootBlock!.indexOf("--tv-rx-chrome-clearance:"),
      rootBlock!.indexOf(";", rootBlock!.indexOf("--tv-rx-chrome-clearance:")),
    );
    // The ONLY permitted literals are the documented fallbacks of the shared
    // shell/chrome variables plus the safe-area zero. Any other px/rem literal
    // would be a hardcoded chrome height (a route-specific magic number).
    const allowedFallbacks = new Set(["3.625rem", "0.75rem", "7.5rem", "0px"]);
    const literals = decl.match(/\b\d+(?:\.\d+)?(?:px|rem|dvh)\b/g) ?? [];
    expect(literals.length).toBeGreaterThan(0);
    for (const literal of literals) {
      expect(allowedFallbacks, `unexpected chrome literal ${literal}`).toContain(
        literal,
      );
    }
  });

  it("RADAR-DOCK-03 il quick preview non usa piu bottom fisso 0.5rem", () => {
    expect(previewBlock).not.toBeNull();
    expect(previewBlock).not.toContain("bottom: 0.5rem");
    expect(previewBlock).toContain(
      "bottom: calc(var(--tv-rx-chrome-clearance) + 0.5rem)",
    );
  });

  it("RADAR-DOCK-04 il quick preview riserva il chrome e non eccede l'altezza disponibile", () => {
    expect(previewBlock).toContain(
      "max-block-size: calc(100dvh - var(--tv-rx-chrome-clearance)",
    );
    expect(previewBlock).toContain("overflow-y: auto");
  });

  it("RADAR-DOCK-05 le azioni finali restano pinnate al bordo del sheet", () => {
    expect(actionsBlock).not.toBeNull();
    expect(actionsBlock).toContain("position: sticky");
    expect(actionsBlock).toContain("bottom: 0");
    expect(actionsBlock).toContain(
      "background: var(--tv-color-surface-elevated",
    );
  });

  it("RADAR-DOCK-06 il contenuto terminale riserva il chrome (nessuna slab fissa)", () => {
    expect(rootBlock).toContain(
      "padding-block-end: calc(1rem + var(--tv-rx-chrome-clearance))",
    );
  });

  it("RADAR-DOCK-07 la clearance rispecchia il branch desktop del dock a 1280px", () => {
    expect(desktopBlock).not.toBeNull();
    expect(desktopBlock).toContain("--tv-rx-chrome-clearance:");
    expect(desktopBlock).toContain("1rem + var(--tv-consent-banner-height");
    expect(desktopBlock).toContain("var(--tv-tray-height");
  });

  it("RADAR-DOCK-08 il dock canonico non viene mosso ne ridisegnato", () => {
    const dockBlock = extractBlock(compareCss, ".tv-compare-dock {");
    expect(dockBlock).toContain("position: fixed");
    expect(dockBlock).toContain("var(--tv-bottom-nav-total");
    expect(dockBlock).toContain("var(--tv-compare-gap");
    // The dock must not reference Radar internals.
    expect(compareCss).not.toContain("tv-rx");
  });

  it("RADAR-DOCK-09 le variabili condivise restano definite in tokens.css", () => {
    expect(tokensCss).toContain("--tv-bottom-nav-total:");
    expect(tokensCss).toContain("--tv-tray-height:");
    expect(tokensCss).toContain("--tv-compare-gap:");
  });

  it("RADAR-DOCK-10 nessun !important aggiunto oltre il kill-switch reduced-motion", () => {
    // Declaration lines only — the header comment mentions `!important` in prose.
    const declarationLines = radarFullCss
      .split("\n")
      .filter((line) => !/^\s*[*/]/.test(line) && line.includes("!important"));
    expect(declarationLines.length).toBeLessThanOrEqual(5);
    // Every !important declaration must belong to the reduced-motion kill-switch.
    for (const line of declarationLines) {
      expect(line).toMatch(/animation|transition|scroll-behavior/);
    }
    // The clearance contract must never need !important to win.
    const clearanceLines = radarFullCss
      .split("\n")
      .filter((line) => line.includes("--tv-rx-chrome-clearance"));
    expect(clearanceLines.join("\n")).not.toContain("!important");
  });

  it("RADAR-DOCK-11 --tv-consent-banner-height e pubblicato dal banner canonico", () => {
    const consentBanner = readFileSync(
      resolve(process.cwd(), "components/ads/consent-banner.tsx"),
      "utf8",
    );
    expect(consentBanner).toContain('setProperty("--tv-consent-banner-height"');
    // Radar must only consume it, never publish it.
    expect(radarFullCss).not.toContain("--tv-consent-banner-height:");
  });
});
