import { describe, expect, it } from "vitest";

import {
  buildBrowserSecurityHeaders,
  getStrictTransportSecurityValue,
  securityHeaderRoutePattern,
} from "@/lib/security/browser-headers";

function asHeaderMap(environment: Parameters<typeof buildBrowserSecurityHeaders>[0]) {
  return new Map(
    buildBrowserSecurityHeaders(environment).map(({ key, value }) => [
      key,
      value,
    ]),
  );
}

describe("browser security header policy", () => {
  it("applies one policy to public, admin and auth routes", () => {
    expect(securityHeaderRoutePattern).toBe("/:path*");
  });

  it("starts CSP in report-only mode and blocks embedding", () => {
    const headers = asHeaderMap({
      nodeEnv: "production",
      supabaseUrl: "https://project.supabase.co",
    });
    const csp = headers.get("Content-Security-Policy-Report-Only");

    expect(csp).toContain("default-src 'self'");
    expect(csp).not.toContain("frame-ancestors");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("report-uri /api/security/csp-report");
    expect(csp).toContain("report-to csp-endpoint");
    expect(headers.get("Content-Security-Policy")).toBe(
      "frame-ancestors 'none'",
    );
    expect(headers.get("X-Frame-Options")).toBe("DENY");
  });

  it("allows the current Next, Supabase, image, font and 3D runtime needs", () => {
    const headers = asHeaderMap({
      nodeEnv: "production",
      supabaseUrl: "https://project.supabase.co",
    });
    const csp = headers.get("Content-Security-Policy-Report-Only");

    expect(csp).toContain("script-src 'self' 'unsafe-inline'");
    expect(csp).not.toContain("'unsafe-eval'");
    expect(csp).toContain("style-src 'self' 'unsafe-inline'");
    expect(csp).toContain("font-src 'self' data:");
    expect(csp).toContain("img-src 'self' data: blob:");
    expect(csp).toContain("https://images.unsplash.com");
    expect(csp).toContain("https://www.google.com");
    expect(csp).toContain(
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://project.supabase.co",
    );
    expect(csp).toContain("worker-src 'self' blob:");
    expect(csp).toContain("https://challenges.cloudflare.com");
    expect(csp).toContain(
      "frame-src https://challenges.cloudflare.com",
    );
  });

  it("allows the exact TinyAdz script origin only where required", () => {
    const headers = asHeaderMap({
      nodeEnv: "production",
      supabaseUrl: "https://project.supabase.co",
    });
    const csp = headers.get("Content-Security-Policy-Report-Only");

    const cspValue = csp ?? "";

    // script-src: the publisher loader itself.
    expect(cspValue).toContain("script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://cdn.apitiny.net");
    // img-src: ad creatives.
    expect(cspValue).toContain("https://cdn.apitiny.net");
    // connect-src: reporting/auction calls.
    expect(cspValue).toContain("connect-src 'self' https://*.supabase.co wss://*.supabase.co https://project.supabase.co https://challenges.cloudflare.com https://cdn.apitiny.net");
    // frame-src: iframe-rendered placements.
    expect(cspValue).toContain("frame-src https://challenges.cloudflare.com https://cdn.apitiny.net");

    // The exact origin only — never a wildcard or a bare https: source token.
    const tinyAdzMatches = cspValue.match(/https:\/\/cdn\.apitiny\.net/g) ?? [];
    expect(tinyAdzMatches.length).toBeGreaterThanOrEqual(4);
    expect(cspValue).not.toContain("*.apitiny.net");
    // A bare `https:` source would allow any https origin; ensure none exists.
    expect(/(^|[ ;])https:(?=[ ;]|$)/.test(cspValue)).toBe(false);
  });

  it("adds unsafe-eval only for Next development tooling", () => {
    const production = asHeaderMap({ nodeEnv: "production" });
    const development = asHeaderMap({ nodeEnv: "development" });

    expect(
      production.get("Content-Security-Policy-Report-Only"),
    ).not.toContain("'unsafe-eval'");
    expect(development.get("Content-Security-Policy-Report-Only")).toContain(
      "'unsafe-eval'",
    );
  });

  it("enables HSTS only for a production HTTPS request", () => {
    expect(
      getStrictTransportSecurityValue({
        nodeEnv: "production",
        requestUrl: "https://tooolvibes.eu/account",
      }),
    ).toContain("max-age=31536000");
    expect(
      getStrictTransportSecurityValue({
        nodeEnv: "development",
        requestUrl: "https://tooolvibes.eu/account",
      }),
    ).toBeNull();
    expect(
      getStrictTransportSecurityValue({
        nodeEnv: "production",
        requestUrl: "http://tooolvibes.eu/account",
      }),
    ).toBeNull();
    expect(
      getStrictTransportSecurityValue({
        nodeEnv: "production",
        requestUrl: "https://localhost:3000/account",
      }),
    ).toBeNull();
    expect(
      getStrictTransportSecurityValue({
        nodeEnv: "production",
        requestUrl: "https://tooolvibes.eu/account",
        enableHsts: "false",
      }),
    ).toBeNull();
  });

  it("sets the remaining browser hardening headers", () => {
    const headers = asHeaderMap({ nodeEnv: "production" });

    expect(headers.has("Strict-Transport-Security")).toBe(false);
    expect(headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(headers.get("Referrer-Policy")).toBe(
      "strict-origin-when-cross-origin",
    );
    expect(headers.get("Permissions-Policy")).toContain("camera=()");
    expect(headers.get("Cross-Origin-Opener-Policy")).toBe(
      "same-origin-allow-popups",
    );
  });
});
