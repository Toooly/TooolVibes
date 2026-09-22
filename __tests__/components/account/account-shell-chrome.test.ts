import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(
  resolve(process.cwd(), "app/(marketing)/account/account.css"),
  "utf8",
);
const maestoso = readFileSync(
  resolve(process.cwd(), "styles/vibes-3d-maestoso.css"),
  "utf8",
);

function authPageRuleBodies(source: string) {
  const bodies: string[] = [];
  let from = 0;
  while (from < source.length) {
    const selectorIndex = source.indexOf(".v-auth-page {", from);
    if (selectorIndex === -1) break;
    const before = selectorIndex > 0 ? source[selectorIndex - 1] : "";
    if (before && /[\w-]/.test(before)) {
      from = selectorIndex + 1;
      continue;
    }
    const openIndex = source.indexOf("{", selectorIndex);
    const end = source.indexOf("}", openIndex);
    if (openIndex === -1 || end === -1) break;
    bodies.push(source.slice(openIndex + 1, end));
    from = end + 1;
  }
  return bodies;
}

describe("authenticated account shell", () => {
  it("does not hide the canonical product chrome", () => {
    expect(css).not.toMatch(/data-account-surface\] \.command-bar/);
    expect(css).not.toMatch(/data-account-surface\] \.mobile-top-bar/);
    expect(css).not.toMatch(/data-account-surface\] \.mobile-bottom-nav/);
  });

  it("keeps auth page clear of the public bottom nav", () => {
    expect(css).toMatch(/--tv-auth-page-pad-bottom/);
    expect(css).toMatch(/--tv-auth-page-pad-bottom:\s*2rem/);
    expect(css).not.toMatch(/--tv-auth-page-pad-bottom:[^;]*--tv-bottom-nav-total/);
    const authPage = css.slice(
      css.indexOf(".v-auth-page {"),
      css.indexOf(".v-auth-container--split"),
    );
    expect(authPage).toMatch(/min-height:\s*auto/);
    expect(authPage).not.toMatch(/min-height:\s*100dvh/);
  });

  it("does not let maestoso reset auth page min-height or padding", () => {
    const bodies = authPageRuleBodies(maestoso);
    expect(bodies.length).toBeGreaterThan(0);
    for (const body of bodies) {
      expect(body).not.toMatch(/min-height:\s*[^;]*100dvh/);
      expect(body).not.toMatch(/min-height:\s*[^;]*100vh/);
      expect(body).not.toMatch(/padding\s*:/);
    }
  });
});
