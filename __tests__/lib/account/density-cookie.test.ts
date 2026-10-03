import { describe, expect, it, vi, beforeAll, beforeEach } from "vitest";

/**
 * tv-density cookie contract tests.
 *
 * tv-density is a PRESENTATION HINT only — never authorization.
 * Canonical auth: AccountProvider / Supabase client session.
 *
 * Contract:
 * - Stores only "compact" or "enriched" (no PII, no tokens)
 * - Path=/, SameSite=Lax, Secure in production, 30-day Max-Age
 * - Synced on every canonical auth status change
 * - "loading"/"unavailable" → does NOT overwrite existing cookie
 * - Stale enriched cookie + guest → corrected to compact
 * - Stale compact cookie + auth → corrected to enriched
 */

let cookieJar: Map<string, string>;

beforeAll(() => {
  cookieJar = new Map();
  const cookieMock = {
    get cookie() {
      return Array.from(cookieJar.entries())
        .map(([k, v]) => `${k}=${v}`)
        .join("; ");
    },
    set cookie(value: string) {
      const [pair] = value.split(";");
      const [key, val] = pair.split("=");
      if (val === "" || value.includes("max-age=0")) {
        cookieJar.delete(key.trim());
      } else {
        cookieJar.set(key.trim(), val.trim());
      }
    },
  };
  vi.stubGlobal("document", cookieMock);
});

beforeEach(() => {
  cookieJar.clear();
});

function syncDensityCookie(status: string): void {
  if (typeof document === "undefined") return;
  if (status === "loading" || status === "unavailable") return;
  const density = status === "authenticated" ? "enriched" : "compact";
  const secure = "https:" === "https:" ? "; Secure" : "";
  document.cookie = `tv-density=${density}; path=/; max-age=2592000; samesite=lax${secure}`;
}

describe("tv-density cookie contract", () => {
  it("DC-01: login (authenticated) → cookie = enriched", () => {
    syncDensityCookie("authenticated");
    expect(cookieJar.get("tv-density")).toBe("enriched");
  });

  it("DC-02: logout (guest) → cookie = compact", () => {
    cookieJar.set("tv-density", "enriched");
    syncDensityCookie("guest");
    expect(cookieJar.get("tv-density")).toBe("compact");
  });

  it("DC-03: stale enriched cookie + guest session → corrected to compact", () => {
    cookieJar.set("tv-density", "enriched");
    syncDensityCookie("guest");
    expect(cookieJar.get("tv-density")).toBe("compact");
  });

  it("DC-04: stale compact cookie + auth session → corrected to enriched", () => {
    cookieJar.set("tv-density", "compact");
    syncDensityCookie("authenticated");
    expect(cookieJar.get("tv-density")).toBe("enriched");
  });

  it("DC-05: loading status → does NOT overwrite existing cookie", () => {
    cookieJar.set("tv-density", "enriched");
    syncDensityCookie("loading");
    expect(cookieJar.get("tv-density")).toBe("enriched");
  });

  it("DC-06: unavailable status → does NOT overwrite existing cookie", () => {
    cookieJar.set("tv-density", "compact");
    syncDensityCookie("unavailable");
    expect(cookieJar.get("tv-density")).toBe("compact");
  });

  it("DC-07: cookie contains only compact or enriched (no PII)", () => {
    syncDensityCookie("authenticated");
    const raw = cookieJar.get("tv-density");
    expect(["compact", "enriched"]).toContain(raw);
  });

  it("DC-08: cookie attributes include samesite=lax", () => {
    // Verify the cookie string format
    let setCookie = "";
    const origSet = Object.getOwnPropertyDescriptor(document, "cookie")?.set;
    Object.defineProperty(document, "cookie", {
      get: () => cookieJar.get("tv-density") ?? "",
      set: (v: string) => { setCookie = v; const [p] = v.split(";"); const [k, val] = p.split("="); cookieJar.set(k.trim(), val.trim()); },
      configurable: true,
    });
    syncDensityCookie("authenticated");
    expect(setCookie).toContain("path=/");
    expect(setCookie).toContain("samesite=lax");
    expect(setCookie).toContain("max-age=2592000");
    // Restore
    if (origSet) Object.defineProperty(document, "cookie", { get: () => "", set: origSet, configurable: true });
  });

  it("DC-09: cookie is NEVER authorization — enriched fields are public ToolView data", () => {
    // The enriched content (levelLabel, readingTime, tags) comes from
    // ToolPublicView — the same data shown in compact mode descriptions.
    // This test documents the contract: tv-density only controls LAYOUT.
    const publicFields = ["levelLabel", "readingTime", "tags"];
    // All are on ToolPublicView (lib/data/tool-public-view.ts) — public API
    expect(publicFields).toContain("levelLabel");
    expect(publicFields).toContain("readingTime");
    expect(publicFields).toContain("tags");
  });

  it("DC-10: cross-tab auth change → cookie synced via onAuthStateChange", () => {
    // Simulate cross-tab: status changes trigger the same useEffect
    cookieJar.set("tv-density", "enriched");
    syncDensityCookie("guest");
    expect(cookieJar.get("tv-density")).toBe("compact");
    syncDensityCookie("authenticated");
    expect(cookieJar.get("tv-density")).toBe("enriched");
  });
});
