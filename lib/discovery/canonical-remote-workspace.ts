import "server-only";

import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { workspaceStateV1Schema } from "@/lib/discovery/schema";
import { createEmptyWorkspaceState } from "@/lib/discovery/workspace-state";
import {
  mergeWorkspaceForSync,
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

async function createGuest() {
  const client = createAdminSupabaseClient();
  const { data, error } = await client.from("viewer_profiles")
    .insert({ access_token: randomUUID(), kind: "guest", last_seen_at: nowIso() })
    .select("id, access_token, kind, auth_user_id").single();
  if (error || !data) throw new Error("viewer_profiles guest create failed: " + (error?.message ?? "unknown"));
  return data as ViewerProfileRow;
}

async function getOrCreateViewer() {
  return (await viewerFromCookie()) ?? createGuest();
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
    .select("id, access_token, kind, auth_user_id").single();
  if (error || !data) throw new Error("viewer_profiles attach failed: " + (error?.message ?? "unknown"));
  return data as ViewerProfileRow;
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
  const parsed = workspaceStateV1Schema.safeParse(row.workspace_state);
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

async function sync(viewerId: string, state: WorkspaceStateV1, operationId: string) {
  return synchronizeWorkspace(state, repository(viewerId), {
    operationId,
    maxConflictRetries: 2,
  });
}

export async function loadCanonicalRemoteWorkspace() {
  if (!isCanonicalWorkspaceRemoteEnabled()) return disabled();
  try {
    const viewer = await getOrCreateViewer();
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
      viewer = await assignViewer((current?.kind === "guest" ? current : await createGuest()).id, userId);
    }
    const result = await sync(viewer.id, state, operationId);
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

export async function attachCanonicalWorkspace(
  token: string,
  localState: WorkspaceStateV1,
  operationId: string,
) {
  if (!isCanonicalWorkspaceRemoteEnabled()) return disabled();
  try {
    const userId = await authenticatedUserId(token);
    const current = await getOrCreateViewer();
    const account = await viewerForUser(userId);
    let viewer: ViewerProfileRow;
    let input = localState;
    if (account) {
      viewer = account;
      if (current.kind === "guest" && current.id !== account.id) {
        input = mergeWorkspaceForSync((await repository(current.id).load()).state, input);
      }
    } else if (current.kind === "guest") {
      viewer = await assignViewer(current.id, userId);
    } else if (current.auth_user_id === userId) {
      viewer = current;
    } else {
      viewer = await assignViewer((await createGuest()).id, userId);
    }
    const result = await sync(viewer.id, input, operationId);
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
    const account = cookieViewer ?? await viewerForUser(userId);
    if (!account || account.kind !== "account" || account.auth_user_id !== userId) {
      throw new Error("The workspace viewer does not belong to the authenticated account.");
    }
    await sync(account.id, localState, operationId);
    const guest = await createGuest();
    await setViewerCookie(guest.access_token);
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
