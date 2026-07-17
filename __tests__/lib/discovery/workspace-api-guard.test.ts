import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/security/distributed-state", () => ({
  consumeRateLimit: vi.fn(),
  getRequestAddress: () => "test-address",
}));

import {
  MAX_WORKSPACE_MUTATION_BYTES,
  consumeWorkspaceMutationRateLimit,
  parseWorkspaceMutationRequest,
  readWorkspaceBearerToken,
  workspaceRateLimitNamespace,
} from "@/lib/discovery/workspace-api-guard";
import {
  workspaceStateV1Schema,
  workspaceSyncStateV1Schema,
} from "@/lib/discovery/schema";
import { createEmptyWorkspaceState } from "@/lib/discovery/workspace-state";
import { consumeRateLimit } from "@/lib/security/distributed-state";

const OPERATION_ID = "11111111-1111-4111-8111-111111111111";

function request(body: unknown, headers: HeadersInit = {}) {
  return new Request("https://tooolvibes.eu/api/workspace-state", {
    method: "PUT",
    headers: {
      "content-type": "application/json",
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

describe("workspace API guard", () => {
  it("allows the complete UTF-8 workspace transport envelope up to 8 MiB", () => {
    expect(MAX_WORKSPACE_MUTATION_BYTES).toBe(8 * 1024 * 1024);
  });

  it("accepts only a bounded bearer token", () => {
    expect(readWorkspaceBearerToken(request({}, {
      authorization: "Bearer token-1",
    }))).toBe("token-1");
    expect(readWorkspaceBearerToken(request({}, {
      authorization: "Basic token-1",
    }))).toBeNull();
    expect(readWorkspaceBearerToken(request({}, {
      authorization: `Bearer ${"x".repeat(8193)}`,
    }))).toBeNull();
  });

  it("rejects declared oversized requests before parsing", async () => {
    const parsed = await parseWorkspaceMutationRequest(request({}, {
      "content-length": String(MAX_WORKSPACE_MUTATION_BYTES + 1),
    }));

    expect(parsed).toEqual({ status: "too-large" });
  });

  it("stops streaming bodies that exceed the limit without a content length", async () => {
    const oversized = `{"padding":"${"x".repeat(MAX_WORKSPACE_MUTATION_BYTES)}"}`;
    const parsed = await parseWorkspaceMutationRequest(new Request(
      "https://tooolvibes.eu/api/workspace-state",
      {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: new ReadableStream({
          start(controller) {
            controller.enqueue(new TextEncoder().encode(oversized));
            controller.close();
          },
        }),
        duplex: "half",
      } as RequestInit & { duplex: "half" },
    ));

    expect(parsed).toEqual({ status: "too-large" });
  });

  it("accepts a structurally valid workspace above the former 256 KiB limit", async () => {
    const state = {
      ...createEmptyWorkspaceState(),
      toolStates: Object.fromEntries(
        Array.from({ length: 150 }, (_, index) => [
          `tool-${index}`,
          {
            stage: "saved",
            note: "x".repeat(2_000),
            saveReason: null,
            pinned: false,
            decision: null,
            updatedAt: null,
          },
        ]),
      ),
    };
    const input = {
      state,
      base_revision: null,
      operation_id: OPERATION_ID,
    };
    const byteLength = new TextEncoder().encode(JSON.stringify(input)).byteLength;

    expect(byteLength).toBeGreaterThan(256 * 1024);
    expect(byteLength).toBeLessThan(MAX_WORKSPACE_MUTATION_BYTES);
    await expect(parseWorkspaceMutationRequest(request(input))).resolves.toMatchObject({
      status: "valid",
    });
  });

  it("covers two maximum-cardinality states with multibyte notes", async () => {
    const slugs = Array.from({ length: 500 }, (_, index) =>
      `tool-${index}-${"a".repeat(120)}`.slice(0, 120));
    const state = {
      ...createEmptyWorkspaceState(),
      saved: { slugs, updatedAt: null },
      stack: { slugs, updatedAt: null },
      toolStates: Object.fromEntries(slugs.map((slug) => [
        slug,
        {
          stage: "saved",
          note: "界".repeat(2_000),
          saveReason: null,
          pinned: false,
          decision: null,
          updatedAt: null,
        },
      ])),
    };
    const input = {
      state,
      guest_state: state,
      base_revision: null,
      operation_id: OPERATION_ID,
    };
    const byteLength = new TextEncoder().encode(JSON.stringify(input)).byteLength;

    expect(byteLength).toBeGreaterThan(2 * 1024 * 1024);
    expect(byteLength).toBeLessThan(MAX_WORKSPACE_MUTATION_BYTES);
    await expect(parseWorkspaceMutationRequest(request(input))).resolves.toMatchObject({
      status: "valid",
    });
  });

  it("uses valid namespaces plus bounded IP and token-fingerprint buckets", async () => {
    const limiter = vi.mocked(consumeRateLimit);
    limiter.mockResolvedValue({
      allowed: true,
      limit: 90,
      remaining: 89,
      resetAt: Date.now() + 60_000,
      retryAfterSeconds: 0,
    });
    const longSupabaseJwt = `header.${"x".repeat(1_200)}.signature`;

    await consumeWorkspaceMutationRateLimit(
      request({}, { authorization: `Bearer ${longSupabaseJwt}` }),
      longSupabaseJwt,
      "save",
    );

    expect(limiter).toHaveBeenCalledTimes(2);
    expect(limiter.mock.calls[0]?.[0]).toMatchObject({
      namespace: "workspace-sync-save-ip",
      identifiers: ["test-address"],
    });
    expect(limiter.mock.calls[1]?.[0].namespace).toBe(
      "workspace-sync-save-token",
    );
    expect(limiter.mock.calls[1]?.[0].identifiers[0]).toMatch(/^[a-f0-9]{64}$/);
    expect(limiter.mock.calls[1]?.[0].identifiers[0]).not.toContain(longSupabaseJwt);
  });

  it("keeps every workspace limiter namespace inside the runtime contract", () => {
    for (const operation of ["attach", "load", "release", "save"] as const) {
      for (const dimension of ["ip", "token"] as const) {
        expect(workspaceRateLimitNamespace(operation, dimension)).toMatch(
          /^[a-z0-9-]{1,48}$/,
        );
      }
    }
  });

  it("leaves remote capacity enforcement after structural request parsing", async () => {
    const slugs = Array.from({ length: 501 }, (_, index) => `tool-${index}`);
    const state = {
      ...createEmptyWorkspaceState(),
      saved: { slugs, updatedAt: null },
      stack: { slugs, updatedAt: null },
    };

    const parsed = await parseWorkspaceMutationRequest(request({
      state,
      base_revision: null,
      operation_id: OPERATION_ID,
    }));

    expect(parsed.status).toBe("valid");
    if (parsed.status !== "valid") return;
    expect(workspaceStateV1Schema.safeParse(parsed.data.state).success).toBe(true);
    expect(workspaceSyncStateV1Schema.safeParse(parsed.data.state).success).toBe(false);
  });
});
