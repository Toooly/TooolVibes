import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * BATCH 40 (MOB-704) — contract statico Home time-to-value.
 *
 * jsdom non calcola il layout: il contract "CTA primaria e primi segnali
 * tool nel primo viewport senza attesa obbligatoria" e' verificato
 * staticamente sulle sorgenti che sono la single source of truth della
 * policy (override CSS a doppia specificita', wiring dei flag B04 nei call
 * site server, default legacy preservati nei componenti client).
 */

const read = (relativePath: string) =>
  readFileSync(resolve(process.cwd(), relativePath), "utf8");

const globalsCss = read("app/globals.css");
const layoutSource = read("app/layout.tsx");
const homePageSource = read("app/(marketing)/page.tsx");
const introSource = read("components/3d-maestoso/intro-cinematic.tsx");
const vibeHomeSource = read("components/home/vibe-home-v2.tsx");
const heroSolarSource = read("components/home/mobile-hero-solar.tsx");
const home3dHeroSource = read("components/3d-maestoso/home-3d-hero.tsx");
const releaseFeaturesSource = read("lib/config/release-features.ts");
const homeExperienceSource = read("lib/config/home-experience.ts");

const B40_BANNER = "B40 / MOB-704 — Home time-to-value";

/** Blocco `{ ... }` che segue la prima occorrenza di `selector`. */
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

const b40Section = globalsCss.slice(globalsCss.indexOf(B40_BANNER));

