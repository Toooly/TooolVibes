import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const tokensCss = readFileSync(resolve(process.cwd(), "styles/tokens.css"), "utf8");
const secondaryCss = readFileSync(resolve(process.cwd(), "styles/secondary-pages.css"), "utf8");
const sponsorizzaCss = readFileSync(resolve(process.cwd(), "styles/sponsorizza.css"), "utf8");
const vibesCss = readFileSync(resolve(process.cwd(), "styles/vibes-3d-maestoso.css"), "utf8");

function extractBlock(source: string, selector: string): string | null {
  const selectorIndex = source.indexOf(selector);
  if (selectorIndex === -1) return null;
  const openIndex = source.indexOf("{", selectorIndex);
  if (openIndex === -1) return null;
  let depth = 0;
  for (let index = openIndex; index < source.length; index += 1) {
    const char = source[index];
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(openIndex + 1, index);
    }
  }
  return null;
}

describe("V3 institutional tokens", () => {
  it("espone la famiglia institutional charcoal/ivory", () => {
    expect(tokensCss).toContain("--tv-grammar-institutional-surface: var(--tv-color-surface-base)");
    expect(tokensCss).toContain("--tv-grammar-institutional-ivory: var(--tv-surface-inverted)");
    expect(tokensCss).toContain("--tv-grammar-institutional-accent: var(--tv-accent-brand)");
  });

  it("espone la famiglia resource come graphite caldo distinto dal commercial shell", () => {
    expect(tokensCss).toContain(
      "--tv-grammar-resource-surface: color-mix(in srgb, var(--tv-surface-inverted) 8%, var(--tv-color-surface-raised))",
    );
    expect(tokensCss).not.toContain(
      "--tv-grammar-resource-surface: var(--tv-grammar-commercial-shell)",
    );
    expect(tokensCss).toContain("--tv-grammar-resource-premium: var(--tv-accent-brand)");
  });
});

describe("V3 secondary / legal / shop", () => {
  it("H1 e titoli sezione usano UI, non Anton", () => {
    expect(extractBlock(secondaryCss, ".secondary-hero__title {")).toContain("var(--tv-font-ui)");
    expect(extractBlock(secondaryCss, ".secondary-section__title {")).toContain("var(--tv-font-ui)");
    expect(extractBlock(secondaryCss, ".legal-page__intro h1 {")).toContain("var(--tv-font-ui)");
    expect(extractBlock(secondaryCss, ".legal-page__intro h1 {")).not.toContain("uppercase");
  });

  it("CTA primario è activation yellow", () => {
    expect(extractBlock(secondaryCss, ".secondary-card__cta {")).toContain("var(--tv-button-activation-bg)");
    expect(extractBlock(secondaryCss, ".secondary-card__cta {")).not.toContain("var(--tv-accent-brand)");
  });

  it("legal nav selected è purple wash, non yellow", () => {
    const current = extractBlock(secondaryCss, '.legal-page__nav a[aria-current="page"] {');
    expect(current).toContain("var(--tv-grammar-selected-wash)");
    expect(current).not.toContain("var(--tv-button-activation-bg)");
  });

  it("asse mobile legale è il gutter canonico 20px", () => {
    expect(extractBlock(secondaryCss, ".legal-page {")).toContain("var(--tv-gutter-mobile)");
  });

  it("cyan radar non è decorazione institutional", () => {
    expect(secondaryCss).not.toContain("var(--tv-accent-cyan)");
  });

  it("shop inventory usa DATA, non display", () => {
    expect(extractBlock(secondaryCss, ".resource-inventory__value {")).toContain("var(--tv-font-data)");
  });
});

describe("V3 chi-siamo", () => {
  it("hero resta ivory istituzionale", () => {
    expect(extractBlock(vibesCss, ".v-about-hero {")).toContain("var(--tv-grammar-institutional-ivory)");
  });

  it("service objects non usano hex bianco", () => {
    expect(extractBlock(vibesCss, ".v-about-service-title {")).toContain("var(--tv-grammar-institutional-ink)");
    expect(extractBlock(vibesCss, ".v-about-service-title {")).not.toContain("#fff");
  });

  it("page outer axis è gutter canonico", () => {
    expect(extractBlock(vibesCss, ".v-about-page.page-shell {")).toContain("var(--tv-gutter-mobile)");
  });
});

describe("V3 sponsorizza commercial", () => {
  it("CTA primario hero e finale sono yellow", () => {
    expect(extractBlock(sponsorizzaCss, ".sponsorizza-hero__cta {")).toContain("var(--tv-button-activation-bg)");
    expect(extractBlock(sponsorizzaCss, ".sponsorizza-final-cta__email {")).toContain("var(--tv-button-activation-bg)");
  });

  it("asse page è gutter canonico", () => {
    expect(extractBlock(sponsorizzaCss, ".sponsorizza-page {")).toContain("var(--tv-gutter-mobile)");
  });
});
