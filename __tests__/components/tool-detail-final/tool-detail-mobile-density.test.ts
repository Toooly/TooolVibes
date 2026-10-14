import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const REPO = path.resolve(__dirname, "../../..");

function read(rel: string) {
  return fs.readFileSync(path.join(REPO, rel), "utf8");
}

describe("tool detail mobile density", () => {
  it("keeps one page breadcrumb and drops Ideale per from hero facts", () => {
    const hero = read("components/tool-detail-final/tool-detail-hero.tsx");
    const page = read("components/tool-detail-final/tool-detail-final-page.tsx");
    expect(page).toMatch(/td-final-breadcrumb/);
    expect(hero).not.toMatch(/td-final-hero__breadcrumb/);
    expect(hero).toMatch(/td-final-hero__level/);
    expect(hero).not.toMatch(/td-final-hero__bestfor/);
    expect(hero).not.toMatch(/Ideale per/);
    expect(hero).not.toMatch(/buildPromoChips/);
    expect(hero).not.toMatch(/td-final-chip--featured/);
    expect(hero).not.toMatch(/In evidenza/);
  });

  it("keeps the page breadcrumb while hiding redundant compare controls on mobile", () => {
    const css = read("styles/tool-detail-final.css");
    expect(css).toMatch(/@media \(max-width: 47\.99rem\)/);
    expect(css).not.toMatch(/\.td-final-hero__breadcrumb/);
    expect(css).toMatch(/\.td-final-compare-rank/);
    expect(css).toMatch(/\.td-final-cta--open-compare/);
  });

  it("caps mobile hero type without truncating the description", () => {
    const css = read("styles/tool-detail-final.css");
    expect(css).toMatch(/\.td-final-hero__name \{\s*font-size: 1\.75rem;/);
    expect(css).not.toMatch(/-webkit-line-clamp/);
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

  it("alternatives carousel has no 100vw overflow", () => {
    const css = read("styles/tool-detail-final.css");
    expect(css).not.toMatch(/min\(18\.5rem, 82vw\)/);
    expect(css).not.toMatch(/100vw/);
  });
});
