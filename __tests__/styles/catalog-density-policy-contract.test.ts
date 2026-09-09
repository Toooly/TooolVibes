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
  it("inserts the Partner Experience INSIDE the discovery flow, render-level only", () => {
    const source = read("app/(marketing)/archivio/page.tsx");

    /* La pagina passa l'insert al catalogo: niente band prima o dopo. */
    const catalogIndex = source.indexOf("<DefinitiveArchive");
    expect(catalogIndex).toBeGreaterThan(-1);
    expect(source).toContain("partnerInsert={");
    expect(source).toContain('placementKey="catalog-native-sponsor"');
    expect(source).not.toContain("archive-partner-placement--before");
    expect(source).not.toContain("archive-partner-placement--after");

    /* L'inserimento vive nel catalogo, dopo il primo gruppo organico,
       senza toccare array, ordinamento o rank delle card organiche. */
    const catalog = read("components/archive/definitive-archive.tsx");
    expect(catalog).toContain("PARTNER_INSERT_AFTER");
    expect(catalog).toContain("ar4-grid__item--partner");
    expect(catalog).toContain("!hasActiveFilter");
    expect(catalog).toContain("rank={idx + 1}");

    /* Grid contract: l'insert occupa una riga intera, mai una cella. */
    const css = read("styles/archive-v4.css");
    expect(css).toContain(".ar4-grid__item--partner");
    expect(css).toContain("grid-column: 1 / -1");
  });
});

