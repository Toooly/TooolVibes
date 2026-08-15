import "server-only";

import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { workspaceSyncStateV1Schema } from "@/lib/discovery/schema";
import { createEmptyWorkspaceState } from "@/lib/discovery/workspace-state";
import {
  synchronizeWorkspace,
  type WorkspaceCompareAndSwapResult,
  type WorkspaceRemoteSnapshot,
  type WorkspaceSyncRepository,
} from "@/lib/discovery/workspace-sync";
import type { ViewerKind, WorkspaceStateV1 } from "@/lib/discovery/types";
import { createAdminSupabaseClient } from "@/lib/supabase/admin-client";
import { getSupabaseAdminEnv } from "@/lib/supabase/env";

export const discoveryViewerCookieName = "tooolvibes-viewer";

type ViewerProfileRow = {
  id: string;
  access_token: string;
  kind: ViewerKind;
  auth_user_id?: string | null;
};

type CanonicalWorkspaceRow = {
  workspace_state: unknown;
  revision: number | string;
  updated_at: string | null;
};

type CanonicalWorkspaceRpcRow = CanonicalWorkspaceRow & {
  sync_status: "saved" | "conflict";
};

function nowIso() {
  return new Date().toISOString();
}

function disabled(error = "workspace-sync-disabled") {
  return {
    remoteAvailable: false as const,
    state: createEmptyWorkspaceState(),
    revision: null,
    error,
  };
}

function schemaUnavailable(error: unknown) {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return ["viewer_profiles", "viewer_workspaces", "workspace_state", "sync_viewer_workspace_v1"]
    .some((token) => message.includes(token));
}

export function isCanonicalWorkspaceRemoteEnabled() {
  const mode = process.env.TOOOLVIBES_WORKSPACE_SYNC_MODE?.trim().toLowerCase();
  const { url, serviceRoleKey } = getSupabaseAdminEnv();
  return mode === "canonical" && Boolean(url && serviceRoleKey);
}

