// @vitest-environment jsdom

import { act } from "react";
import { cleanup, render, waitFor } from "@testing-library/react";
import type { Session } from "@supabase/supabase-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const workspaceRuntime = vi.hoisted(() => ({
  requestWorkspaceMutation: vi.fn(),
}));

const authRuntime = vi.hoisted(() => ({
  getSession: vi.fn(),
  signOut: vi.fn(),
  listener: null as null | ((event: string, session: unknown) => void),
}));

vi.mock("@/lib/discovery/workspace-sync-client", async (importOriginal) => {
  const actual = await importOriginal<
    typeof import("@/lib/discovery/workspace-sync-client")
  >();
  return {
    ...actual,
    requestWorkspaceMutation: workspaceRuntime.requestWorkspaceMutation,
  };
});

vi.mock("@/lib/supabase/browser-client", () => ({
  isSupabaseBrowserEnabled: () => true,
  loadBrowserSupabaseRuntimeConfig: vi.fn().mockResolvedValue(undefined),
  getBrowserSupabaseClient: () => ({
    auth: {
      getSession: authRuntime.getSession,
      signOut: authRuntime.signOut,
      onAuthStateChange: (
        callback: (event: string, session: unknown) => void,
      ) => {
        authRuntime.listener = callback;
        return {
          data: {
            subscription: { unsubscribe: vi.fn() },
          },
        };
      },
    },
  }),
}));

import {
  AccountProvider,
  useAccount,
} from "@/components/account/account-provider";
import {
  markGuestWorkspaceOwner,
  scopeWorkspaceStorage,
} from "@/lib/discovery/workspace-owner-storage";
import {
  persistWorkspaceStateToStorage,
} from "@/lib/discovery/workspace-storage";
import {
  createEmptyWorkspaceState,
  reduceWorkspaceState,
} from "@/lib/discovery/workspace-state";
import type {
  WorkspacePersistencePayload,
  WorkspaceStateV1,
} from "@/lib/discovery/types";
import {
  activateToolWorkspaceOwner,
  getCanonicalToolWorkspaceState,
  useToolWorkspaceStore,
} from "@/lib/stores/tool-workspace-store";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true;

const T0 = "2026-07-17T10:00:00.000Z";

function session(userId = "account-a") {
  return {
    access_token: `token-${userId}`,
    user: { id: userId },
  } as unknown as Session;
}

function saved(slug: string) {
  return reduceWorkspaceState(createEmptyWorkspaceState(), {
    type: "saved/set",
    slug,
    saved: true,
    at: T0,
  });
}

function payload(
  state: WorkspaceStateV1,
  remoteAvailable = true,
): WorkspacePersistencePayload {
  return {
    data: state,
    meta: {
      mode: remoteAvailable ? "remote" : "local",
      remote_available: remoteAvailable,
      viewer_kind: "account",
      synced_at: remoteAvailable ? T0 : null,
      error: remoteAvailable ? null : "workspace-sync-disabled",
      revision: remoteAvailable ? "1" : null,
      conflict_retries: 0,
      recovery_required: !remoteAvailable,
    },
  };
}

