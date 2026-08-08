import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { POST } from "@/app/api/sponsor-analytics/route";

afterEach(() => {
  vi.restoreAllMocks();
});

function makeRequest(body: unknown, contentLength?: number) {
  return new Request("https://tooolvibes.eu/api/sponsor-analytics", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(contentLength ? { "content-length": String(contentLength) } : {}),
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("sponsor analytics ingest endpoint", () => {
  it("accepts a valid sponsor_impression and logs it anonymously", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const response = await POST(
      makeRequest({
        name: "sponsor_impression",
        ts: Date.now(),
        campaignId: "taylora-v1-2026",
        sponsorId: "taylora",
        placementId: "home-partner-spotlight",
        route: "/",
        formatVariant: "rail",
      }),
    );

    expect(response.status).toBe(204);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(log).toHaveBeenCalledOnce();
    expect(log.mock.calls[0]?.[0]).toBe("[sponsor-analytics]");
    const value = log.mock.calls[0]?.[1] as Record<string, unknown>;
    expect(value.name).toBe("sponsor_impression");
    expect(value.placementId).toBe("home-partner-spotlight");
    expect(value.formatVariant).toBe("rail");
  });

  it("strips query-string personal data from the destination", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    await POST(
      makeRequest({
        name: "sponsor_click",
        campaignId: "taylora-v1-2026",
        sponsorId: "taylora",
        placementId: "archive-sponsored-tool",
        route: "/archivio",
        destination: "https://taylora.com?user=secret&email=person@example.com",
        toolSlug: "taylora",
      }),
    );

    const value = log.mock.calls[0]?.[1] as Record<string, string>;
    expect(JSON.stringify(value)).not.toContain("@");
    expect(JSON.stringify(value)).not.toContain("secret");
    expect(value.destination).toBe("https://taylora.com/");
    expect(value.name).toBe("sponsor_click");
  });

  it("rejects malformed and oversized requests", async () => {
    const malformed = await POST(
      new Request("https://tooolvibes.eu/api/sponsor-analytics", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "not-json",
      }),
    );
    const oversized = await POST(makeRequest({}, 9 * 1024));

    expect(malformed.status).toBe(400);
    expect(oversized.status).toBe(413);
  });

  it("rejects unknown event names and missing required fields", async () => {
    const unknown = await POST(
      makeRequest({ name: "something_else", placementId: "p", route: "/" }),
    );
    const missingPlacement = await POST(
      makeRequest({ name: "sponsor_impression", route: "/" }),
    );

    expect(unknown.status).toBe(400);
    expect(missingPlacement.status).toBe(400);
  });

  it("accepts a valid sponsor_opportunity_click via keepalive-shaped body", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const response = await POST(
      makeRequest({
        name: "sponsor_opportunity_click",
        placementId: "home-opportunity-cta",
        route: "/",
        destination: "/sponsorizza",
      }),
    );

    expect(response.status).toBe(204);
    const value = log.mock.calls[0]?.[1] as Record<string, unknown>;
    expect(value.name).toBe("sponsor_opportunity_click");
    expect(value.formatVariant).toBeUndefined();
  });

  it("returns 405 for GET", async () => {
    const { GET } = await import("@/app/api/sponsor-analytics/route");
    expect(GET().status).toBe(405);
  });
});
