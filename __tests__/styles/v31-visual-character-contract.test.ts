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
const globalsCss = readFileSync(resolve(process.cwd(), "app/globals.css"), "utf8");
const shellCss = readFileSync(resolve(process.cwd(), "styles/shell.css"), "utf8");

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
    expect(characterCss).toContain(".site-footer-v2.tv-utility");
    expect(characterCss).toContain("var(--tv-surface-inverted)");
    expect(footerTsx).toContain("tv-utility");
    expect(footerTsx).toContain("BrandLogo");
    expect(footerTsx).not.toContain("tv-launchpad__signature");
  });

  it("hides the skip link with clip, not transform", () => {
    const skip = globalsCss.slice(
      globalsCss.indexOf(".skip-link {"),
      globalsCss.indexOf(".skip-link:focus"),
    );
    expect(skip).toContain("clip-path: inset(50%)");
    expect(skip).not.toContain("translateY(-160%)");
  });

  it("does not force inverted ink on utility footer headings", () => {
    const heading = shellCss.slice(
      shellCss.indexOf(".site-footer-v2 h3 {"),
      shellCss.indexOf(".site-footer-v2__links"),
    );
    expect(heading).toContain("var(--tv-ink-primary)");
    expect(heading).not.toContain("var(--tv-ink-inverted)");
  });
});
