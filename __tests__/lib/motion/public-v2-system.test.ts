import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

function read(rel: string) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

describe("public motion v2 system", () => {
  it("defines semantic keyframes and reduced-motion kills in premium-motion", () => {
    const css = read("styles/premium-motion.css");
    expect(css).toContain("@keyframes tv-motion-enter");
    expect(css).toContain("@keyframes tv-motion-dock-in");
    expect(css).toContain("@keyframes tv-search-settle");
    expect(css).toContain("@keyframes tv-emphasis-once");
    expect(css).toContain(".tv-emphasis--decision");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain(".tv-compare-dock[data-ready] .tv-compare-dock__cta");
  });

  it("aliases enter/exit easings on the token layer", () => {
    const css = read("styles/tokens.css");
    expect(css).toContain("--tv-ease-decelerate: var(--tv-easing-decelerate)");
    expect(css).toContain("--tv-ease-accelerate: var(--tv-easing-accelerate)");
  });

  it("tokenizes filter sheet enter and gates it for reduced motion", () => {
    const css = read("styles/archive-v4.css");
    expect(css).toContain("animation: ar4-sheet-in var(--tv-motion-base) var(--tv-easing-decelerate)");
    expect(css).toContain(".ar4-sheet__panel");
    expect(css).toMatch(/prefers-reduced-motion:\s*reduce[\s\S]*\.ar4-sheet__panel/);
  });

  it("keeps compare dock ready-state as a one-shot, not a loop", () => {
    const css = read("styles/compare.css");
    expect(css).toContain(".tv-compare-dock[data-ready] .tv-compare-dock__cta");
    expect(css).toContain("tv-emphasis-once");
    expect(css).not.toContain("animation-iteration-count: infinite");
  });

  it("wires home search/intent/tab motion without animating the first paint of TOOL", () => {
    const css = read("styles/definitive-home.css");
    expect(css).toContain(".def-intent__field:focus-within");
    expect(css).toContain("tv-emphasis--search");
    expect(css).toContain("[data-intent-extra]");
    expect(css).toContain(".def-start[data-switched] .def-start__panel:not([hidden])");
  });
});
