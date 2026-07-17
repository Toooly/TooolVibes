import { describe, expect, it, vi } from "vitest";

import {
  parseWorkspacePersistencePayload,
  requestWorkspaceMutation,
} from "@/lib/discovery/workspace-sync-client";
import {
  createEmptyWorkspaceState,
  reduceWorkspaceState,
} from "@/lib/discovery/workspace-state";

const T0 = "2026-07-16T10:00:00.000Z";
const T1 = "2026-07-16T11:00:00.000Z";

function payload(
  data: unknown = createEmptyWorkspaceState(),
  overrides: Record<string, unknown> = {},
) {
  return {
    data,
    meta: {
      mode: "remote",
      remote_available: true,
      viewer_kind: "account",
      synced_at: T1,
      revision: "1",
      conflict_retries: 0,
      recovery_required: false,
      ...overrides,
    },
  };
}

function aboveRemoteCapacity() {
  return {
    ...createEmptyWorkspaceState(),
    saved: {
      slugs: Array.from({ length: 501 }, (_, index) => `tool-${index}`),
      updatedAt: T1,
    },
  };
}

describe("workspace sync client contract", () => {
  it("rejects malformed state and inconsistent metadata", () => {
    expect(parseWorkspacePersistencePayload(null)).toBeNull();
    expect(parseWorkspacePersistencePayload(payload({ schemaVersion: 2 }))).toBeNull();
    expect(parseWorkspacePersistencePayload(payload(undefined, {
      mode: "cloud",
    }))).toBeNull();
    expect(parseWorkspacePersistencePayload(payload(undefined, {
      conflict_retries: -1,
    }))).toBeNull();
    expect(parseWorkspacePersistencePayload(payload())).not.toBeNull();
  });

  it("keeps an oversized local 422 payload parsable without accepting it as remote", () => {
    const state = aboveRemoteCapacity();
    const local = parseWorkspacePersistencePayload(payload(state, {
      mode: "local",
      remote_available: true,
      error: "workspace-capacity-exceeded",
      revision: null,
      recovery_required: true,
    }));

    expect(local?.data).toEqual(state);
    expect(local?.meta.error).toBe("workspace-capacity-exceeded");
    expect(parseWorkspacePersistencePayload(payload(state))).toBeNull();
  });

  it("merges a conflict and retries with one stable operation id", async () => {
    const local = reduceWorkspaceState(createEmptyWorkspaceState(), {
      type: "saved/set",
      slug: "local-alpha",
      saved: true,
      at: T1,
    });
    const remote = reduceWorkspaceState(createEmptyWorkspaceState(), {
      type: "compare/toggle",
      slug: "remote-beta",
      at: T0,
    });
    const converged = {
      ...local,
      compare: remote.compare,
    };
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify(payload(remote, {
        mode: "local",
        viewer_kind: undefined,
        revision: "7",
      })), { status: 409 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(payload(converged, {
        revision: "8",
        conflict_retries: 1,
      })), { status: 200 }));

    const result = await requestWorkspaceMutation(
      "/api/workspace-account/attach",
      "token-1",
      local,
      {
        fetcher,
        maxConflictRetries: 1,
        operationId: "operation-1",
      },
    );

    expect(result.response.status).toBe(200);
    expect(result.conflictRetries).toBe(1);
    expect(fetcher).toHaveBeenCalledTimes(2);
    const firstBody = JSON.parse(String(fetcher.mock.calls[0]?.[1]?.body));
    const secondBody = JSON.parse(String(fetcher.mock.calls[1]?.[1]?.body));
    expect(firstBody.operation_id).toBe("operation-1");
    expect(secondBody.operation_id).toBe("operation-1");
    expect(secondBody.base_revision).toBe("7");
    expect(secondBody.state.saved.slugs).toEqual(["local-alpha"]);
    expect(secondBody.state.compare.slugs).toEqual(["remote-beta"]);
  });
});