async function setViewerCookie(accessToken: string) {
  const cookieStore = await cookies();
  cookieStore.set(discoveryViewerCookieName, accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

async function clearViewerCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(discoveryViewerCookieName);
}

async function viewerFromCookie() {
  if (!isCanonicalWorkspaceRemoteEnabled()) return null;
  const client = createAdminSupabaseClient();
  const token = (await cookies()).get(discoveryViewerCookieName)?.value;
  if (!token) return null;
  const { data, error } = await client.from("viewer_profiles")
    .select("id, access_token, kind, auth_user_id")
    .eq("access_token", token).maybeSingle();
  if (error) throw new Error("viewer_profiles cookie lookup failed: " + error.message);
  const viewer = (data ?? null) as ViewerProfileRow | null;
  if (viewer) await client.from("viewer_profiles").update({ last_seen_at: nowIso() }).eq("id", viewer.id);
  return viewer;
}

async function createAccount(userId: string) {
  const client = createAdminSupabaseClient();
  const { data, error } = await client.from("viewer_profiles")
    .insert({
      access_token: randomUUID(),
      kind: "account",
      auth_user_id: userId,
      last_seen_at: nowIso(),
    })
    .select("id, access_token, kind, auth_user_id").single();
  if (error || !data) {
    const existing = await viewerForUser(userId);
    if (existing) return existing;
    throw new Error(
      "viewer_profiles account create failed: " +
      (error?.message ?? "unknown"),
    );
  }
  return data as ViewerProfileRow;
}

async function authenticatedUserId(token: string) {
  const { data: { user }, error } = await createAdminSupabaseClient().auth.getUser(token);
  if (error || !user) throw new Error("Authenticated workspace user lookup failed: " + (error?.message ?? "unknown"));
  return user.id;
}

async function viewerForUser(userId: string) {
  const { data, error } = await createAdminSupabaseClient().from("viewer_profiles")
    .select("id, access_token, kind, auth_user_id")
    .eq("auth_user_id", userId).maybeSingle();
  if (error) throw new Error("viewer_profiles account lookup failed: " + error.message);
  return (data ?? null) as ViewerProfileRow | null;
}

async function assignViewer(viewerId: string, userId: string) {
  const { data, error } = await createAdminSupabaseClient().from("viewer_profiles")
    .update({ kind: "account", auth_user_id: userId, last_seen_at: nowIso() })
    .eq("id", viewerId)
    .eq("kind", "guest")
    .is("auth_user_id", null)
    .select("id, access_token, kind, auth_user_id").maybeSingle();
  if (error) {
    throw new Error("viewer_profiles attach failed: " + error.message);
  }
  if (data) return data as ViewerProfileRow;
  return viewerForUser(userId);
}

function revisionOf(value: number | string | null | undefined) {
  if (value === null || value === undefined) return null;
  const revision = String(value);
  if (!/^\d+$/.test(revision)) throw new Error("Invalid canonical workspace revision.");
  return revision;
}

function revisionInput(value: string | null) {
  if (value === null) return null;
  const revision = Number(value);
  if (!Number.isSafeInteger(revision) || revision < 0) throw new Error("Unsupported workspace revision.");
  return revision;
}

function snapshot(row: CanonicalWorkspaceRow | null): WorkspaceRemoteSnapshot {
  if (!row) return { state: createEmptyWorkspaceState(), revision: null };
  const parsed = workspaceSyncStateV1Schema.safeParse(row.workspace_state);
  if (!parsed.success) throw new Error("Remote workspace_state is not valid WorkspaceStateV1.");
  return { state: parsed.data, revision: revisionOf(row.revision) };
}

function repository(viewerId: string): WorkspaceSyncRepository {
  return {
    async load() {
      const { data, error } = await createAdminSupabaseClient().from("viewer_workspaces")
        .select("workspace_state, revision, updated_at")
        .eq("viewer_id", viewerId).maybeSingle();
      if (error) throw new Error("viewer_workspaces canonical load failed: " + error.message);
      return snapshot((data ?? null) as CanonicalWorkspaceRow | null);
    },
    async compareAndSwap(input): Promise<WorkspaceCompareAndSwapResult> {
      const { data, error } = await createAdminSupabaseClient()
        .rpc("sync_viewer_workspace_v1", {
          p_viewer_id: viewerId,
          p_state: input.state,
          p_expected_revision: revisionInput(input.expectedRevision),
          p_operation_id: input.operationId,
        }).single();
      if (error || !data) throw new Error("sync_viewer_workspace_v1 failed: " + (error?.message ?? "empty response"));
      const row = data as CanonicalWorkspaceRpcRow;
      if (row.sync_status !== "saved" && row.sync_status !== "conflict") {
        throw new Error("sync_viewer_workspace_v1 returned an invalid status.");
      }
      return { status: row.sync_status, snapshot: snapshot(row) };
    },
  };
}

async function sync(
  viewerId: string,
  state: WorkspaceStateV1,
  operationId: string,
  guestContribution?: WorkspaceStateV1,
) {
  return synchronizeWorkspace(state, repository(viewerId), {
    operationId,
    maxConflictRetries: 2,
    guestContribution,
  });
}

export async function loadCanonicalRemoteWorkspace(token?: string) {
  if (!isCanonicalWorkspaceRemoteEnabled()) return disabled();
  try {
    if (!token) return disabled("missing-access-token");
    const userId = await authenticatedUserId(token);
    const viewer = await viewerForUser(userId);
    if (!viewer) return disabled("workspace-account-attach-required");
    await setViewerCookie(viewer.access_token);
    const remote = await repository(viewer.id).load();
    return {
      remoteAvailable: true as const,
      viewerKind: viewer.kind,
      state: remote.state,
      revision: remote.revision,
      conflictRetries: 0,
    };
  } catch (error) {
    if (schemaUnavailable(error)) return disabled("workspace-schema-upgrade-required");
    throw error;
  }
}

export async function saveCanonicalRemoteWorkspace(
  state: WorkspaceStateV1,
  token: string,
  operationId: string,
) {
  if (!isCanonicalWorkspaceRemoteEnabled()) return disabled();
  try {
    const userId = await authenticatedUserId(token);
    let viewer = await viewerForUser(userId);
    if (!viewer) {
      const current = await viewerFromCookie();
      viewer = current?.kind === "guest"
        ? await assignViewer(current.id, userId) ?? await createAccount(userId)
        : await createAccount(userId);
    }
    const result = await sync(viewer.id, state, operationId);
    return {
      remoteAvailable: true as const,
      viewerKind: "account" as const,
      state: result.state,
      revision: result.revision,
      conflictRetries: result.conflictRetries,
    };
  } catch (error) {
    if (schemaUnavailable(error)) return disabled("workspace-schema-upgrade-required");
    throw error;
  }
}

export async function attachCanonicalWorkspace(
  token: string,
  localState: WorkspaceStateV1,
  guestState: WorkspaceStateV1,
  operationId: string,
) {
  if (!isCanonicalWorkspaceRemoteEnabled()) return disabled();
  try {
    const userId = await authenticatedUserId(token);
    const account = await viewerForUser(userId);
    const current = await viewerFromCookie();
    let viewer: ViewerProfileRow;
    const guestContribution = guestState;
    const input = account ? createEmptyWorkspaceState() : localState;
    if (account) {
      viewer = account;
      if (current?.kind === "guest" && current.id !== account.id) {
        // The client sends its explicitly reserved guest contribution. Do not
        // copy a cookie guest row into an already-existing account here: that
        // read-then-merge sequence lets two accounts consume the same remote
        // guest snapshot concurrently. Keep the legacy guest row untouched as
        // well: deleting it before an atomic migration exists would destroy
        // remote-only state that an empty or stale client contribution did not
        // carry into the account.
      }
    } else if (current?.kind === "guest") {
      viewer = await assignViewer(current.id, userId) ?? await createAccount(userId);
    } else if (current?.auth_user_id === userId) {
      viewer = current;
    } else {
      viewer = await createAccount(userId);
    }
    const result = await sync(
      viewer.id,
      input,
      operationId,
      guestContribution,
    );
    await setViewerCookie(viewer.access_token);
    return {
      remoteAvailable: true as const,
      viewerKind: "account" as const,
      state: result.state,
      revision: result.revision,
      conflictRetries: result.conflictRetries,
    };
  } catch (error) {
    if (schemaUnavailable(error)) return disabled("workspace-schema-upgrade-required");
    throw error;
  }
}

export async function releaseCanonicalWorkspace(
  token: string,
  localState: WorkspaceStateV1,
  operationId: string,
) {
  if (!isCanonicalWorkspaceRemoteEnabled()) return disabled();
  try {
    const userId = await authenticatedUserId(token);
    const cookieViewer = await viewerFromCookie();
    const account = cookieViewer?.kind === "account" &&
        cookieViewer.auth_user_id === userId
      ? cookieViewer
      : await viewerForUser(userId);
    if (!account || account.kind !== "account" || account.auth_user_id !== userId) {
      throw new Error("The workspace viewer does not belong to the authenticated account.");
    }
    await sync(account.id, localState, operationId);
    await clearViewerCookie();
    return {
      remoteAvailable: true as const,
      viewerKind: "guest" as const,
      state: createEmptyWorkspaceState(),
      revision: null,
      conflictRetries: 0,
    };
  } catch (error) {
    if (schemaUnavailable(error)) return disabled("workspace-schema-upgrade-required");
    throw error;
  }
}
