import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const canonicalWorkspace = vi.hoisted(() => ({
  loadCanonicalRemoteWorkspace: vi.fn(),
  saveCanonicalRemoteWorkspace: vi.fn(),
  attachCanonicalWorkspace: vi.fn(),
  releaseCanonicalWorkspace: vi.fn(),
}));
const securityState = vi.hoisted(() => ({
  consumeRateLimit: vi.fn(),
}));

vi.mock("@/lib/discovery/canonical-remote-workspace", () => canonicalWorkspace);
vi.mock("@/lib/security/distributed-state", () => ({
  consumeRateLimit: securityState.consumeRateLimit,
  getRequestAddress: () => "test-address",
  rateLimitResponseHeaders: (decision: { limit: number; remaining: number }) =>
    new Headers({
      "RateLimit-Limit": String(decision.limit),
      "RateLimit-Remaining": String(decision.remaining),
    }),
}));

import {
  GET as getWorkspaceState,
  PUT as putWorkspaceState,
} from "@/app/api/workspace-state/route";
import { POST as attachWorkspace } from "@/app/api/workspace-account/attach/route";
import { POST as releaseWorkspace } from "@/app/api/workspace-account/release/route";
import { createEmptyWorkspaceState } from "@/lib/discovery/workspace-state";
import {
  WorkspaceCapacityError,
  WorkspaceSyncConflictError,
} from "@/lib/discovery/workspace-sync";

const ACCESS_TOKEN = "workspace-access-token";
const OPERATION_ID = "11111111-1111-4111-8111-111111111111";
const UPDATED_AT = "2026-07-17T08:00:00.000Z";

const workspaceState = {
  ...createEmptyWorkspaceState(),
  saved: {
    slugs: ["alpha"],
    updatedAt: UPDATED_AT,
  },
};

const validMutation = {
  state: workspaceState,
  base_revision: "6",
  operation_id: OPERATION_ID,
};

function requestFor(
  path: string,
  method: "POST" | "PUT",
  body: unknown = validMutation,
  authenticated = true,
) {
  return new Request(`https://tooolvibes.eu${path}`, {
    method,
    headers: {
      "content-type": "application/json",
      ...(authenticated
        ? { authorization: `Bearer ${ACCESS_TOKEN}` }
        : {}),
    },
    body: JSON.stringify(body),
  });
}

function getRequest(authenticated = true) {
  return new Request("https://tooolvibes.eu/api/workspace-state", {
    headers: authenticated
      ? { authorization: `Bearer ${ACCESS_TOKEN}` }
      : {},
  });
}

const mutationRoutes = [
  {
    label: "PUT /api/workspace-state",
    path: "/api/workspace-state",
    method: "PUT" as const,
    handler: putWorkspaceState,
    dependency: canonicalWorkspace.saveCanonicalRemoteWorkspace,
    expectedArgs: [workspaceState, ACCESS_TOKEN, OPERATION_ID],
    viewerKind: "account",
    failureError: "save-failed",
  },
  {
    label: "POST /api/workspace-account/attach",
    path: "/api/workspace-account/attach",
    method: "POST" as const,
    handler: attachWorkspace,
    dependency: canonicalWorkspace.attachCanonicalWorkspace,
    expectedArgs: [
      ACCESS_TOKEN,
      workspaceState,
      createEmptyWorkspaceState(),
      OPERATION_ID,
    ],
    viewerKind: "account",
    failureError: "attach-failed",
  },
  {
    label: "POST /api/workspace-account/release",
    path: "/api/workspace-account/release",
    method: "POST" as const,
    handler: releaseWorkspace,
    dependency: canonicalWorkspace.releaseCanonicalWorkspace,
    expectedArgs: [ACCESS_TOKEN, workspaceState, OPERATION_ID],
    viewerKind: "guest",
    failureError: "release-failed",
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  securityState.consumeRateLimit.mockResolvedValue({
    allowed: true,
    limit: 90,
    remaining: 89,
    resetAt: Date.now() + 60_000,
    retryAfterSeconds: 0,
  });
});

describe("GET /api/workspace-state", () => {
  it("returns the canonical remote workspace with a 200 contract", async () => {
    canonicalWorkspace.loadCanonicalRemoteWorkspace.mockResolvedValue({
      remoteAvailable: true,
      viewerKind: "account",
      state: workspaceState,
      revision: "7",
      conflictRetries: 1,
    });

    const response = await getWorkspaceState(getRequest());

    expect(response.status).toBe(200);
    expect(canonicalWorkspace.loadCanonicalRemoteWorkspace).toHaveBeenCalledWith(
      ACCESS_TOKEN,
    );
    await expect(response.json()).resolves.toMatchObject({
      data: workspaceState,
      meta: {
        mode: "remote",
        remote_available: true,
        viewer_kind: "account",
        error: null,
        revision: "7",
        conflict_retries: 1,
        recovery_required: false,
      },
    });
  });

  it("falls back locally with 200 when remote persistence is disabled", async () => {
    canonicalWorkspace.loadCanonicalRemoteWorkspace.mockResolvedValue({
      remoteAvailable: false,
      state: createEmptyWorkspaceState(),
      revision: null,
      error: "workspace-sync-disabled",
    });

    const response = await getWorkspaceState(getRequest());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      meta: {
        mode: "local",
        remote_available: false,
        error: "workspace-sync-disabled",
        revision: null,
        recovery_required: true,
      },
    });
  });

  it("contains unexpected load failures in the local 200 response", async () => {
    canonicalWorkspace.loadCanonicalRemoteWorkspace.mockRejectedValue(
      new Error("database unavailable"),
    );

    const response = await getWorkspaceState(getRequest());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      meta: {
        mode: "local",
        remote_available: false,
        error: "remote-unavailable",
        recovery_required: true,
      },
    });
  });

  it("keeps anonymous GET local-only without allocating a remote guest", async () => {
    const response = await getWorkspaceState(getRequest(false));

    expect(response.status).toBe(200);
    expect(canonicalWorkspace.loadCanonicalRemoteWorkspace).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toMatchObject({
      meta: {
        mode: "local",
        remote_available: false,
        error: "missing-access-token",
      },
    });
  });
});

