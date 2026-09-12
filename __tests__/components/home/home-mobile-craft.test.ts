import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (rel: string) => readFileSync(resolve(process.cwd(), rel), "utf8");

describe("home mobile craft contracts", () => {
  const css = read("styles/definitive-home.css");
  const decision = read("components/home/decision-system.tsx");
  const home = read("components/home/definitive-home.tsx");
  const visual = read("styles/visual-character.css");

  it("does not animate decision progress with width", () => {
    expect(css).not.toMatch(/path-fill[^{]*\{[^}]*width:\s*calc\(var\(--decision-progress/);
    expect(css).toContain("transform: scaleX(var(--decision-progress, 0))");
  });

  it("does not idle decision copy by fading the parent", () => {
    expect(css).not.toContain('.def-decision__node[data-state="idle"]');
    expect(css).not.toContain("opacity: 0.42");
    expect(decision).not.toContain("useDecisionProgress");
    expect(decision).not.toContain("getBoundingClientRect");
  });

  it("keeps semantic stage updates and a continuous candidate object", () => {
    expect(decision).toContain("setStage");
    expect(decision).toContain("def-decision__object--${role}");
    expect(decision).toContain('role="a"');
    expect(decision).toContain('role="b"');
    expect(decision).toContain('data-tv-surface="dark"');
  });

  it("binds hero destinations to the ivory contract", () => {
    expect(css).toContain("color: var(--tv-home-ivory-fg)");
    expect(visual).not.toMatch(/\.def-home \{\s*background:[^}]*color: var\(--tv-grammar-discovery-ink\)/);
    expect(home).toContain('data-tv-surface="ivory"');
    expect(home).toContain("def-cockpit__explore");
  });
});
