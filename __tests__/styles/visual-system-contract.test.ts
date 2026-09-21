import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const releaseEntry = readFileSync(resolve(process.cwd(), "styles/release-entry.ts"), "utf8");
const systemCss = readFileSync(resolve(process.cwd(), "styles/visual-system.css"), "utf8");

describe("final visual system", () => {
  it("loads after visual-character", () => {
    const character = releaseEntry.indexOf('import "@/styles/visual-character.css"');
    const system = releaseEntry.indexOf('import "@/styles/visual-system.css"');
    expect(character).toBeGreaterThan(-1);
    expect(system).toBeGreaterThan(character);
  });

  it("defines one glow and motion scale", () => {
    expect(systemCss).toContain("--tv-glow-gold");
    expect(systemCss).toContain("--tv-glow-cyan");
    expect(systemCss).toContain("--tv-glow-violet");
    expect(systemCss).toContain("--tv-motion-ui: 180ms");
    expect(systemCss).toContain("prefers-reduced-motion");
  });
});
