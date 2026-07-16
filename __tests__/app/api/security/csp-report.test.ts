import { afterEach, describe, expect, it, vi } from "vitest";

import { GET, POST } from "@/app/api/security/csp-report/route";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("CSP report endpoint", () => {
  it("logs a sanitized report and returns no content", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const response = await POST(
      new Request("https://tooolvibes.eu/api/security/csp-report", {
        method: "POST",
        headers: { "content-type": "application/csp-report" },
        body: JSON.stringify({
          "csp-report": {
            "document-uri": "https://tooolvibes.eu/auth/callback?token=secret",
            "blocked-uri": "https://blocked.example/script.js?secret=1",
            "effective-directive": "script-src-elem",
          },
        }),
      }),
    );

    expect(response.status).toBe(204);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(warn).toHaveBeenCalledOnce();
    expect(warn.mock.calls[0]?.[1]).toMatchObject({
      documentUri: "https://tooolvibes.eu/auth/callback",
      blockedUri: "https://blocked.example/script.js",
      effectiveDirective: "script-src-elem",
    });
    expect(JSON.stringify(warn.mock.calls)).not.toContain("token=secret");
  });

  it("rejects malformed and oversized reports", async () => {
    const malformed = await POST(
      new Request("https://tooolvibes.eu/api/security/csp-report", {
        method: "POST",
        body: "not-json",
      }),
    );
    const oversized = await POST(
      new Request("https://tooolvibes.eu/api/security/csp-report", {
        method: "POST",
        headers: { "content-length": String(33 * 1024) },
        body: "{}",
      }),
    );

    expect(malformed.status).toBe(400);
    expect(oversized.status).toBe(413);
    expect(GET().status).toBe(405);
  });

  it("redacts malformed and embedded-data URL values", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const response = await POST(
      new Request("https://tooolvibes.eu/api/security/csp-report", {
        method: "POST",
        body: JSON.stringify({
          "csp-report": {
            "document-uri": "person@example.com?token=secret",
            "blocked-uri": "data:text/plain,private-value",
            "source-file": "javascript:private-value",
          },
        }),
      }),
    );

    expect(response.status).toBe(204);
    expect(warn.mock.calls[0]?.[1]).toMatchObject({
      documentUri: "[invalid-url]",
      blockedUri: "data:",
      sourceFile: "[unsupported-url]",
    });
    expect(JSON.stringify(warn.mock.calls)).not.toContain("person@example.com");
    expect(JSON.stringify(warn.mock.calls)).not.toContain("private-value");
  });
});
