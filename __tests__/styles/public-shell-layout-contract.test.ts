import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * PHASE 0 — Public shell layout contract.
 *
 * The marketing shell is a true sticky-footer flex column: main grows to
 * fill the viewport, the footer pins to the bottom on short pages and
 * follows content immediately on long pages. The fixed MobileBottomNav
 * reservation has exactly ONE home: the footer shell padding driven by
 * --tv-bottom-nav-total. Neither main nor route wrappers reserve nav space.
 */

const shellCss = readFileSync(resolve(process.cwd(), "styles/shell.css"), "utf8");
const publicRoutesCss = readFileSync(
  resolve(process.cwd(), "styles/public-routes.css"),
  "utf8",
);
const secondaryPagesCss = readFileSync(
  resolve(process.cwd(), "styles/secondary-pages.css"),
  "utf8",
);
const marketingChromeSrc = readFileSync(
  resolve(process.cwd(), "components/layout/marketing-chrome.tsx"),
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

describe("public shell layout contract", () => {
  it("marketing-shell è una flex column sticky footer", () => {
    const block = extractBlock(shellCss, ".marketing-shell {");
    expect(block).not.toBeNull();
    expect(block).toContain("display: flex");
    expect(block).toContain("flex-direction: column");
    expect(block).toContain("min-height: 100svh");
  });

  it("main cresce a riempire la shell e il footer segue il contenuto", () => {
    const block = extractBlock(shellCss, ".marketing-shell > main {");
    expect(block).not.toBeNull();
    expect(block).toContain("flex: 1 1 auto");
  });

  it("l'unica riserva bottom-nav pubblica vive nel padding del footer", () => {
    // La riserva del fixed MobileBottomNav esiste solo nel footer (mobile).
    expect(shellCss).toContain("var(--tv-bottom-nav-total");
    const desktopShell = extractBlock(shellCss, ".site-footer-v2__shell {");
    expect(desktopShell).not.toBeNull();
    expect(desktopShell).not.toContain("--bottom-nav-height");

    // Nessuna riserva padding su main nelle public routes: i selettori
    // ".marketing-shell main :where(...)" restano legali (styling), ma
    // nessun blocco diretto puo' dichiarare padding-bottom.
    expect(publicRoutesCss).not.toMatch(
      /\.marketing-shell\s+main\s*\{[\s\S]*?padding-bottom/,
    );
  });

  it("secondary-page non duplica la riserva nav nel page-end padding", () => {
    const block = extractBlock(secondaryPagesCss, ".secondary-page {");
    expect(block).not.toBeNull();
    expect(block).toContain("padding-block: clamp(1.5rem, 3vw, 2.75rem)");
    expect(secondaryPagesCss).not.toContain(
      "padding-block-end: clamp(5rem",
    );
  });

  it("il main del marketing chrome non porta classi di riserva nav", () => {
    expect(marketingChromeSrc).not.toContain("pb-mobile-nav");
  });
});
