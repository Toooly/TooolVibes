import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const REPO = path.resolve(__dirname, "../../..");

function read(rel: string) {
  return fs.readFileSync(path.join(REPO, rel), "utf8");
}

describe("tool detail mobile density", () => {
  it("keeps breadcrumb in the hero DOM and drops Ideale per from facts", () => {
    const hero = read("components/tool-detail-final/tool-detail-hero.tsx");
    expect(hero).toMatch(/td-final-hero__breadcrumb/);
    expect(hero).toMatch(/td-final-hero__level/);
    expect(hero).not.toMatch(/td-final-hero__bestfor/);
    expect(hero).not.toMatch(/Ideale per/);
    expect(hero).not.toMatch(/buildPromoChips/);
    expect(hero).not.toMatch(/td-final-chip--featured/);
    expect(hero).not.toMatch(/In evidenza/);
  });

  it("hides breadcrumb, compare rank, and Apri confronto on mobile", () => {
    const css = read("styles/tool-detail-final.css");
    expect(css).toMatch(/@media \(max-width: 47\.99rem\)/);
    expect(css).toMatch(
      /\.td-final-hero__breadcrumb\s*\{\s*display:\s*none;/,
    );
    expect(css).toMatch(/\.td-final-compare-rank/);
    expect(css).toMatch(/\.td-final-cta--open-compare/);
  });

  it("caps mobile hero type and removes the double gutter", () => {
    const css = read("styles/tool-detail-final.css");
    expect(css).toMatch(/\.td-final-hero__name \{\s*font-size: 1\.75rem;/);
    expect(css).toMatch(/-webkit-line-clamp:\s*2/);
    expect(css).not.toMatch(/clamp\(2\.2rem, 12vw, 3\.4rem\)/);
    expect(css).toMatch(/padding-inline:\s*0/);
  });

  it("keeps Confronta activation yellow and does not fill is-ready", () => {
    const css = read("styles/tool-detail-final.css");
    expect(css).toMatch(
      /\.td-final-cta--primary \{[\s\S]*?background:\s*var\(--tv-button-activation-bg\)/,
    );
    expect(css).toMatch(
      /\.td-final-cta--secondary\.is-ready \{[\s\S]*?background:\s*var\(--tv-surface-elevated\)/,
    );
    expect(css).not.toMatch(
      /\.td-final-cta--secondary\.is-ready \{[\s\S]*?--tv-button-activation-bg/,
    );
  });

  it("stacks alternatives on mobile without 100vw overflow", () => {
    const css = read("styles/tool-detail-final.css");
    expect(css).not.toMatch(/flex:\s*0 0 calc\(100% - 2\.5rem\)/);
    expect(css).not.toMatch(/scroll-snap-type:\s*x mandatory/);
    expect(css).not.toMatch(/min\(18\.5rem, 82vw\)/);
    expect(css).not.toMatch(/100vw/);
  });
});