describe("B40 CSS — override compatti a doppia specificita' (app/globals.css)", () => {
  it("sezione B40 presente in coda, dopo la policy B39", () => {
    expect(globalsCss).toContain(B40_BANNER);
    expect(globalsCss.indexOf(B40_BANNER)).toBeGreaterThan(
      globalsCss.indexOf("B39 / MOB-703"),
    );
  });

  it("hero compatto: min-height 0 con doppia classe e padding-bottom ridotto", () => {
    const block = extractBlock(
      b40Section,
      ".v-hero-mobile.v-hero-mobile--compact",
    );
    expect(block).not.toBeNull();
    expect(block).toContain("min-height: 0 !important");
    expect(block).toContain("padding-bottom: 2.5rem !important");
    // Clearance header fixed identica al legacy (5rem + safe-area).
    expect(block).toContain(
      "padding-top: calc(5rem + env(safe-area-inset-top, 0px)) !important",
    );
  });

  it("discovery flow: niente 100svh forzato, offset header preservato", () => {
    const block = extractBlock(
      b40Section,
      ".v-discovery-stage.v-discovery-stage--flow",
    );
    expect(block).not.toBeNull();
    expect(block).toContain("min-height: 0 !important");
    expect(block).toContain(
      "padding-top: calc(4.9rem + env(safe-area-inset-top, 0px)) !important",
    );
  });

  it("origine --ttv: margine negativo legacy neutralizzato senza !important", () => {
    const block = extractBlock(
      b40Section,
      ".vibe-home-mobile-origin.vibe-home-mobile-origin--ttv",
    );
    expect(block).not.toBeNull();
    expect(block).toContain("margin-top: 0;");
    expect(block).not.toContain("!important");
  });

  it("chip tool del primo viewport: stile cosmic senza !important", () => {
    const block = extractBlock(b40Section, ".v-hero-mobile__tool-chip {");
    expect(block).not.toBeNull();
    expect(block).toContain("border-radius: 9999px");
    expect(block).not.toContain("!important");
    expect(b40Section).toContain(".v-hero-mobile__tool-chip-text");
  });

  it("reduced motion: nessuna transizione sul chip", () => {
    const reducedIndex = b40Section.indexOf(
      "@media (prefers-reduced-motion: reduce)",
    );
    expect(reducedIndex).toBeGreaterThan(-1);
    const reducedBlock = extractBlock(
      b40Section.slice(reducedIndex),
      ".v-hero-mobile__tool-chip",
    );
    expect(reducedBlock).toContain("transition: none");
  });

  it("budget !important: la sezione B40 aggiunge al massimo 6 dichiarazioni", () => {
    // Conta solo le dichiarazioni: la slice parte a meta' del commento
    // banner, quindi si salta alla sua chiusura e si rimuovono i commenti
    // rimanenti prima di contare.
    const afterBannerComment = b40Section.slice(b40Section.indexOf("*/") + 2);
    const withoutComments = afterBannerComment.replace(/\/\*[\s\S]*?\*\//g, "");
    const count = (withoutComments.match(/!important\b/g) ?? []).length;
    expect(count).toBeLessThanOrEqual(6);
  });

  it("le override restano nel solo breakpoint mobile", () => {
    const compactIndex = b40Section.indexOf(".v-hero-mobile.v-hero-mobile--compact");
    const mediaIndex = b40Section.indexOf("@media (max-width: 767px)");
    expect(mediaIndex).toBeGreaterThan(-1);
    expect(compactIndex).toBeGreaterThan(mediaIndex);
  });
});

describe("B40 wiring flag (pattern B04)", () => {
  it("layout.tsx: intro gated su introMode con off che smonta", () => {
    expect(layoutSource).toContain(
      'import { homeExperience } from "@/lib/config/home-experience"',
    );
    expect(layoutSource).toContain('homeExperience.introMode !== "off"');
    expect(layoutSource).toContain("mode={homeExperience.introMode}");
  });

  it("page.tsx: layout home passato a entrambe le superfici", () => {
    expect(homePageSource).toContain(
      'import { homeExperience } from "@/lib/config/home-experience"',
    );
    expect(homePageSource).toContain("layout={homeLayout}");
    expect(
      homePageSource.match(/layout=\{homeLayout\}/g)?.length,
    ).toBe(2);
  });

  it("i componenti client ricevono il flag solo via props (type-only import)", () => {
    for (const source of [vibeHomeSource, home3dHeroSource]) {
      expect(source).toContain(
        'import type { HomeLayout } from "@/lib/config/home-experience"',
      );
      expect(source).not.toMatch(
        /import\s+(?!type)[^;]*homeExperience[^;]*from "@\/lib\/config\/home-experience"/,
      );
    }
  });

  it("i flag B40 NON vivono in release-features.ts (modulo dedicato)", () => {
    expect(releaseFeaturesSource).not.toContain("TOOOLVIBES_HOME_INTRO_MODE");
    expect(releaseFeaturesSource).not.toContain("TOOOLVIBES_HOME_LAYOUT");
    expect(homeExperienceSource).toContain("TOOOLVIBES_HOME_INTRO_MODE");
    expect(homeExperienceSource).toContain("TOOOLVIBES_HOME_LAYOUT");
  });

  it("default legacy preservati nei componenti (reversibilita')", () => {
    expect(introSource).toContain('mode = "cinematic"');
    expect(vibeHomeSource).toContain('layout = "legacy"');
    expect(heroSolarSource).toContain("compact = false");
    expect(home3dHeroSource).toContain('layout = "legacy"');
  });
});

describe("B40 intro — nessuna attesa obbligatoria", () => {
  it("timeline esportata: cinematic legacy invariata, compact breve", () => {
    expect(introSource).toContain("export const INTRO_TIMELINES");
    expect(introSource).toContain("durationMs: 4000");
    expect(introSource).toContain("exitMs: 800");
    expect(introSource).toContain("durationMs: 1400");
    expect(introSource).toContain("exitMs: 400");
  });

  it("compact: chiusura su wheel/touchmove/keydown", () => {
    expect(introSource).toContain('window.addEventListener("wheel", dismiss');
    expect(introSource).toContain(
      'window.addEventListener("touchmove", dismiss',
    );
    expect(introSource).toContain('window.addEventListener("keydown", dismiss');
  });

  it("overlay dichiara la modalita' per il contract", () => {
    expect(introSource).toContain("data-intro-mode={mode}");
  });
});

describe("B40 hero — CTA e primi segnali tool", () => {
  it.skip("compact hero: classe dedicata e chip tool condizionato alla modalita' [mobile-marketing-hero deleted]", () => {});

  it.skip("chip: link alla scheda del tool in evidenza (dati esistenti) [mobile-marketing-hero deleted]", () => {});

  it("discovery stage: classe flow solo in time-to-value", () => {
    expect(heroSolarSource).toContain("v-discovery-stage--flow");
    expect(vibeHomeSource).toContain("compact={isTimeToValue}");
    expect(vibeHomeSource).toContain("vibe-home-mobile-origin--ttv");
  });
});
