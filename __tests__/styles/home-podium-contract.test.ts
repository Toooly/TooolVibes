import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

/* Ultime dal catalogo final podium: canonical top-6, safe top-3 stage,
   static 04/05/06 continuation grid (no carousel), rank-aware tap,
   decorative crown/laurels/medals hidden from AT, calm reduced-motion. */

describe("home podium contract", () => {
  it("renders top-9 from the canonical tool list without inventing ranks", () => {
    const tsx = read("components/home/start-here.tsx");
    expect(tsx).toContain("tools.slice(0, 9)");
    expect(tsx).toContain("ranked.slice(3, 9)");
    expect(tsx).toContain("if (ranked.length < 3) return null");
    expect(tsx).not.toMatch(/VibeCode|WeWeb|CosmicJS|Mocha/);
  });

  it("keeps 04-09 tool names fully readable with no truncation at all", () => {
    const css = read("styles/definitive-home.css");
    const compactName = css.slice(css.indexOf(".def-podium__card.is-compact .def-podium__name"), css.indexOf(".def-podium__card.is-compact .def-podium__name") + 400);
    expect(compactName).not.toContain("text-overflow: ellipsis");
    expect(compactName).not.toContain("white-space: nowrap");
    expect(compactName).not.toContain("-webkit-line-clamp");
    expect(compactName).not.toContain("-webkit-box-orient");
    expect(compactName).toContain("overflow-wrap: anywhere");
  });

  it("uses intrinsic height for compact cards, not fixed height", () => {
    const css = read("styles/definitive-home.css");
    const compactCard = css.slice(css.indexOf(".def-podium__card.is-compact {"), css.indexOf(".def-podium__card.is-compact {") + 500);
    expect(compactCard).toContain("height: auto");
    expect(compactCard).toContain("min-height: 72px");
    expect(compactCard).not.toContain("height: 80px");
    expect(compactCard).not.toContain("height: 64px");
  });

  it("renders 04-09 in a continuation rail with canonical links", () => {
    const tsx = read("components/home/start-here.tsx");
    expect(tsx).toContain("tools.slice(0, 9)");
    expect(tsx).toContain("ranked.slice(3, 9)");
    expect(tsx).toContain("def-podium__rail");
  });

  it("separates the safe top-3 stage from the static 04/05/06 grid", () => {
    const tsx = read("components/home/start-here.tsx");
    expect(tsx).toContain("def-podium__stage");
    expect(tsx).toContain("def-podium__rail");
    expect(tsx).not.toContain("def-podium__more");
    expect(tsx).toContain("top3");
    expect(tsx).toContain("aria-label=\"Podio dei tool\"");
    expect(tsx).toContain("Posizioni 04");
    expect(tsx).toContain("href={`/toools/${tool.slug}`}");
    const css = read("styles/definitive-home.css");
    expect(css).toContain(".def-podium__stage {");
    expect(css).toContain(".def-podium__rail {");
    expect(css).toContain("grid-template-areas: \"second first third\"");
  });

  it("places rank/crown/medal/laurels in a reserved in-flow badge row above the card", () => {
    const tsx = read("components/home/start-here.tsx");
    expect(tsx).toContain("def-podium__badge");
    expect(tsx).toContain("def-podium__badge--gold");
    const css = read("styles/definitive-home.css");
    expect(css).toContain(".def-podium__badge {");
    expect(css).toContain("min-height: 64px");
    expect(css).not.toContain("top: -28px");
    expect(css).not.toContain("top: -4px");
  });

  it("keeps the crown decorative and the cards keyboard-reachable links", () => {
    const tsx = read("components/home/start-here.tsx");
    expect(tsx).toContain('className="def-podium__badge');
    expect(tsx).toContain('aria-hidden="true"');
    const css = read("styles/definitive-home.css");
    expect(css).toContain(".def-podium__crown {");
    expect(css).toContain("pointer-events: none");
  });

  it("frames the winner with crown and laurels, both decorative", () => {
    const tsx = read("components/home/start-here.tsx");
    expect(tsx).toContain("def-podium__laurels");
    expect(tsx).toContain('className="def-podium__badge def-podium__badge--gold" aria-hidden="true"');
    const css = read("styles/definitive-home.css");
    expect(css).toContain(".def-podium__laurels {");
  });

  it("gives 02/03 metal-matched laurel decoration subordinate to 01", () => {
    const tsx = read("components/home/start-here.tsx");
    expect(tsx).toContain('laurel="silver"');
    expect(tsx).toContain('laurel="bronze"');
    expect(tsx).toContain("RankLaurels");
    const css = read("styles/definitive-home.css");
    expect(css).toContain(".def-podium__laurels--silver");
    expect(css).toContain(".def-podium__laurels--bronze");
    expect(css).toContain(".def-podium__laurels--gold");
    expect(css).toContain(".def-podium__cell.pos-second .def-podium__rank");
    expect(css).toContain(".def-podium__cell.pos-third .def-podium__rank");
  });

  it("resets selection on outside click/tap", () => {
    const tsx = read("components/home/start-here.tsx");
    expect(tsx).toContain("mousedown");
    expect(tsx).toContain("touchstart");
    expect(tsx).toContain("setSelectedPos(null)");
  });

  it("implements two-tap select-then-navigate depth interaction", () => {
    const tsx = read("components/home/start-here.tsx");
    expect(tsx).toContain("selectedPos");
    expect(tsx).toContain("handleCellClick");
    expect(tsx).toContain("has-focus-");
    expect(tsx).toContain("onClick");
    expect(tsx).toContain("data-selected");
    expect(tsx).not.toContain("aria-pressed");
    /* No ranking reorder: visual order stays 02/01/03 in source. */
    const stage = tsx.slice(tsx.indexOf("def-podium__stage"), tsx.indexOf("def-podium__rail"));
    expect(stage.indexOf("pos-second")).toBeLessThan(stage.indexOf("pos-first"));
    expect(stage.indexOf("pos-first")).toBeLessThan(stage.indexOf("pos-third"));
    const css = read("styles/definitive-home.css");
    expect(css).not.toContain("perspective: 1100px");
    expect(css).not.toContain("preserve-3d");
    expect(css).toContain(".def-podium__stage.has-focus-second .def-podium__cell.pos-second");
    expect(css).toContain(".def-podium__stage.has-focus-first .def-podium__cell.pos-first");
    expect(css).toContain(".def-podium__stage.has-focus-third .def-podium__cell.pos-third");
    expect(css).toContain(".def-podium__card.is-selected");
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
    expect(tail).toContain(".def-podium__stage.has-focus-second .def-podium__cell.pos-second,");
  });

  it("keeps selected side cards >=2px inside mobile bounds (inward translate)", () => {
    const css = read("styles/definitive-home.css");
    expect(css).toContain("translateX(5px) scale(1.14)");
    expect(css).toContain("translateX(-5px) scale(1.14)");
    expect(css).not.toContain("translateX(3px) scale(1.05)");
    expect(css).not.toContain("translateX(-3px) scale(1.05)");
  });

  it("keeps keyboard navigation native (no two-step for keyboard users)", () => {
    const tsx = read("components/home/start-here.tsx");
    // handleCellClick only preventDefault when selecting (first tap), not when already selected
    expect(tsx).toContain("if (selectedPos !== pos)");
    expect(tsx).toContain("e.preventDefault()");
    // When already selected, Link navigates naturally (no preventDefault)
    const handler = tsx.slice(tsx.indexOf("handleCellClick"), tsx.indexOf("handleCellClick") + 300);
    expect(handler).not.toContain("window.location");
  });

  it("keeps the top-3 stage viewport-safe (no bleed, no rail clipping)", () => {
    const css = read("styles/definitive-home.css");
    const stage = css.slice(css.indexOf(".def-podium__stage {"), css.indexOf(".def-podium__stage {") + 700);
    expect(stage).not.toContain("calc(-1");
    expect(stage).not.toContain("overflow-x");
    expect(css).toContain('grid-template-areas: "second first third"');
    const more = css.slice(css.indexOf(".def-podium__rail {"), css.indexOf(".def-podium__rail {") + 900);
    expect(more).not.toContain("calc(-1");
    expect(more).toContain("overflow-x: auto");
    expect(more).toContain("scroll-snap-type: x mandatory");
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
