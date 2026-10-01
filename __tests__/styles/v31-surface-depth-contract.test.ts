import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const tokensCss = readFileSync(resolve(process.cwd(), "styles/tokens.css"), "utf8");
const secondaryCss = readFileSync(
  resolve(process.cwd(), "styles/secondary-pages.css"),
  "utf8",
);
const archiveCss = readFileSync(resolve(process.cwd(), "styles/archive-v4.css"), "utf8");
const toolCss = readFileSync(resolve(process.cwd(), "styles/tool-detail-final.css"), "utf8");
const radarCss = readFileSync(resolve(process.cwd(), "styles/radar.css"), "utf8");
const homeCss = readFileSync(resolve(process.cwd(), "styles/definitive-home.css"), "utf8");
const accountCss = readFileSync(
  resolve(process.cwd(), "app/(marketing)/account/account.css"),
  "utf8",
);
const shortlistCss = readFileSync(
  resolve(process.cwd(), "app/(marketing)/shortlist/shortlist.css"),
  "utf8",
);
const sponsorizzaCss = readFileSync(
  resolve(process.cwd(), "styles/sponsorizza.css"),
  "utf8",
);
const memberCss = readFileSync(
  resolve(process.cwd(), "styles/member-experience.css"),
  "utf8",
);
const motionCss = readFileSync(
  resolve(process.cwd(), "styles/premium-motion.css"),
  "utf8",
);
const globalsCss = readFileSync(resolve(process.cwd(), "app/globals.css"), "utf8");

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

describe("V3.1 ivory cascade", () => {
  it("ivory principle beats later .secondary-principle and shop resource hammer", () => {
    const ivory = extractBlock(
      secondaryCss,
      ".secondary-principle.secondary-card--ivory {",
    );
    expect(ivory).toContain("var(--tv-grammar-institutional-ivory)");
    expect(ivory).toContain("var(--tv-ink-inverted-primary)");
    expect(ivory).not.toContain("var(--tv-surface-raised)");

    const shopDark = extractBlock(
      secondaryCss,
      ".resource-page .secondary-principle:not(.secondary-card--ivory) {",
    );
    expect(shopDark).toContain("var(--tv-grammar-resource-surface)");

    const shopIvory = extractBlock(
      secondaryCss,
      ".resource-page .secondary-principle.secondary-card--ivory {",
    );
    expect(shopIvory).toContain("var(--tv-grammar-institutional-ivory)");
  });
});

describe("V3.1 family surfaces", () => {
  it("resource catalog is not signal or workflow", () => {
    const card = extractBlock(archiveCss, ".ar4-card {\n  position: relative");
    expect(card).toContain("var(--tv-grammar-resource-surface)");
    expect(card).not.toContain("var(--tv-grammar-signal-surface)");
    expect(card).not.toContain("var(--tv-grammar-workflow-surface)");
  });

  it("signal status and instrument use SIGNAL tokens, not generic raised hairline only", () => {
    expect(extractBlock(radarCss, ".tv-radar-status-bar {")).toContain(
      "var(--tv-grammar-signal-surface-raised)",
    );
    expect(extractBlock(radarCss, ".tv-radar-status-bar {")).toContain(
      "var(--tv-grammar-signal-trace)",
    );
    expect(extractBlock(radarCss, ".tv-radar-instrument {")).toContain(
      "var(--tv-grammar-signal-border)",
    );
    expect(extractBlock(radarCss, ".tv-radar-instrument {")).toContain(
      "var(--tv-grammar-signal-surface)",
    );
  });

  it("personal auth and space cards use PERSONAL tokens, not activation gold", () => {
    const auth = extractBlock(accountCss, ".v-auth-card {");
    expect(auth).toContain("var(--tv-grammar-personal-surface)");
    expect(auth).toContain("var(--tv-grammar-personal-remembered-edge)");
    expect(auth).not.toContain("var(--tv-activation-surface)");
    expect(extractBlock(accountCss, ".tv-space-card {")).toContain(
      "var(--tv-grammar-personal-surface)",
    );
  });

  it("editorial decision nav is a light orientation rail; podium keeps dark cloth + brass rail", () => {
    const nav = extractBlock(toolCss, ".td-final-decision-nav {");
    expect(nav).toContain("border-top: 1px solid var(--tv-border-subtle)");
    expect(nav).toContain("background: transparent");
    expect(nav).not.toContain("var(--tv-grammar-editorial-surface-dark)");
    const pod = extractBlock(homeCss, ".def-editorial__pod-card {");
    expect(pod).toContain("var(--tv-grammar-editorial-surface-dark)");
    expect(extractBlock(homeCss, ".def-editorial__pod-card--rank-1 {")).not.toContain(
      "border: 1px solid var(--tv-accent-gold)",
    );
  });

  it("institutional method steps stay quieter than workflow", () => {
    const step = extractBlock(secondaryCss, ".method-track__step {");
    expect(step).toContain("var(--tv-grammar-institutional-wash)");
    expect(step).not.toContain("var(--tv-grammar-workflow-surface)");
    expect(step).not.toContain("var(--tv-accent-cyan)");
  });

  it("commercial format cards drop brand wash and extra hover lift", () => {
    const card = extractBlock(sponsorizzaCss, ".sponsorizza-format-card {");
    expect(card).toContain("var(--tv-grammar-commercial-surface)");
    expect(card).not.toContain("var(--tv-accent-brand)");
    const hover = extractBlock(
      sponsorizzaCss,
      ".sponsorizza-format-card:hover,\n.sponsorizza-format-card:focus-within {",
    );
    expect(hover).not.toContain("translate");
  });
});

describe("V3.1 route-guide and overlay", () => {
  it("removes the V1 purple route-guide hex", () => {
    expect(memberCss).not.toContain("#1a1238");
    expect(memberCss).not.toContain("tv-route-guide");
  });

  it("normalizes shadcn card/popover to canonical cloth", () => {
    expect(tokensCss).toContain("--card: var(--tv-surface-raised)");
    expect(tokensCss).toContain("--popover: var(--tv-surface-floating)");
    expect(globalsCss).toContain("--card: var(--tv-surface-raised)");
    expect(globalsCss).toContain("--popover: var(--tv-surface-floating)");
    expect(globalsCss).not.toContain("--card: oklch(0.205 0 0)");
  });
});

describe("V3.1 laws", () => {
  it("does not add new family hex outside tokens", () => {
    expect(memberCss).not.toMatch(/#[0-9A-Fa-f]{3,8}/);
    expect(shortlistCss.includes("#2a1f55")).toBe(false);
    expect(accountCss.includes("#2a1f55")).toBe(false);
  });

  it("yellow CTA law is unchanged", () => {
    expect(tokensCss).toContain("--tv-grammar-activation: var(--tv-activation-strong)");
    expect(secondaryCss).toContain("var(--tv-button-activation-bg)");
  });

  it("shared card lift is no longer a cloned jump", () => {
    expect(motionCss).not.toContain("translate3d(0, -0.28rem, 0)");
    expect(archiveCss).not.toContain("translateY(-2px)");
  });
});
