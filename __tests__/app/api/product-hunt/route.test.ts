import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const GRAPHQL_OK_BODY = {
  data: {
    posts: {
      edges: [
        {
          node: {
            id: "ph-1",
            name: "Alpha Tool",
            tagline: "Primo segnale",
            votesCount: 120,
            commentsCount: 10,
            url: "https://www.producthunt.com/posts/alpha",
            thumbnail: { url: "https://example.com/alpha.png" },
          },
        },
        {
          node: {
            id: "ph-2",
            name: "Beta Tool",
            tagline: "Secondo segnale",
            votesCount: 80,
            commentsCount: 5,
            url: "https://www.producthunt.com/posts/beta",
            thumbnail: null,
          },
        },
      ],
    },
  },
};

function makeRequest(range = "day") {
  return new NextRequest(`http://localhost/api/product-hunt?range=${range}`);
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function importRoute() {
  // Le cache del modulo sono in memoria: reset per isolare ogni scenario.
  vi.resetModules();
  return import("@/app/api/product-hunt/route");
}

describe("GET /api/product-hunt — provenance e fallback (B36 / FLOW-606)", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
    delete process.env.PRODUCTHUNT_TOKEN;
    delete process.env.PRODUCTHUNT_CLIENT_ID;
    delete process.env.PRODUCTHUNT_CLIENT_SECRET;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("live: dichiara source, timestamp e items reali ordinati per voti", async () => {
    process.env.PRODUCTHUNT_TOKEN = "token-test";
    fetchMock.mockResolvedValue(jsonResponse(GRAPHQL_OK_BODY));

    const { GET } = await importRoute();
    const response = await GET(makeRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe("ok");
    expect(body.source).toBe("product-hunt-live");
    expect(body.stale).toBe(false);
    expect(body.updatedAt).toEqual(expect.any(String));
    expect(Number.isNaN(Date.parse(body.updatedAt))).toBe(false);
    expect(body.items.map((item: { name: string }) => item.name)).toEqual([
      "Alpha Tool",
      "Beta Tool",
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("cache: una sola chiamata upstream per range entro il TTL", async () => {
    process.env.PRODUCTHUNT_TOKEN = "token-test";
    fetchMock.mockResolvedValue(jsonResponse(GRAPHQL_OK_BODY));

    const { GET } = await importRoute();
    await GET(makeRequest());
    const second = await GET(makeRequest());
    const body = await second.json();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(body.source).toBe("product-hunt-live");
    expect(body.stale).toBe(false);
  });

  it("missing token: nessun dato inventato, source none e items vuoti", async () => {
    const { GET } = await importRoute();
    const response = await GET(makeRequest());
    const body = await response.json();

    expect(body.status).toBe("missing-token");
    expect(body.source).toBe("none");
    expect(body.stale).toBe(false);
    expect(body.items).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("errore upstream senza cache: status error, source none, items vuoti", async () => {
    process.env.PRODUCTHUNT_TOKEN = "token-test";
    fetchMock.mockRejectedValue(new Error("network down"));

    const { GET } = await importRoute();
    const response = await GET(makeRequest());
    const body = await response.json();

    expect(body.status).toBe("error");
    expect(body.source).toBe("none");
    expect(body.items).toEqual([]);
  });

  it("stale: dopo un errore live ri-serva l'ultima classifica reale dichiarando fallback e timestamp originale", async () => {
    vi.useFakeTimers();
    process.env.PRODUCTHUNT_TOKEN = "token-test";

    const firstUpdatedAt = "2026-07-18T08:00:00.000Z";
    vi.setSystemTime(new Date(firstUpdatedAt));
    fetchMock.mockResolvedValue(jsonResponse(GRAPHQL_OK_BODY));

    const { GET } = await importRoute();
    const first = await GET(makeRequest());
    const firstBody = await first.json();
    expect(firstBody.source).toBe("product-hunt-live");
    expect(firstBody.updatedAt).toBe(firstUpdatedAt);

    // TTL del range "day" = 30 minuti: oltre la scadenza il live fallisce.
    vi.setSystemTime(new Date("2026-07-18T08:31:00.000Z"));
    fetchMock.mockRejectedValue(new Error("upstream 500"));

    const second = await GET(makeRequest());
    const secondBody = await second.json();

    expect(secondBody.status).toBe("ok");
    expect(secondBody.source).toBe("product-hunt-stale");
    expect(secondBody.stale).toBe(true);
    // Il timestamp di origine non viene riscritto dal fallback.
    expect(secondBody.updatedAt).toBe(firstUpdatedAt);
    expect(secondBody.items).toHaveLength(2);
    expect(secondBody.message).toMatch(/ultima classifica/i);
  });
});
