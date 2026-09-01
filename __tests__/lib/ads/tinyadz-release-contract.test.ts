import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "../../..");

function read(rel: string) {
  return readFileSync(path.join(root, rel), "utf8");
}

describe("TinyAdz release contract", () => {
  it("keeps the loader on marketing chrome", () => {
    const chrome = read("components/layout/marketing-chrome.tsx");
    expect(chrome).toContain("TinyAdzLoader");
    expect(chrome).toContain("<TinyAdzLoader");
  });

  it("keeps curated inline slots on intended surfaces", () => {
    expect(read("components/home/definitive-home.tsx")).toContain(
      'placement="home-editorial"',
    );
    expect(read("app/(marketing)/archivio/page.tsx")).toContain(
      'placement="archive-feed"',
    );
    expect(read("components/tool-detail-final/tool-detail-final-page.tsx")).toContain(
      'placement="tool-detail"',
    );
    expect(read("app/(marketing)/posts/[slug]/page.tsx")).toContain(
      'placement="article-body"',
    );
    expect(read("components/radar/radar-experience.tsx")).toContain(
      'placement="radar-feed"',
    );
  });

  it("keeps production TinyAdz enabled in wrangler public vars", () => {
    const wrangler = read("wrangler.jsonc");
    expect(wrangler).toMatch(/"NEXT_PUBLIC_TINYADZ_ENABLED":\s*"1"/);
    expect(wrangler).toMatch(/"NEXT_PUBLIC_TINYADZ_SITE_ID":\s*"[a-z0-9]{24}"/);
    expect(wrangler).toMatch(/"NEXT_PUBLIC_TINYADZ_TEST_MODE":\s*"0"/);
    expect(wrangler).not.toMatch(/NEXT_PUBLIC_TINYADZ_INLINE_WIDGET_ID/);
  });

  it("keeps the official TinyAdz v2 snippet", () => {
    const loader = read("components/ads/tinyadz-loader.tsx");
    expect(loader).toContain("https://cdn.apitiny.net/scripts/v2.0/main.js");
    expect(loader).toContain("data-site-id");
    expect(loader).toContain("data-test-mode");
    expect(loader).toContain('strategy="afterInteractive"');
    expect(loader).not.toContain("installTinyAdzConfigCapture");
    expect(loader).not.toContain("requestTinyAdzAd");
    const slot = read("components/ads/tinyadz-inline-slot.tsx");
    expect(slot).toContain('<div ta-ad-container="" />');
    expect(slot).not.toContain("scheduleTinyAdzInlineBind");
    const runtime = read("components/ads/tinyadz-runtime.ts");
    expect(runtime).not.toContain("NO_AD");
    expect(runtime).not.toContain("/api/gsc");
  });

  it("keeps the TinyAdz script origin in the CSP contract", () => {
    const headers = read("lib/security/browser-headers.ts");
    expect(headers).toContain("https://cdn.apitiny.net");
    expect(headers).toContain("TINYADZ_SCRIPT_ORIGIN");
  });

  it("stamps a release SHA on every Next build", () => {
    const pkg = JSON.parse(read("package.json")) as { scripts: Record<string, string> };
    expect(pkg.scripts.build).toBe("node scripts/next-release-build.mjs");
    const stamp = read("scripts/next-release-build.mjs");
    expect(stamp).toContain("WORKERS_CI_COMMIT_SHA");
    expect(stamp).toContain("TOOOLVIBES_RELEASE_SHA");
    expect(stamp).toContain("NEXT_PUBLIC_TINYADZ_ENABLED");
  });
});
