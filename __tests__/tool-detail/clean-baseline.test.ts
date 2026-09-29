import { describe, expect, it } from "vitest";

/**
 * Tool Detail — Clean Baseline contract tests.
 *
 * Static (file-system) checks against the source tree that enforce the
 * route namespace ownership defined in
 * audits/definitive-rebuild/tool-detail-clean-reset/README.md and
 * FIXED_SURFACE_CONTRACT.md.
 */

import fs from "node:fs";
import path from "node:path";

const REPO = path.resolve(__dirname, "../..");
const PAGE = path.join(REPO, "app/(marketing)/toools/[slug]/page.tsx");
const TOOL_DETAIL_DIR = path.join(REPO, "components/tool-detail-final");
const TOOL_DETAIL_FINAL_CSS = path.join(REPO, "styles/tool-detail-final.css");
const TOOL_DETAIL_V4_CSS = path.join(REPO, "styles/tool-detail-v4.css");
const TOOL_DETAIL_V4_CTA = path.join(REPO, "components/tool-detail/tool-detail-cta-bar.tsx");
const TOOL_DETAIL_V4_DIR = path.join(REPO, "components/tool-detail");
const GLOBALS = path.join(REPO, "app/globals.css");

function read(p: string): string {
  return fs.readFileSync(p, "utf8");
}

/** Strip block + line comments from a CSS string. */
function stripCssComments(css: string): string {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "");
}

/** Extract `.classname` selectors from a CSS string.
 *  Filters out decimal fragments (e.g. ".7rem" matches `.7rem`
 *  because the regex starts with `.` followed by an alpha char).
 *  The regex intentionally requires the first char after `.` to be
 *  alphabetic or `_`, so decimal numbers are not selected. */
function extractClassSelectors(css: string): string[] {
  const matches = css.match(/\.[A-Za-z_][A-Za-z0-9_-]*/g) ?? [];
  return matches;
}

const FORBIDDEN_IMPORTS = [
  "ArchiveV4ToolCard",
  "DirectoryToolCard",
  "DirectoryToolGlyph",
  "PageOrbitShell",
  "SectionOrbitProvider",
  "ToolDetailCtaBar",
];

const FORBIDDEN_PATTERNS_IN_ROUTE = [
  /\bpremium-button\b/,
  /\bpremium-button-(?:primary|secondary|subtle|outline|glow|premium|dark|ghost|link|danger)\b/,
];

