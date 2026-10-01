import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

/* Home TOOL/STACK/RADAR segmented control: single-thumb contract.
   Guards the physical-iPhone polish: one track, one geometric thumb,
   three label-only buttons, centered grid, contained thumb. */

describe("home segmented control contract", () => {
  it("defines one centered 3-column track with a single thumb formula", () => {
    const css = read("styles/visual-system.css");
    expect(css).toContain(".tv-discovery-stage .def-start__tabs {");
    expect(css).toContain("grid-template-columns: repeat(3, minmax(0, 1fr))");
    expect(css).toContain("margin-inline: auto");
    expect(css).toContain(".tv-discovery-stage .def-start__tabs::before {");
    expect(css).toContain("width: calc((100% - 8px) / 3)");
    expect(css).toContain('transform: translateX(100%)');
    expect(css).toContain('transform: translateX(200%)');
  });

  it("keeps labels geometry-free (color-only active state)", () => {
    const css = read("styles/visual-system.css");
    const block = css.slice(
      css.indexOf(".tv-discovery-stage .def-start__tab {"),
      css.indexOf(".tv-discovery-stage .def-start__tab {") + 1200,
    );
    expect(block).toContain("background: transparent !important");
    expect(block).toContain("box-shadow: none !important");
  });

  it("has no duplicated active fills painting a second pill", () => {
    for (const rel of [
      "styles/definitive-home.css",
      "styles/visual-character.css",
      "styles/mockup-parity-v4.css",
    ]) {
      const css = read(rel);
      const hits = [...css.matchAll(/\.def-start__tab(?:\.is-active|\[aria-selected="true"\])\s*\{[^}]*background:\s*([^;]+);/g)];
      for (const [, value] of hits) {
        expect(
          value.trim(),
          `${rel} paints a second active fill: ${value.trim()}`,
        ).toMatch(/transparent/);
      }
    }
  });

  it("keeps the thumb transition on the canonical motion token without spring overshoot", () => {
    const css = read("styles/visual-system.css");
    expect(css).toContain("--tv-easing-spring-smooth");
    const thumb = css.slice(
      css.indexOf(".tv-discovery-stage .def-start__tabs::before {"),
      css.indexOf(".tv-discovery-stage .def-start__tabs::before {") + 1100,
    );
    expect(thumb).toContain("var(--tv-duration-base, 180ms) var(--tv-easing-standard)");
    expect(thumb).not.toContain("spring");
  });

  it("renders three tabs with tablist semantics", () => {
    const tsx = read("components/home/start-here.tsx");
    expect(tsx).toContain('role="tablist"');
    expect(tsx).toContain('role="tab"');
    expect(tsx).toContain('"tool"');
    expect(tsx).toContain('"stack"');
    expect(tsx).toContain('"radar"');
  });
});
