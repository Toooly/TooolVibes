import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import postcss, { type Rule } from "postcss";
import { describe, expect, it } from "vitest";

function mediaQueries(rule: Rule) {
  const queries: string[] = [];
  let parent = rule.parent;
  while (parent) {
    if (parent.type === "atrule" && parent.name === "media") queries.push(parent.params);
    parent = parent.parent;
  }
  return queries.join(" ");
}

describe.each(["services-site", "projects-site"])("%s visual interaction polish", (site) => {
  const css = readFileSync(resolve(process.cwd(), site, "public/styles.css"), "utf8");
  const html = readFileSync(resolve(process.cwd(), site, "public/index.html"), "utf8");
  const app = readFileSync(resolve(process.cwd(), site, "public/app.js"), "utf8");
  const stylesheet = postcss.parse(css);

  it("limits every hover style to a fine pointer that actually supports hover", () => {
    const unguarded: string[] = [];
    stylesheet.walkRules((rule) => {
      if (!rule.selector.includes(":hover")) return;
      const media = mediaQueries(rule);
      if (!media.includes("(hover: hover)") || !media.includes("(pointer: fine)")) {
        unguarded.push(rule.selector);
      }
    });
    expect(unguarded).toEqual([]);
  });

  it("retains keyboard feedback independently of pointer capabilities", () => {
    for (const selector of [
      ".button:focus-visible:not(:disabled)",
      ".journey__choices button:focus-visible",
      ".journey__link:focus-visible svg",
      ".journey__window:focus-visible",
      ".journey__continue:focus-visible svg",
      ".service-capacity:focus-visible",
      ".contact-steps button:focus-visible > span",
      ".contact-back:focus-visible",
      ".availability-notice__close:focus-visible",
      ".menu-toggle:focus-visible",
    ]) {
      const accessible = stylesheet.nodes.some((node) => node.type === "rule" && node.selector === selector);
      expect(accessible, selector).toBe(true);
    }
  });

  it("preserves touch press feedback without a persistent hover-dependent countdown state", () => {
    expect(css).toContain(".button:active:not(:disabled) { transform: translateY(0) scale(.985);");
    expect(css).toContain(".journey__choices button:active { transform: scale(.98);");
    expect(css).toContain(".service-capacity.is-in-view:not(:focus-visible):not(:active) { animation: var(--capacity-spectrum),capacity-breathe");
    expect(css).not.toContain(".service-capacity.is-in-view:not(:hover)");
  });

  it("keeps the interaction sheen behind the reduced-motion preference", () => {
    let checked = 0;
    stylesheet.walkRules((rule) => {
      if (!rule.nodes.some((node) => node.type === "decl" && node.prop === "animation" && node.value.startsWith("control-sheen"))) return;
      expect(mediaQueries(rule)).toContain("(prefers-reduced-motion: no-preference)");
      checked += 1;
    });
    expect(checked).toBe(2);
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain("transition-duration: .01ms !important");
  });

  it("reveals each service artwork once instead of compounding nested translations", () => {
    const figures = [...html.matchAll(/<figure class="service-visual [^>]+>/g)];
    expect(figures).toHaveLength(3);
    figures.forEach(([tag]) => expect(tag).not.toContain("data-reveal"));
    expect(html.match(/class="section-copy" data-reveal/g)).toHaveLength(3);
  });

  it("starts benefit motion at the benefit list and keeps each icon attached to its label", () => {
    expect(app).toContain('querySelectorAll(".service-benefits").forEach((element) => sceneObserver.observe(element))');
    expect(css).toContain(".service-benefits.is-in-view li { animation: detail-arrive");
    expect(css).not.toMatch(/\.service(?:\.is-in-view)? \.service-benefits svg \{ animation/);
    expect(css).not.toContain(".service.is-in-view .service-benefits li");
    expect(css).toContain('.service-capacity[data-available="request"] { --capacity-accent: var(--service-accent); }');
  });

  it("keeps the new ambient accents finite and motion-preference gated", () => {
    let accents = 0;
    stylesheet.walkRules((rule) => {
      if (!rule.nodes.some((node) => node.type === "decl" && node.prop === "animation" && /^(detail-edge|scene-orbit-settle)/.test(node.value))) return;
      expect(mediaQueries(rule)).toContain("(prefers-reduced-motion: no-preference)");
      expect(rule.toString()).not.toContain("infinite");
      accents++;
    });
    expect(accents).toBe(2);
  });
});
