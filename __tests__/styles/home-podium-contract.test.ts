import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

// Layout guards. Interaction and canonical-data coverage live in podium-geometry.test.tsx.

describe("home podium layout contract", () => {
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
