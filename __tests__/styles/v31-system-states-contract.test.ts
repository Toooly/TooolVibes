import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const shopPage = readFileSync(
  resolve(process.cwd(), "app/(marketing)/shop/page.tsx"),
  "utf8",
);
const secondaryCss = readFileSync(
  resolve(process.cwd(), "styles/secondary-pages.css"),
  "utf8",
);
const archiveSrc = readFileSync(
  resolve(process.cwd(), "components/archive/definitive-archive.tsx"),
  "utf8",
);
const archiveCss = readFileSync(resolve(process.cwd(), "styles/archive-v4.css"), "utf8");
const collectionsSrc = readFileSync(
  resolve(process.cwd(), "components/collections/collections-index.tsx"),
  "utf8",
);
const informationSrc = readFileSync(
  resolve(process.cwd(), "components/tool-detail-final/tool-detail-information.tsx"),
  "utf8",
);
const radarSrc = readFileSync(
  resolve(process.cwd(), "components/radar/radar-experience.tsx"),
  "utf8",
);
const radarCss = readFileSync(resolve(process.cwd(), "styles/radar.css"), "utf8");
const compareChrome = readFileSync(
  resolve(process.cwd(), "components/tools/compare-workbench-chrome.tsx"),
  "utf8",
);
const archiveCard = readFileSync(
  resolve(process.cwd(), "components/archive/archive-v4-tool-card.tsx"),
  "utf8",
);

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

describe("V3.1 system states — shop", () => {
  it("does not expose fake inventory metrics", () => {
    expect(shopPage).not.toContain("Non annunciato");
    expect(shopPage).not.toContain('value: "0"');
    expect(shopPage).not.toContain("Prodotti pubblicati");
    expect(shopPage).not.toContain("resource-inventory__row");
    expect(shopPage).not.toContain("resource-inventory__value");
    expect(shopPage).toContain("resource-inventory__stamp");
    expect(shopPage).toContain("In preparazione");
    expect(shopPage).toContain("Nessun prodotto, prezzo o checkout");
  });

  it("shop stamp is resource cloth with data mark", () => {
    const stamp = extractBlock(secondaryCss, ".resource-inventory__stamp {");
    const mark = extractBlock(secondaryCss, ".resource-inventory__stamp-mark {");
    expect(stamp).toContain("var(--tv-grammar-resource-surface)");
    expect(stamp).toContain("var(--tv-grammar-resource-edge)");
    expect(mark).toContain("var(--tv-font-data)");
    expect(mark).toContain("var(--tv-grammar-resource-premium)");
  });
});

describe("V3.1 system states — catalog empty", () => {
  it("has one recovery action that resets filters", () => {
    expect(archiveSrc).toContain("Reimposta i filtri");
    expect(archiveSrc).not.toContain("Mostra tutti i tool");
    expect(archiveSrc).toContain("ar4-grid__empty-cta--primary");
    expect(archiveSrc).not.toContain("ar4-grid__empty-cta--secondary");
    const actions = archiveSrc.slice(
      archiveSrc.indexOf("ar4-grid__empty-actions"),
      archiveSrc.indexOf("ar4-grid__empty-actions") + 700,
    );
    expect(actions).toContain("onClick={resetAll}");
    expect(actions.match(/<button/g)?.length).toBe(1);
  });

  it("empty surface uses resource grammar, not a generic dashed slab", () => {
    const lastEmpty = archiveCss.lastIndexOf(".ar4-grid__empty {");
    const block = extractBlock(archiveCss.slice(lastEmpty), ".ar4-grid__empty {");
    expect(block).toContain("var(--tv-grammar-resource-surface)");
    expect(block).toContain("var(--tv-grammar-resource-edge)");
    expect(block).not.toContain("dashed");
  });
});

describe("V3.1 system states — collections empty", () => {
  it("renders an intentional empty state instead of a blank page", () => {
    expect(collectionsSrc).toContain("cx-index__empty");
    expect(collectionsSrc).toContain("Nessuna raccolta disponibile.");
    expect(collectionsSrc).toContain('href="/archivio"');
    expect(collectionsSrc).not.toMatch(/if \(collections\.length === 0\) \{\s*return null;/);
  });
});

describe("V3.1 system states — tool partial data", () => {
  it("omits unavailable technical rows instead of placeholder copy", () => {
    expect(informationSrc).toContain("hasToolDetailInformation");
    expect(informationSrc).not.toContain("Non specificato");
    expect(informationSrc).not.toContain("Nessun tag associato");
    expect(informationSrc).not.toContain("Data non disponibile");
    expect(informationSrc).not.toContain("Non disponibile");
  });
});

describe("V3.1 system states — preserved references", () => {
  it("radar keeps live/empty/stale/error/refreshing signal states", () => {
    expect(radarSrc).toContain('data-state={model.state}');
    expect(radarCss).toContain("[data-refreshing");
    expect(radarCss).toContain('data-state="live"');
    expect(radarCss).toContain('data-variant="stale"');
  });

  it("catalog saved remains a data-saved memory mark", () => {
    expect(archiveCard).toContain("data-saved");
  });

  it("compare zero-candidate copy stays explicit without a fake matrix", () => {
    expect(compareChrome).toContain("Servono due strumenti.");
    expect(compareChrome).toContain("data-compare-workbench-state=\"empty\"");
    expect(compareChrome).toContain("Serve ancora uno strumento per confrontare.");
  });
});
