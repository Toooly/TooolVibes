import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * \u00a746-50 final evidence \u2014 structural contracts only (no pixels).
 * - compare contract (COMPARE_DESKTOP_MEDIA_QUERY + workbench empty CTAs)
 * - tool nav no-scroll (grid 4-col, sticky subnav, section ids)
 * - empty states render CTA hrefs (shortlist / compare; tags empty copy)
 * - error.tsx presence for 6 routes
 */

const root = process.cwd();
function read(p: string) {
  return fs.readFileSync(path.join(root, p), "utf8");
}
function exists(p: string) {
  return fs.existsSync(path.join(root, p));
}

describe("\u00a746-50 compare contract", () => {
  it("battle view exports the 1280 desktop media query", () => {
    expect(read("components/tools/tool-battle-view.tsx")).toContain(
      'export const COMPARE_DESKTOP_MEDIA_QUERY = "(min-width: 1280px)"',
    );
  });
  it("compare empty state offers Salvati + catalog CTAs", () => {
    const chrome = read("components/tools/compare-workbench-chrome.tsx");
    expect(chrome).toContain("CompareWorkbenchEmpty");
    expect(chrome).toContain('href="/archivio"');
    expect(chrome).toContain("Aggiungi da Salvati");
    expect(chrome).toContain("Apri il catalogo");
  });
});

describe("\u00a746-50 tool nav no-scroll", () => {
  it("decision nav is a 4-col grid with sticky subnav (no overflow-x)", () => {
    const css = read("styles/tool-detail-final.css");
    expect(css).toContain("grid-template-columns: repeat(4, minmax(0, 1fr))");
    expect(css).toContain("position: sticky");
    expect(css).not.toMatch(/\.td-final-decision-nav\s*\{[^}]*overflow-x:\s*auto/);
  });
  it("nav exposes the four section anchors", () => {
    const nav = read("components/tool-detail-final/tool-detail-decision-nav.tsx");
    for (const id of [
      "td-final-overview",
      "td-final-panel-pros-limits",
      "td-final-pricing",
      "td-final-alternatives",
    ]) {
      expect(nav).toContain(id);
    }
  });
});

describe("\u00a746-50 empty states render CTA hrefs", () => {
  it("shortlist empty links to /archivio, tool pages and /collections", () => {
    const src = read("components/tools/mobile-shortlist-board.tsx");
    expect(src).toContain('href="/archivio"');
    expect(src).toContain('href="/collections"');
    expect(src).toMatch(/href=\{`\/toools\/\$\{tool\.slug\}`\}/);
  });
  it("compare empty/prep links resolve via salvatiHref + /archivio", () => {
    const chrome = read("components/tools/compare-workbench-chrome.tsx");
    expect(chrome).toContain("salvatiHref");
    expect(chrome).toContain('href="/archivio"');
    const model = read("components/account/workspace/workspace-model.ts");
    expect(model).toContain("GUEST_SALVATI_HREF");
  });
  it("tags empty renders copy + one CTA to discovery", () => {
    const src = read("app/(marketing)/tags/page.tsx");
    expect(src).toContain("tagCounts.length === 0");
    expect(src).toContain("Nessun tag disponibile");
    expect(src).toContain('href="/archivio"');
    expect(src).toContain("Esplora il catalogo");
  });
});

describe("\u00a746-50 error.tsx presence for 6 routes", () => {
  const routes = [
    "app/(marketing)/account/error.tsx",
    "app/(marketing)/archivio/error.tsx",
    "app/(marketing)/compare/error.tsx",
    "app/(marketing)/radar/error.tsx",
    "app/(marketing)/shortlist/error.tsx",
    "app/(marketing)/toools/[slug]/error.tsx",
  ];
  for (const r of routes) {
    it(`${r} exists`, () => {
      expect(exists(r), `${r} missing`).toBe(true);
    });
  }
});
