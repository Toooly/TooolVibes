import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { WORKSPACE_SCHEMA_VERSION } from "@/lib/discovery/workspace-constants";
import {
  LOOP_RAIL_MIN_WIDTH_PX,
  loopPrimaryDestinations,
} from "@/lib/navigation/loop-routes";

const root = process.cwd();

function read(relativePath: string) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

describe("Wave 14 — responsive contracts", () => {
  it("W14-T1/T2 dest count stays 4 auth / 2 guest", () => {
    expect(loopPrimaryDestinations("authenticated")).toHaveLength(4);
    expect(loopPrimaryDestinations("guest")).toHaveLength(2);
    expect(LOOP_RAIL_MIN_WIDTH_PX).toBe(1024);
    expect(read("components/tools/tool-battle-view.tsx")).toContain(
      'export const COMPARE_DESKTOP_MEDIA_QUERY = "(min-width: 1280px)"',
    );
  });

  it("cookie banner sits above the dock via --tv-bottom-nav-total", () => {
    const banner = read("components/ads/consent-banner.tsx");
    const bannerCss = read("styles/public-system.css");
    expect(bannerCss).toContain("--tv-bottom-nav-total");
    expect(bannerCss).toContain("env(safe-area-inset-bottom");
    expect(banner).not.toMatch(/bottom-0/);
    expect(banner).not.toContain("9999999999");
    expect(banner).toContain("Rispettiamo la tua privacy");
  });

  it("W14-T5 cookie or sheets consume --tv-bottom-nav-total without double-counting dock padding", () => {
    const banner = read("styles/public-system.css");
    const sheetCss = read("components/account/workspace/decision-sheet.css");

    expect(banner).toMatch(/var\(--tv-bottom-nav-total/);
    expect(sheetCss).toMatch(/var\(--tv-bottom-nav-total/);
  });

  it("DecisionSheet desktop query is 1024 not 768 and wins 480px width", () => {
    const sheet = read("components/account/workspace/decision-sheet.tsx");
    const css = read("components/account/workspace/decision-sheet.css");
    expect(sheet).toContain('(min-width: 1024px)');
    expect(sheet).not.toContain('(min-width: 768px)');
    expect(css).toMatch(/max-width:\s*480px/);
    expect(css).toContain('[data-slot="sheet-content"].tv-decision-sheet[data-side="right"]');
  });

  it("W14-T7 DecisionSheet Fast/Deep semantics stay in place", () => {
    const sheet = read("components/account/workspace/decision-sheet.tsx");
    expect(sheet).toContain('aria-label="Esito"');
    // GM-10: no deep gate — Nota privata + revisit inline.
    expect(sheet).not.toContain("Aggiungi dettagli");
    expect(sheet).toContain("Nota privata");
    expect(sheet).toContain("Conferma se lo usi tra 1 mese");
    expect(sheet).toContain("Salva decisione");
    expect(sheet).toContain("commitWorkspaceDecision");
    expect(sheet).toContain('role="radiogroup"');
  });

  it("compare 390 obiettivo wraps instead of clipping a nowrap scroller", () => {
    const css = read("styles/compare.css");
    const mobile = css.match(
      /@media \(max-width: 47\.99rem\) \{[\s\S]*?\.compare-objective__options \{([\s\S]*?)\}/,
    );
    expect(mobile?.[1]).toMatch(/flex-wrap:\s*wrap/);
    expect(mobile?.[1]).not.toMatch(/flex-wrap:\s*nowrap/);
    expect(mobile?.[1]).not.toMatch(/overflow-x:\s*auto/);
    expect(read("components/tools/tool-battle-view.tsx")).toContain(
      'export const COMPARE_DESKTOP_MEDIA_QUERY = "(min-width: 1280px)"',
    );
  });

  it("guest shortlist remove/note targets are at least 44px", () => {
    const css = read("app/(marketing)/shortlist/shortlist.css");
    expect(css).toMatch(
      /\.shortlist-final-surface \.mobile-library-book__remove \{[\s\S]*?min-height:\s*44px/,
    );
    expect(css).toMatch(
      /\.shortlist-final-surface \.mobile-library-book__spine \{[\s\S]*?pointer-events:\s*none/,
    );
  });

  it("W14-T6 decorative marks keep pointer-events none", () => {
    const accountCss = read("app/(marketing)/account/account.css");
    expect(accountCss).toMatch(/\.tv-tool-mark__jewel[\s\S]*?pointer-events:\s*none/);
  });

  it("compact stack create inputs have a 44px min-height", () => {
    const css = read("app/(marketing)/account/account.css");
    expect(css).toMatch(/\.tv-compose-stack input,[\s\S]*?min-height:\s*2\.75rem/);
    expect(css).toMatch(/\.tv-stack-pick--compact input,[\s\S]*?min-height:\s*2\.75rem/);
  });

  it("W14-T9 Radar facet chrome remains CatalogoFacetHead", () => {
    const archive = read("components/archive/definitive-archive.tsx");
    const radar = read("components/radar/radar-experience.tsx");
    expect(archive).toContain("CatalogoFacetHead");
    expect(radar).toContain("CatalogoFacetHead");
    expect(radar).toContain('active="radar"');
  });

  it("W14-T10 Trova / Vai / Fai grouping stays in the palette", () => {
    const palette = read("components/app/global-command-palette.tsx");
    expect(palette).toContain("Trova");
    expect(palette).toContain("Vai");
    expect(palette).toContain("Fai");
  });

  it("W14-T11 HUD is not a loop destination", () => {
    const routes = read("lib/navigation/loop-routes.ts");
    expect(routes).not.toMatch(/\bHUD\b/);
    expect(loopPrimaryDestinations("authenticated").map((item) => item.id)).toEqual([
      "home",
      "salvati",
      "stack",
      "catalogo",
    ]);
  });

  it("W14-T13 schemaVersion stays 1", () => {
    expect(WORKSPACE_SCHEMA_VERSION).toBe(1);
  });
});
