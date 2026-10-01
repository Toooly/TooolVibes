import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

/* Ultime dal catalogo final podium: canonical top-5, swipeable rail,
   rank-aware tap, decorative crown hidden from AT, calm reduced-motion. */

describe("home podium contract", () => {
  it("renders top-5 from the canonical tool list without inventing ranks", () => {
    const tsx = read("components/home/start-here.tsx");
    expect(tsx).toContain("tools.slice(0, 5)");
    expect(tsx).toContain("if (ranked.length < 3) return null");
    expect(tsx).not.toMatch(/VibeCode|WeWeb|CosmicJS|Mocha/);
  });

  it("orders the rail 02 / 01 / 03 / 04 / 05 with canonical links", () => {
    const tsx = read("components/home/start-here.tsx");
    expect(tsx).toContain("pos-first");
    expect(tsx).toContain("pos-fifth");
    expect(tsx).toContain("href={`/toools/${tool.slug}`}");
    expect(tsx).toContain('aria-label={`Posizione ${rank}: apri ${tool.name}`}');
    expect(tsx).toContain('aria-label="Classifica dei tool"');
  });

  it("keeps the crown decorative and the cards keyboard-reachable links", () => {
    const tsx = read("components/home/start-here.tsx");
    expect(tsx).toContain('className="def-podium__crown" aria-hidden="true"');
    const css = read("styles/definitive-home.css");
    expect(css).toContain(".def-podium__crown {");
    expect(css).toContain("pointer-events: none");
  });

  it("defines the rail as the intentional scroller with snap + tap grammar", () => {
    const css = read("styles/definitive-home.css");
    expect(css).toContain(".def-podium__rail {");
    expect(css).toContain("scroll-snap-type: x mandatory");
    expect(css).toContain(".def-podium__card:active {");
    expect(css).toContain(".def-podium__card.is-first:active {");
    expect(css).toContain("@keyframes tv-podium-rise");
  });

  it("calms the podium under prefers-reduced-motion (scroll still works)", () => {
    const css = read("styles/definitive-home.css");
    const tail = css.slice(css.lastIndexOf("@media (prefers-reduced-motion: reduce)"));
    expect(tail).toContain(".def-latest.is-celebrated .def-podium__cell,");
    expect(tail).toContain("animation: none");
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
