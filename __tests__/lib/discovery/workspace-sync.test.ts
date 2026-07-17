import { describe, expect, it, vi } from "vitest";

import {
  WorkspaceCapacityError,
  WorkspaceSyncConflictError,
  synchronizeWorkspace,
  type WorkspaceRemoteSnapshot,
  type WorkspaceSyncRepository,
} from "@/lib/discovery/workspace-sync";
import {
  createEmptyWorkspaceState,
  normalizeWorkspaceState,
} from "@/lib/discovery/workspace-state";
import type { WorkspaceStateV1 } from "@/lib/discovery/types";

function undatedSaved(...slugs: string[]): WorkspaceStateV1 {
  return normalizeWorkspaceState({
    ...createEmptyWorkspaceState(),
    saved: {
      slugs,
      updatedAt: null,
    },
  });
}

function snapshot(
  state: WorkspaceStateV1,
  revision: string | null,
): WorkspaceRemoteSnapshot {
  return { state, revision, viewerKind: "account" };
}

describe("canonical workspace compare-and-swap synchronization", () => {
  it("fails before CAS when two valid snapshots exceed remote capacity after merge", async () => {
    const remote = undatedSaved(...Array.from(
      { length: 300 },
      (_, index) => `remote-${index}`,
    ));
    const local = undatedSaved(...Array.from(
      { length: 300 },
      (_, index) => `local-${index}`,
    ));
    const compareAndSwap = vi.fn<WorkspaceSyncRepository["compareAndSwap"]>();
    const repository: WorkspaceSyncRepository = {
      load: vi.fn().mockResolvedValue(snapshot(remote, "1")),
      compareAndSwap,
    };

    await expect(synchronizeWorkspace(local, repository, {
      operationId: "10000000-0000-4000-8000-000000000004",
    })).rejects.toBeInstanceOf(WorkspaceCapacityError);
    expect(compareAndSwap).not.toHaveBeenCalled();
  });

  it("adds a newer guest contribution without replacing account membership", async () => {
    const account = normalizeWorkspaceState({
      ...undatedSaved("account-tool"),
      saved: {
        slugs: ["account-tool"],
        updatedAt: "2026-07-17T10:00:00.000Z",
      },
    });
    const guest = normalizeWorkspaceState({
      ...undatedSaved("guest-tool"),
      clearedAt: "2026-07-17T12:00:00.000Z",
      saved: {
        slugs: ["guest-tool"],
        updatedAt: "2026-07-17T11:00:00.000Z",
      },
    });
    const compareAndSwap = vi
      .fn<WorkspaceSyncRepository["compareAndSwap"]>()
      .mockImplementation(async (input) => ({
        status: "saved",
        snapshot: snapshot(input.state, "2"),
      }));
    const repository: WorkspaceSyncRepository = {
      load: vi.fn().mockResolvedValue(snapshot(account, "1")),
      compareAndSwap,
    };

    const result = await synchronizeWorkspace(
      createEmptyWorkspaceState(),
      repository,
      {
        operationId: "10000000-0000-4000-8000-000000000005",
        guestContribution: guest,
      },
    );

    expect(result.state.saved.slugs).toEqual([
      "account-tool",
      "guest-tool",
    ]);
    expect(result.state.clearedAt).toBeNull();
  });
  it("returns the remote snapshot without writing when the merge is a no-op", async () => {
    const remote = undatedSaved("alpha");
    const compareAndSwap = vi.fn<WorkspaceSyncRepository["compareAndSwap"]>();
    const repository: WorkspaceSyncRepository = {
      load: vi.fn().mockResolvedValue(snapshot(remote, "4")),
      compareAndSwap,
    };

    const result = await synchronizeWorkspace(remote, repository, {
      operationId: "10000000-0000-4000-8000-000000000001",
    });

    expect(result).toEqual({
      state: remote,
      revision: "4",
      conflictRetries: 0,
      changed: false,
    });
    expect(repository.load).toHaveBeenCalledTimes(1);
    expect(compareAndSwap).not.toHaveBeenCalled();
  });

  it("merges the latest remote snapshot and retries a CAS conflict without losing either side", async () => {
    const initialRemote = undatedSaved("remote-alpha");
    const local = undatedSaved("local-beta");
    const conflictingRemote = undatedSaved("remote-alpha", "remote-gamma");
    const operationId = "10000000-0000-4000-8000-000000000002";

    const compareAndSwap = vi
      .fn<WorkspaceSyncRepository["compareAndSwap"]>()
      .mockResolvedValueOnce({
        status: "conflict",
        snapshot: snapshot(conflictingRemote, "2"),
      })
      .mockImplementationOnce(async (input) => ({
        status: "saved",
        snapshot: snapshot(input.state, "3"),
      }));
    const repository: WorkspaceSyncRepository = {
      load: vi.fn().mockResolvedValue(snapshot(initialRemote, "1")),
      compareAndSwap,
    };

    const result = await synchronizeWorkspace(local, repository, {
      operationId,
      maxConflictRetries: 2,
    });

    expect(compareAndSwap).toHaveBeenCalledTimes(2);
    expect(compareAndSwap.mock.calls[0]?.[0]).toMatchObject({
      expectedRevision: "1",
      operationId,
    });
    expect(compareAndSwap.mock.calls[1]?.[0]).toMatchObject({
      expectedRevision: "2",
      operationId,
    });
    expect(result).toMatchObject({
      revision: "3",
      conflictRetries: 1,
      changed: true,
    });
    expect(result.state.saved.slugs).toEqual([
      "remote-alpha",
      "remote-gamma",
      "local-beta",
    ]);
  });

  it("throws the converged state and latest revision after the retry budget is exhausted", async () => {
    const initialRemote = undatedSaved("remote-alpha");
    const local = undatedSaved("local-beta");
    const firstConflict = undatedSaved("remote-alpha", "remote-gamma");
    const secondConflict = undatedSaved(
      "remote-alpha",
      "remote-gamma",
      "remote-delta",
    );
    const operationId = "10000000-0000-4000-8000-000000000003";

    const compareAndSwap = vi
      .fn<WorkspaceSyncRepository["compareAndSwap"]>()
      .mockResolvedValueOnce({
        status: "conflict",
        snapshot: snapshot(firstConflict, "2"),
      })
      .mockResolvedValueOnce({
        status: "conflict",
        snapshot: snapshot(secondConflict, "3"),
      });
    const repository: WorkspaceSyncRepository = {
      load: vi.fn().mockResolvedValue(snapshot(initialRemote, "1")),
      compareAndSwap,
    };

    const failure = await synchronizeWorkspace(local, repository, {
      operationId,
      maxConflictRetries: 1,
    }).catch((error: unknown) => error);

    expect(failure).toBeInstanceOf(WorkspaceSyncConflictError);
    expect(failure).toMatchObject({
      revision: "3",
      retries: 2,
    });
    expect((failure as WorkspaceSyncConflictError).state.saved.slugs).toEqual([
      "remote-alpha",
      "remote-gamma",
      "remote-delta",
      "local-beta",
    ]);
    expect(compareAndSwap).toHaveBeenCalledTimes(2);
    expect(compareAndSwap.mock.calls.every(([input]) => input.operationId === operationId)).toBe(true);
  });
});