describe("Tool Detail clean baseline — source files", () => {
  it("route page is a thin re-export to the final owner", () => {
    const src = read(PAGE);
    expect(src).toMatch(/ToolDetailFinalPage/);
    for (const f of FORBIDDEN_IMPORTS) {
      expect(src, `route page contains forbidden ${f}`).not.toMatch(new RegExp(`\\b${f}\\b`));
    }
    for (const p of FORBIDDEN_PATTERNS_IN_ROUTE) {
      expect(src, `route page matches forbidden ${p}`).not.toMatch(p);
    }
  });

  it("components/tool-detail-final/ contains the live owners", () => {
    expect(fs.existsSync(TOOL_DETAIL_DIR)).toBe(true);
    const required = [
      "tool-detail-final-page.tsx",
      "tool-detail-hero.tsx",
      "tool-detail-score.tsx",
      "tool-detail-decision-nav.tsx",
      "tool-detail-information.tsx",
      "tool-detail-alternatives.tsx",
      "tool-detail-action-surface.tsx",
      "tool-detail-decision-brief.tsx",
      "tool-detail-extended-content.tsx",
    ];
    for (const f of required) {
      const p = path.join(TOOL_DETAIL_DIR, f);
      expect(fs.existsSync(p), `missing ${f}`).toBe(true);
    }
  });

  it("styles/tool-detail-final.css uses ONLY the .td-final-* class namespace (state modifiers .is-/.has- allowed as compounds)", () => {
    const css = stripCssComments(read(TOOL_DETAIL_FINAL_CSS));
    const selectors = extractClassSelectors(css);
    const offenders = selectors.filter(
      (s) =>
        !/^\.td-final-/.test(s) &&
        !/^\.is-/.test(s) &&
        !/^\.has-/.test(s) &&
        !/^\.js-/.test(s),
    );
    expect(offenders, `non-td-final class selectors: ${offenders.join(", ")}`).toEqual([]);
  });

  it("tool-detail-final.css has no !important declarations in code", () => {
    const stripped = stripCssComments(read(TOOL_DETAIL_FINAL_CSS));
    expect(stripped).not.toMatch(/!important/);
  });

  it("tool-detail-final.css has no literal z-index values (uses --tv-z-* tokens only)", () => {
    const stripped = stripCssComments(read(TOOL_DETAIL_FINAL_CSS));
    const offenders: string[] = [];
    stripped.split("\n").forEach((line, idx) => {
      if (/z-index\s*:\s*\d/.test(line)) {
        offenders.push(`line ${idx + 1}: ${line.trim()}`);
      }
    });
    expect(offenders, `literal z-index found: ${offenders.join("; ")}`).toEqual([]);
  });

  it("release entry imports tool-detail-final.css exactly once", () => {
    const globals = read(GLOBALS);
    const releaseEntry = read(path.join(REPO, "styles/release-entry.ts"));
    expect(globals).not.toMatch(/tool-detail-final\.css/);
    expect(releaseEntry.match(/tool-detail-final\.css/g)).toHaveLength(1);
    expect(`${globals}\n${releaseEntry}`).not.toMatch(/tool-detail-v4\.css/);
  });

  it("legacy V4 deliverables are removed from disk", () => {
    expect(fs.existsSync(TOOL_DETAIL_V4_CSS)).toBe(false);
    expect(fs.existsSync(TOOL_DETAIL_V4_CTA)).toBe(false);
    if (fs.existsSync(TOOL_DETAIL_V4_DIR)) {
      const remaining = fs.readdirSync(TOOL_DETAIL_V4_DIR);
      expect(remaining, `leftover files in components/tool-detail/: ${remaining.join(", ")}`).toEqual([]);
    }
  });
});

