import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * BATCH 37 (MOB-701) — CSS contract della shell mobile.
 *
 * jsdom non calcola il layout: il contract "nessuna sovrapposizione a
 * 320-430px, safe area, orientation, reduced motion" è verificato
 * staticamente sulla sorgente CSS, che è la single source of truth della
 * geometria (una sola geometria safe-area token-driven per bottom nav e
 * dock launcher).
 */

const globalsCss = readFileSync(
  resolve(process.cwd(), "app/globals.css"),
  "utf8",
);
const tokensCss = readFileSync(
  resolve(process.cwd(), "styles/tokens.css"),
  "utf8",
);

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

describe("B37 shell tokens — unica geometria safe-area (MOB-701)", () => {
  it.each([
    "--tv-shell-nav-inset-left",
    "--tv-shell-nav-inset-right",
    "--tv-shell-nav-inset-bottom",
    "--tv-shell-fab-size",
    "--tv-shell-fab-gap",
    "--tv-shell-dock-inset-right",
    "--tv-shell-dock-inset-bottom",
  ])("styles/tokens.css definisce %s", (token) => {
    expect(tokensCss).toContain(`${token}:`);
  });

  it("il dock inset include altezza nav, gap e safe-area-inset-bottom", () => {
    const tokenIndex = tokensCss.indexOf("--tv-shell-dock-inset-bottom:");
    expect(tokenIndex).toBeGreaterThan(-1);
    const token = tokensCss.slice(
      tokenIndex,
      tokensCss.indexOf(";", tokenIndex),
    );
    expect(token).toContain("var(--tv-shell-nav-inset-bottom)");
    expect(token).toContain("var(--bottom-nav-height)");
    expect(token).toContain("var(--tv-shell-fab-gap)");

    // La safe-area entra nella composizione via nav inset.
    const navInsetIndex = tokensCss.indexOf("--tv-shell-nav-inset-bottom:");
    expect(navInsetIndex).toBeGreaterThan(-1);
    const navInset = tokensCss.slice(
      navInsetIndex,
      tokensCss.indexOf(";", navInsetIndex),
    );
    expect(navInset).toContain("env(safe-area-inset-bottom, 0px)");
  });
});

describe("B37 globals.css — contract geometrico della shell mobile", () => {
  it("il dock floating è l'unico slot fixed per i launcher (token-driven)", () => {
    const dock = extractBlock(globalsCss, ".shell-floating-dock {");
    expect(dock).not.toBeNull();
    expect(dock).toContain("position: fixed");
    expect(dock).toContain("right: var(--tv-shell-dock-inset-right)");
    expect(dock).toContain("bottom: var(--tv-shell-dock-inset-bottom)");
    expect(dock).toContain("z-index: var(--tv-z-nav)");
    expect(dock).not.toContain("!important");
  });

  it("il FAB missioni non si auto-posiziona più (niente fixed nel trigger)", () => {
    const fab = extractBlock(globalsCss, ".game-mission-fab {");
    expect(fab).not.toBeNull();
    expect(fab).not.toContain("position: fixed");
    expect(fab).not.toContain("bottom:");
    expect(fab).not.toContain("right:");
    expect(fab).toContain("var(--tv-shell-fab-size, 3rem)");
  });

  it("la geometria legacy .site-vibe-rush-fab è rimossa", () => {
    expect(globalsCss).not.toContain(".site-vibe-rush-fab {");
  });

  it("la bottom nav consuma i token shell nella regola base", () => {
    const nav = extractBlock(globalsCss, ".mobile-bottom-motion {");
    expect(nav).not.toBeNull();
    expect(nav).toContain("left: var(--tv-shell-nav-inset-left)");
    expect(nav).toContain("right: var(--tv-shell-nav-inset-right)");
    expect(nav).toContain("bottom: var(--tv-shell-nav-inset-bottom)");
    // Nessuna geometria letterale duplicata nella regola base.
    expect(nav).not.toContain("env(safe-area-inset-bottom");
  });

  it("lo stato overlay del dock è dichiarato e privo di !important", () => {
    const hidden = extractBlock(
      globalsCss,
      '.shell-floating-dock[data-overlay-open="true"] {',
    );
    expect(hidden).not.toBeNull();
    expect(hidden).toContain("opacity: 0");
    expect(hidden).toContain("pointer-events: none");
    expect(hidden).not.toContain("!important");
  });

  it("reduced motion: il dock disattiva transizioni e spostamenti", () => {
    const reducedIndex = globalsCss.indexOf(
      "@media (prefers-reduced-motion: reduce)",
      globalsCss.indexOf(".shell-floating-dock {"),
    );
    expect(reducedIndex).toBeGreaterThan(-1);
    const reduced = extractBlock(
      globalsCss.slice(reducedIndex),
      "@media (prefers-reduced-motion: reduce)",
    );
    expect(reduced).not.toBeNull();
    expect(reduced).toContain(".shell-floating-dock");
    expect(reduced).toContain("transition: none");
  });

  it("scroll end: con il dock attivo il contenuto riserva l'ingombro launcher", () => {
    expect(globalsCss).toContain(
      "body:has(.shell-floating-dock) .pb-mobile-nav",
    );
    const reserved = extractBlock(
      globalsCss,
      "body:has(.shell-floating-dock) .pb-mobile-nav",
    );
    expect(reserved).not.toBeNull();
    expect(reserved).toContain("var(--tv-shell-dock-inset-bottom)");
    expect(reserved).toContain("var(--tv-shell-fab-size)");
  });

  it("il drawer missioni mobile rispetta la safe-area inferiore", () => {
    const drawer = extractBlock(globalsCss, ".game-mission-drawer--mobile {");
    expect(drawer).not.toBeNull();
    expect(drawer).toContain("env(safe-area-inset-bottom, 0px)");
  });
});
