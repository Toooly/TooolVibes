import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (rel: string) => readFileSync(resolve(process.cwd(), rel), "utf8");

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

describe("V3.1 cascade ownership", () => {
  it("Compare H1 owns type and former public-routes uppercase leak", () => {
    const compare = read("styles/compare.css");
    const publicRoutes = read("styles/public-routes.css");
    const intro = extractBlock(
      compare,
      ".tool-battle-page .tool-battle-page__intro h1 {",
    );
    expect(intro).toContain("var(--tv-font-ui)");
    expect(intro).toContain("var(--tv-weight-bold)");
    // Final convergence: the Compare H1 speaks in the shared sentence-case
    // display voice, not the legacy all-caps treatment.
    expect(intro).not.toContain("text-transform: uppercase");
    expect(publicRoutes).not.toContain(".compare-space-page h1");
    expect(publicRoutes).not.toContain(".catalog-discovery__copy h1");
    expect(publicRoutes).not.toContain(".tool-detail-title");
    expect(publicRoutes).not.toContain(".tone-screen h1");
  });

  it("ivory principle still beats later institutional wash", () => {
    const secondary = read("styles/secondary-pages.css");
    const ivory = extractBlock(
      secondary,
      ".secondary-principle.secondary-card--ivory {",
    );
    expect(ivory).toContain("var(--tv-grammar-institutional-ivory)");
  });

  it("1280 chrome hide fallback remains for dual SSR", () => {
    expect(read("styles/command-bar.css")).toMatch(
      /@media \(max-width: 1279px\)[\s\S]*\.command-bar \{\s*display: none/,
    );
    expect(read("styles/mobile-top-bar.css")).toMatch(
      /@media \(min-width: 1280px\)[\s\S]*\.mobile-top-bar \{\s*display: none/,
    );
    expect(read("styles/mobile-bottom-nav.css")).toMatch(
      /@media \(min-width: 1280px\)[\s\S]*\.mobile-bottom-shell \{\s*display: none/,
    );
  });

  it("does not keep proven-orphan D0/D1.1 selectors in live sheets", () => {
    const globals = read("app/globals.css");
    const motion = read("styles/premium-motion.css");
    const maestoso = read("styles/vibes-3d-maestoso.css");
    const account = read("app/(marketing)/account/account.css");
    const globalAccount = read("styles/account.css");
    expect(globals).not.toContain(".mobile-radar-view__scan-line");
    expect(motion).not.toContain(".tool-detail-editorial-card");
    expect(maestoso).not.toContain(".shortlist-slot-card");
    expect(maestoso).not.toContain(".arena-3d-wrapper");
    expect(account).not.toContain(".tv-signal-mark");
    expect(account).not.toContain(".account-loading-state");
    expect(globalAccount).not.toContain(".account-loading-state");
  });

  it("radar retry visual owner keeps justify-content without a losing duplicate", () => {
    const radar = read("styles/radar.css");
    const ownerStart = radar.lastIndexOf(
      ".tv-radar__retry {\n  display: inline-flex",
    );
    expect(ownerStart).toBeGreaterThan(-1);
    const owner = extractBlock(radar.slice(ownerStart), ".tv-radar__retry {");
    expect(owner).toContain("justify-content: center");
    expect(owner).toContain("var(--tv-button-activation-bg)");
    expect(owner).toContain("margin-left: auto");
    expect(radar).not.toContain(
      "padding: var(--tv-space-px-2) var(--tv-space-px-3);\n  border: 1px solid var(--tv-button-activation-bg);\n  border-radius: var(--tv-radius-pill);\n  background: var(--tv-button-activation-bg);\n  color: var(--tv-button-activation-text);\n}\n\n.tv-radar__retry:hover:not(:disabled) {\n  border-color: var(--tv-button-activation-bg-hover);\n  background: var(--tv-button-activation-bg-hover);\n}\n\n.tv-radar__retry:disabled {\n  cursor: wait;",
    );
  });
});