describe("Tool Detail clean baseline — owner tree", () => {
  it("the final page composes all owners in the binding order", () => {
    const src = read(path.join(TOOL_DETAIL_DIR, "tool-detail-final-page.tsx"));
    const owners = [
      "ToolDetailHero",
      "ToolDetailDecisionBrief",
      "ToolDetailDecisionNav",
      "ToolDetailExtendedContent",
      "ExperienceSection",
      "ToolDetailAlternatives",
    ];
    for (const removed of ["ToolDetailEditorial", "ToolDetailSignal", "ToolDetailFooter"]) {
      expect(src, `removed owner ${removed} still composed`).not.toMatch(
        new RegExp(`<${removed}\\b`),
      );
    }
    for (const o of owners) {
      expect(src, `owner ${o} not in final page`).toMatch(new RegExp(`\\b${o}\\b`));
    }
  });

  it("the final page does not import legacy components", () => {
    const src = read(PAGE);
    for (const f of FORBIDDEN_IMPORTS) {
      expect(src, `route page imports forbidden ${f}`).not.toMatch(new RegExp(`\\b${f}\\b`));
    }
    for (const p of FORBIDDEN_PATTERNS_IN_ROUTE) {
      expect(src, `route page matches forbidden ${p}`).not.toMatch(p);
    }
  });

  it("the alternatives component uses editorial comparison rows, not rich cards", () => {
    const src = read(path.join(TOOL_DETAIL_DIR, "tool-detail-alternatives.tsx"));
    expect(src).toMatch(/buildAlternativeWhy/);
    expect(src).toMatch(/deriveEssentialDifference/);
    expect(src).toMatch(/computeEditorialScore/);
    expect(src).not.toMatch(/AlternativeDecisionCard/);
    expect(src).not.toMatch(/ArchiveV4ToolCard/);
    expect(src).toMatch(/td-final-alt-row/);
  });

  it("H4-UI-01 places Esperienze inside Approfondisci and before Alternatives", () => {
    const src = read(path.join(TOOL_DETAIL_DIR, "tool-detail-final-page.tsx"));
    const deepen = src.indexOf("<ToolDetailExtendedContent");
    const experiences = src.indexOf("<ExperienceSection");
    const alternatives = src.indexOf("<ToolDetailAlternatives");
    expect(deepen).toBeGreaterThan(-1);
    expect(experiences).toBeGreaterThan(deepen);
    expect(alternatives).toBeGreaterThan(experiences);
    expect(src).not.toMatch(/<ToolDetailSignal\b/);
  });

  it("H4-SEO-03 does not add Review structured data", () => {
    const src = read(path.join(TOOL_DETAIL_DIR, "tool-detail-final-page.tsx"));
    expect(src).not.toMatch(/AggregateRating|ReviewRating|ratingValue|"Review"/);
  });

  it("the decision nav links only to unique, rendered section targets", () => {
    const nav = read(path.join(TOOL_DETAIL_DIR, "tool-detail-decision-nav.tsx"));
    const page = read(path.join(TOOL_DETAIL_DIR, "tool-detail-final-page.tsx"));
    const extended = read(path.join(TOOL_DETAIL_DIR, "tool-detail-extended-content.tsx"));
    expect(nav).toMatch(/aria-current=\{selected \? "true" : undefined\}/);
    expect(nav).not.toMatch(/#td-final-use-cases/);
    expect(nav).not.toMatch(/#td-final-signal/);
    for (const id of [
      "td-final-overview",
      "td-final-panel-pros-limits",
      "td-final-pricing",
      "td-final-alternatives",
    ]) {
      expect(nav).toContain(id);
    }
    const deepenItems = read(path.join(TOOL_DETAIL_DIR, "tool-detail-deepen-items.tsx"));
    expect(deepenItems).toMatch(/id=\{`td-final-panel-\$\{panel\.id\}`\}/);
    expect(extended).toMatch(/"pros-limits"/);
    
    expect(page).toMatch(/id="td-final-overview"/);
    expect(page).toMatch(/showAlternatives=\{relatedTools\.length > 0\}/);
  });

  it("the route file is a thin re-export (≤ 30 lines)", () => {
    const lineCount = read(PAGE).split("\n").length;
    expect(lineCount, `route file has ${lineCount} lines`).toBeLessThanOrEqual(30);
  });
});

describe("Tool Detail clean baseline — fixed-surface contract", () => {
  it("publishes --tv-bottom-nav-total token in globals", () => {
    expect(read(GLOBALS)).toMatch(/--tv-bottom-nav-total/);
  });

  it("publishes --tv-tray-height token in globals", () => {
    expect(read(GLOBALS)).toMatch(/--tv-tray-height/);
  });

  it("declares scroll-padding-top on html", () => {
    expect(read(GLOBALS)).toMatch(/scroll-padding-top/);
  });

  it("leaves page-level bottom reservation to the footer shell", () => {
    const css = read(TOOL_DETAIL_FINAL_CSS);
    const page = css.slice(css.indexOf(".td-final-page {"), css.indexOf(".td-final-page__") + 1);
    expect(page).not.toMatch(/--tv-(bottom-nav-total|tray-height)/);
  });
});

describe("Tool Detail clean baseline — data contract preserved", () => {
  it("imports computeEditorialScore from the canonical module", () => {
    const score = read(path.join(TOOL_DETAIL_DIR, "tool-detail-score.tsx"));
    expect(score).toMatch(/computeEditorialScore/);
    expect(score).toMatch(/@\/lib\/data\/editorial-score/);
  });

  it("uses MIN_COMPARE_TOOLS / MAX_COMPARE_TOOLS constants in the action surface", () => {
    const action = read(path.join(TOOL_DETAIL_DIR, "tool-detail-action-surface.tsx"));
    expect(action).toMatch(/MIN_COMPARE_TOOLS/);
    expect(action).toMatch(/MAX_COMPARE_TOOLS/);
  });

  it("preserves Save and Compare workspace store bindings", () => {
    const action = read(path.join(TOOL_DETAIL_DIR, "tool-detail-action-surface.tsx"));
    expect(action).toMatch(/useToolWorkspaceStore/);
    expect(action).toMatch(/toggleSaved/);
    expect(action).toMatch(/toggleCompare/);
  });
});