function mutationResult(
  state: WorkspaceStateV1,
  options: { status?: number; remoteAvailable?: boolean } = {},
) {
  const status = options.status ?? 200;
  return {
    response: new Response(null, { status }),
    payload: payload(state, options.remoteAvailable ?? true),
    sentState: state,
    conflictRetries: 0,
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((next) => {
    resolve = next;
  });
  return { promise, resolve };
}

let accountValue: ReturnType<typeof useAccount> | null = null;

function AccountProbe() {
  accountValue = useAccount();
  return null;
}

function renderProvider() {
  return render(
    <AccountProvider>
      <AccountProbe />
    </AccountProvider>,
  );
}

beforeEach(() => {
  localStorage.clear();
  expect(markGuestWorkspaceOwner(localStorage)).toBe(true);
  activateToolWorkspaceOwner({ kind: "guest" }, createEmptyWorkspaceState());
  accountValue = null;
  authRuntime.listener = null;
  authRuntime.getSession.mockReset();
  authRuntime.signOut.mockReset();
  workspaceRuntime.requestWorkspaceMutation.mockReset();
});

afterEach(() => {
  cleanup();
  activateToolWorkspaceOwner({ kind: "guest" }, createEmptyWorkspaceState());
  localStorage.clear();
});

describe("AccountProvider workspace orchestration", () => {
  it("keeps a mutation made during attach in the final account workspace", async () => {
    const currentSession = session();
    authRuntime.getSession.mockResolvedValue({
      data: { session: currentSession },
    });
    authRuntime.signOut.mockResolvedValue({ error: null });
    persistWorkspaceStateToStorage(localStorage, saved("guest-alpha"), {
      now: T0,
    });
    const request = deferred<ReturnType<typeof mutationResult>>();
    workspaceRuntime.requestWorkspaceMutation.mockReturnValue(request.promise);

    renderProvider();
    await waitFor(() => {
      expect(workspaceRuntime.requestWorkspaceMutation).toHaveBeenCalledTimes(1);
      expect(accountValue?.isAttaching).toBe(true);
    });

    act(() => {
      expect(useToolWorkspaceStore.getState().toggleSaved("during-attach")).toBe(
        true,
      );
    });
    await act(async () => {
      request.resolve(mutationResult(saved("guest-alpha")));
      await request.promise;
    });

    await waitFor(() => {
      expect(accountValue?.isAttaching).toBe(false);
      expect(accountValue?.workspaceAttachPending).toBe(false);
    });
    expect(getCanonicalToolWorkspaceState().saved.slugs).toEqual([
      "guest-alpha",
      "during-attach",
    ]);

    activateToolWorkspaceOwner({ kind: "guest" });
    expect(getCanonicalToolWorkspaceState().saved.slugs).toEqual([]);
  });

  it("keeps the staged selection visible when canonical sync returns 202", async () => {
    const currentSession = session();
    authRuntime.getSession.mockResolvedValue({
      data: { session: currentSession },
    });
    authRuntime.signOut.mockResolvedValue({ error: null });
    persistWorkspaceStateToStorage(localStorage, saved("guest-offline"), {
      now: T0,
    });
    workspaceRuntime.requestWorkspaceMutation.mockResolvedValue(
      mutationResult(createEmptyWorkspaceState(), {
        status: 202,
        remoteAvailable: false,
      }),
    );

    renderProvider();

    await waitFor(() => {
      expect(workspaceRuntime.requestWorkspaceMutation).toHaveBeenCalledTimes(1);
      expect(accountValue?.isAttaching).toBe(false);
      expect(accountValue?.workspaceAttachPending).toBe(true);
    });
    expect(getCanonicalToolWorkspaceState().saved.slugs).toEqual([
      "guest-offline",
    ]);
  });

  it("retries a transient attach failure with bounded backoff", async () => {
    const currentSession = session();
    authRuntime.getSession.mockResolvedValue({
      data: { session: currentSession },
    });
    authRuntime.signOut.mockResolvedValue({ error: null });
    persistWorkspaceStateToStorage(localStorage, saved("guest-retry"), {
      now: T0,
    });
    workspaceRuntime.requestWorkspaceMutation
      .mockRejectedValueOnce(new Error("network unavailable"))
      .mockResolvedValueOnce(mutationResult(createEmptyWorkspaceState(), {
        status: 202,
        remoteAvailable: false,
      }));

    renderProvider();

    await waitFor(() => {
      expect(workspaceRuntime.requestWorkspaceMutation).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(workspaceRuntime.requestWorkspaceMutation).toHaveBeenCalledTimes(2);
    }, { timeout: 3_500 });
    expect(accountValue?.workspaceAttachPending).toBe(true);
    expect(getCanonicalToolWorkspaceState().saved.slugs).toEqual([
      "guest-retry",
    ]);
  });

  it("ignores a late attach response after switching from account A to B", async () => {
    const sessionA = session("account-a");
    const sessionB = session("account-b");
    authRuntime.getSession.mockResolvedValue({ data: { session: sessionA } });
    authRuntime.signOut.mockResolvedValue({ error: null });
    persistWorkspaceStateToStorage(localStorage, saved("guest-for-a"), {
      now: T0,
    });
    const requestA = deferred<ReturnType<typeof mutationResult>>();
    workspaceRuntime.requestWorkspaceMutation.mockImplementation(
      (_path: string, token: string) => token === sessionA.access_token
        ? requestA.promise
        : Promise.resolve(mutationResult(saved("account-b-only"))),
    );

    renderProvider();
    await waitFor(() => {
      expect(workspaceRuntime.requestWorkspaceMutation).toHaveBeenCalledTimes(1);
      expect(authRuntime.listener).not.toBeNull();
    });

    act(() => {
      authRuntime.listener?.("SIGNED_IN", sessionB);
    });
    await waitFor(() => {
      expect(workspaceRuntime.requestWorkspaceMutation).toHaveBeenCalledTimes(2);
      expect(accountValue?.session?.user.id).toBe("account-b");
      expect(accountValue?.isAttaching).toBe(false);
    });
    expect(getCanonicalToolWorkspaceState().saved.slugs).toEqual([
      "account-b-only",
    ]);

    await act(async () => {
      requestA.resolve(mutationResult(saved("late-account-a")));
      await requestA.promise;
    });

    expect(accountValue?.session?.user.id).toBe("account-b");
    expect(getCanonicalToolWorkspaceState().saved.slugs).toEqual([
      "account-b-only",
    ]);
  });

  it("keeps the account and its scope active when Supabase sign-out fails", async () => {
    const currentSession = session();
    const accountOwner = {
      kind: "account" as const,
      userId: currentSession.user.id,
    };
    const accountState = saved("account-private");
    persistWorkspaceStateToStorage(
      scopeWorkspaceStorage(localStorage, accountOwner),
      accountState,
      { now: T0 },
    );
    authRuntime.getSession.mockResolvedValue({
      data: { session: currentSession },
    });
    authRuntime.signOut.mockResolvedValue({
      error: new Error("sign-out unavailable"),
    });
    workspaceRuntime.requestWorkspaceMutation
      .mockResolvedValueOnce(mutationResult(accountState))
      .mockResolvedValueOnce(mutationResult(accountState, {
        status: 202,
        remoteAvailable: false,
      }));

    renderProvider();
    await waitFor(() => {
      expect(accountValue?.status).toBe("authenticated");
      expect(accountValue?.isAttaching).toBe(false);
      expect(workspaceRuntime.requestWorkspaceMutation).toHaveBeenCalledTimes(1);
    });

    await act(async () => {
      await accountValue?.signOut();
    });

    expect(accountValue?.status).toBe("authenticated");
    expect(accountValue?.session?.user.id).toBe("account-a");
    expect(accountValue?.isAttaching).toBe(false);
    expect(getCanonicalToolWorkspaceState().saved.slugs).toEqual([
      "account-private",
    ]);
  });
});
