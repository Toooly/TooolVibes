import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const commandBarCss = readFileSync(resolve(process.cwd(), "styles/command-bar.css"), "utf8");
const mobileTopCss = readFileSync(resolve(process.cwd(), "styles/mobile-top-bar.css"), "utf8");
const mobileBottomCss = readFileSync(
  resolve(process.cwd(), "styles/mobile-bottom-nav.css"),
  "utf8",
);
const shellCss = readFileSync(resolve(process.cwd(), "styles/shell.css"), "utf8");
const archiveCss = readFileSync(resolve(process.cwd(), "styles/archive-v4.css"), "utf8");
const compareCss = readFileSync(resolve(process.cwd(), "styles/compare.css"), "utf8");
const radarCss = readFileSync(resolve(process.cwd(), "styles/radar.css"), "utf8");
const guidesCss = readFileSync(resolve(process.cwd(), "styles/guides.css"), "utf8");
const publicRoutesCss = readFileSync(
  resolve(process.cwd(), "styles/public-routes.css"),
  "utf8",
);
const toolCss = readFileSync(resolve(process.cwd(), "styles/tool-detail-final.css"), "utf8");
const battleSrc = readFileSync(
  resolve(process.cwd(), "components/tools/tool-battle-view.tsx"),
  "utf8",
);
const bottomNavSrc = readFileSync(
  resolve(process.cwd(), "components/layout/mobile-bottom-nav.tsx"),
  "utf8",
);
const secondaryCss = readFileSync(
  resolve(process.cwd(), "styles/secondary-pages.css"),
  "utf8",
);

describe("v3.1 responsive contract", () => {
  it("chrome and compare desktop agree at 1280, with no dead 1180 nav hide", () => {
    expect(commandBarCss).toMatch(/@media \(max-width: 1279px\)[\s\S]*?\.command-bar \{[\s\S]*?display:\s*none/);
    expect(mobileTopCss).toMatch(/@media \(min-width: 1280px\)[\s\S]*?\.mobile-top-bar \{[\s\S]*?display:\s*none/);
    expect(mobileBottomCss).toMatch(
      /@media \(min-width: 1280px\)[\s\S]*?\.mobile-bottom-shell \{[\s\S]*?display:\s*none/,
    );
    expect(bottomNavSrc).toContain('(min-width: 1280px)');
    expect(battleSrc).toContain('export const COMPARE_DESKTOP_MEDIA_QUERY = "(min-width: 1280px)"');
    expect(commandBarCss).not.toMatch(/@media \(max-width: 1180px\)[\s\S]*?\.command-bar__nav/);
  });

  it("archive 3-col and tool-detail desktop gutter wait for chrome 1280", () => {
    expect(archiveCss).toMatch(
      /@media \(min-width: 1280px\) and \(max-width: 1439px\)[\s\S]*?\.ar4-grid__list \{[\s\S]*?1fr 1fr 1fr/,
    );
    expect(archiveCss).not.toMatch(
      /@media \(min-width: 1180px\) and \(max-width: 1439px\)/,
    );
    expect(toolCss).toMatch(
      /@media \(min-width: 1280px\)[\s\S]*?\.td-final-page \{[\s\S]*?--tv-gutter-desktop/,
    );
  });

  it("footer reserves --tv-bottom-nav-total through 1279 including utility and launchpad", () => {
    expect(shellCss).toMatch(
      /@media \(min-width: 48rem\) and \(max-width: 1279px\)[\s\S]*?\.site-footer-v2__shell \{[\s\S]*?--tv-bottom-nav-total/,
    );
    expect(shellCss).toMatch(
      /@media \(min-width: 48rem\) and \(max-width: 1279px\)[\s\S]*?\.site-footer-v2\.tv-utility[\s\S]*?--tv-bottom-nav-total/,
    );
    expect(shellCss).toMatch(
      /@media \(max-width: 1279px\)[\s\S]*?\.tv-launchpad \.site-footer-v2__shell[\s\S]*?--tv-bottom-nav-total/,
    );
  });

  it("radar labels wrap and compare H1 drops 22ch under mobile chrome", () => {
    expect(radarCss).toMatch(/\.tv-radar-node__label strong \{[\s\S]*?-webkit-line-clamp:\s*2/);
    expect(radarCss).not.toMatch(
      /\.tv-radar-node__label strong,[\s\S]*?\.tv-radar-node__label small \{[\s\S]*?white-space:\s*nowrap/,
    );
    expect(compareCss).toMatch(
      /@media \(max-width: 1279px\)[\s\S]*?\.tool-battle-page__intro h1 \{[\s\S]*?max-inline-size:\s*none/,
    );
  });

  it("route-marker labels wrap below chrome and guides chips keep a 44px target", () => {
    expect(publicRoutesCss).toMatch(
      /@media \(max-width: 79\.99rem\)[\s\S]*?\.route-marker__label \{[\s\S]*?white-space:\s*normal/,
    );
    expect(guidesCss).toMatch(/\.guides-filter__chip \{[\s\S]*?min-height:\s*2\.75rem/);
  });

  it("catalog icon toggles hit 44px on the actual button, not only the wrapper", () => {
    expect(archiveCss).toMatch(
      /\.ar4-card__toggles button \{[\s\S]*?min-width:\s*44px[\s\S]*?min-height:\s*44px/,
    );
  });

  it("ivory cascade remains a combined selector, not a responsive dark override", () => {
    expect(secondaryCss).toContain(".secondary-principle.secondary-card--ivory");
    expect(secondaryCss).not.toMatch(
      /@media[\s\S]*?\.secondary-principle\.secondary-card--ivory[\s\S]*?--tv-surface-raised/,
    );
  });
});
