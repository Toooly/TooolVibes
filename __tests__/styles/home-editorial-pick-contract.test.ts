import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

/* Scelta della redazione: featured/winner treatment stays scoped,
   data-driven, decorative-only, and calm under reduced motion. */

describe("home editorial pick contract", () => {
  it("renders the pick from the dynamic featured tool (no hardcoded identity)", () => {
    const tsx = read("components/home/start-here.tsx");
    expect(tsx).toContain("Scelta della redazione");
    expect(tsx).toContain("focusTool.name");
    expect(tsx).toContain("data-spotlight={focusTool.slug}");
    expect(tsx).not.toMatch(/blink|Blink/i);
  });

  it("keeps the celebration layer decorative and click-transparent", () => {
    const tsx = read("components/home/start-here.tsx");
    expect(tsx).toContain('className="tv-featured-tool__sparks"');
    expect(tsx).toContain('aria-hidden="true"');
    const css = read("styles/definitive-home.css");
    expect(css).toContain(".tv-featured-tool__sparks {");
    expect(css).toContain("pointer-events: none");
  });

  it("scopes all featured keyframes to the tv-spot namespace", () => {
    const css = read("styles/definitive-home.css");
    const names = [...css.matchAll(/@keyframes\s+([\w-]+)/g)].map((m) => m[1]);
    const spot = names.filter((n) => n.startsWith("tv-spot-"));
    expect(spot).toContain("tv-spot-bar-sweep");
    expect(spot).toContain("tv-spot-aura");
    expect(spot).toContain("tv-spot-spark-rise");
    for (const n of spot) {
      const uses = [...css.matchAll(new RegExp(`animation:\\s*${n}\\b`, "g"))];
      expect(uses.length, `${n} must be referenced`).toBeGreaterThan(0);
    }
  });

  it("runs the three effects on one shared ambient clock", () => {
    const css = read("styles/definitive-home.css");
    expect(css).toContain("--tv-spot-cycle: 12s");
    expect(css).toContain("--tv-meteor-cycle: 8.5s");
    expect(css).toContain("@keyframes tv-meteor-orbit");
    expect(css).toContain(".tv-featured-tool__meteor {");
    expect(css).toContain("animation: tv-spot-bar-sweep var(--tv-spot-cycle)");
    expect(css).toContain("animation: tv-spot-aura var(--tv-spot-cycle)");
    expect(css).toContain("animation: tv-spot-spark-rise var(--tv-spot-cycle)");
  });

  it("disables all featured motion under prefers-reduced-motion", () => {
    const css = read("styles/definitive-home.css");
    const block = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"));
    expect(block).toContain(".tv-featured-tool .def-editorial__spot-eyebrow::after");
    expect(block).toContain(".tv-featured-tool__sparks");
    expect(block).toContain(".tv-featured-tool .def-editorial__spot-avatar::before");
    expect(block).toContain("animation: none");
  });

  it("explains the pick with grounded micro reasons (no invented claims)", () => {
    const tsx = read("components/home/start-here.tsx");
    expect(tsx).toContain("editorialReasonsFor(focusTool)");
    expect(tsx).toContain("tv-featured-tool__reasons");
    expect(tsx).toContain("reasons.slice(0, 3)");
    expect(tsx).not.toMatch(/blink|vibecode|weweb|cosmic|mocha/i);
    /* No synthesized benefit claims may exist in the helper. */
    const helper = tsx.slice(tsx.indexOf("function editorialReasonsFor"), tsx.indexOf("const START_TABS"));
    expect(helper).not.toMatch(/Risultato in poche ore|Facile anche da zero|Output di qualità/);
    expect(helper).toContain("tool.tags");
    expect(helper).toContain("tool.useCases");
    expect(helper).toContain("tool.levelLabel");
    const css = read("styles/definitive-home.css");
    expect(css).toContain(".tv-featured-tool__reasons {");
    expect(css).toContain(".tv-featured-tool__reasons li {");
  });

  it("never touches the segmented control contract", () => {
    const css = read("styles/definitive-home.css");
    expect(css).not.toMatch(/def-start__tabs::(before|after)/);
  });

  it("keeps the featured flow vertically sequenced: card, CTA row, podium", () => {
    const tsx = read("components/home/start-here.tsx");
    const card = tsx.indexOf('className="def-editorial__spotlight tv-featured-tool"');
    const row = tsx.indexOf("tv-featured-tool__cta-row");
    const podium = tsx.indexOf("<LatestFromCatalog tools={tools} />");
    expect(card).toBeGreaterThan(-1);
    expect(row).toBeGreaterThan(card);
    expect(podium).toBeGreaterThan(row);
    expect(tsx).toContain("Apri {focusTool.name}");
    const css = read("styles/definitive-home.css");
    expect(css).toContain(".def-editorial__inner > .tv-featured-tool,");
    expect(css).toContain(".tv-featured-tool__cta-row {");
  });

  it("rebuilds the catalog block as a ranked podium", () => {
    const tsx = read("components/home/start-here.tsx");
    expect(tsx).toContain("def-podium__rank");
    expect(tsx).toContain("def-podium__cell");
    expect(tsx).toContain("Ultime dal catalogo");
    const css = read("styles/definitive-home.css");
    expect(css).toContain(".def-podium__card {");
    expect(css).toContain("@keyframes tv-podium-rise");
    expect(css).toContain("@keyframes tv-podium-glow");
  });
});
