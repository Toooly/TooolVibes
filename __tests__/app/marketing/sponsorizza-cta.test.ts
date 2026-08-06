import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

/**
 * /sponsorizza contact CTA contract.
 *
 * The sponsor page must route every information request to the same
 * canonical contact used across the product: hello@tooolvibes.com. That
 * address is the single source of truth in the navigation registry
 * (`lib/navigation/destinations.ts` -> contact-email) and is also used by
 * the Studio and Privacy pages. The test pins the page mailto to that
 * canonical value so a changed/drifted contact is detected immediately.
 */

const REPO = path.resolve(__dirname, "../../..");
const SPONSOR_PAGE = path.join(
  REPO,
  "app/(marketing)/sponsorizza/page.tsx",
);
const REGISTRY = path.join(REPO, "lib/navigation/destinations.ts");

function read(p: string): string {
  return readFileSync(p, "utf8");
}

function canonicalContact(): string {
  const registry = read(REGISTRY);
  const match = registry.match(/"contact-email"/);
  expect(match).not.toBeNull();
  const href = registry.match(/href: "mailto:([^"]+)"/);
  expect(href).not.toBeNull();
  return `mailto:${href?.[1]}`;
}

describe("/sponsorizza contact CTA", () => {
  it("routes the hero CTA to the canonical mailto contact", () => {
    const src = read(SPONSOR_PAGE);
    expect(src).toMatch(/const SPONSOR_EMAIL =/);
    expect(src).toContain(canonicalContact());
  });

  it("routes the final CTA mailto to the same canonical contact", () => {
    const src = read(SPONSOR_PAGE);
    expect(src).toMatch(/href="mailto:hello@tooolvibes\.com"/);
  });

  it("uses the exact active contact confirmed in Studio and Privacy pages", () => {
    const studio = read(path.join(REPO, "app/(marketing)/studio/page.tsx"));
    const privacy = read(path.join(REPO, "app/(marketing)/privacy/page.tsx"));

    expect(studio).toContain("mailto:hello@tooolvibes.com");
    expect(privacy).toContain("mailto:hello@tooolvibes.com");
    expect(read(SPONSOR_PAGE)).toContain("mailto:hello@tooolvibes.com");
  });
});
