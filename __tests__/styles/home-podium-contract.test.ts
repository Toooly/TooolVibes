import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

/* Ultime dal catalogo final podium: canonical top-6, safe top-3 stage,
   static 04/05/06 continuation grid (no carousel), rank-aware tap,
   decorative crown/laurels/medals hidden from AT, calm reduced-motion. */

describe("home podium contract", () => {
  it("renders top-6 from the canonical tool list without inventing ranks", () => {
    const tsx = read("components/home/start-here.tsx");
    expect(tsx).toContain("tools.slice(0, 6)");
    expect(tsx).toContain("ranked.slice(3, 6)");
    expect(tsx).toContain("if (ranked.length < 3) return null");
    expect(tsx).not.toMatch(/VibeCode|WeWeb|CosmicJS|Mocha/);
  });

  it("separates the safe top-3 stage from the static 04/05/06 grid", () => {
    const tsx = read("components/home/start-here.tsx");
    expect(tsx).toContain("def-podium__stage");
    expect(tsx).toContain("def-podium__more");
    expect(tsx).not.toContain("def-podium__rail");
    expect(tsx).toContain("top3");
    expect(tsx).toContain("aria-label=\"Podio dei tool\"");
    expect(tsx).toContain("Posizioni 04");
    expect(tsx).toContain("href={`/toools/${tool.slug}`}");
    const css = read("styles/definitive-home.css");
    expect(css).toContain(".def-podium__stage {");
    expect(css).toContain(".def-podium__more {");
    expect(css).toContain("grid-template-areas: \"second first third\"");
  });

  it("keeps the crown decorative and the cards keyboard-reachable links", () => {
    const tsx = read("components/home/start-here.tsx");
    expect(tsx).toContain('className="def-podium__crown" aria-hidden="true"');
    const css = read("styles/definitive-home.css");
    expect(css).toContain(".def-podium__crown {");
    expect(css).toContain("pointer-events: none");
  });

  it("frames the winner with crown and laurels, both decorative", () => {
    const tsx = read("components/home/start-here.tsx");
    expect(tsx).toContain("def-podium__laurels");
    expect(tsx).toContain('className="def-podium__crown" aria-hidden="true"');
    const css = read("styles/definitive-home.css");
    expect(css).toContain(".def-podium__laurels {");
  });

  it("marks 02 silver and 03 bronze and loops laurels subtly", () => {
    const tsx = read("components/home/start-here.tsx");
    expect(tsx).toContain('medal="silver"');
    expect(tsx).toContain('medal="bronze"');
    const css = read("styles/definitive-home.css");
    expect(css).toContain(".def-podium__medal--silver");
    expect(css).toContain(".def-podium__medal--bronze");
    expect(css).toContain("@keyframes tv-laurel-sway");
    expect(css).toContain("@keyframes tv-rank-breathe");
    expect(css).toContain("@keyframes tv-medal-shimmer");
    expect(css).toContain(".def-podium__card:active {");
    expect(css).toContain(".def-podium__card.is-first:active {");
    expect(css).toContain("@keyframes tv-podium-rise");
  });

  it("calms the podium under prefers-reduced-motion (scroll still works)", () => {
    const css = read("styles/definitive-home.css");
    const tail = css.slice(css.lastIndexOf("@media (prefers-reduced-motion: reduce)"));
    expect(tail).toContain(".def-latest.is-celebrated .def-podium__stage .def-podium__cell,");
    expect(tail).toContain("animation: none");
  });

  it("keeps the top-3 stage viewport-safe (no bleed, no rail clipping)", () => {
    const css = read("styles/definitive-home.css");
    const stage = css.slice(css.indexOf(".def-podium__stage {"), css.indexOf(".def-podium__stage {") + 700);
    expect(stage).not.toContain("calc(-1");
    expect(stage).not.toContain("overflow-x");
    expect(css).toContain('grid-template-areas: "second first third"');
    const more = css.slice(css.indexOf(".def-podium__more {"), css.indexOf(".def-podium__more {") + 900);
    expect(more).not.toContain("calc(-1");
    expect(more).not.toContain("overflow-x");
    expect(more).not.toContain("scroll-snap");
  });

  it("never touches the segmented control", () => {
    const tsx = read("components/home/start-here.tsx");
    const podium = tsx.slice(tsx.indexOf("function LatestFromCatalog"));
    expect(podium).not.toMatch(/def-start-tab/);
    expect(podium).not.toMatch(/START_TABS/);
    const css = read("styles/definitive-home.css");
    expect(css).not.toMatch(/def-start__tabs::(before|after)/);
  });
});
