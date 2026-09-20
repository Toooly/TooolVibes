import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

/**
 * Home metadata contract.
 *
 * The home <title> must not duplicate the brand: the root layout applies a
 * `%s | TooolVibes` template, so the page title itself must be the bare
 * promise ("Scegli il tuo stack") to produce the live title
 * "Scegli il tuo stack | TooolVibes".
 */
const REPO = path.resolve(__dirname, "../../..");
const HOME_PAGE = path.join(REPO, "app/(marketing)/page.tsx");
const ROOT_LAYOUT = path.join(REPO, "app/layout.tsx");

function read(p: string): string {
  return readFileSync(p, "utf8");
}

describe("Home metadata — no duplicate brand", () => {
  it("uses createPublicPageMetadata", () => {
    expect(read(HOME_PAGE)).toMatch(/createPublicPageMetadata\(/);
    expect(read(HOME_PAGE)).toMatch(/import .*createPublicPageMetadata/);
  });

  it("sets the bare title without a leading brand token", () => {
    const src = read(HOME_PAGE);
    expect(src).toMatch(/title: "Scegli il tool giusto. Ricorda perché."/);
    expect(src).not.toMatch(/title: "TooolVibes \|/);
    expect(src).not.toMatch(/title: "TooolVibes/);
  });

  it("keeps OG and Twitter titles brand-coherent", () => {
    const src = read(HOME_PAGE);
    expect(src).toMatch(/openGraphTitle: "TooolVibes · Il sistema decisionale per scegliere software con criterio"/);
  });

  it("root layout applies the %s | TooolVibes template exactly once", () => {
    const layout = read(ROOT_LAYOUT);
    expect(layout.match(/template: `%s \| \$\{siteConfig\.name\}`/g)).toHaveLength(1);
  });
});
