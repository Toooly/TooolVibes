import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * BATCH 39 (MOB-703) — contract statico della policy mobile keyboard /
 * viewport / sheet.
 *
 * jsdom non calcola il layout né la tastiera virtuale: il contract
 * "input, submit e close restano visibili con tastiera aperta" è verificato
 * staticamente sulle sorgenti che sono la single source of truth della
 * policy (token dvh/safe-area, utility isolata tv-kbd-*, viewport meta
 * interattivo, classi applicate ai wrapper Gate/Auth/Search).
 */

const read = (relativePath: string) =>
  readFileSync(resolve(process.cwd(), relativePath), "utf8");

const tokensCss = read("styles/tokens.css");
const globalsCss = read("app/globals.css");
const layoutSource = read("app/layout.tsx");
const gateModalSource = read("components/coming-soon/gate-modal.tsx");
const authPageSource = read("components/account/auth-page.tsx");

/** Estrae il blocco `{ ... }` che segue la prima occorrenza di `selector`. */
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

const B39_SECTION_BANNER = "B39 / MOB-703 — Mobile keyboard, viewport e sheet";

describe("B39 token dvh/safe-area (styles/tokens.css)", () => {
  it.each([
    "--tv-kbd-overlay-inset-top",
    "--tv-kbd-overlay-inset-right",
    "--tv-kbd-overlay-inset-bottom",
    "--tv-kbd-overlay-inset-left",
    "--tv-kbd-sheet-max-height",
    "--tv-kbd-input-min-font-size",
  ])("definisce %s", (token) => {
    expect(tokensCss).toContain(`${token}:`);
  });

  it("gli inset overlay includono la safe-area con fallback 0px", () => {
    for (const side of ["top", "right", "bottom", "left"]) {
      const tokenIndex = tokensCss.indexOf(
        `--tv-kbd-overlay-inset-${side}:`,
      );
      expect(tokenIndex).toBeGreaterThan(-1);
      const token = tokensCss.slice(
        tokenIndex,
        tokensCss.indexOf(";", tokenIndex),
      );
      expect(token).toContain(`env(safe-area-inset-${side}, 0px)`);
    }
  });

  it("l'altezza max della sheet compone 100dvh meno gli inset overlay", () => {
    const tokenIndex = tokensCss.indexOf("--tv-kbd-sheet-max-height:");
    expect(tokenIndex).toBeGreaterThan(-1);
    const token = tokensCss.slice(
      tokenIndex,
      tokensCss.indexOf(";", tokenIndex),
    );
    expect(token).toContain("100dvh");
    expect(token).toContain("var(--tv-kbd-overlay-inset-top)");
    expect(token).toContain("var(--tv-kbd-overlay-inset-bottom)");
  });

  it("lo zoom guard input fissa il floor a 16px (1rem, no auto-zoom iOS)", () => {
    const tokenIndex = tokensCss.indexOf("--tv-kbd-input-min-font-size:");
    expect(tokenIndex).toBeGreaterThan(-1);
    const token = tokensCss.slice(
      tokenIndex,
      tokensCss.indexOf(";", tokenIndex),
    );
    expect(token).toContain("1rem");
  });
});

