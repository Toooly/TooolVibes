import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (rel: string) => readFileSync(resolve(process.cwd(), rel), "utf8");

const commandBarSrc = read("components/layout/command-bar.tsx");
const mobileTopSrc = read("components/layout/mobile-top-bar.tsx");
const commandBarCss = read("styles/command-bar.css");
const mobileTopCss = read("styles/mobile-top-bar.css");
const intentSrc = read("components/home/intent-entry.tsx");
const homeCss = read("styles/definitive-home.css");
const archiveSrc = read("components/archive/definitive-archive.tsx");
const archiveCss = read("styles/archive-v4.css");
const radarFullSrc = read("components/radar/full-radar-experience.tsx");
const startHereSrc = read("components/home/start-here.tsx");
const homeSrc = read("components/home/definitive-home.tsx");

describe("v3.1 hidden-dom contract", () => {
  it("removes empty chrome scanline and bottom-border nodes", () => {
    expect(commandBarSrc).not.toContain("command-bar__scanline");
    expect(commandBarSrc).not.toContain("command-bar__bottom-border");
    expect(mobileTopSrc).not.toContain("mobile-top-bar__scanline");
    expect(commandBarCss).not.toContain(".command-bar__scanline");
    expect(commandBarCss).not.toContain(".command-bar__bottom-border");
    expect(mobileTopCss).not.toContain(".mobile-top-bar__scanline");
  });

  it("uses one semantic home submit label with a density fragment", () => {
    expect(intentSrc).toContain(
      'Cerca',
    );
    expect(intentSrc).not.toContain("def-intent__submit-desktop");
    expect(intentSrc).not.toContain("def-intent__submit-mobile");
    expect(homeCss).toMatch(/\.def-intent__submit-rest\s*\{\s*display:\s*none;/);
  });

  it("collapses archive eyebrow and data copy-swaps without dead mobile twins", () => {
    expect(archiveSrc).toContain("ar4-intro__eyebrow-lead");
    expect(archiveSrc).not.toContain("ar4-intro__eyebrow-desktop");
    expect(archiveSrc).not.toContain("ar4-intro__eyebrow-mobile");
    expect(archiveSrc).not.toContain("ar4-intro__data-desktop");
    expect(archiveSrc).not.toContain("ar4-intro__data-mobile");
    expect(archiveCss).toContain(".ar4-intro__eyebrow-sep { display: none; }");
    expect(archiveCss).not.toContain(".ar4-intro__data-mobile");
  });

  it("keeps one radar visual eyebrow plus a single sr-only canonical label", () => {
    // The FULL Radar owns a single visual eyebrow (`tv-rx__eyebrow`) with no
    // desktop/mobile split and one sr-only search label.
    expect(radarFullSrc).toContain('className="tv-rx__eyebrow"');
    expect(radarFullSrc).toContain("tv-rx-sr-only");
    expect(radarFullSrc).not.toContain("tv-rx__eyebrow-desktop");
    expect(radarFullSrc).not.toContain("tv-rx__eyebrow-mobile");
    expect(radarFullSrc).not.toContain("tv-radar__eyebrow-desktop");
    expect(radarFullSrc).not.toContain("tv-radar__eyebrow-mobile");
  });

  it("preserves product-intent home lede variants and start-here tab panels", () => {
    expect(homeSrc).toContain("def-cockpit__lede-desktop");
    expect(homeSrc).toContain("def-cockpit__lede-mobile");
    expect(startHereSrc).toContain('hidden={tab !== "tool"}');
    expect(startHereSrc).toContain('hidden={tab !== "stack"}');
    expect(startHereSrc).toContain('hidden={tab !== "radar"}');
  });
});
