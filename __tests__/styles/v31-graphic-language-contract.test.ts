import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const tokensCss = readFileSync(resolve(process.cwd(), "styles/tokens.css"), "utf8");
const primitivesCss = readFileSync(
  resolve(process.cwd(), "styles/brand-primitives.css"),
  "utf8",
);
const radarCss = readFileSync(resolve(process.cwd(), "styles/radar.css"), "utf8");
const archiveCss = readFileSync(resolve(process.cwd(), "styles/archive-v4.css"), "utf8");
const collectionsCss = readFileSync(
  resolve(process.cwd(), "app/(marketing)/collections/collections.css"),
  "utf8",
);
const homeCss = readFileSync(resolve(process.cwd(), "styles/definitive-home.css"), "utf8");
const compareCss = readFileSync(resolve(process.cwd(), "styles/compare.css"), "utf8");
const decisionCss = readFileSync(
  resolve(process.cwd(), "components/account/workspace/decision-sheet.css"),
  "utf8",
);
const publicRoutesCss = readFileSync(
  resolve(process.cwd(), "styles/public-routes.css"),
  "utf8",
);
const motionCss = readFileSync(resolve(process.cwd(), "styles/premium-motion.css"), "utf8");
const toolCss = readFileSync(
  resolve(process.cwd(), "styles/tool-detail-final.css"),
  "utf8",
);
const cardTsx = readFileSync(
  resolve(process.cwd(), "components/collections/collection-card-v4.tsx"),
  "utf8",
);
const shortlistToggle = readFileSync(
  resolve(process.cwd(), "components/tools/shortlist-toggle.tsx"),
  "utf8",
);
const compareToggle = readFileSync(
  resolve(process.cwd(), "components/tools/compare-toggle.tsx"),
  "utf8",
);
const workbenchSrc = readFileSync(
  resolve(process.cwd(), "components/tools/compare-workbench-chrome.tsx"),
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
      if (depth === 0) return source.slice(openIndex + 1, index);
    }
  }
  return null;
}

describe("V3.1 graphic language tokens", () => {
  it("declares family-aware AA focus tokens", () => {
    expect(tokensCss).toContain("--tv-grammar-signal-focus: var(--tv-accent-cyan-on-dark)");
    expect(tokensCss).toContain("--tv-grammar-workflow-focus: var(--tv-accent-brand-aa)");
    expect(tokensCss).toContain(
      "--tv-grammar-personal-focus: var(--tv-grammar-personal-accent-strong)",
    );
    expect(tokensCss).toContain("--tv-grammar-editorial-focus: var(--tv-accent-gold-on-ivory)");
    expect(tokensCss).toContain(
      "--tv-grammar-editorial-focus-dark: var(--tv-accent-gold-on-dark)",
    );
    expect(tokensCss).toContain(
      "--tv-grammar-activation-focus: var(--tv-accent-gold-on-dark)",
    );
  });

  it("does not revive unused V1 wave/orbit/scan as product marks", () => {
    expect(primitivesCss).toContain("@keyframes tv-gl-trace-draw");
    expect(primitivesCss).not.toMatch(/\.tv-brand-wave\s*\{[^}]*tv-gl-/);
    expect(radarCss).not.toContain("tv-brand-wave");
    expect(archiveCss).not.toContain("tv-brand-orbit");
    expect(collectionsCss).not.toContain("tv-brand-scan");
  });
});

describe("Signal Trace", () => {
  it("status bar keeps a localized cyan trace; live stays green", () => {
    const bar = extractBlock(radarCss, ".tv-radar-status-bar {");
    expect(bar).toContain("inset 2px 0 0 var(--tv-grammar-signal-trace)");
    const live = extractBlock(
      radarCss,
      '.tv-radar-status-bar__status[data-state="live"] {',
    );
    expect(live).toContain("var(--tv-status-success)");
    expect(live).not.toContain("cyan");
  });

  it("refreshing draws the trace once, not as a second infinite scan", () => {
    expect(radarCss).toContain("animation: tv-gl-trace-draw var(--tv-duration-route)");
    expect(radarCss).toContain("tv-gl-trace-draw var(--tv-duration-route) var(--tv-easing-decelerate) 1 both");
  });

  it("row hover/focus uses an inset trace and is pointer-fine gated", () => {
    expect(radarCss).toContain("@media (hover: hover) and (pointer: fine)");
    expect(radarCss).toContain(
      "box-shadow: inset 2px 0 0 var(--tv-grammar-signal-trace)",
    );
  });
});