describe.each(mutationRoutes)("$label", (route) => {
  it("returns 401 without an access token and does not call remote persistence", async () => {
    const response = await route.handler(
      requestFor(route.path, route.method, validMutation, false),
    );

    expect(response.status).toBe(401);
    expect(route.dependency).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toMatchObject({
      meta: {
        mode: "local",
        remote_available: false,
        error: "missing-access-token",
        recovery_required: true,
      },
    });
  });

  it("returns 400 for an invalid mutation and does not call remote persistence", async () => {
    const response = await route.handler(
      requestFor(route.path, route.method, { state: {} }),
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(route.dependency).not.toHaveBeenCalled();
    expect(payload).toMatchObject({
      meta: {
        mode: "local",
        remote_available: false,
        error: "invalid-payload",
        recovery_required: true,
      },
    });
    expect(payload.issues).toEqual(expect.any(Array));
    expect(payload.issues.length).toBeGreaterThan(0);
  });

  it("returns 429 before parsing or persisting when the distributed limit is exhausted", async () => {
    securityState.consumeRateLimit.mockResolvedValueOnce({
      allowed: false,
      limit: 90,
      remaining: 0,
      resetAt: Date.now() + 60_000,
      retryAfterSeconds: 60,
    });

    const response = await route.handler(requestFor(route.path, route.method));

    expect(response.status).toBe(429);
    expect(route.dependency).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toMatchObject({
      meta: { error: "rate-limited" },
    });
  });

  it("returns 202 when canonical persistence is temporarily unavailable", async () => {
    route.dependency.mockResolvedValue({
      remoteAvailable: false,
      state: createEmptyWorkspaceState(),
      revision: null,
      error: "workspace-schema-upgrade-required",
    });

    const response = await route.handler(requestFor(route.path, route.method));

    expect(response.status).toBe(202);
    expect(route.dependency).toHaveBeenCalledWith(...route.expectedArgs);
    await expect(response.json()).resolves.toMatchObject({
      meta: {
        mode: "local",
        remote_available: false,
        error: "workspace-schema-upgrade-required",
        revision: null,
        recovery_required: true,
      },
    });
  });

  it("returns 200 after a successful canonical mutation", async () => {
    route.dependency.mockResolvedValue({
      remoteAvailable: true,
      viewerKind: route.viewerKind,
      state: workspaceState,
      revision: "7",
      conflictRetries: 1,
    });

    const response = await route.handler(requestFor(route.path, route.method));

    expect(response.status).toBe(200);
    expect(route.dependency).toHaveBeenCalledWith(...route.expectedArgs);
    await expect(response.json()).resolves.toMatchObject({
      data: workspaceState,
      meta: {
        mode: "remote",
        remote_available: true,
        viewer_kind: route.viewerKind,
        error: null,
        revision: "7",
        conflict_retries: 1,
        recovery_required: false,
      },
    });
  });

  it("returns a recoverable 409 with the converged conflict state", async () => {
    route.dependency.mockRejectedValue(
      new WorkspaceSyncConflictError(workspaceState, "8", 3),
    );

    const response = await route.handler(requestFor(route.path, route.method));

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      data: workspaceState,
      meta: {
        mode: "local",
        remote_available: true,
        ...(route.path === "/api/workspace-state"
          ? {}
          : { viewer_kind: route.viewerKind }),
        error: "revision-conflict",
        revision: "8",
        conflict_retries: 3,
        recovery_required: true,
      },
    });
  });

  it("returns 422 without writing when a converged workspace exceeds remote capacity", async () => {
    route.dependency.mockRejectedValue(
      new WorkspaceCapacityError(workspaceState),
    );

    const response = await route.handler(requestFor(route.path, route.method));

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toMatchObject({
      data: workspaceState,
      meta: {
        mode: "local",
        remote_available: true,
        error: "workspace-capacity-exceeded",
        recovery_required: true,
      },
    });
  });

  it("returns 503 without leaking an unexpected persistence failure", async () => {
    route.dependency.mockRejectedValue(new Error("sensitive database failure"));

    const response = await route.handler(requestFor(route.path, route.method));

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      meta: {
        mode: "local",
        remote_available: false,
        error: route.failureError,
        recovery_required: true,
      },
    });
  });
});
