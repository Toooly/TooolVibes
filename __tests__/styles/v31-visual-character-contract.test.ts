import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const characterCss = readFileSync(
  resolve(process.cwd(), "styles/visual-character.css"),
  "utf8",
);
const releaseEntry = readFileSync(
  resolve(process.cwd(), "styles/release-entry.ts"),
  "utf8",
);
const tokensCss = readFileSync(resolve(process.cwd(), "styles/tokens.css"), "utf8");
const footerTsx = readFileSync(
  resolve(process.cwd(), "components/layout/site-footer-v2.tsx"),
  "utf8",
);

describe("V3.1 visual character restore", () => {
  it("loads after member-experience so chapter materials can win", () => {
    const member = releaseEntry.indexOf('import "@/styles/member-experience.css"');
    const character = releaseEntry.indexOf('import "@/styles/visual-character.css"');
    expect(member).toBeGreaterThan(-1);
    expect(character).toBeGreaterThan(member);
  });

  it("home discovery and radar canvases are not generic charcoal aliases", () => {
    expect(tokensCss).toContain("--tv-grammar-discovery-surface");
    expect(tokensCss).toContain("--tv-grammar-radar-canvas: #07111c");
    expect(tokensCss).toContain("--tv-grammar-workflow-field");
    expect(characterCss).toContain(".def-home {");
    expect(characterCss).toContain("var(--tv-grammar-discovery-surface)");
    expect(characterCss).toContain("var(--tv-grammar-radar-canvas)");
  });

  it("restores ivory footer presence without dropping nav reservation", () => {
    expect(characterCss).toContain(".site-footer-v2.tv-launchpad");
    expect(characterCss).toContain("var(--tv-surface-inverted)");
    expect(footerTsx).toContain("tv-launchpad__signature");
    expect(footerTsx).toContain("BrandLogo");
  });
});