describe("Workflow Connector", () => {
  it("collection cards expose a real CORE sequence plus a connector spine", () => {
    expect(cardTsx).toContain("visibleCores.map");
    expect(cardTsx).toContain("cx-card-v4__stack-no");
    expect(collectionsCss).toContain(".cx-card-v4__stack-list::before");
    expect(extractBlock(collectionsCss, ".cx-card-v4__stack-list::before {")).toContain(
      "var(--tv-grammar-workflow-border)",
    );
  });

  it("home stack preview connects existing nodes without extra markup", () => {
    expect(homeCss).toContain(".tv-workflow-card__flow li:not(:last-child)::after");
    expect(
      extractBlock(homeCss, ".tv-workflow-card__flow li:not(:last-child)::after {"),
    ).toContain("var(--tv-grammar-workflow-border)");
  });
});

describe("Memory Mark", () => {
  it("saved catalog cards use remembered lilac, not radar cyan", () => {
    const saved = extractBlock(archiveCss, ".ar4-card[data-saved] {");
    expect(saved).toContain("var(--tv-grammar-personal-remembered-edge)");
    expect(saved).not.toContain("var(--tv-accent-cyan)");
    expect(archiveCss).toContain(".ar4-card[data-saved]::before");
    expect(extractBlock(archiveCss, ".ar4-card[data-saved]::before {")).toContain(
      "var(--tv-grammar-personal-remembered-marker)",
    );
  });

  it("save state remains text/ARIA independent of the graphic", () => {
    expect(shortlistToggle).toContain("is-active");
    expect(shortlistToggle).toContain("aria-pressed");
  });
});

describe("Editorial Mark", () => {
  it("editorial catalog cards wear a brass rail, not a stamp revival", () => {
    expect(archiveCss).toContain(".ar4-card:has(.ar4-card__status--editorial)::after");
    expect(
      extractBlock(
        archiveCss,
        ".ar4-card:has(.ar4-card__status--editorial)::after {",
      ),
    ).toContain("var(--tv-grammar-editorial-rail)");
    expect(archiveCss).not.toContain("tv-brand-stamp");
  });

  it("does not add a score micrographic bar", () => {
    expect(archiveCss).not.toContain("editorial-score-meter");
    expect(toolCss).not.toContain("ToolDetailScoreBar");
  });
});

describe("Decision Mark", () => {
  it("compare-ready is text-accessible and uses one-shot emphasis", () => {
    expect(compareToggle).toContain("is-ready");
    expect(compareCss).toContain(
      ".tv-compare-dock[data-ready] .tv-compare-dock__cta",
    );
    expect(compareCss).toContain("tv-emphasis-once");
    expect(compareCss).toContain(
      ".tv-compare-dock[data-ready] .tv-compare-dock__inner",
    );
  });

  it("closed comparison settles into memory, not a celebration", () => {
    expect(workbenchSrc).toContain('data-compare-workbench-state="closed"');
    expect(workbenchSrc).toContain("La decisione è registrata.");
    const closed = extractBlock(
      compareCss,
      '.compare-workbench-chrome[data-compare-workbench-state="closed"] {',
    );
    expect(closed).toContain("var(--tv-grammar-personal-remembered-edge)");
  });

  it("active decision outcome keeps accessible selected state plus a mark", () => {
    const outcome = extractBlock(
      decisionCss,
      '.tv-decision-sheet__outcome[data-active="true"] {',
    );
    expect(outcome).toContain("var(--tv-accent-brand)");
    expect(outcome).toContain("inset 2px 0 0 var(--tv-grammar-selected)");
  });
});

describe("Focus / pointer / reduced motion", () => {
  it("family focus overrides stay 2px outlines with AA tokens", () => {
    expect(publicRoutesCss).toContain("outline-color: var(--tv-grammar-signal-focus)");
    expect(publicRoutesCss).toContain("outline-color: var(--tv-grammar-workflow-focus)");
    expect(publicRoutesCss).toContain("outline-color: var(--tv-grammar-personal-focus)");
    expect(publicRoutesCss).toContain("outline-color: var(--tv-grammar-editorial-focus)");
    expect(publicRoutesCss).toContain(
      "outline-color: var(--tv-grammar-activation-focus)",
    );
  });

  it("new hover traces are pointer-fine gated", () => {
    expect(radarCss).toContain("@media (hover: hover) and (pointer: fine)");
    expect(collectionsCss).toContain("@media (hover: hover) and (pointer: fine)");
    expect(homeCss).toContain("@media (hover: hover) and (pointer: fine)");
    expect(archiveCss).toContain("@media (hover: hover) and (pointer: fine)");
  });

  it("reduced motion disables new one-shot animations", () => {
    expect(radarCss).toContain("@media (prefers-reduced-motion: reduce)");
    expect(motionCss).toContain(
      '.tv-radar[data-refreshing="true"] .tv-radar-status-bar::after',
    );
    expect(primitivesCss).toContain("@media (prefers-reduced-motion: reduce)");
  });
});