describe("B39 utility isolata tv-kbd-* (app/globals.css)", () => {
  const sectionIndex = globalsCss.indexOf(B39_SECTION_BANNER);
  // Il banner e' dentro un commento /* ... */ che inizia prima del marker:
  // lo slice parte dall'apertura del commento per poterlo strippare nei check.
  const commentStart = globalsCss.lastIndexOf("/*", sectionIndex);
  const nextMarkerIndex = globalsCss.indexOf(
    "B38 — Catalog density policy",
    sectionIndex,
  );
  const nextSectionStart = globalsCss.lastIndexOf("/*", nextMarkerIndex);
  const section = globalsCss.slice(
    commentStart === -1 ? sectionIndex : commentStart,
    nextSectionStart === -1 ? undefined : nextSectionStart,
  );

  it("la sezione B39 esiste nella parte finale del file (unlayered, isolata)", () => {
    expect(sectionIndex).toBeGreaterThan(-1);
    expect(sectionIndex).toBeGreaterThan(globalsCss.length * 0.9);
    expect(nextSectionStart).toBeGreaterThan(commentStart);
  });

  it("la sezione non introduce alcun !important", () => {
    const withoutComments = section.replace(/\/\*[\s\S]*?\*\//g, "");
    expect(withoutComments).not.toContain("!important");
  });

  it("l'overlay segue il dynamic viewport con fallback vh → dvh", () => {
    const overlay = extractBlock(section, ".tv-kbd-overlay {");
    expect(overlay).not.toBeNull();
    const vhIndex = overlay!.indexOf("min-height: 100vh");
    const dvhIndex = overlay!.indexOf("min-height: 100dvh");
    expect(vhIndex).toBeGreaterThan(-1);
    expect(dvhIndex).toBeGreaterThan(vhIndex);
    expect(overlay).toContain("overflow-y: auto");
    expect(overlay).toContain("overscroll-behavior: contain");
  });

  it("la sheet è cappata allo spazio visibile e scorre internamente", () => {
    const sheet = extractBlock(section, ".tv-kbd-sheet {");
    expect(sheet).not.toBeNull();
    expect(sheet).toContain("max-height: var(--tv-kbd-sheet-max-height)");
    expect(sheet).toContain("overflow-y: auto");
    expect(sheet).toContain("overscroll-behavior: contain");
  });

  it("lo zoom guard è scoped touch/mobile e senza !important", () => {
    const mediaIndex = section.indexOf(
      "@media (max-width: 767px), (pointer: coarse)",
    );
    expect(mediaIndex).toBeGreaterThan(-1);
    const media = extractBlock(
      section.slice(mediaIndex),
      "@media (max-width: 767px), (pointer: coarse)",
    );
    expect(media).not.toBeNull();
    expect(media).toContain(".tv-kbd-input.tv-kbd-input");
    expect(media).toContain(
      "font-size: max(var(--tv-kbd-input-min-font-size), 1em)",
    );
  });

  it("con viewport basso (tastiera aperta) overlay/page ancorano in alto con inset safe-area", () => {
    const mediaIndex = section.indexOf("@media (max-height: 34rem)");
    expect(mediaIndex).toBeGreaterThan(-1);
    const media = extractBlock(
      section.slice(mediaIndex),
      "@media (max-height: 34rem)",
    );
    expect(media).not.toBeNull();
    expect(media).toContain("align-items: flex-start");
    expect(media).toContain("padding-top: var(--tv-kbd-overlay-inset-top)");
    expect(media).toContain(
      "padding-bottom: var(--tv-kbd-overlay-inset-bottom)",
    );
  });

  it("il footer azioni è sticky nel viewport basso (submit/close visibili)", () => {
    const mediaIndex = section.indexOf("@media (max-height: 34rem)");
    const media = extractBlock(
      section.slice(mediaIndex),
      "@media (max-height: 34rem)",
    );
    expect(media).not.toBeNull();
    const footer = extractBlock(media!, ".tv-kbd-sheet__footer {");
    expect(footer).not.toBeNull();
    expect(footer).toContain("position: sticky");
    expect(footer).toContain("bottom: 0");
  });
});

describe("B39 viewport meta interattivo (app/layout.tsx)", () => {
  it("dichiara interactive-widget=resizes-content (Android ridimensiona il layout viewport)", () => {
    expect(layoutSource).toContain('interactiveWidget: "resizes-content"');
  });

  it("mantiene width/initial-scale di default (nessuna variazione a tastiera chiusa)", () => {
    expect(layoutSource).toContain('width: "device-width"');
    expect(layoutSource).toContain("initialScale: 1");
  });
});

describe("B39 wrapper Gate/Auth/Search — classi della policy applicate", () => {
  it("gate-modal: overlay, sheet, footer sticky, input guard e scroll-to-input", () => {
    expect(gateModalSource).toContain("tv-kbd-overlay");
    expect(gateModalSource).toContain("tv-kbd-sheet");
    expect(gateModalSource).toContain("tv-kbd-sheet__footer");
    expect(gateModalSource).toContain("tv-kbd-input");
    expect(gateModalSource).toContain("useKeyboardAwareScroll");
  });

  it("auth-page: page policy, scroll-to-input, zoom guard sui 3 campi e submit sticky", () => {
    expect(authPageSource).toContain("tv-kbd-page");
    expect(authPageSource).toContain("useKeyboardAwareScroll");
    expect(authPageSource).toContain("tv-kbd-sheet__footer");
    const zoomGuardCount = authPageSource.split("tv-kbd-input").length - 1;
    expect(zoomGuardCount).toBe(3);
  });

});
