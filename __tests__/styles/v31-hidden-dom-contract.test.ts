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
const radarSrc = read("components/radar/radar-experience.tsx");
const radarCss = read("styles/radar.css");
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
      'Cerca<span className="def-intent__submit-rest"> nel catalogo</span>',
    );
    expect(intentSrc).not.toContain("def-intent__submit-desktop");
    expect(intentSrc).not.toContain("def-intent__submit-mobile");
    expect(homeCss).toContain(".def-intent__submit-rest { display: none; }");
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
    expect(radarSrc).toContain('className="tv-radar__eyebrow-visual"');
    expect(radarSrc).toContain('className="sr-only"');
    expect(radarSrc).not.toContain("tv-radar__eyebrow-desktop");
    expect(radarSrc).not.toContain("tv-radar__eyebrow-mobile");
    expect(radarCss).toContain(".tv-radar__eyebrow-lead { display: none; }");
  });

  it("preserves product-intent home lede variants and start-here tab panels", () => {
    expect(homeSrc).toContain("def-cockpit__lede-desktop");
    expect(homeSrc).toContain("def-cockpit__lede-mobile");
    expect(startHereSrc).toContain('hidden={tab !== "tool"}');
    expect(startHereSrc).toContain('hidden={tab !== "stack"}');
    expect(startHereSrc).toContain('hidden={tab !== "radar"}');
  });
});
