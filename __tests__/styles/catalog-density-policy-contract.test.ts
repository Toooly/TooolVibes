/* ═══════════════════════════════════════════════════════════════
   B38 / MOB-702 — Catalog density policy, static contract.

   Verifica deterministica (senza browser) dei vincoli strutturali:
   - regola CSS colonna singola scopata, senza !important, in coda e
   unlayered (specificity 0-2-0 > 0-1-0 delle regole legacy);
   - route archivio: band sponsor DOPO il catalogo con flag ON,
     posizione legacy preservata con flag OFF;
   - result list: variante applicata solo sotto flag;
   - sponsor slot: disclosure presente nel markup.
   ═══════════════════════════════════════════════════════════════ */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (relativePath: string) =>
  fs.readFileSync(path.join(root, relativePath), "utf8");

describe("B38 catalog density policy — CSS contract", () => {
  it("forces a single column below the mobile threshold, scoped and layered-safe", () => {
    const css = read("app/globals.css");
    const marker = "B38 — Catalog density policy";
    const markerIndex = css.indexOf(marker);
    expect(markerIndex).toBeGreaterThan(-1);

    /* Il blocco parte dall'apertura del commento che contiene il marker. */
    const start = css.lastIndexOf("/*", markerIndex);
    expect(start).toBeGreaterThan(-1);
    const nextMarkerIndex = css.indexOf("B40 / MOB-704", markerIndex);
    const nextSectionStart = css.lastIndexOf("/*", nextMarkerIndex);
    expect(nextSectionStart).toBeGreaterThan(start);
    const block = css.slice(start, nextSectionStart);

    /* Soglia mobile: una colonna sotto 768px (contract 320–430px). */
    expect(block).toContain("@media (max-width: 767.98px)");
    expect(block).toContain(
      ".mobile-tool-grid--density-list .mobile-tool-grid__list",
    );
    expect(block).toContain("grid-template-columns: minmax(0, 1fr)");

    /* Nessun !important nelle regole B38: la vittoria di cascade e'
       affidata alla specificity 0-2-0, reversibile rimuovendo il blocco. */
    const rulesOnly = block.replace(/\/\*[\s\S]*?\*\//g, "");
    expect(rulesOnly).not.toContain("!important");

    /* La sezione B38 resta isolata anche quando batch successivi vengono
       aggiunti in coda al foglio globale. */
    expect(block.slice(block.lastIndexOf("}") + 1).trim()).toBe("");
  });

  it("does not weaken the legacy two-column grid for other consumers", () => {
    const css = read("app/globals.css");
    /* Regola legacy a due colonne intatta: la variante B38 e' additiva. */
    expect(css).toContain("grid-template-columns: repeat(2, 1fr)");
    expect(css).toContain("grid-template-columns: repeat(2, minmax(0, 1fr))");
  });
});

describe("B38 catalog density policy — archivio route sponsor placement", () => {
  it("renders the sponsor band AFTER the organic catalog when the flag is ON", () => {
    const source = read("app/(marketing)/archivio/page.tsx");

    expect(source).toContain("isCatalogDensityPolicyEnabled");

    const catalogIndex = source.indexOf("<FloatingCatalogView");
    expect(catalogIndex).toBeGreaterThan(-1);

    /* Con flag ON la band segue il catalogo (ultimo occurrence). */
    const sponsorAfterCatalog = source.lastIndexOf(
      'placementKey="catalog-native-sponsor"',
    );
    expect(sponsorAfterCatalog).toBeGreaterThan(catalogIndex);

    /* La posizione legacy above-the-fold resta disponibile con flag OFF. */
    const legacySection = source.indexOf("!catalogDensityPolicy");
    expect(legacySection).toBeGreaterThan(-1);
    expect(legacySection).toBeLessThan(catalogIndex);
  });
});

describe("B38 catalog density policy — component wiring", () => {
  it("applies the density-list variant only under the route flag", () => {
    const source = read("components/directory/catalog/catalog-result-list.tsx");
    expect(source).toContain("isCatalogDensityPolicyEnabled");
    expect(source).toContain("mobile-tool-grid--density-list");
    expect(source).toContain('density="mobile-list"');
    /* Fallback legacy preservato nel branch OFF. */
    expect(source).toContain("MobileToolCard");
  });

  it("exposes the mobile-list density in the canonical card config", () => {
    const source = read("components/directory/canonical-tool-card.tsx");
    expect(source).toContain('"mobile-list"');
    expect(source).toContain('density === "mobile-list"');
  });

  it("declares the sponsor disclosure in the featured slot", () => {
    const source = read("components/directory/catalog/catalog-featured-rail.tsx");
    expect(source).toContain("Promosso");
    expect(source).toContain('data-sponsor-slot="catalog-featured"');
    expect(source).toContain("catalog-featured-rail__disclosure");
  });
});
